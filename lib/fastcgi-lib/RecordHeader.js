var constants = require('./constants');

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
var RecordHeader = function(data) {
	if(Buffer.isBuffer(data)) {
		this.version = data[0];
		this.type = data[1];
		this.requestId = (data[2] << 8) + data[3]; // (B1 << 8) + B0
		this.contentLength = (data[4] << 8) + data[5];
		this.paddingLength = data[6];
		// this.reserved = data[7];
		this.totalLength = this.contentLength + this.paddingLength;
	} else {
		this.version = constants.FCGI_VERSION_1;
		this.type = 0;
		this.requestId = 0;
		this.contentLength = 0;
		this.paddingLength = 0;
		
		if(data !== undefined) {
			Object.extend(this, data); // TODO: Change to extendIf
		}
	}
	
	this.write = function(buffer, offset) {
		buffer[offset + 0] = this.version;
		buffer[offset + 1] = this.type;
		buffer[offset + 2] = (this.requestId >> 8) & 0xFF;
		buffer[offset + 3] = this.requestId & 0xFF;
		buffer[offset + 4] = (this.contentLength >> 8) & 0xFF;
		buffer[offset + 5] = this.contentLength & 0xFF;
		buffer[offset + 6] = this.paddingLength;
		buffer[offset + 7] = 0;
		
		return 8;
	};
};

exports.RecordHeader = RecordHeader;
