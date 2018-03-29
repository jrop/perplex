import LexerState from './lexer-state'
import Token, {EOF, UnrecognizedToken} from './token'
import TokenTypes from './token-types'

/**
 * The options a Lexer abides by
 */
export type LexerOptions = {
	record: boolean
	throwOnUnrecognized: boolean
}

/**
 * The main Lexer class
 */
export default class Lexer {
	/**
	 * The internal state of the lexer.  Multiple lexers can
	 * utilize the same shared state.  See `attachTo`.
	 */
	public state: LexerState

	/**
	 * The token types that this Lexer can consume
	 */
	public tokenTypes: TokenTypes

	/**
	 * Change certain behaviors by manipulating
	 * these options
	 */
	public options: LexerOptions = {
		record: false,
		throwOnUnrecognized: true,
	}

	/**
	 * Constructs a new Lexer
	 * @param source Either:
	 *   1) a string
	 *   2) Another Lexer to attach to, or
	 *   3) LexerState to use as the underlying state
	 */
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

	/**
	 * Utilize the `other` Lexer's underlying state as our own.
	 * Allows two or more Lexers to attache to the same state
	 * and both stream through tokens in a coordinated manner.
	 * @param other The other lexer to attach to
	 */
	attachTo(other: Lexer) {
		this.state = other.state
	}

	/**
	 * Throw if `.next().type != type`
	 * @param type The type of token to expect
	 */
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

	/**
	 * Retrieve the next token, and advance the current position
	 */
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

	/**
	 * Peek at the next token without consuming it
	 * @param position The position to peek at
	 */
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

	/**
	 * Restore the Lexer state to the way it was before `tokenToRewind` was consumed
	 * @param tokenToRewind
	 */
	rewind(tokenToRewind: Token): Lexer {
		this.state.position = tokenToRewind.start
		return this
	}

	/**
	 * Return the {line, column} of a position `i` in the string
	 * @param i
	 */
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

	/**
	 * Throw an error like `Unexpected input: ...` based on a token
	 * @param t The token to base the error message on
	 */
	throw(t: Token) {
		const {line, column} = this.strpos(t.start)
		const e = new Error(`Unexpected input: ${t.match} at (${line}:${column})`)
		;(e as any).token = t
		throw e
	}

	/**
	 * Retrieve the array of tokens in the underlying string.
	 * Includes all unexpected input, and skipped tokens as
	 * top-level entries in the returned array.
	 */
	toArray(): Token[] {
		const oldState = this.state.copy()
		this.state.position = 0

		const shouldThrow = this.options.throwOnUnrecognized
		this.options.throwOnUnrecognized = false

		const tkns: Token[] = []
		const addSkipped = (t: Token) => {
			for (const tkn of t.skipped) tkns.push(tkn)
		}
		let t
		while (!(t = this.next()).isEof()) {
			addSkipped(t)
			tkns.push(t)
		}
		addSkipped(t)

		this.state = oldState
		this.options.throwOnUnrecognized = shouldThrow
		return tkns
	}
}

export {EOF, Token, TokenTypes, LexerState}
