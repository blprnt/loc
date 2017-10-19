var assert = require("assert");
var path = require('path');
var xml2object = require('../lib/xml2object');

describe('Error', function(){
	it('should have an error when cannot parse', function(done){
		var parser = new xml2object(
			['dog'],
			path.normalize(__dirname + '/fixture/input02_invalid.xml'));
	    var found = [];

	    parser.on('error', function(error) {
			assert.equal(true, error instanceof Error);
			found.push(error);

			// Brittle, but the parser gets multiple errors with invalid input.
			if (found.length == 2) {
				done();
			}
	    });

	    parser.start();
	});
});
