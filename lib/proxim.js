'use strict';

var cuid = require('cuid');
var extend = require('cog/extend');
var EventEmitter = require('events');
var net = require('net');
var tls = require('tls');
var util = require('util');

function Proxim(opts) {
	if (!opts) throw new Error('A new rule requires at least a port');
	if (!opts.port && typeof opts !== 'object') opts = {port: opts};

	var proxim = this;
	this.id = cuid();
	this.host = opts.host;
	this.port = opts.port;
	this._to = [];
	this._connections = [];
	this._opts = opts;

	EventEmitter.call(this);

	process.nextTick(function() {
		proxim.start();
	});
}
util.inherits(Proxim, EventEmitter);

/**
  Start the Proxim
 **/
Proxim.prototype.start = function() {
	if (this._server || this._connections.length > 0) this.stop();

	var proxim = this;
	var createServer = net.createServer;
	var connector = net.connect;
	if (this._opts.secure) {
		createServer = tls.createServer.bind(null, this._opts.secure);
		connector = tls.connect.bind(this._opts.secure);
	}

	// Handle incoming socket connections
	var server = this._server = createServer(function(socket) {
		proxim.emit('connection', socket);
		if (!proxim._to || proxim._to.length === 0) return;
		var connection = {
			id: cuid(),
			socket: socket
		};

		// Establish the proxies
		connection.proxies = proxim._to.map(function(target) {
			var proxy = connector(target);
			proxy.on('connect', function() {
				proxim.emit('proxy:established', socket, proxy, target);
			});
			proxy.on('close', function() {
				// closed
			});
			// Handle errors
			proxy.on('error', function(err) {
				proxim._handleError(err, connection, target);
			});

			// Pipe streams
			proxy.pipe(socket).pipe(proxy);
		});

		socket.on('error', function(err) {
			proxim._handleError(err, connection);
		});
	});

	server.listen(this.port, this.host || '0.0.0.0', function() {
		proxim.emit('listening', proxim.port, proxim.host || '0.0.0.0');
	});

	server.on('error', function(err) {

	});
};
Proxim.prototype.reload = Proxim.prototype.start;

Proxim.prototype.find = function(target) {
	return this._to.filter(function(to) {
		return (target && (
			target.id === to.id
			|| (target.host === to.host && target.port === to.port)
		));
	});
}

/**
  Sets up a new target
 **/
Proxim.prototype.to = function(opts) {
	if (!opts || !opts.port) throw new Error('To requires at least a port');
	// Don't allow duplicates
	var existing = this.find(opts);
	if (existing && existing.length > 0) return;

	this._to.push(extend({id: cuid()}, opts || {}));
	return this;
};

Proxim.prototype._handleError = function(err, connection, target) {
	if (!connection) return;
	this.emit('error', err, connection, target);
	if (connection.proxy) connection.proxy.destroy();
	if (connection.socket) connection.socket.destroy();
	if (this._connections[connection.id]) {
		delete this._connections[connection.id];
	}
};

Proxim.prototype.stop = function() {
	server.close();
	function endProxy(proxy) {
		proxy.end();
	}
	this._connections.forEach(function(conn) {
		(conn.proxies || []).forEach(endProxy);
	});
	this._connections = [];
};

module.exports = Proxim;