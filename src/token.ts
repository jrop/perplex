import Lexer from './lexer'

class Token {
	type: string
	match: string
	groups: string[]
	start: number
	end: number
	lexer: Lexer
	skip: boolean
	skipped: Token[]

	constructor(opts: {
		type: string
		match: string
		groups: string[]
		start: number
		end: number
		lexer: Lexer
		skip?: boolean
		skipped?: Token[]
	}) {
		this.type = opts.type
		this.match = opts.match
		this.groups = opts.groups
		this.start = opts.start
		this.end = opts.end
		this.lexer = opts.lexer
		this.skip = Boolean(opts.skip)
		this.skipped = opts.skipped || []
	}

	strpos() {
		const start = this.lexer.strpos(this.start)
		const end = this.lexer.strpos(this.end)
		return {start, end}
	}

	isEof() {
		return false
	}
	isUnrecognized() {
		return false
	}
}

export default Token

export class EOFToken extends Token {
	constructor(lexer: Lexer) {
		const end = lexer.source.length
		super({
			type: null,
			match: '(eof)',
			groups: [],
			skip: false,
			start: end,
			end,
			lexer,
		})
	}

	isEof() {
		return true
	}
}
export class UnrecognizedToken extends Token {
	constructor(match: string, start: number, end: number, lexer: Lexer) {
		super({
			type: 'ERROR',
			match,
			groups: [match],
			start,
			end,
			skip: true,
			lexer,
		})
	}
	isUnrecognized() {
		return true
	}
}

export const EOF = (lexer: Lexer) => new EOFToken(lexer)
