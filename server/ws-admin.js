import WsShared from './ws-shared.js'
import WsParticipant from './ws-participant.js'
import ApiKey from './apikey.js'
import talk from '../talk/index.js'

class WsAdmin extends WsShared {
  constructor (ws, server) {
    super(ws)
    this.server = server

    this.send('auth', { isAdmin: true })

    this.sendParticipantsList()

    for (const navigation of talk.navigation) {
      this.send('slide', talk.slides[navigation].format())
    }
    this.send('current-slide', { slug: talk.currentSlide })
  }

  get admins () {
    return this.server.admins
  }
  get pendingParticipants () {
    return this.server.pendingParticipants
  }
  get participants () {
    return this.server.participants
  }

  sendParticipantsList () {
    this.send('pending-participants', {
      list: this.pendingParticipants.map(instance => instance.format())
    })
    this.send('participants', {
      list: this.participants.map(instance => instance.format())
    })
  }

  async onMessage (type, data) {
    if (type === 'accept-pending-participant' && data.id) {
      await this.acceptPendingParticipant(data.id)
    } else if (type === 'update-admin-slide-slug' && data.slug) {
      await this.updateAdminSlideSlug(data.slug)
    } else {
      await super.onMessage(type, data)
    }
  }

  async acceptPendingParticipant (pendingParticipantId) {
    const instance = this.pendingParticipants.find(pending => pending.id === pendingParticipantId)

    if (!instance) {
      throw new Error('Pending participant not found')
    }

    this.server.pendingParticipants = this.server.pendingParticipants.filter(pending => pending !== instance)

    const { id, lastname, firstname } = instance
    const apiKey = await ApiKey.encrypt({ isParticipant: true, lastname, firstname }, new Date().getTime() + (1000 * 60 * 60 * 24 * 3))
    const participant = new WsParticipant(instance.ws, lastname, firstname, apiKey, id)
    this.server.participants.push(participant)

    this.sendParticipantsList()
  }

  async updateAdminSlideSlug (slideSlug) {
    talk.currentSlide = slideSlug

    for (const admin of this.admins) {
      admin.send('current-slide', { slug: slideSlug })
    }
    for (const participant of this.participants) {
      participant.updateCurrentSlide()
    }
  }
}

export default WsAdmin
