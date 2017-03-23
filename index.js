const Lexer = require('./lib/lexer').default
const Token = require('./lib/token').default

module.exports = source => new Lexer(source)
module.exports.Lexer = Lexer
module.exports.Token = Token
