# Usage

Perplex is compiled and published as a CommonJS module.  However, all of the ES Module information is retained, so it can be imported as an ECMAScript module, or a TypeScript module.

### CommonJS

```js
const perplex = require('perplex')
// => { LexerState: [Function: LexerState],
//      Token: [Function: Token],
//      EOF: [Function],
//      TokenTypes: [Function: TokenTypes],
//      default: [Function: Lexer],
//      Lexer: [Function: Lexer],
//      LexerBuilder: [Function: LexerBuilder] }
```

### ECMAScript

```js
// Like above:
import {Lexer /*, ... */} from 'perplex'
```

### TypeScript

```js
// Like above:
import {Lexer /*, ... */} from 'perplex'
```

### Initializing

A `Lexer` is initialized based on a source.  The source that a lexer can operate on can be one of:

* Another `Lexer` (the lexer's state is extracted and operated on)
* An instance of `LexerState`
* A string

Whatever it is initialized with, the Lexer constructor will normalize the source to an instance of `LexerState`.  This way multiple lexers can operate on the same state, and all work in conjunction.  Imagine the following scenario where I want several types of lexers operating on the same input stream:

```ts
import {Lexer} from 'perplex'
const source = '...my source string...'

const baseLexer = new Lexer(source)
	.token('ID', /([a-z_$]+[a-z0-9_$]*)/)
	.token('WS', /\s+/, /* skip = */true)
const nlLexer = new Lexer(baseLexer)
	.token('NL', /\r?\n/)
```

In this case, one lexer can handle newlines.  When it consumes a token, it will advance all lexers by the appropriate character count.

### Defining Token Types

Use the following methods:

* `Lexer.token`
* `Lexer.keyword`
* `Lexer.operator`

```ts
const lexer = new Lexer('...my source string...')
	.token('ID', /([a-z_$]+[a-z0-9_$]*)/)
	.keyword('T_WHILE', 'while')
	.operator('T_PLUS', '+')
```
