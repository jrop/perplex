import Token from './token'

function normalize(regex: RegExp): RegExp {
	if (!regex.source.startsWith('^'))
		return new RegExp(`^${regex.source}`, regex.flags)
	else
		return regex
}

/**
 * @typedef {{
 *   line: number,
 *   column: number,
 * }} Position
 */

/**
 * Lexes a source-string into tokens.
 * 
 * @example
 * const lex = perplex('...')
 *   .token('ID', /my-id-regex/)
 *   .token('(', /\(/)
 *   .token(')', /\)/)
 *   .token('$SKIP_WS', /\s+/)
 * 
 * while ((let t = lex.next()).type != '$EOF') {
 *   console.log(t)
 * }
 */
class Lexer {
	/* tslint:disable:variable-name */
	private _source: string
	private _position: number
	private _tokenTypes: {
		type: string,
		regex: RegExp,
		extra: any,
	}[]
	private _inserted: Token[]
	private _defaultExtra: any

	private _current: Token
	/* tslint:enable */

	/**
	 * Creates a new Lexer instance
	 * @param {string} source The source string to operate on.
	 */
	constructor(source: string) {
		this._source = source
		this._position = 0
		this._tokenTypes = []
		this._inserted = []
		this._defaultExtra = null
	}

	private _peekRegex(r, position): {
		match: string,
		groups: string[],
	} {
		r.lastMatch = 0

		let groups = r.exec(this._source.substring(position))
		if (groups) groups = groups.map(x => x) // only keep array elements (remove "index" and "input")

		const match = groups ? groups[0] : null
		return {match, groups}
	}

	/**
	 * Gets the source being lexed
	 * @type {string}
	 */
	get source(): string {
		return this._source
	}

	/**
	 * Sets the source being lexed
	 * @type {string}
	 */
	set source(s: string) {
		this._source = s
		this.position = 0
		this._inserted.splice(0, this._inserted.length)
	}

	/**
	 * Returns the lexer's position in the source string
	 * @type {number}
	 */
	get position(): number {
		return this._position
	}

	/**
	 * Sets the lexer's position in the source string
	 * @type {number}
	 */
	set position(pos: number) {
		this._position = pos
	}

	/**
	 * Like {@link next}, but throws an exception if the next token is
	 * not of the required type.
	 * @param {string} type The token type expected from {@link next}
	 * @return {Token} Returns the {@link Token} on success
	 */
	expect(type: string): Token {
		const t = this.next()
		if (t.type != type) {
			const pos = t.strpos()
			throw new Error('Expected ' + type + (t ? ', got ' + t.type : '') + ' at ' + pos.start.line + ':' + pos.start.column)
		}
		return t
	}

	/**
	 * Extends Token instances generically.
	 * @param {any} extra The object to be `Object.assign(...)`'d to tokens in general.
	 * @return {Lexer} Returns the Lexer instance.
	 * @example
	 * const lex = perplex(s)
	 *   .extra({
	 *     myMethod() {
	 *       console.log('My custom method')
	 *     }
	 *   })
	 * lex.next().myMethod() // prints 'My custom method'
	 */
	extra(extra: any): Lexer {
		this._defaultExtra = extra
		return this
	}

	/**
	 * Inserts a transient token into the token stream that will be returned
	 * the next time {@link next} is called.
	 * @param {Token|any} token The token to insert.
	 */
	insert(token: Token|any) {
		if (!(token instanceof Token)) {
			const extra = Object.assign({}, this._defaultExtra, token)
			token = new Token('$TRANSIENT', '', [], -1, -1, this, extra)
		}
		token.transient = true
		this._inserted.push(token)
	}

	/**
	 * Consumes and returns the next {@link Token} in the source string.
	 * If there are no more tokens, it returns a {@link Token} of type `$EOF`
	 * @return {Token}
	 */
	next(): Token {
		try {
			const t = this.peek()
			if (t && !t.transient)
				this.position = t.end
			this._current = t
			return t
		} catch (e) {
			this._position = e.end
			throw e
		}
	}

	/**
	 * Returns the next {@link Token} in the source string, but does
	 * not consume it.
	 * If there are no more tokens, it returns a {@link Token} of type `$EOF`
	 * @param {number} [position=`this.position`] The position at which to start reading
	 * @return {Token}
	 */
	peek(position:number = this.position): Token {
		// first check if we have any feaux tokens to deliver:
		if (this._inserted.length > 0)
			return Object.assign(this._inserted.pop())

		if (position >= this._source.length)
			return new Token('$EOF', '', [], position, position, this, this._defaultExtra)

		let t
		do {
			t = null
			for (const tokenType of this._tokenTypes) {
				const { match, groups } = this._peekRegex(tokenType.regex, position)
				if (match) {
					const start = position
					const end = position + match.length
					t = new Token(tokenType.type, match, groups, start, end, this, Object.assign({}, this._defaultExtra, tokenType.extra))
					position = end
					break // break out of for
				}
			}
		} while (t && t.type.startsWith('$SKIP'))

		if (!t && position >= this._source.length)
			return new Token('$EOF', '(eof)', [], position, position, this, this._defaultExtra)

		// did we find a match?
		if (!t) {
			let unexpected = this._source.substring(position, position + 1)
			try {
				this.peek(position + 1)
			} catch (e) {
				unexpected += e.unexpected
			}
			const {line, column} = this.strpos(position)
			const e = new Error(`Unexpected token: ${unexpected} at (${line}:${column})`);
			(e as any).unexpected = unexpected;
			(e as any).end = position + unexpected.length
			throw e
		}

		return t
	}

	/**
	 * Returns the remaining (un-lexed) source string
	 * @return {string}
	 */
	remaining() {
		return this._source.substring(this.position)
	}

	/**
	 * Converts a string-index (relative to the source string) to a line and a column.
	 * @param {number} i The index to compute
	 * @return {Position}
	 */
	strpos(i: number): {
		line: number,
		column: number,
	} {
		let lines = this._source.substring(0, i).split(/\r?\n/)
		if (!Array.isArray(lines))
			lines = [lines]

		const line = lines.length
		const column = lines[lines.length - 1].length + 1
		return {line, column}
	}

	/**
	 * Defines a token-type. If the token `type` starts with `$SKIP`, then those tokens will be skipped.
	 * @param {string} type The name of this token-type.
	 * @param {RegExp} regex The regular expression that will match this token.
	 * @param {any} [extra] Token-specific extras (will become instance methods/properties on this token type)
	 * @return {Lexer}
	 * @example
	 * const lex = perplex('...')
	 *   .token('ID', /(([$_a-z]+[$_a-z0-9]*)/i)
	 *   .token('$SKIP_WS', /\s+/i)
	 */
	token(type: string, regex: RegExp, extra: any = null): Lexer {
		regex = normalize(regex)
		this._tokenTypes.push({type, regex, extra})
		return this
	}
}

export default Lexer
