var assert = require("assert");
var path = require('path');
var xml2object = require('../lib/xml2object');

describe('CDATA', function(){
	it('should find CDATA values', function(done){
		var parser = new xml2object(
			['tiger'],
			path.normalize(__dirname + '/fixture/input03_CDATA.xml'));
		var found = [];

		parser.on('object', function(name, obj) {
			found.push(obj.$d);
		});

		parser.on('end', function() {
			assert.equal(1, found.length);
			assert.equal('string', typeof found[0]);

			done();
		});

		parser.start();
	});
});
