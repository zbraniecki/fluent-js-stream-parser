const Stream = require('stream');

class FluentLexer extends Stream.Transform {
  constructor(options = {}) {
    options.objectMode = true;
    super(options);
    this.state = FluentLexer.states.Resource;
    this.buffer = "";
    this.tokenBuffer = [];
  }

  _transform(data, encoding, callback) {
    console.log(`FluentLexer::transform::read: "${data.toString()}"`);
    for (let ch of data.toString()) {
      if (ch === '%') {
        this._readChar("");
      } else {
        this._readChar(ch);
      }
    }
    let token;
    while (token = this.tokenBuffer.shift()) {
      console.log(`FluentLexer::transform::push: "${JSON.stringify(token)}"`);
      this.push(token);
    }
    callback();
  }

  _readChar(ch = "") {
    console.log(`FluentLexer::readChar: "${ch}", state: ${this.state}`);
    let cc = ch.charCodeAt(0);
    switch (this.state) {
      case FluentLexer.states.Resource:
        if (isAlphaNum(cc)) {
          this.state = FluentLexer.states.Identifier;
          this.buffer += ch;
        } else if (isWS(cc)) {
          this.state = FluentLexer.states.WS;
          this.buffer += ch;
        } else if (cc === 61) { // =
          this.tokenBuffer.push({
            type: 'EqualSign',
          });
        } else if (cc === 10) { // \n
          this.tokenBuffer.push({
            type: 'NL',
          });
        } else if (ch === "") {
          this.tokenBuffer.push({
            type: 'EOF',
          });
        }
        break;
      case FluentLexer.states.Identifier:
        if (isAlphaNum(cc)) {
          this.buffer += ch;
        } else {
          this.tokenBuffer.push({
            type: 'Identifier',
            name: this.buffer
          });
          this.buffer = "";
          this.state = FluentLexer.states.Resource;
          this._readChar(ch);
        }
        break;
      case FluentLexer.states.WS:
        if (isWS(cc)) {
          this.buffer += ch;
        } else  {
          this.tokenBuffer.push({
            type: 'WS',
            content: this.buffer
          });
          this.buffer = "";
          this.state = FluentLexer.states.Resource;
          this._readChar(ch);
        }
        break;
    }
  }
}

FluentLexer.states = {
  Resource: 0,
  Identifier: 1,
  WS: 2,
}

function isAlphaNum(cc) {
  if (cc >= 97 && cc <= 122 ||
      cc >= 65 && cc <= 90 ||
      cc >= 48 && cc <= 57) {
    return true;
  }
  return false;
}

function isWS(cc) {
  if (cc === 32 || cc === 9) {
    return true;
  }
  return false;
}


exports.FluentLexer = FluentLexer;
