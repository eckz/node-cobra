var nodeSpawn = require('child_process').spawn;
var nodePath = require('path');
var nodeQuerystring = require('querystring');
var nodeNet = require('net');

exports.name = 'fastcgi';

exports.init = function(server) {
	var handlerModule = server.getModule('handler', true);
	handlerModule.addHandler(this, 'fastcgi');

	var confModule = server.getModule('config');
	if (confModule) {
		confModule.addPropertyHandlerAsIs('cgiScript', [ 'request',
				'requestFile' ]);
	}
};

/*
 * typedef struct {
 *     unsigned char version;
 *     unsigned char type;
 *     unsigned char requestIdB1;
 *     unsigned char requestIdB0;
 *     unsigned char contentLengthB1;
 *     unsigned char contentLengthB0;
 *     unsigned char paddingLength;
 *     unsigned char reserved;
 *     unsigned char contentData[contentLength];
 *     unsigned char paddingData[paddingLength];
 * } FCGI_Record;
 */
var FastCGIRecordHeader = function(data) {
	this.version = data[0];
	this.type = data[1];
	this.requestId = (data[2] << 8) + data[3]; // (B1 << 8) + B0
	this.contentLength = (data[4] << 8) + data[5];
	this.paddingLength = data[6];
	// this.reserved = data[7];
	this.totalLength = this.contentLength + this.paddingLength;
};

var FastCGIConnector = function(port, host) {
	this.socket = nodeNet.createConnection(port, host);
	this.socketConnected = false;
	
	var self = this;
	this.socket.once('connect', function() {
		self.socketConnected = true;
	});
	
	this.request = {};
	
	this.dataBuffer = new Buffer(1024);
	this.dataBufferOffset = 0;
	
	this.expectedDataLength = 8;
	this.nextFunction = recieveHeader;
	
	this.socket.on('data', function(data) {
		var dataRemaining = true;
		
		while(dataRemaining) {
			dataRemaining = false;
		
			var end = expectedDataLength -  dataBufferOffset;
			if(end > data.length) {
				end = data.length;
			}
			data.copy(dataBuffer, dataBufferOffset, 0, end);
			
			dataBufferOffset += data;
			
			if(dataBufferOffset === expectedDataLength) {
				//process data
				
				this.processData();
				
				// clean the buffer
				dataBufferOffset = 0;
				
				if(end < data.length) {
					data = data.slice(end);
					dataRemaining = true;
				}
			}
		}
		
		
	});
}

FastCGIConnector.prototype.processData = function() {
	this.nextFunction.call(this, this.dataBuffer);
};

var receiveHeader = function(data) {
	var header = new FastCGIRecordHeader(data);
	this.currentHeader = header;
	
	this.expectedDataLength = header.totalLength;
	this.nextFunction = receiveContentData;
};

var receiveContentData = function(data) {
	var header = this.currentHeader;
	header.contentData = data.slice(0, contentLength);
};

exports.handle = function(context, dispatcher) {
	throw new Error('unimplemented');
};
