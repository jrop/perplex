import * as assert from 'assert'
import * as except from 'except'
import Lexer from './lexer'

const lex = new Lexer()
	.token('WS', /\s+/).disable('WS')
	.token('NUMBER', /\d+/)
	.token('$SKIP_SINGLE_LINE_COMMENT', /\/\/[^\n]*/)
	.token('$SKIP_WHITESPACE', /^\s+/)

describe('lexer', function () {
	beforeEach(function () {
		lex.source = '  4 5 6  '
	})

	const FOUR = {
		type: 'NUMBER',
		match: '4',
		groups: [ '4' ],
		start: 2,
		end: 3,
	}
	const FIVE = {
		type: 'NUMBER',
		match: '5',
		groups: [ '5' ],
		start: 4,
		end: 5,
	}
	const SIX = {
		type: 'NUMBER',
		match: '6',
		groups: [ '6' ],
		start: 6,
		end: 7,
	}

	it('.peek()', function () {
		assert.deepEqual(except(lex.peek(), 'lexer', 'strpos'), FOUR)

		lex.next()
		assert.deepEqual(except(lex.peek(), 'lexer', 'strpos'), FIVE)
		assert.deepEqual(except(lex.peek(), 'lexer', 'strpos'), FIVE)
	})

	it('.next()', function () {
		assert.deepEqual(except(lex.next(), 'lexer', 'strpos'), FOUR)
		assert.deepEqual(except(lex.next(), 'lexer', 'strpos'), FIVE)
		assert.deepEqual(except(lex.next(), 'lexer', 'strpos'), SIX)
		assert.deepEqual(except(lex.next(), 'lexer', 'strpos'), {
			type: '$EOF',
			match: '(eof)',
			groups: [],
			start: 9,
			end: 9,
		})
	})

	it('.expect()', function () {
		assert(lex.expect('NUMBER').match.trim(), '4')
		assert.throws(() => lex.expect('NOPE'))
	})

	it('.push()/.pop()', function () {
		const source = 'abc123def'
		const lexer = new Lexer().token('ID', /[a-z]+/)

		lexer.source = source
		assert.equal(lexer.expect('ID').match, 'abc')

		lexer.push(new Lexer().token('NUM', /[0-9]+/))
		assert.equal(lexer.expect('NUM').match, '123')

		lexer.pop()
		assert.equal(lexer.expect('ID').match, 'def')
	})

	it('.source (get)', function () {
		lex.next() // 4
		assert.equal(lex.source.replace(/\s+/g, ''), '456')
	})

	it('.position (get)', function () {
		lex.next() // 4
		assert.equal(lex.position, 3)
	})

	it('.position (set)', function () {
		lex.next() // 4
		lex.position = 0
		assert.equal(lex.next().match.trim(), '4')
	})

	it('enable/disable token types', function () {
		assert.equal(lex.enable('WS').next().match, '  ')
		assert.equal(lex.next().match, '4')
		lex.disable('WS')
		assert.equal(lex.next().match, '5')
	})

	it('unexpected input', function () {
		lex.source = '4 asdf'
		assert.equal(lex.next().match, '4')
		assert.throws(function () {
			lex.next()
		}, /asdf/)

		// recover?
		lex.source = '4 asdf 5'
		assert.equal(lex.next().match, '4')
		assert.throws(function () {
			lex.next()
		}, /asdf/)
		assert.equal(lex.next().match, '5')
	})
})

describe('Token', function () {
	it('.strpos()', function () {
		lex.source = `4
5 6
7`

		const _4 = lex.next()
		assert.deepEqual(_4.strpos(), {
			start: { line: 1, column: 1 },
			end: { line: 1, column: 2 },
		})

		const _5 = lex.next()
		assert.deepEqual(_5.strpos(), {
			start: { line: 2, column: 1 },
			end: { line: 2, column: 2 },
		})

		const _6 = lex.next()
		assert.deepEqual(_6.strpos(), {
			start: { line: 2, column: 3 },
			end: { line: 2, column: 4 },
		})

		const _7 = lex.next()
		assert.deepEqual(_7.strpos(), {
			start: { line: 3, column: 1 },
			end: { line: 3, column: 2 },
		})
	})
})
