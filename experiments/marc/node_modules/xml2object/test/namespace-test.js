var assert = require("assert");
var fs = require('fs');
var path = require('path');
var xml2object = require('../lib/xml2object');

describe('Namespace', function(){
	it('should parse namespace correctly', function(done){
		var stream = fs.createReadStream(path.normalize(
			__dirname + '/fixture/input04_namespace.xml'));
		var parser = new xml2object(['Envelope'], undefined, {xmlns:true});
		var found = [];

		var expectedValue = {
			'xmlns:s': {
				name: 'xmlns:s',
				value: 'http://schemas.xmlsoap.org/soap/envelope/',
				prefix: 'xmlns',
				local: 's',
				uri: 'http://www.w3.org/2000/xmlns/'
			},
			's:encodingStyle': {
				name: 's:encodingStyle',
				value: 'http://schemas.xmlsoap.org/soap/encoding/',
				prefix: 's',
				local: 'encodingStyle',
				uri: 'http://schemas.xmlsoap.org/soap/envelope/'
			},
			Body: {
				actionNameResponse: {
					'xmlns:u': {
						name: 'xmlns:u',
						value: 'urn:schemas-upnp-org:service:serviceType:v',
						prefix: 'xmlns',
						local: 'u',
						uri: 'http://www.w3.org/2000/xmlns/'
					},
					argumentName: 'out arg value'
				}
			}
		};

		parser.on('object', function(name, obj) {
			found.push(obj);
		});

		parser.on('end', function() {
			assert.equal(1, found.length);
			assert.deepEqual(expectedValue, found[0]);

			done();
		});

		stream.pipe(parser.saxStream);
	});
});
