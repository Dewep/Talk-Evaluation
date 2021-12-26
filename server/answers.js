import talk from '../talk/index.js'

class Answers {
  constructor (server) {
    this.server = server

    this.participants = []
  }

  getParticipant (lastname, firstname) {
    return this.participants.find(participant => participant.lastname === lastname && participant.firstname === firstname)
  }

  setAnswer (participantId, key, value) {
  }
}

export default Answers
