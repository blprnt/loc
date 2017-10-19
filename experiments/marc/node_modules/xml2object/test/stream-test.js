var assert = require("assert");
var fs = require('fs');
var os = require('os');
var path = require('path');
var xml2object = require('../lib/xml2object');

describe('Stream', function(){
	it('should parse using a read stream in constructor', function(done){
		var stream = fs.createReadStream(
			path.normalize(__dirname + '/fixture/input01_simple.xml'));
		var parser = new xml2object(['dog'], stream);
		var found = [];

		parser.on('object', function(name, obj) {
			found.push(obj.name);
		});

		parser.on('end', function() {
			assert.equal(2, found.length, 'Should have found two objects');
			assert.equal('Fluffy', found[0], 'Name mismatch');
			assert.equal('Max', found[1], 'Name mismatch');

			done();
		});

		parser.start();
	});

	it('should parse using a read stream from setter', function(done){
		var stream = fs.createReadStream(
			path.normalize(__dirname + '/fixture/input01_simple.xml'));
		var parser = new xml2object(['cat']);
		var found = [];

		parser.source = stream;

		parser.on('object', function(name, obj) {
			found.push(obj.name);
		});

		parser.on('end', function() {
			assert.equal(2, found.length, "Should have found two objects");
			assert.equal('Snuggles', found[0], 'Name mismatch');
			assert.equal('Snowball', found[1], 'Name mismatch');

			done();
		});

		parser.start();
	});

	it('should error without a source', function(){
		var parser = new xml2object(['cat']);

		assert.throws(function() {
			// Starting without any source should throw an error
			parser.start();
		}, Error);
	});

	it('should error without a readable stream', function(){
		var stream = fs.createWriteStream(
			path.normalize(os.tmpdir() + '/output.xml'));
		var parser = new xml2object(['cat']);
	    var found = [];

		// Make the stream non-readable by destroying.
		stream.destroy();

		assert.throws(function() {
			// Starting without any source should throw an error
	    	parser.source = stream;
		}, Error);
	});
});
