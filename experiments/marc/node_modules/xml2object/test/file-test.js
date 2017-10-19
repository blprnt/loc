var assert = require("assert");
var path = require('path');
var xml2object = require('../lib/xml2object');

describe('File Read', function(){
	it('should parse source from constructor', function(done){
		var parser = new xml2object(
			['dog'], path.normalize(__dirname + '/fixture/input01_simple.xml'));
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

		parser.start();
	});

	it('should parse source from setter', function(done){
		var parser = new xml2object(['cat']);
		var found = [];

		parser.source = path.normalize(
			__dirname + '/fixture/input01_simple.xml');

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
});
