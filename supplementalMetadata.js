var reader = require("./reader");
var blocking;
var locales;
var parents;

function val(doc, xpath){
	var el = doc.get(xpath);
	return el && el.value();
};

/*
 Oh those crazy CLDR folks...

 So- distinguishingItems are important to the inheritance
 crazyness. Here's the deal: certain attributes make a node
 distinct form it's siblings with the same name. An example
 will probably help explain this the easiest...

 <calendars>
   <calendar type="buddhist" />
   <calendar type="chinese" />
   <calendar type="generic" foo="bar" />
 </calendars>

 Here the `type` attribute is the guy that makes it unique
 from the others. That `foo` attribute was thrown in there
 to illustrate the other important thing to note: other
 attributes don't contribute to the uniqueness. This might
 seem obvious- but it isn't obvious to xpath generators.
 (A node's xpath is important to the inheritance scheme)

 The `distinguishingItems` nodes in supplementalMetadata.xml
 has the info about this stuff. The data is all like:
 "hey dude- these attribute guys here are like- awesome and stuff"
 "Oh Uhh- well.. unless they're hanging with these elements; then they're losers"

 From v23.1; so you have a clue about what we're talking about here:
 <distinguishing>
    <distinguishingItems attributes="key request id _q registry alt iso4217 iso3166 mzone from to type numberSystem"/>
    <distinguishingItems exclude="true" elements="default measurementSystem mapping abbreviationFallback preferenceOrdering" attributes="type"/>
 </distinguishing>
*/
function distinguishing(nodeName, attrs) {
	//it is distinguishing if the attribute is listed and not excluded
	return attrs
		.filter(function(attrName){
			return !!~exports.distinguishing.attributes.indexOf(attrName) && !excluded(nodeName, attrName);
		});
};
function excluded(nodeName, attrName){
	var excludedNodes = distinguishing.exclude[attrName];
	return !!excludedNodes && !!~excludedNodes.indexOf(nodeName);
}
distinguishing.exclude={};
distinguishing.attributes=[];

function readSupplementalData(){
	var sup = reader.open("supplemental", "supplementalMetadata");

	sup.find('/supplementalData/metadata/distinguishing/distinguishingItems').forEach(function(node) {
		var attrs = node.getAttribute("attributes").split(' ');
		if(node.getAttribute("exclude")){
			attrs.forEach(function(a) {
				distinguishing.exclude[a] = node.getAttribute("elements").split(' ');
			});
		}
		else {
			Array.prototype.push.apply(distinguishing.attributes, attrs);
		}
	});
	//manually adding `count`- http://unicode.org/cldr/trac/ticket/6587
	if(!~distinguishing.attributes.indexOf("count"))
		distinguishing.attributes.push("count");

	blocking = sup.find('//blockingItems/@elements')[0].nodeValue.split(' ');
}


function readParents() {
	parents = {};
//This isn't actually in supplementalMetadata.xml
	var doc = reader.open("supplemental", "supplementalData");
	doc.find("//parentLocales/parentLocale").forEach(function (element) {
		var parent = element.getAttribute("parent");
		element.getAttribute("locales").split(' ').forEach(function (locale) {
			parents[locale] = parent;
		});
	});
	return parents;
}


exports = module.exports = {
	get distinguishing(){
		if(!blocking) readSupplementalData();
		return distinguishing;
	},
	get blocking(){
		if(!blocking) readSupplementalData();
		return blocking;
	},
	get parents(){
		if(!parents) readParents();
		return parents;
	}
}
