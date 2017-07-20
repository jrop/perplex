import * as except from 'except'
import Lexer from '../src/lexer'
import Token from '../src/token'
import _test = require('tape')

function clean<T>(t: Token<T>) {
	return except(t, 'lexer', 'strpos', 'isEof', 'constructor')
}

const lex = new Lexer<string>()
	.token('WS', /\s+/)
	.disable('WS')
	.token('NUMBER', /\d+/)
	.token('SINGLE_LINE_COMMENT', /\/\/[^\n]*/, true)
	.token('WHITESPACE', /^\s+/, true)

const test = (s, cb: _test.TestCase) =>
	_test(s, t => {
		lex.source = '  4 5 6  '
		return cb(t)
	})

const FOUR = {
	type: 'NUMBER',
	match: '4',
	groups: ['4'],
	start: 2,
	end: 3,
}
const FIVE = {
	type: 'NUMBER',
	match: '5',
	groups: ['5'],
	start: 4,
	end: 5,
}
const SIX = {
	type: 'NUMBER',
	match: '6',
	groups: ['6'],
	start: 6,
	end: 7,
}

test('.source (get)', function(t) {
	t.plan(1)
	lex.next() // 4
	t.looseEqual(lex.source.replace(/\s+/g, ''), '456')
})

test('.position (get)', function(t) {
	t.plan(1)
	lex.next() // 4
	t.looseEqual(lex.position, 3)
})

test('.position (set)', function(t) {
	t.plan(1)
	lex.next() // 4
	lex.position = 0
	t.looseEqual(lex.next().match.trim(), '4')
})

test('.peek()', function(t) {
	t.plan(3)
	t.deepLooseEqual(clean(lex.peek()), FOUR)

	lex.next()
	t.deepLooseEqual(clean(lex.peek()), FIVE)
	t.deepLooseEqual(clean(lex.peek()), FIVE)
})

test('.next()', function(t) {
	t.plan(6)
	t.assert(!lex.peek().isEof())
	t.deepLooseEqual(clean(lex.next()), FOUR)
	t.deepLooseEqual(clean(lex.next()), FIVE)
	t.deepLooseEqual(clean(lex.next()), SIX)
	t.deepLooseEqual(clean(lex.next()), {
		type: null,
		match: '(eof)',
		groups: [],
		start: 9,
		end: 9,
	})
	t.assert(lex.next().isEof())
})

test('.expect()', function(t) {
	t.plan(2)
	t.assert(lex.expect('NUMBER').match.trim(), '4')
	t.throws(() => lex.expect('NOPE'))
})

test('.toArray()', function(t) {
	t.plan(2)
	lex.next() // make sure toArray starts from the beginning
	t.deepLooseEqual(lex.toArray().map(t => clean(t)), [FOUR, FIVE, SIX])
	// make sure the original state is left intact:
	t.deepLooseEqual(clean(lex.peek()), FIVE)
})

test('.attach()', function(t) {
	t.plan(1)
	const lex2 = new Lexer().token('ALL', /.*/)
	lex2.attachTo(lex)

	lex.next() // eat 4
	t.deepLooseEqual(clean(lex2.peek()), {
		type: 'ALL',
		match: ' 5 6  ',
		groups: [' 5 6  '],
		start: 3,
		end: 9,
	})
})

test('enable/disable token types', function(t) {
	t.plan(5)
	t.equal(lex.isEnabled('WS'), false)
	t.looseEqual(lex.enable('WS').next().match, '  ')
	t.equal(lex.isEnabled('WS'), true)
	t.looseEqual(lex.next().match, '4')
	lex.disable('WS')
	t.looseEqual(lex.next().match, '5')
})

test('unexpected input', function(t) {
	t.plan(5)
	lex.source = '4 asdf'
	t.looseEqual(lex.next().match, '4')
	t.throws(function() {
		lex.next()
	}, /asdf/)

	// recover?
	lex.source = '4 asdf 5'
	t.looseEqual(lex.next().match, '4')
	t.throws(function() {
		lex.next()
	}, /asdf/)
	t.looseEqual(lex.next().match, '5')
})

test('.strpos()', function(t) {
	t.plan(4)
	lex.source = `4
5 6
7`

	const _4 = lex.next()
	t.deepLooseEqual(_4.strpos(), {
		start: {line: 1, column: 1},
		end: {line: 1, column: 2},
	})

	const _5 = lex.next()
	t.deepLooseEqual(_5.strpos(), {
		start: {line: 2, column: 1},
		end: {line: 2, column: 2},
	})

	const _6 = lex.next()
	t.deepLooseEqual(_6.strpos(), {
		start: {line: 2, column: 3},
		end: {line: 2, column: 4},
	})

	const _7 = lex.next()
	t.deepLooseEqual(_7.strpos(), {
		start: {line: 3, column: 1},
		end: {line: 3, column: 2},
	})
})
