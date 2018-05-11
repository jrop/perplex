import * as except from 'except'
import Lexer from '../src/lexer'
import Token, {EOF} from '../src/token'
import _test = require('tape')

function clean(t: Token) {
	return except(
		t,
		'constructor',
		'isEof',
		'isUnrecognized',
		'lexer',
		'skip',
		'skipped',
		'strpos',
		'toString'
	)
}

const lex = new Lexer().build(define =>
	define
		.token('WS', /\s+/)
		.disable('WS')
		.token('NUMBER', /\d+/)
		.token('SINGLE_LINE_COMMENT', /\/\/[^\n]*/, true)
		.token('WHITESPACE', /^\s+/, true)
)

const test = (s, cb: _test.TestCase) =>
	_test(s, t => {
		lex.state.source = '  4 5 6  '
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
	t.looseEqual(lex.state.source.replace(/\s+/g, ''), '456')
})

test('.position (get)', function(t) {
	t.plan(1)
	lex.next() // 4
	t.looseEqual(lex.state.position, 3)
})

test('.position (set)', function(t) {
	t.plan(1)
	lex.next() // 4
	lex.state.position = 0
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
	t.deepLooseEqual(lex.toArray().map(t => clean(t)), [
		FOUR,
		FIVE,
		SIX,
		clean(EOF(lex)),
	])
	// make sure the original state is left intact:
	t.deepLooseEqual(clean(lex.peek()), FIVE)
})

test('.rewind()', t => {
	const _4 = lex.next()
	const _5 = lex.next()

	t.equal(_4.match, '4')
	t.equal(_5.match, '5')

	lex.rewind(_4)
	t.equal(lex.next().match, '4')

	lex.rewind(_5)
	t.equal(lex.next().match, '5')

	t.end()
})

test('.attach()', function(t) {
	t.plan(1)
	const lex2 = new Lexer().build(define => define.token('ALL', /.*/))
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
	t.equal(lex.tokenTypes.isEnabled('WS'), false)

	lex.tokenTypes.enable('WS')
	t.looseEqual(lex.next().match, '  ')
	t.equal(lex.tokenTypes.isEnabled('WS'), true)
	t.looseEqual(lex.next().match, '4')

	lex.tokenTypes.disable('WS')
	t.looseEqual(lex.next().match, '5')
})

test('unexpected input', function(t) {
	lex.state.source = '4 asdf'
	t.looseEqual(lex.next().match, '4')
	t.throws(() => lex.next(), /asdf/)
	t.assert(lex.next().isEof())
	t.end()
})

test('.strpos()', function(t) {
	t.plan(4)
	lex.state.source = `4
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

test('define.keyword()', function(t) {
	const lex = new Lexer().build(define => define.keyword('asdf', 'asdf'))
	lex.state.source = 'asdf('
	t.equal(lex.next().type, 'asdf')
	t.end()
})

test('define.operator()', function(t) {
	const lex = new Lexer().build(define => define.operator('+', '+'))
	lex.state.source = '+('
	t.equal(lex.next().type, '+')
	t.end()
})

test('recording', t => {
	lex.options.record = true
	const _4 = lex.next()
	while (!lex.next().isEof());
	t.deepLooseEqual(lex.state.trail.map(t => t.type), [
		'WHITESPACE',
		'NUMBER',
		'WHITESPACE',
		'NUMBER',
		'WHITESPACE',
		'NUMBER',
		'WHITESPACE',
	])

	lex.rewind(_4)
	t.deepLooseEqual(lex.state.trail.map(t => t.type), ['WHITESPACE'])
	t.end()
})

test('preservation', t => {
	// test for recognized input
	t.equal(
		lex.state.source,
		lex
			.toArray()
			.map(t => t.toString())
			.join(''),
		'preserves all tokens'
	)

	// test for unrecognized input
	lex.state.source = '1 asdf'
	const tokens = lex.toArray()
	const eof = tokens[1]
	t.assert(eof.isEof())
	t.equal(eof.skipped.length, 2)
	t.assert(tokens[1].skipped[1].isUnrecognized(), 'contains unrecognized token')
	t.equal(
		lex.state.source,
		tokens.map(t => t.toString()).join(''),
		'preserves unrecognized'
	)

	// test rewriting token stream:
	tokens[0].match = '777'
	tokens[1].skipped.push(
		new Token({
			type: 'WHITESPACE',
			start: -1,
			end: -1,
			lexer: lex,
			groups: ['  '],
			match: '  ',
		})
	)
	t.equal(
		'777 asdf  ',
		tokens.map(t => t.toString()).join(''),
		'rewrite token stream'
	)

	t.end()
})
