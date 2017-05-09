import * as assert from 'assert'
import * as except from 'except'
import Lexer from '../src/lexer'
import Token from '../src/token'

function clean<T>(t: Token<T>) {
	return except(t, 'lexer', 'strpos', 'isEof', 'constructor')
}

const lex = new Lexer<string>()
	.token('WS', /\s+/).disable('WS')
	.token('NUMBER', /\d+/)
	.token('SINGLE_LINE_COMMENT', /\/\/[^\n]*/, true)
	.token('WHITESPACE', /^\s+/, true)

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

	it('.peek()', function () {
		assert.deepEqual(clean(lex.peek()), FOUR)

		lex.next()
		assert.deepEqual(clean(lex.peek()), FIVE)
		assert.deepEqual(clean(lex.peek()), FIVE)
	})

	it('.next()', function () {
		assert(!lex.peek().isEof())
		assert.deepEqual(clean(lex.next()), FOUR)
		assert.deepEqual(clean(lex.next()), FIVE)
		assert.deepEqual(clean(lex.next()), SIX)
		assert.deepEqual(clean(lex.next()), {
			type: null,
			match: '(eof)',
			groups: [],
			start: 9,
			end: 9,
		})
		assert(lex.next().isEof())
	})

	it('.expect()', function () {
		assert(lex.expect('NUMBER').match.trim(), '4')
		assert.throws(() => lex.expect('NOPE'))
	})

	it('.toArray()', function () {
		lex.next() // make sure toArray starts from the beginning
		assert.deepEqual(lex.toArray().map(t => clean(t)), [FOUR, FIVE, SIX])
		// make sure the original state is left intact:
		assert.deepEqual(clean(lex.peek()), FIVE)
	})

	it('.attach()', function () {
		const lex2 = new Lexer()
			.token('ALL', /.*/)
		lex2.attachTo(lex)

		lex.next() // eat 4
		assert.deepEqual(clean(lex2.peek()), {
			type: 'ALL',
			match: ' 5 6  ',
			groups: [' 5 6  '],
			start: 3, end: 9,
		})
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
