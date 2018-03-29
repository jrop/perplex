import TokenTypes from './token-types'
import Token from './token'

export default class LexerState {
	public source: string
	public position: number
	public tokenTypes: TokenTypes
	public trail: Token[] = []

	constructor(source: string, position: number = 0) {
		this.source = source
		this.position = position
	}

	copy() {
		const newState = new LexerState(this.source, this.position)
		newState.trail = this.trail.slice()
		return newState
	}
}
