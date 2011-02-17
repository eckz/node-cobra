var net = require('net');
var EventEmitter = require('events').EventEmitter;


var constants = require('./constants');
var bodies = require('./RecordBody');
var EndRequestBody= bodies.EndRequestBody;
var BeginRequestBody = bodies.BeginRequestBody;

var Client = function(port, host) {
	this.socket = net.createConnection(port, host);
	this.socketConnected = false;
	
	var self = this;
	this.socket.once('connect', function() {
		self.socketConnected = true;
	});
	
	this.requests = new Array(10);
	
	this.dataBuffer = new Buffer(4096);
	this.dataBufferOffset = 0;
	
	this.expectedDataLength = 8;
	this.nextFunction =  _receiveHeader;
	
	var self = this;
	this.socket.on('data', function() {
		try {
			_receiveData.call(self);
		} catch(e) {
			self.emit('exception', e);
		}
	});
};

var _searchRequestId = function() {
	
}

var _receiveData = function(data) {
	var dataRemaining = true;
	
	while(dataRemaining) {
		dataRemaining = false;
	
		var end = this.expectedDataLength - this.dataBufferOffset;
		if(end > data.length) {
			end = data.length;
		}
		data.copy(this.dataBuffer, this.dataBufferOffset, 0, end);
		
		this.dataBufferOffset += data.length;
		
		if(this.dataBufferOffset === this.expectedDataLength) {
		
			//process data
			this.nextFunction.call(this, this.dataBuffer);
			
			// clean the buffer
			dataBufferOffset = 0;
			
			if(end < data.length) {
				data = data.slice(end);
				dataRemaining = true;
			}
		}
	}
};

var _receiveHeader = function(data) {
	var header = new FastCGIRecordHeader(data);
	this.currentHeader = header;
	
	this.expectedDataLength = header.totalLength;
	this.nextFunction = _receiveContentData;
};


var _receiveContentData = function(data) {
	var header = this.currentHeader;
	header.contentData = data.slice(0, header.contentLength);
	
	this.expectedDataLength = 8;
	this.nextFunction = _receiveHeader;
	
	var processTypeFunction = functionTypes[header.type];
	
	processTypeFunction.call(this, header.contentData);
};

var functionTypes = {};

functionTypes[constants.FCGI_END_REQUEST] = function(data) {
	this.emit('end');
};

functionTypes[constants.FCGI_STDOUT] = function(data) {
	this.stdout.emit('data', data);
};

functionTypes[constants.FCGI_STDERR] = function(data) {
	this.stderr.emit('data', data);
};

exports.Client = Client;
