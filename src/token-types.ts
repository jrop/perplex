import Token, {UnrecognizedToken} from './token'
import Lexer from './lexer'

// Thank you, http://stackoverflow.com/a/6969486
function toRegExp(str: string): RegExp {
	return new RegExp(str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'))
}

function normalize(regex: RegExp | string): RegExp {
	if (typeof regex === 'string') regex = toRegExp(regex)
	if (!regex.source.startsWith('^'))
		return new RegExp(`^${regex.source}`, regex.flags)
	else return regex
}

function first<T, U>(
	arr: T[],
	predicate: (item: T, i: number) => U
): {item: T; result: U} {
	let i = 0
	for (const item of arr) {
		const result = predicate(item, i++)
		if (result) return {item, result}
	}
}

export default class TokenTypes<T = string> {
	private lexer: Lexer<T>
	public tokenTypes: {
		type: T
		regex: RegExp
		enabled: boolean
		skip: boolean
	}[]
	private UNMATCHED_TT = {
		type: null,
		regex: normalize(/(?:.|\s)*/),
		enabled: true,
		skip: true,
	}

	constructor(lexer: Lexer<T>) {
		this.lexer = lexer
		this.tokenTypes = []
	}

	disable(type: T): TokenTypes<T> {
		return this.enable(type, false)
	}

	enable(type: T, enabled: boolean = true): TokenTypes<T> {
		this.tokenTypes
			.filter(t => t.type == type)
			.forEach(t => (t.enabled = enabled))
		return this
	}

	isEnabled(type: T) {
		const ttypes = this.tokenTypes.filter(tt => tt.type == type)
		if (ttypes.length == 0)
			throw new Error(`Token of type ${type} does not exists`)
		return ttypes[0].enabled
	}

	peek(source: string, position: number) {
		const tts = [...this.tokenTypes, this.UNMATCHED_TT]
		const match = first(tts.filter(tt => tt.enabled), tt => {
			tt.regex.lastIndex = 0
			return tt.regex.exec(source.substring(position))
		})
		return match.item == this.UNMATCHED_TT
			? new UnrecognizedToken(
					match.result[0],
					position,
					position + match.result[0].length,
					null
			  )
			: new Token({
					type: match.item.type,
					match: match.result[0],
					groups: match.result.map(x => x),
					start: position,
					end: position + match.result[0].length,
					skip: match.item.skip,
					lexer: this.lexer,
			  })
	}

	define(
		type: T,
		pattern: RegExp | string,
		skip: boolean = false,
		enabled: boolean = true
	): TokenTypes<T> {
		this.tokenTypes.push({
			type,
			regex: normalize(pattern),
			skip,
			enabled,
		})
		return this
	}

	defineKeyword(type: T, kwd: string) {
		return this.define(type, new RegExp(`\\b${kwd}(?=\\b)`))
	}

	defineOperator(type: T, op: string) {
		return this.define(type, op)
	}
}
