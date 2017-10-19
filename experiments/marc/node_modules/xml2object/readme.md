# Node.js xml2object

Simple wrapper on the [SAX.js](https://github.com/isaacs/sax-js) parser to stream xml into JavaScript objects.

Converts xml elements into JavaScript objects.

[![Build Status](https://drone.io/github.com/emberfeather/node-xml2object/status.png)](https://drone.io/github.com/emberfeather/node-xml2object/latest)

## Install

    npm install xml2object --save

## Usage

### From A File Name

    var xml2object = require('xml2object');

    // Create a new xml parser with an array of xml elements to look for
    var parser = new xml2object([ 'animal' ], 'myAnimals.xml');

    // Bind to the object event to work with the objects found in the XML file
    parser.on('object', function(name, obj) {
        console.log('Found an object: %s', name);
        console.log(obj);
    });

    // Bind to the file end event to tell when the file is done being streamed
    parser.on('end', function() {
        console.log('Finished parsing xml!');
    });

    // Start parsing the XML
    parser.start();

### From An Input Stream

    var xml2object = require('xml2object');
    var source = fs.createReadStream('/path/to/file.xml');

    // Create a new xml parser with an array of xml elements to look for
    var parser = new xml2object([ 'animal' ], source);

    // Bind to the object event to work with the objects found in the XML file
    parser.on('object', function(name, obj) {
        console.log('Found an object: %s', name);
        console.log(obj);
    });

    // Bind to the file end event to tell when the file is done being streamed
    parser.on('end', function() {
        console.log('Finished parsing xml!');
    });

    // Start parsing the input stream
    parser.start();

### Piped From An Input Stream

_Note:_ The following example uses the [`request`][1] package to simplify the http request.

    var xml2object = require('xml2object');
    var request = require('request');

    // Create a new xml parser with an array of xml elements to look for
    var parser = new xml2object([ 'animal' ]);

    // Bind to the object event to work with the objects found in the XML file
    parser.on('object', function(name, obj) {
        console.log('Found an object: %s', name);
        console.log(obj);
    });

    // Bind to the file end event to tell when the file is done being streamed
    parser.on('end', function() {
        console.log('Finished parsing xml!');
    });

    // Pipe a request into the parser
    request.get('http://www.example.com/test.xml').pipe(parser.saxStream);


### Advanced Options

    var xml2object = require('xml2object');

    // Create a new xml parser with an array of xml elements to look for
    // but this time we have lower-level requirements
    var parser = new xml2object([ 'Envelope' ], undefined, { xmlns:true });

    // everything else the same


## Module

### xml2object(elements[, source[, saxOptions]])

Constructor for creating an instance of the xml parser.

The source argument is can be a path to an xml file or an input stream.

If no source is specified you can set a readable Stream to `.source` or pipe a Stream into the `.saxStream`.

    var xml2object = require('xml2object');

    // Parse the myAnimals.xml file looking for <animal> elements
    var parser = new xml2object([ 'animal' ], 'myAnimals.xml');

`saxOptions` is passed directly to the [SAX parser](https://github.com/isaacs/sax-js#arguments). Options supported in node-xml2object are
* xmlns : XML namespaces, ignore namespaces. Helpful if you don't know the namespace(s) but do know the element names (example, some uPnP XML data)

### .source

The input Stream used as a source for parsing. Can be set to a xml file path or a readable stream.

    var parser = new xml2object([ 'animal' ]);

    parser.source = 'myAnimals.xml';

### .saxStream

The underlying sax Stream. Data can be piped directly to the sax Stream using the `pipe()`.

### .start()

Triggers the xml file to start streaming to the parser. Call this method after you have bound to the events.

    // Start parsing the XML
    parser.start();

### Event: 'object'

    function(name, obj) { ... }

Triggered when an object has been parsed from the XML file with the name of the element found and the actual object.

### Event: 'end'

    function() { ... }

Marks the end of the input file when it has been completely streamed through the parser.

### Event: 'start'

    function() { ... }

Marks the start of reading from the source. This event will not fire if using the `.saxParser.pipe()` method.

## Other Notes

Elements being parsed cannot currently be nested. For example. if you have `root > bikes > bike > wheel` as a heirarchy and have done a `xml2object('transportation.xml', [ 'bike', 'wheel' ])` the bike objects will be returned, but the wheel elements inside the bike element will not be parsed separately.

  [1]: https://github.com/mikeal/request
