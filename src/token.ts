import Lexer from './lexer'

class Token<T = string> {
	type: T
	match: string
	groups: string[]
	start: number
	end: number
	lexer: Lexer<T>
	skip: boolean
	skipped: Token<T>[]

	constructor(opts: {
		type: T
		match: string
		groups: string[]
		start: number
		end: number
		lexer: Lexer<T>
		skip?: boolean
		skipped?: Token<T>[]
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
	toString() {
		return (
			this.skipped.map(t => t.match).join('') + (this.isEof() ? '' : this.match)
		)
	}
}

export default Token

export class EOFToken<T> extends Token<T> {
	constructor(lexer: Lexer<T>) {
		const end = lexer.state.source.length
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
export class UnrecognizedToken<T> extends Token<T> {
	constructor(match: string, start: number, end: number, lexer: Lexer<T>) {
		super({
			type: null,
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

export const EOF = <T>(lexer: Lexer<T>) => new EOFToken<T>(lexer)
