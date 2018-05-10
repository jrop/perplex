import TokenTypes from './token-types'
import Token from './token'

export default class LexerState<T = string> {
	private _source: string
	private _position: number
	public tokenTypes: TokenTypes<T>
	public trail: Token<T>[] = []

	constructor(source: string, position: number = 0) {
		this._source = source
		this.position = position
	}

	get source() {
		return this._source
	}
	set source(value: string) {
		this._source = value
		this.position = 0
	}
	get position() {
		return this._position
	}
	set position(value: number) {
		this._position = value
		this.trail = this.trail.filter(t => t.start < value)
	}

	copy() {
		const newState = new LexerState<T>(this.source, this.position)
		newState.trail = this.trail.slice()
		return newState
	}
}
