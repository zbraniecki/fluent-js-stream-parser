const FluentLexer = require('./lexer').FluentLexer;
const FluentParser = require('./parser').FluentParser;
const MessageContext = require('./context').MessageContext;

const source = `key = Hello World\nkey2 = Hello World 2%`;

const DEBUG = true;

const Stream = require('stream');

class SourceReader extends Stream.Readable {
  constructor(options = {}) {
    super(options);
    this.ptr = 0;
  }

  _read() {
    if (this.ptr >= source.length) return sourceReader.push(null);

    setTimeout(() => {
      let char = source[this.ptr++];
      console.log(`SourceReader::push "${char}"`);
      sourceReader.push(char);
    }, 1);
  }
}
const sourceReader = new SourceReader();


let lexer = new FluentLexer({
  debug: DEBUG
});
let parser = new FluentParser();
let ctx = new MessageContext();

sourceReader.pipe(lexer).pipe(parser).pipe(ctx);
