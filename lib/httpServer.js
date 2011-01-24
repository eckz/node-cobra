var nodeHttp = require('http');
var nodePath = require('path');
var nodeUtil = require('util');

var HttpContext = require('./httpContext').HttpContext;
var ModulesContainer = require('./modulesContainer').ModulesContainer
var statusPhrases = require('./statusPhrases').statusPhrases;

var HttpServer = function(){
	HttpServer.super_.call(this);
	this.config = {};
	this.cwd = require('path').resolve('.');
};

exports.HttpServer = HttpServer;

nodeUtil.inherits(HttpServer, ModulesContainer);

var proto = HttpServer.prototype;

proto.defaultHeaders = {
	'Content-Type': 'text/html; charset=utf-8',
	'Server': 'node-cobra (Powered By node.JS [Powered by V8])'
};

proto.listenOn = function() {
	var server = nodeHttp.createServer(this.dispatch.bind(this));
	server.listen.apply(server, arguments);
	
	console.log('Listening on', arguments[0]);
};

proto.configurationHandlers = {};

proto.loadConfig = function(file) {
	var ext = nodePath.extname(file);
	var configModule = this.configurationHandlers[ext];
	configModule.loadConfig(file);
}

proto.addConfig = function(c) {
	this.config.extend(c);
},

proto.dispatch = function(req, res) {
	var url = req.url;
	this.dispatchUrl(url, req, res, function(result) {
		if(result === 'undispatched') {
			this._error(context, 501, 'Undispatched request');
		}
	}.bind(this));
};

proto.dispatchUrl = function(url, req, res, callback) {
	var context = new HttpContext(this,url,req,res);
	
	context.addConfig(this.config);
	context.addHeaders(this.defaultHeaders);
	context.addHeaders({'Date': new Date().toUTCString()});
	
	this.triggerHook('request', [context], function(result) {
		if(result === 'undispatched') {
			this.triggerHook('requestUndispatched', [context], callback);
		} else {
			callback.call(null, result);
		}
	}.bind(this));
}

proto._error = function(context, code, extra, showConfig) {
	context.statusCode = code;
	context.statusPhrase = statusPhrases[code];
	context.statusExtra = extra;
	
	if(!context.statusPhrase) {
		context.statusPhrase = 'unknownError';
	}
	
	var ph = context.statusPhrase;
	
	context.writeHeaders();
	
	console.error('ERROR', code, ph);
	
	this.emit('httpError', context);
	
	/* rendering the error */
	
	var title = '' + code + ' ' + ph;
	var w = context.write.bind(context);
	
	w('<html><head><title>'); w(title); w('</title></head>');
	w('<body><h1>'); w(title); w('</h1>');
	
	if(extra) {
		w('<p>'); w(extra); w('</p>');
	}
	
	if(showConfig) {
		w('<p><h3>Configuration:</h3><code>');
		w(JSON.stringify(context.config));
		w('</code></p>');
	}
	
	w('</body></html>');
	
	context.end();
};
