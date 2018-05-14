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
export default class Lexer<T = string> {
	/**
	 * The internal state of the lexer.  Multiple lexers can
	 * utilize the same shared state.  See `attachTo`.
	 */
	public state: LexerState<T>

	/**
	 * The token types that this Lexer can consume
	 */
	public tokenTypes: TokenTypes<T>

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
	constructor(source?: Lexer<T> | LexerState<T> | string) {
		this.state = ((): LexerState<T> => {
			if (typeof source == 'undefined') return new LexerState('')
			else if (source instanceof Lexer) return source.state
			else if (source instanceof LexerState) return source
			else if (typeof source == 'string') return new LexerState(source)
		})()
		this.tokenTypes = new TokenTypes(this)
	}

	//
	// PROPERTIES
	//
	get source() {
		return this.state.source
	}
	set source(value: string) {
		this.state.source = value
	}
	get position() {
		return this.state.position
	}
	set position(i: number) {
		this.state.position = i
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
	attachTo(other: Lexer<T>) {
		this.state = other.state
	}

	/**
	 * Throw if `.next().type != type`
	 * @param type The type of token to expect
	 */
	expect(type: T): Token<T> {
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
	 * Execute a function if the next token is of type `type`
	 *
	 * Example:
	 * ```ts
	 * const result = lexer.ifNext(
	 *   'NUM',
	 *   t => parseFloat(t.match),
	 *   () => Number.NaN
	 * )
	 * ```
	 *
	 * @param type The type(s) of token to accept
	 * @param consequent The function to execute upon a matching token
	 * @param alternate An optional function to execute upon not matching
	 * @returns The result of `consequent` or `alternate`
	 */
	ifNext<U, V>(
		type: T | T[],
		consequent: (token: Token<T>) => U,
		alternate?: () => V
	): U | V {
		const types = Array.isArray(type) ? type : [type]
		if (types.includes(this.peek().type)) return consequent(this.next())
		else if (typeof alternate === 'function') return alternate()
	}

	/**
	 * Retrieve the next token, and advance the current position
	 */
	next(): Token<T> {
		try {
			const t = this.peek()
			this.state.position = t.end
			this.record(t)
			return t
		} catch (e) {
			const t = e.token as Token<T>
			this.record(t)
			this.state.position = t.end
			throw e
		}
	}

	/**
	 * Peek at the next token without consuming it
	 * @param position The position to peek at
	 */
	peek(position: number = this.state.position): Token<T> {
		const skipped = []
		const read = (i: number = position) => {
			if (i >= this.state.source.length) return EOF(this)
			const t = this.tokenTypes.peek(this.state.source, i)
			if (t.isUnrecognized() && this.options.throwOnUnrecognized) this.throw(t)
			if (t.skip) {
				skipped.push(t)
				return read(i + t.groups[0].length)
			} else return t
		}

		const token: Token<T> = read()
		token.skipped = skipped
		return token
	}

	private record(t: Token<T>) {
		if (!this.options.record) return
		for (const s of t.skipped) this.state.trail.push(s)
		if (!t.isEof()) this.state.trail.push(t)
	}

	/**
	 * Return the rest of the (unconsumed) string
	 */
	rest() {
		return this.source.substr(this.position)
	}

	/**
	 * Restore the Lexer state to the way it was before `tokenToRewind` was consumed
	 * @param tokenToRewind
	 */
	rewind(tokenToRewind: Token<T>): Lexer<T> {
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
	throw(t: Token<T>) {
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
	toArray(): Token<T>[] {
		const oldState = this.state.copy()
		this.state.position = 0

		const shouldThrow = this.options.throwOnUnrecognized
		this.options.throwOnUnrecognized = false

		const tkns: Token<T>[] = []
		let t
		while (!(t = this.next()).isEof()) tkns.push(t)
		tkns.push(t)

		this.state = oldState
		this.options.throwOnUnrecognized = shouldThrow
		return tkns
	}

	//
	// BUILDER METHODS
	//

	/**
	 * Disables a specified token-type
	 * @param type The token type to disable
	 */
	disable(type: T): this {
		this.tokenTypes.enable(type, false)
		return this
	}
	/**
	 * Enables/disables a specified token-type
	 * @param type The token type to enable/disable
	 */
	enable(type: T, enabled: boolean = true): this {
		this.tokenTypes.enable(type, enabled)
		return this
	}

	/**
	 * Defines a keyword token
	 * @param type The token type
	 * @param kwd The keyword, as a string
	 */
	keyword(type: T, kwd: string): this {
		this.tokenTypes.defineKeyword(type, kwd)
		return this
	}

	/**
	 * Defines a token
	 * @param type The token type
	 * @param pattern The pattern to match
	 * @param skip Sets whether this is a skipped token or not
	 * @param enabled Sets where this token is enabled or not
	 */
	token(
		type: T,
		pattern: RegExp | string,
		skip: boolean = false,
		enabled: boolean = true
	): this {
		this.tokenTypes.define(type, pattern, skip, enabled)
		return this
	}

	/**
	 * Defines an operator token
	 * @param type The token type
	 * @param kwd The operator, as a string
	 */
	operator(type: T, op: string): this {
		this.tokenTypes.defineOperator(type, op)
		return this
	}
}

export {EOF, Token, TokenTypes, Lexer, LexerState}
