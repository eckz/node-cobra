/*
typedef struct {
    unsigned char appStatusB3;
    unsigned char appStatusB2;
    unsigned char appStatusB1;
    unsigned char appStatusB0;
    unsigned char protocolStatus;
    unsigned char reserved[3];
} FCGI_EndRequestBody;
*/

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
} FCGI_BeginRequestBody;
*/

var BeginRequestBody = function(data) {
	this.flags = FCGI_KEEP_CONN;
	this.write = function(buffer, offset) {
		data[offset] = (this.role >> 8) & 0xFF;
		data[offset + 1] = (this.role) & 0xFF;
		
		return 8;
	};
};

exports.EndRequestBody = EndRequestBody;
exports.BeginRequestBody = BeginRequestBody;
