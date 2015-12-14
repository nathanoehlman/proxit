# Proxit

Really simple TCP proxying.

Want stuff that's arriving here, to end up over there, without a whole heap of fuss? Me too.


var proxy = require('proxit')();

proxy.from({port: 1277}).to({host: 'localhost', port: 12777}).then(function() {

});

var proxim = proxy.from({port: 1277});
proxim.to({ host: 'localhost', port: 1298, name: 'rule1'});
proxim.to({ host: 'localhost', port: 1299});


proxy.list();
	//
	{
		id: 'xxxx-xxxx-xxxx-xxxx',
		port: 1277,
		to: [
			{id: 'xxxx-xxxx-xxxx-xxxx', host: 'localhost', port: 1298, name: 'rule1'},
			{id: 'xxxx-xxxx-xxxx-xxxx', host: 'localhost', port: 1299}
		]
	}
});

