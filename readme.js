const fs = require('fs')

const section = (title, f) =>
	`### ${title}\r\n` +
	'```ts\r\n' +
	fs
		.readFileSync(f, 'utf8')
		.replace(/^\s*private.*(?:\r?\n)?/mg, '')
		.trim() +
	'\r\n```'

const api = () =>
	[
		section('Lexer', 'lib/lexer.d.ts'),
		section('LexerState', 'lib/lexer-state.d.ts'),
		section('TokenTypes', 'lib/token-types.d.ts'),
		section('Token', 'lib/token.d.ts'),
	].join('\r\n\r\n')

const readme = fs
	.readFileSync('./README.tpl.md', 'utf8')
	.replace('{{__API_PLACEHOLDER__}}', api())
fs.writeFileSync('./README.md', readme)
