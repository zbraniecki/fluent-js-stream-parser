const Stream = require('stream');

class MessageContext extends Stream.Writable {
  constructor(options = {}) {
    options.objectMode = true;
    super(options);
  }

  _write(doc, encoding, callback) {
    console.log(`MessageContext::write: "${JSON.stringify(doc)}"`);
    callback();
  }

}

exports.MessageContext = MessageContext;
