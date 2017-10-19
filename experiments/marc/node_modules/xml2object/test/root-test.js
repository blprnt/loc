var assert = require("assert");
var path = require('path');
var xml2object = require('../lib/xml2object');

describe('Root', function(){
	it('should match root element', function(done){
		var parser = new xml2object(
			['example'],
			path.normalize(__dirname + '/fixture/input01_simple.xml'));
		var found = [];

		parser.on('object', function(name, obj) {
			found.push(obj.foo);
		});

		parser.on('end', function() {
			assert.equal(1, found.length, 'Should have found two objects');
			assert.equal('bar', found[0], 'foobar mismatch');

			done();
		});

		parser.start();
	});
});
