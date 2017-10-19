var assert = require("assert");
var fs = require('fs');
var path = require('path');
var xml2object = require('../lib/xml2object');

describe('Pipe', function(){
	it('should parse from a piped stream', function(done){
		var stream = fs.createReadStream(
			path.normalize(__dirname + '/fixture/input01_simple.xml'));
		var parser = new xml2object(['dog']);
		var found = [];

		parser.on('object', function(name, obj) {
			found.push(obj.name);
		});

		parser.on('end', function() {
			assert.equal(2, found.length, "Should have found two objects");
			assert.equal('Fluffy', found[0], 'Name mismatch');
			assert.equal('Max', found[1], 'Name mismatch');

			done();
		});

		stream.pipe(parser.saxStream);
	});
});
