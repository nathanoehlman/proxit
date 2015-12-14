'use strict';

var Proxim = require('./proxim');

function ProxyServer() {
	 this._proxims = [];
}

/**
  List the available proxims
 **/
ProxyServer.prototype.list = function() {
	return this._proxims;
};

/**
  Finds a proxim
 **/
ProxyServer.prototype.find = function(opts) {
	if (!opts) return;
	for (var i = 0; i < this._proxims.length; i++) {
		var xim = this._proxims[i];
		if (xim && (
			(xim.port === opts.port && xim.host == opts.host)
			|| (xim.name && xim.name === opts.name)
			|| (xim._server === opts._server)
			)
		) {
			return xim;
		}
	}
};

/**
  Finds/creates a proxim with the given opts
 **/
ProxyServer.prototype.from = function(opts) {
	var proxim = this.find(opts);
	if (!proxim) proxim = this.add(opts);
	return proxim;
};

/**
  Adds a new proxim
 **/
ProxyServer.prototype.add = function(opts) {
	var xim = new Proxim(opts);
	this._proxims.push(xim);
	return xim;
};

module.exports = function(opts) {
	return new ProxyServer(opts);
};