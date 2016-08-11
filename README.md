perplex
=======

> A simple lexer written entirely in JavaScript, with no dependencies!

## Installation

```sh
npm install --save perplex
```

## Use

An example explains the use best:

```js
'use strict'
const perplex = require('perplex')

const lexer = perplex()
	.token('NUMBER', /\d+/)
	.token('$SKIP_WHITESPACE', /\s+/)
	.source('  4 5 6  ')

lexer.next() // Token { type: 'NUMBER', match: '4', start: 2, end: 3 }
```

The `lexer` instance supports the following methods:


### lexer.token(type, regex, extra)

Defines a token.  Any extras defined here will be copied over to any token instance of this token-type, and functions will be bound to the token instance.

```js
const lexer = perplex()
	.token('NUMBER', /\d+/, {
		printInfo() {
			console.log(this.type) // note that since `this` will get auto-bound to the token instance, `printInfo` cannot be a lambda
		}
	})
	.source('101')

const num = lexer.next()
num.printInfo() // prints 'NUMBER'
```

### lexer.extra(obj)

Sets any extra properties that you may want to be attached to `Token` instances.  These extras will be overridden by any token-specific extras when there are name-collisions.

Example:

```js
const lexer = perplex()
	.extra({ myProperty: 42, myFunction: () => 'Hello!' })
	.token('NUMBER', /\d+/)
	.source('101')

lexer.next() // { type: 'NUMBER', match: '101', ..., myProperty: 42, myFunction: ... }
```

### lexer.source(string)

Initializes the lexer to operate on the given string

### lexer.peek()

Like `next()`, but does not consume the token.

### lexer.next()

Consumes a token.

### lexer.insert()

Inserts a transient token.  Example:

```js
const lexer = perplex()
	.extra({ myProperty: 42, myFunction: () => 'Hello!' })
	.token('NUMBER', /\d+/)
	.source('101')

lexer.next() // 101
lexer.next() // { type: '$EOF', ... }

lexer.insert({ type: 'dummy' })
lexer.peek() // { type: 'dummy', ... }
lexer.next() // { type: 'dummy', ... }

lexer.next() // { type: '$EOF', ... }
```

## `Token` Instances

Tokens support the following properties/methods:

* `type`
* `match`
* `start` - `-1` for transient tokens
* `end` - `-1` for transient tokens
* any other properties defined by `extra`
* position() - returns an object of the form (line and column are both 1-based):
```js
{
	start: { line: ..., column: ... },
	end: { line: ..., column: ... },
}
```

# License

ISC License (ISC)
Copyright (c) 2016, Jonathan Apodaca <jrapodaca@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
