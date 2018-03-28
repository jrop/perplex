import TokenTypes from './token-types'

export default class LexerState {
	public source: string
	public position: number
	public tokenTypes: TokenTypes

	constructor(source: string, position: number = 0) {
		this.source = source
		this.position = position
	}

	copy() {
		return new LexerState(this.source, this.position)
	}
}
