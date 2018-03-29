import LexerState from './lexer-state'
import Token, {EOF, UnrecognizedToken} from './token'
import TokenTypes from './token-types'

export type LexerOptions = {
	record: boolean
	throwOnUnrecognized: boolean
}

export default class Lexer {
	public state: LexerState
	public tokenTypes: TokenTypes
	public options: LexerOptions = {
		record: false,
		throwOnUnrecognized: true,
	}

	constructor(source?: Lexer | LexerState | string) {
		this.state = (function(): LexerState {
			if (typeof source == 'undefined') return new LexerState('')
			else if (source instanceof Lexer) return source.state
			else if (source instanceof LexerState) return source
			else if (typeof source == 'string') return new LexerState(source)
		})()
		this.tokenTypes = new TokenTypes(this)
	}

	//
	// METHODS
	//

	attachTo(other: Lexer) {
		this.state = other.state
	}

	expect(type: string): Token {
		const t = this.next()
		if (t.type != type) {
			const pos = t.strpos()
			throw new Error(
				`Expected ${type}, got ${t.type} at ${pos.start.line}:${
					pos.start.column
				}`
			)
		}
		return t
	}

	next(): Token {
		try {
			const t = this.peek()
			this.state.position = t.end
			this.record(t)
			return t
		} catch (e) {
			const t = e.token as Token
			this.record(t)
			this.state.position = t.end
			throw e
		}
	}

	peek(position: number = this.state.position): Token {
		const skipped = []
		const read = (i: number = position) => {
			if (i >= this.state.source.length) return EOF(this)
			const t = this.peekOrUnrecognized(i)
			if (t.isUnrecognized() && this.options.throwOnUnrecognized) this.throw(t)
			if (t.skip) {
				skipped.push(t)
				return read(i + t.groups[0].length)
			} else return t
		}

		const token: Token = read()
		token.skipped = skipped
		return token
	}

	private peekOrUnrecognized(position: number = this.state.position): Token {
		let i = position,
			t: Token = null
		let readNextRaw = (): Token =>
			i >= this.state.source.length
				? (EOF(this) as Token)
				: this.tokenTypes.peek(this.state.source, i)

		while (true) {
			t = readNextRaw()
			if (t) break
			if (t && t.isEof()) break
			i++
		}

		if (t.start != position)
			return new UnrecognizedToken(
				this.state.source.substring(position, i),
				position,
				i,
				this
			)
		return t
	}

	private record(t: Token) {
		if (!this.options.record) return
		for (const s of t.skipped) this.state.trail.push(s)
		if (!t.isEof()) this.state.trail.push(t)
	}

	rewind(tokenToRewind: Token): Lexer {
		this.state.position = tokenToRewind.start
		return this
	}

	strpos(
		i: number
	): {
		line: number
		column: number
	} {
		let lines = this.state.source.substring(0, i).split(/\r?\n/)
		if (!Array.isArray(lines)) lines = [lines]

		const line = lines.length
		const column = lines[lines.length - 1].length + 1
		return {line, column}
	}

	throw(t: Token) {
		const {line, column} = this.strpos(t.start)
		const e = new Error(`Unexpected input: ${t.match} at (${line}:${column})`)
		;(e as any).token = t
		throw e
	}

	toArray(): Token[] {
		const oldState = this.state.copy()
		this.state.position = 0

		const shouldThrow = this.options.throwOnUnrecognized
		this.options.throwOnUnrecognized = false

		const tkns: Token[] = []
		let t
		while (!(t = this.next()).isEof()) {
			for (const tkn of t.skipped) tkns.push(tkn)
			tkns.push(t)
		}

		this.state = oldState
		this.options.throwOnUnrecognized = shouldThrow
		return tkns
	}
}

export {EOF, Token, TokenTypes, LexerState}
