---
home: false
title: Introduction
---
# Introduction

Perplex is an easy-to-use lexer written in TypeScript, powered by RegExp.  Perplex has the following features:

* Full location tracking
* Tracks skipped tokens
* Records token trail (opt-in)

At its simplest, you can start using perplex in just a few lines:

```js
import {Lexer} from 'perplex'

const lexer = new Lexer('  4 5 6  ')
	.token('NUMBER', /\d+/)
	.token('WHITESPACE', /\s+/, /* skip = */ true)
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
