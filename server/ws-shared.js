class WsShared {
  constructor (ws, id = null) {
    this.id = id ?? Math.random().toString('26').substring(2, 12).toUpperCase()
    this.ws = ws
    this.isAlive = true
  }

  close () {
    this.ws.close()
  }

  send (type, data) {
    this.ws.send(JSON.stringify({ type, data }))
  }

  async onMessage (type, data) {
    if (type === 'pong') {
      this.isAlive = true
    } else {
      throw new Error('Not implemented')
    }
  }
}

export default WsShared
