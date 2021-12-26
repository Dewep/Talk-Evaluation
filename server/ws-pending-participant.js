import WsShared from './ws-shared.js'

class WsPendingParticipant extends WsShared {
  constructor (ws, lastname, firstname) {
    super(ws)

    this.lastname = lastname
    this.firstname = firstname
  }

  format () {
    return {
      id: this.id,
      lastname: this.lastname,
      firstname: this.firstname
    }
  }
}

export default WsPendingParticipant
