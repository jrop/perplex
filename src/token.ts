import Lexer from './lexer'

/**
 * @typedef {{
 *   start: Position,
 *   end: Position,
 * }} TokenPosition
 */

/**
 * Represents a token instance
 */
class Token {
	type: string
	match: string
	groups: string[]
	start: number
	end: number
	lexer: Lexer
	transient: boolean

	/* tslint:disable:indent */
	/**
	 * Constructs a token
	 * @param {string} type The token type
	 * @param {string} match The string that the lexer consumed to create this token
	 * @param {string[]} groups Any RegExp groups that accrued during the match
	 * @param {number} start The string position where this match started
	 * @param {number} end The string position where this match ends
	 * @param {Lexer} lexer The parent {@link Lexer}
	 * @param {any} [extra] Extra props/methods to tack on to this Token instance
	 */
	constructor(type: string,
	            match: string,
	            groups: string[],
	            start: number,
	            end: number,
	            lexer: Lexer,
	            extra: any) {
		/* tslint:enable */
		/**
		 * The token type
		 * @type {string}
		 */
		this.type = type
		
		/**
		 * The string that the lexer consumed to create this token
		 * @type {string}
		 */
		this.match = match
		
		/**
		 * Any RegExp groups that accrued during the match
		 * @type {string[]}
		 */
		this.groups = groups
		
		/**
		 * The string position where this match started
		 * @type {number}
		 */
		this.start = start
		
		/**
		 * The string position where this match ends
		 * @type {number}
		 */
		this.end = end
		
		/**
		 * The parent {@link Lexer}
		 * @type {Lexer}
		 */
		this.lexer = lexer

		for (const key in extra) {
			if (typeof extra[key] == 'function')
				/** @private */
				this[key] = extra[key].bind(this)
			else
				this[key] = extra[key]
		}
	}

	/**
	 * Returns the bounds of this token, each in `{line, column}` format
	 * @return {TokenPosition}
	 */
	strpos() {
		const start = this.lexer.strpos(this.start)
		const end = this.lexer.strpos(this.end)
		return {start, end}
	}
}

export default Token
