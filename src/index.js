'use strict'

class Token {
	constructor(type, match, start, end, extra) {
		this.type = type
		this.match = match
		this.start = start
		this.end = end

		for (const key in extra) {
			if (typeof extra[key] == 'function')
				this[key] = extra[key].bind(this)
			else
				this[key] = extra[key]
		}
	}
}

function normalize(regex) {
	if (!regex.source.startsWith('^'))
		return new RegExp(`^${regex.source}`, regex.flags)
	else
		return regex
}

function lexer(s) {
	const tokenTypes = [ ]
	const inserted = [ ]
	let pos = 0
	let defaultExtra

	function peekRegex(r, position) {
		position = position || pos
		r.lastMatch = 0
		const m = r.exec(s.substring(position))
		return m ? m[0] : null
	}

	const lex = { }

	//
	// next
	//
	lex.next = function lexerNext() {
		try {
			const t = lex.peek()
			if (t && !t.transient)
				pos = t.end
			lex.current = t
			return t
		} catch (e) {
			pos = e.end
			throw e
		}
	}

	//
	// peek
	//
	lex.peek = function lexerPeek(position) {
		position = position || pos

		// first check if we have any feaux tokens to deliver:
		if (inserted.length > 0)
			return Object.assign(inserted.pop())

		if (position >= s.length)
			return new Token('$EOF', '', position, position, defaultExtra)

		let t
		do {
			t = null
			for (var tokenType of tokenTypes) {
				const match = peekRegex(tokenType.regex, position)
				if (match) {
					const start = position
					const end = position + match.length
					t = new Token(tokenType.type, match, start, end, tokenType.extra || defaultExtra)
					position = end
					break // break out of for
				}
			}
		} while (t && t.type.startsWith('$SKIP'))

		if (!t && position >= s.length)
			return new Token('$EOF', '', position, position, defaultExtra)

		// did we find a match?
		if (!t) {
			let unexpected = s.substring(position, position + 1)
			try {
				lex.peek(position + 1)
			} catch (e) {
				unexpected += e.unexpected
			}
			const e = new Error(`Unexpected token: ${unexpected}`)
			e.unexpected = unexpected
			e.end = position + unexpected.length
			throw e
		}

		return t
	}

	//
	// insert
	//
	lex.insert = function lexerInsert(token) {
		if (!(token instanceof Token)) {
			const extra = Object.assign({ }, defaultExtra, token)
			token = new Token('$TRANSIENT', '', -1, -1, extra)
		}
		token.transient = true
		inserted.push(token)
	}

	//
	// source
	//
	lex.source = function lexerString(str) {
		s = str
		pos = 0
		inserted.splice(0, inserted.length)
	}

	//
	// attach chaining functions to `lex`
	//
	lex.extra = function lexerExtra(extra) {
		defaultExtra = extra
		return lex
	}
	lex.token = function lexerToken(type, regex, extra) {
		regex = normalize(regex)
		tokenTypes.push({ type, regex, extra })
		return lex
	}
	return lex
}

module.exports = lexer
module.exports.Token = Token
