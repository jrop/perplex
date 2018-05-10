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
/**
 * The options a Lexer abides by
 */
export declare type LexerOptions = {
    record: boolean;
    throwOnUnrecognized: boolean;
};
/**
 * The main Lexer class
 */
export default class Lexer<T = string> {
    /**
     * The internal state of the lexer.  Multiple lexers can
     * utilize the same shared state.  See `attachTo`.
     */
    state: LexerState<T>;
    /**
     * The token types that this Lexer can consume
     */
    tokenTypes: TokenTypes<T>;
    /**
     * Change certain behaviors by manipulating
     * these options
     */
    options: LexerOptions;
    /**
     * Constructs a new Lexer
     * @param source Either:
     *   1) a string
     *   2) Another Lexer to attach to, or
     *   3) LexerState to use as the underlying state
     */
    constructor(source?: Lexer<T> | LexerState<T> | string);
    /**
     * Builds and then returns a lexer (convenience method)
     * @param builder The callback that will build the lexer
     */
    build(builder: (lexer: Lexer<T>) => any): Lexer<T>;
    /**
     * Utilize the `other` Lexer's underlying state as our own.
     * Allows two or more Lexers to attache to the same state
     * and both stream through tokens in a coordinated manner.
     * @param other The other lexer to attach to
     */
    attachTo(other: Lexer<T>): void;
    /**
     * Throw if `.next().type != type`
     * @param type The type of token to expect
     */
    expect(type: T): Token<T>;
    /**
     * Retrieve the next token, and advance the current position
     */
    next(): Token<T>;
    /**
     * Peek at the next token without consuming it
     * @param position The position to peek at
     */
    peek(position?: number): Token<T>;
    /**
     * Restore the Lexer state to the way it was before `tokenToRewind` was consumed
     * @param tokenToRewind
     */
    rewind(tokenToRewind: Token<T>): Lexer<T>;
    /**
     * Return the {line, column} of a position `i` in the string
     * @param i
     */
    strpos(i: number): {
        line: number;
        column: number;
    };
    /**
     * Throw an error like `Unexpected input: ...` based on a token
     * @param t The token to base the error message on
     */
    throw(t: Token<T>): void;
    /**
     * Retrieve the array of tokens in the underlying string.
     * Includes all unexpected input, and skipped tokens as
     * top-level entries in the returned array.
     */
    toArray(): Token<T>[];
}
export { EOF, Token, TokenTypes, LexerState };
```

### LexerState
```ts
import TokenTypes from './token-types';
import Token from './token';
export default class LexerState<T = string> {
    tokenTypes: TokenTypes<T>;
    trail: Token<T>[];
    constructor(source: string, position?: number);
    source: string;
    position: number;
    copy(): LexerState<T>;
}
```

### TokenTypes
```ts
import Token from './token';
import Lexer from './lexer';
export default class TokenTypes<T = string> {
    tokenTypes: {
        type: T;
        regex: RegExp;
        enabled: boolean;
        skip: boolean;
    }[];
    constructor(lexer: Lexer<T>);
    disable(type: T): TokenTypes<T>;
    enable(type: T, enabled?: boolean): TokenTypes<T>;
    isEnabled(type: T): boolean;
    peek(source: string, position: number): Token<any>;
    define(type: T, pattern: RegExp | string, skip?: boolean, enabled?: boolean): TokenTypes<T>;
    defineKeyword(type: T, kwd: string): TokenTypes<T>;
    defineOperator(type: T, op: T): TokenTypes<T>;
}
```

### Token
```ts
import Lexer from './lexer';
declare class Token<T = string> {
    type: T;
    match: string;
    groups: string[];
    start: number;
    end: number;
    lexer: Lexer<T>;
    skip: boolean;
    skipped: Token<T>[];
    constructor(opts: {
        type: T;
        match: string;
        groups: string[];
        start: number;
        end: number;
        lexer: Lexer<T>;
        skip?: boolean;
        skipped?: Token<T>[];
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
    toString(): string;
}
export default Token;
export declare class EOFToken<T> extends Token<T> {
    constructor(lexer: Lexer<T>);
    isEof(): boolean;
}
export declare class UnrecognizedToken<T> extends Token<T> {
    constructor(match: string, start: number, end: number, lexer: Lexer<T>);
    isUnrecognized(): boolean;
}
export declare const EOF: <T>(lexer: Lexer<T>) => EOFToken<T>;
```

# License

ISC License (ISC)
Copyright (c) 2018, Jonathan Apodaca <jrapodaca@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
