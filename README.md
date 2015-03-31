LDML for Node.js
======================================================
(UNICODE LOCALE DATA MARKUP LANGUAGE)

Unicode's [Common Locale Data Repository (CLDR)](http://cldr.unicode.org/) data
is stored in XML files and uses a very custom inheritance scheme. With this module 
you can `query` the data and it will do the crazy inheritance for you.

```javascript
var ldml = require("ldml");
ldml.data = __dirname + "/core/common";

var en_US = ldml.cache.main.en_US;
var path = "/ldml/dates/calendars/calendar[@type='buddhist']/dateTimeFormats/dateTimeFormatLength[@type='full']/dateTimeFormat/pattern";
var found = en_US.query(path);

if(found.length){
	console.log("found:", found[0]+"");
	console.log("at", ldml.cldrChain(found[0])+"");
	console.log("in", found[0].ownerDocument.locale);
}

/*
found: <pattern>{1} 'at' {0}</pattern>
at /ldml/dates/calendars/calendar[@type="generic"]/dateTimeFormats/dateTimeFormatLength[@type="full"]/dateTimeFormat/pattern
in en
*/
```
Notice how the end result came from `calendar[@type="generic"]` in the `en.xml` file.


The full search route for this query was actually:

    en_US.xml → en.xml → root.xml (found an alias) → en_US.xml → en.xml

## Data files
**This repo does not include the CLDR data files**. You will need to download and extract
[core.zip](http://unicode.org/Public/cldr/23.1/).

## ldml.data
After downloading the data, you need to make sure the module knows where to find it. Set the 
`data` property to the location of the `/common/` directory.


## ldml.cache
For better performance, the XML document are cached on first load (lazy loaded).

The `cache` object has a accessor for every ldml directory:
### ldml.cache.main<BR>ldml.cache.casing<BR>ldml.cache.collation<BR>ldml.cache.rbnf<BR>ldml.cache.segments<BR>

Each will return an object with accessors for every locale found in that directory.


## ldml.open(directory, filename)
Opens and parses an ldml file from the specified `directory`. Returns the XML doc.

## ldml.cldrChain(xmlElement)
Returns an `Array` of information about the [distinguished](http://unicode.org/reports/tr35/#Definitions) segments.

You'll probably just want to call `toString()` on it.

## doc.query(xpath)
Give it an xpath, it'll look up the data.


License
=======
The MIT License (MIT)

Copyright (c) 2013 William Kapke

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
