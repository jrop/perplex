perplex
=======

A simple lexer written entirely in JavaScript, with no dependencies!

## Installation

```sh
npm install --save perplex
# or
yarn add perplex
```

## Use

```js
import perplex from 'perplex'

const lexer = perplex('  4 5 6  ')
	.token('NUMBER', /\d+/)
	.token('WHITESPACE', /\s+/, true) // true means 'skip'

lexer.next() // Token {type: 'NUMBER', match: '4', groups: ['4'], start: 2, end: 3}
```

[See the documentation for more information, and supported instance methods, etc.](https://jrop.github.io/perplex/):

* [Lexer](https://jrop.github.io/perplex/class/lib/lexer.js~Lexer.html)
* [Token](https://jrop.github.io/perplex/class/lib/token.js~Token.html)

# License

ISC License (ISC)
Copyright (c) 2016, Jonathan Apodaca <jrapodaca@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
