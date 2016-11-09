'use strict'

const assert = require('assert')
const except = require('except')
const lexer = require('./lib/index')

const lex = lexer()
	.extra({ extra: true })
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
		extra: true,
	}
	const FIVE = {
		type: 'NUMBER',
		match: '5',
		groups: [ '5' ],
		start: 4,
		end: 5,
		extra: true,
	}
	const SIX = {
		type: 'NUMBER',
		match: '6',
		groups: [ '6' ],
		start: 6,
		end: 7,
		extra: true,
	}

	it('.insert()', function () {
		lex.insert({ type: 'MY_TRANSIENT' })
		assert.deepEqual(except(lex.next(), 'lexer'), {
			type: 'MY_TRANSIENT',
			match: '',
			groups: [],
			start: -1,
			end: -1,
			transient: true,
			extra: true,
		})
		assert.deepEqual(except(lex.next(), 'lexer'), FOUR)

		lex.insert({ type: 'MY_TRANSIENT' })
		assert.deepEqual(except(lex.next(), 'lexer'), {
			type: 'MY_TRANSIENT',
			match: '',
			groups: [],
			start: -1,
			end: -1,
			transient: true,
			extra: true,
		})

		assert.deepEqual(except(lex.next(), 'lexer'), FIVE)
	})

	it('.peek()', function () {
		assert.deepEqual(except(lex.peek(), 'lexer'), FOUR)

		lex.next()
		assert.deepEqual(except(lex.peek(), 'lexer'), FIVE)
		assert.deepEqual(except(lex.peek(), 'lexer'), FIVE)
	})

	it('.next()', function () {
		assert.deepEqual(except(lex.next(), 'lexer'), FOUR)
		assert.deepEqual(except(lex.next(), 'lexer'), FIVE)
		assert.deepEqual(except(lex.next(), 'lexer'), SIX)
		assert.deepEqual(except(lex.next(), 'lexer'), {
			type: '$EOF',
			match: '(eof)',
			groups: [],
			start: 9,
			end: 9,
			extra: true,
		})
	})

	it('.expect()', function () {
		assert(lex.expect('NUMBER').match.trim(), '4')
		assert.throws(() => lex.expect('NOPE'))
	})

	it('.remaining()', function () {
		lex.next() // 4
		assert.equal(lex.remaining().trim(), '5 6')
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
