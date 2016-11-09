'use strict'

class Token {
	constructor(type, match, groups, start, end, lexer, extra) {
		this.type = type
		this.match = match
		this.groups = groups
		this.start = start
		this.end = end
		this.lexer = lexer

		for (const key in extra) {
			if (typeof extra[key] == 'function')
				this[key] = extra[key].bind(this)
			else
				this[key] = extra[key]
		}
	}

	strpos() {
		const start = this.lexer.strpos(this.start)
		const end = this.lexer.strpos(this.end)
		return { start, end }
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

		let groups = r.exec(s.substring(position))
		if (groups) groups = groups.map(x => x) // only keep array elements (remove "index" and "input")

		const match = groups ? groups[0] : null
		return { match, groups }
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
	// expect
	//
	lex.expect = function lexerExpect(type) {
		const t = lex.next()
		if (t.type != type) {
			const pos = t.strpos()
			throw new Error('Expected ' + type + (t ? ', got ' + t.type : '') + ' at ' + pos.start.line + ':' + pos.start.column)
		}
		return t
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
			return new Token('$EOF', '', position, position, lex, defaultExtra)

		let t
		do {
			t = null
			for (var tokenType of tokenTypes) {
				const { match, groups } = peekRegex(tokenType.regex, position)
				if (match) {
					const start = position
					const end = position + match.length
					t = new Token(tokenType.type, match, groups, start, end, lex, Object.assign({ }, defaultExtra, tokenType.extra))
					position = end
					break // break out of for
				}
			}
		} while (t && t.type.startsWith('$SKIP'))

		if (!t && position >= s.length)
			return new Token('$EOF', '(eof)', [], position, position, lex, defaultExtra)

		// did we find a match?
		if (!t) {
			let unexpected = s.substring(position, position + 1)
			try {
				lex.peek(position + 1)
			} catch (e) {
				unexpected += e.unexpected
			}
			const { line, column } = lex.strpos(position)
			const e = new Error(`Unexpected token: ${unexpected} at (${line}:${column})`)
			e.unexpected = unexpected
			e.end = position + unexpected.length
			throw e
		}

		return t
	}

	//
	// strpos
	//
	lex.strpos = function lexStrpos(i) {
		let lines = s.substring(0, i).split(/\r\n|\r|\n/)
		if (!Array.isArray(lines))
			lines = [ lines ]

		const line = lines.length
		const column = lines[lines.length - 1].length + 1
		return { line, column }
	}

	//
	// insert
	//
	lex.insert = function lexerInsert(token) {
		if (!(token instanceof Token)) {
			const extra = Object.assign({ }, defaultExtra, token)
			token = new Token('$TRANSIENT', '', [], -1, -1, lex, extra)
		}
		token.transient = true
		inserted.push(token)
	}

	//
	// source
	//
	lex.source = function lexerString(str) {
		if (typeof str == 'undefined')
			return s
		s = str
		pos = 0
		inserted.splice(0, inserted.length)
		return lex
	}

	//
	// remaining
	//
	lex.remaining = function lexerRemaining() {
		return s.substring(pos)
	}

	//
	// pos property
	//
	Object.defineProperty(lex, 'position', {
		get: () => pos,
		set: p => pos = p,
	})

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
