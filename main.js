
require('./lib/prototype');
var HttpServer = require('./lib/httpServer').HttpServer;

require.paths.unshift('./lib/external/');

var s = new HttpServer();

s.loadModule('config');
s.loadModule('file');
s.loadModule('indexFiles');
s.loadModule('autoindex');
s.loadModule('access');
s.loadModule('mime');

s.loadConfig('./config.js');

