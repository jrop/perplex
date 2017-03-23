import _Lexer from './lib/lexer'
import _Token from './lib/token'

declare function perplex(s: string): _Lexer;

declare namespace perplex {
	interface Lexer extends _Lexer {}
	interface Token extends _Token {}
}

export = perplex
