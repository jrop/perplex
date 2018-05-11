# perplex

A simple lexer written entirely in JavaScript, with no dependencies.

Features:
* full location tracking
* tracks skipped tokens
* records token trail (opt-in)

## Installation

```sh
npm install perplex
# or
yarn add perplex
```

## Use

This README merely serves as an example. Be sure to [read the API documentation](https://jrop.github.io/perplex/index.html).

```js
import perplex from 'perplex'

const lexer = perplex('  4 5 6  ')
lexer.build(define => define
	.token('NUMBER', /\d+/)
	.token('WHITESPACE', /\s+/, /* skip = */ true)
)
lexer.next()
// => Token {
//   type: 'NUMBER',
//   match: '4',
//   groups: ['4'],
//   start: 2,
//   end: 3,
//   skipped: [{type: 'WHITESPACE', ...}]
// }
```

# License

ISC License (ISC)
Copyright (c) 2018, Jonathan Apodaca <jrapodaca@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
