'use strict'

const assert = require('assert')
const lexer = require('./lib/index')

describe('lexer', function () {

	const lex = lexer()
		.extra({ extra: true })
		.token('NUMBER', /\d+/)
		.token('$SKIP_SINGLE_LINE_COMMENT', /\/\/[^\n]*/)
		.token('$SKIP_WHITESPACE', /^\s+/)

	beforeEach(function () {
		lex.source('  4 5 6  ')
	})

	const FOUR = {
		type: 'NUMBER',
		match: '4',
		start: 2,
		end: 3,
		extra: true,
	}
	const FIVE = {
		type: 'NUMBER',
		match: '5',
		start: 4,
		end: 5,
		extra: true,
	}
	const SIX = {
		type: 'NUMBER',
		match: '6',
		start: 6,
		end: 7,
		extra: true,
	}

	it('.insert()', function () {
		lex.insert({ type: 'MY_TRANSIENT' })
		assert.deepEqual(lex.next(), {
			type: 'MY_TRANSIENT',
			match: '',
			start: -1,
			end: -1,
			transient: true,
			extra: true,
		})
		assert.deepEqual(lex.next(), FOUR)

		lex.insert({ type: 'MY_TRANSIENT' })
		assert.deepEqual(lex.next(), {
			type: 'MY_TRANSIENT',
			match: '',
			start: -1,
			end: -1,
			transient: true,
			extra: true,
		})

		assert.deepEqual(lex.next(), FIVE)
	})

	it('.peek()', function () {
		assert.deepEqual(lex.peek(), FOUR)

		lex.next()
		assert.deepEqual(lex.peek(), FIVE)
		assert.deepEqual(lex.peek(), FIVE)
	})

	it('.next()', function () {
		assert.deepEqual(lex.next(), FOUR)
		assert.deepEqual(lex.next(), FIVE)
		assert.deepEqual(lex.next(), SIX)
		assert.deepEqual(lex.next(), {
			type: '$EOF',
			match: '',
			start: 9,
			end: 9,
			extra: true,
		})
	})

	it('unexpected input', function () {
		lex.source('4 asdf')
		assert.equal(lex.next().match, '4')
		assert.throws(function () {
			lex.next()
		}, /asdf/)

		// recover?
		lex.source('4 asdf 5')
		assert.equal(lex.next().match, '4')
		assert.throws(function () {
			lex.next()
		}, /asdf/)
		assert.equal(lex.next().match, '5')
	})
})
