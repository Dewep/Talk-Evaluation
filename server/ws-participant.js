import WsShared from './ws-shared.js'
import talk from '../talk/index.js'

class WsParticipant extends WsShared {
  constructor (ws, participantSlug, lastname, firstname, apiKey = null, id = null) {
    super(ws, id)

    this.participantSlug = participantSlug
    this.lastname = lastname
    this.firstname = firstname

    this.send('auth', { apiKey, participantSlug, lastname, firstname })
    
    this.slidesSent = []
    this.updateCurrentSlide()
  }
  
  updateCurrentSlide () {
    for (const navigation of talk.navigation) {
      if (!this.slidesSent.includes(navigation)) {
        this.send('slide', talk.slides[navigation].format())
        this.slidesSent.push(navigation)
      }
  
      if (talk.currentSlide === navigation) {
        this.send('current-slide', { slug: talk.currentSlide })
        break
      }
    }
  }

  format () {
    return {
      id: this.id,
      participantSlug: this.participantSlug,
      lastname: this.lastname,
      firstname: this.firstname
    }
  }
}

export default WsParticipant
