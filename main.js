require.paths.unshift('./lib/');
require.paths.unshift('./lib/external/');

require('prototype');
var HttpServer = require('httpServer').HttpServer;

var s = new HttpServer();

/* Basic module loading */
s.loadModule('config');
s.loadModule('configJSON');

//s.loadModule('file');
//s.loadModule('indexFiles');
//s.loadModule('autoindex');
//s.loadModule('access');
//s.loadModule('mime');

s.loadConfig('./config.json');
