var fs = require("fs");
var dom = require('xmldom').DOMParser;
var reader = require("./reader");
var metadata = require("./supplementalMetadata");
var Consumer = require("consumer");
var cache = {};

exports = module.exports = {
	get data(){ return reader.data; },
	set data(v){ reader.data = v; },
	cache: {
		get main(){ return cacher("main"); },
		get casing(){ return cacher("casing"); },
		get collation(){ return cacher("collation"); },
		get rbnf(){ return cacher("rbnf"); },
		get segments(){ return cacher("segments"); }
	},
	open: function(dir, name){
		var xmlDoc = reader.open(dir, name);
		xmlDoc.dir = dir;
		xmlDoc.locale = name;
		xmlDoc.query = query;
		Object.defineProperty(xmlDoc, "identity", { get:identity });
		Object.defineProperty(xmlDoc, "parent", { get:parent });
		return xmlDoc;
	},
	parent: function (dir, locale) {
		if(locale==="root") return undefined;
		var parent = metadata.parents[locale];
		if(parent)
			return parent;

		//some "truncation inheritance"?
		locale = locale.substr(0, locale.lastIndexOf('_'));
		if(!locale) return "root";

		if(!~Object.keys(exports.cache[dir]).indexOf(locale))
			return exports.parent(dir, locale);
		return locale;
	},
	segments: function (chain){
		var out = [];
		var c = new Consumer(chain);
		var depth = 0;
		while(!c.done){
			c.consume(/\//);
			var name = c.consume(/[^\[\/\[]+/g)[0];
			depth++;
			var attr, attrs = {};
			while(attr = c.consume(/\[@([^=]+)=["']([^"']+)["']\]/g)){
				attrs[attr[1]] = attr[2];
			}
			var link = {
				name: name,
				attrs: attrs,
				depth: depth
			};
			link.toString = Link.prototype.toString;
			out.push(link);
		}
		out.toString = segString;
		return out;
	},
	cldrChain: function(node){
		if(!node._chain){
			node._chain = node.parentNode.nodeType===1? exports.cldrChain(node.parentNode).slice() : [];
			node._chain.push(link(node));
			node._chain.toString = chainString;
		}
		return node._chain;
	},
	identity: function(doc){
		return {
			language: doc.value("//identity/language/@type"),
			script: doc.value(doc, "//identity/script/@type"),
			territory: doc.value(doc, "//identity/territory/@type"),
			variant: doc.value(doc, "//identity/variant/@type")
		}
	},
	forEachDocument: function(dir, cb){
		var files = exports.cache[dir];
		Object.keys(files)
			.forEach(function (name) {
				cb(files[name], name);
			}
		);
	},
	get metadata() {
		return require("./supplementalMetadata");
	}
};

function cacher(dir){
	if(!cache[dir]){
		cache[dir] = {};
		files(dir).forEach(function (name) {
				name = name.substr(0, name.length-4);// chop off ".xml"
				var doc;
				Object.defineProperty(cache[dir], name, {
					enumerable: true,
					get: function(){
						return doc || (doc = exports.open("main", name));
					}
				});
			}
		);
	}
	return cache[dir];
}
function files(dir){
	dir = reader.data + "/" + dir + "/";
	return fs.readdirSync(dir).filter(function (name) {
		return /\.xml$/.test(name);
	});
}


//functions to add to every document

function parent(){
	if(!this._parent)
		this._parent = exports.parent(this.dir, this.locale);
	return exports.cache[this.dir][this._parent];
};
function identity(){
	return exports.identity(this);
}
/**
 * Similar to find(), but implements CLDR inheritance
 * @param xpath
 * @returns {Array}
 */
function query(xpath){
	var parent=this, found;
	do{
		found = parent.find(xpath);
		//blocking elements are not allowed to inherit
		if(parent===this && ~metadata.blocking.indexOf(this.nodeName))
			return found;
		if(found.length) break;
	}
	while((parent.locale!=="root") && (parent = parent.parent));

	if(!found.length){
		//we're at root
		var segments = exports.segments(xpath);
		var remnants = [];
		do{
			found = parent.find(segments+"/alias");
			if(found.length)
				return this.query(alias(found[0], remnants));

			var next = segments.pop()
			remnants.unshift(next);
			if(next.name==="ldml") break;
		}
		while(true)
	}
	return found;
}
function alias(node, remnants){
	var path = exports.segments(node.getAttribute("path"));
	var ancestor = node.parentNode;
	for (var i=0; i<path.length; i++) {
		if(path.shift().name==="..") ancestor = ancestor.parentNode;
		else break;
	}
	var truncated = exports.cldrChain(ancestor);
	var result = '/'+truncated.concat(path).concat(remnants).join('/');
	return result;
}

//use to build `cldrChain`s

function link(element){
	var map = Array.prototype.map;
	var attrs = map.call(element.attributes, function (attr) { return attr.name; });
	var distinguishing = {};
	metadata.distinguishing(element.nodeName, attrs).forEach(function (attr) {
		distinguishing[attr] = element.getAttribute(attr);
	});
	return new Link(element.nodeName, distinguishing);
}
function Link(name, attrs){
	this.name = name;
	this.attrs = attrs;
}
Link.prototype.toString = function(){
	var attrs = this.attrs;
	return this.name + Object.keys(attrs)
		.sort()
		.map(function(a){
			return '[@'+ a +'="'+ attrs[a] +'"]'
		})
		.join('');
}
function chainString(){
	return '/'+this.map(function (link) {
			return link.toString();
		})
		.join('/');
}


function segString(){
	return '/'+this.join('/');
}
