var fs = require("fs");
var dom = require('xmldom').DOMParser;
var xpath = require('xpath');

function find(xp){
	var found = xpath.select(xp, this);
	return found;
}
function value(xp){
	var found = xpath.select1(xp, this);
	if(found) {
		return found.value || innerText(found);
	}
}
function innerText(node) {
	var out = "";
	for (var child = node.firstChild; !!child; child=child.nextSibling) {
		if (child.nodeType == 3)//#text
			out += child.nodeValue;
		else if (child.nodeType == 1) //element
			out += innerText(child);
	}
	return out;
};
exports = module.exports = {
	data: "./core/common",
	open: function(dir, name){
		var fullpath = exports.data + "/" + dir + "/" + name + ".xml";
		var txt = fs.readFileSync(fullpath, "utf8");
		var xmlDoc = new dom().parseFromString(txt);
		xmlDoc.find = find;
		xmlDoc.value = value;
		return xmlDoc;
	}
}