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

```js
import perplex from 'perplex'

const lexer = perplex('  4 5 6  ')
lexer.tokenTypes
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

## API

### Lexer
```ts
import LexerState from './lexer-state';
import Token, { EOF } from './token';
import TokenTypes from './token-types';
export declare type LexerOptions = {
    record: boolean;
    throwOnUnrecognized: boolean;
};
export default class Lexer {
    state: LexerState;
    tokenTypes: TokenTypes;
    options: LexerOptions;
    constructor(source?: Lexer | LexerState | string);
    attachTo(other: Lexer): void;
    expect(type: string): Token;
    next(): Token;
    peek(position?: number): Token;
    private peekOrUnrecognized(position?);
    private record(t);
    rewind(tokenToRewind: Token): Lexer;
    strpos(i: number): {
        line: number;
        column: number;
    };
    throw(t: Token): void;
    toArray(): Token[];
}
export { EOF, Token, TokenTypes, LexerState };
```

### LexerState
```ts
import TokenTypes from './token-types';
import Token from './token';
export default class LexerState {
    private _source;
    private _position;
    tokenTypes: TokenTypes;
    trail: Token[];
    constructor(source: string, position?: number);
    source: string;
    position: number;
    copy(): LexerState;
}
```

### TokenTypes
```ts
import Token from './token';
import Lexer from './lexer';
export default class TokenTypes {
    private lexer;
    tokenTypes: {
        type: string;
        regex: RegExp;
        enabled: boolean;
        skip: boolean;
    }[];
    constructor(lexer: Lexer);
    disable(type: string): TokenTypes;
    enable(type: string, enabled?: boolean): TokenTypes;
    isEnabled(type: string): boolean;
    peek(source: string, position: number): Token;
    define(type: string, pattern: RegExp | string, skip?: boolean, enabled?: boolean): TokenTypes;
    defineKeyword(kwd: string): TokenTypes;
    defineOperator(op: string): TokenTypes;
}
```

### Token
```ts
import Lexer from './lexer';
declare class Token {
    type: string;
    match: string;
    groups: string[];
    start: number;
    end: number;
    lexer: Lexer;
    skip: boolean;
    skipped: Token[];
    constructor(opts: {
        type: string;
        match: string;
        groups: string[];
        start: number;
        end: number;
        lexer: Lexer;
        skip?: boolean;
        skipped?: Token[];
    });
    strpos(): {
        start: {
            line: number;
            column: number;
        };
        end: {
            line: number;
            column: number;
        };
    };
    isEof(): boolean;
    isUnrecognized(): boolean;
}
export default Token;
export declare class EOFToken extends Token {
    constructor(lexer: Lexer);
    isEof(): boolean;
}
export declare class UnrecognizedToken extends Token {
    constructor(match: string, start: number, end: number, lexer: Lexer);
    isUnrecognized(): boolean;
}
export declare const EOF: (lexer: Lexer) => EOFToken;
```

# License

ISC License (ISC)
Copyright (c) 2018, Jonathan Apodaca <jrapodaca@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
