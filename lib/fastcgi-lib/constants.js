
/*
 * Number of bytes in a FCGI_Header.  Future versions of the protocol
 * will not reduce this number.
 */
exports.FCGI_HEADER_LEN        =  8;

/*
 * Value for version component of FCGI_Header
 */
exports.FCGI_VERSION_1         =  1;

/*
 * Values for type component of FCGI_Header
 */
exports.FCGI_BEGIN_REQUEST     =  1;
exports.FCGI_ABORT_REQUEST     =  2;
exports.FCGI_END_REQUEST       =  3;
exports.FCGI_PARAMS            =  4;
exports.FCGI_STDIN             =  5;
exports.FCGI_STDOUT            =  6;
exports.FCGI_STDERR            =  7;
exports.FCGI_DATA              =  8;
exports.FCGI_GET_VALUES        =  9;
exports.FCGI_GET_VALUES_RESULT = 10;
exports.FCGI_UNKNOWN_TYPE      = 11;
exports.FCGI_MAX_TYPE          = exports.FCGI_UNKNOWN_TYPE;

/*
 * Value for requestId component of FCGI_Header
 */
exports.FCGI_NULL_REQUEST_ID   =  0;

/*
 * Mask for flags component of FCGI_BeginRequestBody
 */
exports.FCGI_KEEP_CONN         =  1;

/*
 * Values for role component of FCGI_BeginRequestBody
 */
exports.FCGI_RESPONDER         =  1;
exports.FCGI_AUTHORIZER        =  2;
exports.FCGI_FILTER            =  3;

