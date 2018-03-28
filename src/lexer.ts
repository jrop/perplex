import LexerState from './lexer-state'
import Token, {EOF, UnrecognizedToken} from './token'
import TokenTypes from './token-types'

class Lexer {
	private _state: LexerState
	private _tokenTypes: TokenTypes
	private _throwOnUnrecognized = true

	constructor(source: string = '') {
		this._state = new LexerState(source)
		this._tokenTypes = new TokenTypes(this)
	}

	//
	// Getters/Setters
	//

	get position() {
		return this._state.position
	}

	set position(i: number) {
		this._state.position = i
	}

	get source() {
		return this._state.source
	}

	set source(s: string) {
		this._state = new LexerState(s)
	}

	//
	// METHODS
	//

	attachTo(other: Lexer) {
		this._state = other._state
	}

	disable(type: string) {
		this._tokenTypes.disable(type)
		return this
	}

	enable(type: string, enabled?: boolean) {
		this._tokenTypes.enable(type, enabled)
		return this
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

	isEnabled(tokenType: string) {
		return this._tokenTypes.isEnabled(tokenType)
	}

	next(): Token {
		try {
			const t = this.peek()
			this._state.position = t.end
			return t
		} catch (e) {
			this._state.position = (e.token as Token).end
			throw e
		}
	}

	peek(position: number = this._state.position): Token {
		const skipped = []
		const read = (i: number = position) => {
			if (i >= this._state.source.length) return EOF(this)
			const t = this.peekOrUnrecognized(i)
			if (t.isUnrecognized() && this._throwOnUnrecognized) this.throw(t)
			if (t.skip) {
				skipped.push(t)
				return read(i + t.groups[0].length)
			} else return t
		}

		const token: Token = read()
		token.skipped = skipped
		return token
	}

	private peekOrUnrecognized(position: number = this._state.position): Token {
		let i = position,
			t: Token = null
		let readNextRaw = (): Token =>
			i >= this._state.source.length
				? (EOF(this) as Token)
				: this._tokenTypes.peek(this._state.source, i)

		while (true) {
			t = readNextRaw()
			if (t) break
			if (t && t.isEof()) break
			i++
		}

		if (t.start != position)
			return new UnrecognizedToken(
				this._state.source.substring(position, i),
				position,
				i,
				this
			)
		return t
	}

	strpos(
		i: number
	): {
		line: number
		column: number
	} {
		let lines = this._state.source.substring(0, i).split(/\r?\n/)
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
		const oldState = this._state.copy()
		this._state.position = 0
		this._throwOnUnrecognized = false

		const tkns: Token[] = []
		let t
		while (!(t = this.next()).isEof()) {
			for (const tkn of t.skipped) tkns.push(tkn)
			tkns.push(t)
		}

		this._state = oldState
		this._throwOnUnrecognized = true
		return tkns
	}

	token(type: string, pattern: string | RegExp, skip?: boolean) {
		this._tokenTypes.token(type, pattern, skip)
		return this
	}

	keyword(kwd: string) {
		return this.token(kwd, new RegExp(`${kwd}(?=\\W|$)`))
	}

	operator(op: string) {
		const sOp = new String(op).valueOf()
		return this.token(op, sOp)
	}
}

export default Lexer
export {EOF, Token, TokenTypes, LexerState}
