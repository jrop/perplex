import Token from './token'

// Thank you, http://stackoverflow.com/a/6969486
function toRegExp(str: string): RegExp {
	return new RegExp(str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'))
}

function normalize(regex: RegExp|string): RegExp {
	if (typeof regex === 'string')
		regex = toRegExp(regex)
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
		enabled: boolean,
	}[]
	private _subLexer: Lexer
	/* tslint:enable */

	/**
	 * Creates a new Lexer instance
	 * @param {string} [source = ''] The source string to operate on.
	 */
	constructor(source: string = '') {
		this._source = source
		this._position = 0
		this._tokenTypes = []
		this._subLexer = null
	}

	private _peekRegex(r: RegExp, position: number): {
		match: string,
		groups: string[],
	} {
		r.lastIndex = 0
		const groups = r.exec(this._source.substring(position))
		const sGroups = groups ? groups.map(x => x) : null  // only keep array elements (remove "index" and "input")
		const match = groups ? groups[0] : null
		return {match, groups: sGroups}
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
	 * Disables the specified token-type
	 * @param {string} type The token type to disable
	 * @returns {Lexer}
	 */
	disable(type: string): Lexer {
		return this.enable(type, false)
	}

	/**
	 * Enables/disables the specified token-type
	 * @param {string} type The token type to enable/disable
	 * @param {boolean} [enabled=true] Whether to enable/disable the token type
	 * @returns {Lexer}
	 */
	enable(type: string, enabled: boolean = true): Lexer {
		this._tokenTypes
			.filter(t => t.type == type)
			.forEach(t => t.enabled = enabled)
		return this
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
	 * Consumes and returns the next {@link Token} in the source string.
	 * If there are no more tokens, it returns a {@link Token} of type `$EOF`
	 * @return {Token}
	 */
	next(): Token {
		if (this._subLexer)
			return this._subLexer.next()
		try {
			const t = this.peek()
			this.position = t.end
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
	peek(position: number = this.position): Token {
		if (this._subLexer) {
			console.log('SUB found!', this._subLexer)
			return this._subLexer.peek(position)
		}

		if (position >= this._source.length)
			return new Token('$EOF', '', [], position, position, this)

		let t
		do {
			t = null
			for (const tokenType of this._tokenTypes.filter(t => t.enabled)) {
				const { match, groups } = this._peekRegex(tokenType.regex, position)
				if (match) {
					const start = position
					const end = position + match.length
					t = new Token(tokenType.type, match, groups, start, end, this)
					position = end
					break // break out of for
				}
			}
		} while (t && t.type.startsWith('$SKIP'))

		if (!t && position >= this._source.length)
			return new Token('$EOF', '(eof)', [], position, position, this)

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
	 * Pops the sub-lexer and returns lexing-control to `this`
	 */
	pop() {
		if (!this._subLexer)
			throw new Error('Sub-lexer is not set; cannot `pop(...)`')
		this.position = this._subLexer.position
		this._subLexer = null
	}

	/**
	 * Sets a sub-lexer that will operate on the source stream instead of `this`.
	 * @param {Lexer} lexer The sub-lexer to set
	 * @returns {Lexer} Returns `this`
	 */
	push(lexer: Lexer): Lexer {
		if (this._subLexer)
			throw new Error('Sub-lexer already set; cannot `push(...)`')
		if (lexer === this || lexer._subLexer === this)
			return this
		lexer.source = this.source
		lexer.position = this.position
		this._subLexer = lexer
		return this
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
	 * @param {RegExp|string} regex The regular expression that will match this token.
	 * @return {Lexer}
	 * @example
	 * const lex = perplex('...')
	 *   .token('ID', /(([$_a-z]+[$_a-z0-9]*)/i)
	 *   .token('$SKIP_WS', /\s+/i)
	 */
	token(type: string, pattern: RegExp|string): Lexer {
		this._tokenTypes.push({
			type,
			regex: normalize(pattern),
			enabled: true,
		})
		return this
	}
}

export default Lexer
