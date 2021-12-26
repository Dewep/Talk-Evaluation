window.AppDefinition = {
  data () {
    return {
      socket: null,
      apiKey: window.localStorage.apiKey || null,

      lastname: '',
      firstname: '',

      isAdmin: false,
      pendingParticipants: [],
      currentPendingParticipantId: null,
      participants: [],

      isParticipant: false,
      slides: [],
      adminSlideSlug: null,
      currentSlideSlug: null
    }
  },

  computed: {
    currentSlide () {
      return this.slides.find(slide => slide.slug === this.currentSlideSlug)
    }
  },

  mounted () {
    setTimeout(() => {
      document.body.classList.remove('initializing')
    }, 250)

    this.wsConnect()
  },

  watch: {
    currentSlide: {
      immediate: true,
      handler () {
        if (!this.currentSlide) {
          return
        }
        setTimeout(() => {
          window.Vue.createApp({
            data () {
              return {
                name: 'Bob'
              }
            }
          }).mount('#slide-content')
        })
      }
    }
  },

  methods: {
    async wsConnect () {
      this.socket = new WebSocket(`wss://${window.location.host}`)

      this.socket.addEventListener('open', () => {
        if (this.apiKey) {
          this.send('relog', { apiKey: this.apiKey })
        }
      })

      this.socket.addEventListener('message', event => {
        try {
          const { type, data } = JSON.parse(event.data)

          if (type === 'auth') {
            if (data.apiKey) {
              window.localStorage.apiKey = data.apiKey
            }
            this.isAdmin = data.isAdmin
            this.isParticipant = data.isParticipant
          } else if (type === 'ping') {
            this.send('pong', {})
          } else if (type === 'pending-participants') {
            this.pendingParticipants = data.list
          } else if (type === 'participants') {
            this.participants = data.list
          } else if (type === 'slide') {
            this.slides.push(data)
          } else if (type === 'current-slide') {
            this.adminSlideSlug = data.slug
            this.currentSlideSlug = data.slug
          }
        } catch (err) {
          console.warn('WS.error', err.message)
        }
      })

      this.socket.addEventListener('close', () => {
        this.socket = null
        setTimeout(() => {
          this.wsConnect()
        }, 5000)
      })
    },

    send (type, data) {
      if (!this.socket) {
        return
      }
      this.socket.send(JSON.stringify({ type, data }))
    },

    async newParticipant () {
      this.send('auth', { lastname: this.lastname, firstname: this.firstname })
    },

    acceptPendingParticipant (pendingParticipant) {
      this.send('accept-pending-participant', { id: pendingParticipant.id })
    },
    updateAdminSlideSlug () {
      this.send('update-admin-slide-slug', { slug: this.currentSlideSlug })
    },
  }
}
