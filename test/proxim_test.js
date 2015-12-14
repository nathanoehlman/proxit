var net = require('net');
var should = require('chai').should();
var Proxit = require('..');

describe('Proxim proxy', function() {

	var port = 9432;
	var server = null;
	var sockets = [];

	before(function(done) {
		server = net.createServer(function(socket) {
			// Listen for data, ping it back with resp+ in front
			socket.on('data', function(buf) {
				var payload = buf.toString();
				socket.write('resp+' + payload);
			});
		});
		server.listen(port, done);
	});

	it('should be able to proxy a connection', function(done) {
		var proxit = Proxit();
		var xim = proxit.from(6400).to({port: port});
		xim.on('listening', function(port) {
			// Connect to a proxied server, wait until it's been established then write a random value
			var val = Math.random() * 10000;
			var client = net.connect(6400, function() {
				xim.on('proxy:established', function() {
					client.write(val.toString());
				});
			});

			// Receive the response data
			client.on('data', function(buf) {
				var payload = buf.toString();
				payload.should.equal('resp+' + val.toString());
				client.end();
				return done();
			});
		});
	});

	after(function(done) {
		server.close(done);
	});
});