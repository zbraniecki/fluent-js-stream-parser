const Stream = require('stream');
const FluentLexer = require('./lexer').FluentLexer;

class FluentParser extends Stream.Transform {
  constructor(options = {}) {
    options.objectMode = true;
    super(options);
    this.state = FluentParser.states.Resource;
    this.buffer = "";
    this.token = null;
    this.lexerTokenBuffer = [];
    this.tokenBuffer = [];
  }

  _transform(data, encoding, callback) {
    console.log(`FluentParser::transform::read: "${JSON.stringify(data)}"`);
    this._readLexerToken(data);
    let token;
    while (token = this.tokenBuffer.shift()) {
      console.log(`FluentParser::transform::push: "${JSON.stringify(token)}"`);
      this.push(token);
    }
    callback();
  }

  _readLexerToken(token) {
    console.log(`FluentParser::readLexerToken: "${JSON.stringify(token)}", state ${this.state}`);
    let lastLexerToken;
    switch (this.state) {
      case FluentParser.states.Resource:
        switch (token.type) {
          case 'Identifier':
            this.state = FluentParser.states.Message;
            this.lexerTokenBuffer.push(token);
            break;
          case 'EOF':
            this.tokenBuffer.push(token);
            break;
        }

        break;
      case FluentParser.states.Message:
        switch (token.type) {
          case 'WS':
            this.lexerTokenBuffer.push(token);
            break;
          case 'EqualSign':
            lastLexerToken = this._getPrevTokenFromBuffer(true, true);
            if (lastLexerToken.type !== 'Identifier') {
              throw new Error('EqualSign should only apper after an Identifier');
            } else {
              this.lexerTokenBuffer.push(token);
            }
            break;
          case 'Identifier':
            this.lexerTokenBuffer.push(token);
            break;
          case 'NL':
          case 'EOF':
            let id = this.lexerTokenBuffer[0].name;
            let eqSignPos = this._findTokenInBuffer('EqualSign');
            let patternStartPos = eqSignPos + 1;
            if (this.lexerTokenBuffer[patternStartPos].type === 'WS') {
              patternStartPos += 1;
            }
            let pattern = this.lexerTokenBuffer.slice(patternStartPos).map(token => {
              switch (token.type) {
                case 'Identifier':
                  return token.name;
                case 'WS':
                  return token.content;
              }
            }).join("");

            this.tokenBuffer.push({
              type: 'Message',
              id,
              pattern
            });
            this.lexerTokenBuffer = [];
            this.state = FluentParser.states.Resource;
            this._readLexerToken(token);
            break;
        }
        break;
    }
  }

  _getPrevTokenFromBuffer(skipWS = true, wsAllowed = true) {
    let lastLexerToken = this.lexerTokenBuffer[this.lexerTokenBuffer.length - 1];
    if (lastLexerToken.type === 'WS') {
      if (!wsAllowed) {
        throw new Error('WS not allowed before this token');
      } else if (!skipWS) {
        return lastLexerToken;
      } else {
        lastLexerToken = this.lexerTokenBuffer[this.lexerTokenBuffer.length - 2];
      }
    }
    return lastLexerToken;
  }

  _findTokenInBuffer(name) {
    for (let i = 0; i < this.lexerTokenBuffer.length; i++) {
      if (this.lexerTokenBuffer[i].type === name) {
        return i;
      }
    }
    return -1;
  }
}

FluentParser.states = {
  Resource: 0,
  Message: 1,
}

exports.FluentParser = FluentParser;
