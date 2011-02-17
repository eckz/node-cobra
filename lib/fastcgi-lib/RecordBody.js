var constants = require('/constants');

/*
typedef struct {
    unsigned char appStatusB3;
    unsigned char appStatusB2;
    unsigned char appStatusB1;
    unsigned char appStatusB0;
    unsigned char protocolStatus;
    unsigned char reserved[3];
} FCGI_EndRequestBody; */

var EndRequestBody = function(data) {
	this.appStatus = (data[0] << 24) + (data[1] << 16)  + (data[2] << 8) + data[3];
	this.protocolStatus = data[4];
	// this.reserved = data[5];
};

/*
typedef struct {
    unsigned char roleB1;
    unsigned char roleB0;
    unsigned char flags;
    unsigned char reserved[5];
} FCGI_BeginRequestBody;  */

var BeginRequestBody = function(data) {
	if(Buffer.isBuffer(data)) {
		throw new Error('unimplemented');
	} else {
		this.flags = constants.FCGI_KEEP_CONN;
		this.role = constants.FCGI_RESPONDER;
		
		if(data) {
			Object.extend(this, data);
		}
	}
	this.copyTo = function(buffer, offset) {
		buffer[offset] = (this.role >> 8) & 0xFF;
		buffer[offset + 1] = (this.role) & 0xFF;
		buffer[offset + 2] = (this.flags) & 0xFF;
		return 8;
	};
};

exports.EndRequestBody = EndRequestBody;
exports.BeginRequestBody = BeginRequestBody;
