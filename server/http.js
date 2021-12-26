import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import fs from 'fs/promises'
import ApiKey from './apikey.js'
import WsAdmin from './ws-admin.js'
import WsPendingParticipant from './ws-pending-participant.js'
import WsParticipant from './ws-participant.js'

async function staticFile (filename, contentType) {
  return {
    filename,
    content: await fs.readFile(`public/${filename}`),
    contentType
  }
}

const files = {
  '/': await staticFile('index.html', 'text/html'),
  '/app.js': await staticFile('app.js', 'text/javascript'),
  '/favicon.ico': await staticFile('favicon.ico', 'image/x-icon'),
  '/styles.css': await staticFile('styles.css', 'text/css'),
  '/slide-bg-cut.png': await staticFile('slide-bg-cut.png', 'image/png'),
  '/slide-bg-left.png': await staticFile('slide-bg-left.png', 'image/png'),
  '/slide-bg-left-2.png': await staticFile('slide-bg-left-2.png', 'image/png'),
  '/slide-bg-right.png': await staticFile('slide-bg-right.png', 'image/png'),
  '/slide-bg-title.png': await staticFile('slide-bg-title.png', 'image/png'),
  '/slide-bg-top-left.png': await staticFile('slide-bg-top-left.png', 'image/png'),
  '/vue-3.2.20.global.prod.js': await staticFile('vue-3.2.20.global.prod.js', 'text/javascript')
}
const availableFiles = Object.keys(files)

class ServerHTTP {
  constructor () {
    this.server = createServer(async (req, res) => {
      const file = availableFiles.includes(req.url) ? files[req.url] : files['/']
      // Dev mode only (start)
      file.content = await fs.readFile(`public/${file.filename}`)
      // Dev mode only (end)
      res.writeHead(200, { 'Content-Type': file.contentType })
      res.end(file.content)
    })

    this.admins = []
    this.pendingParticipants = []
    this.participants = []

    this.wss = new WebSocketServer({ server: this.server })

    this.wss.on('connection', ws => {
      let instance = null

      ws.on('message', async message => {
        try {
          const { type, data } = JSON.parse(message)

          if (instance) {
            return await instance.onMessage(type, data)
          } else if (type === 'relog' && data.apiKey) {
            const apiKey = await ApiKey.decrypt(data.apiKey)
            if (apiKey.data.isAdmin) {
              instance = new WsAdmin(ws, this)
              this.admins.push(instance)
              console.info('New admin WS connection')
            } else if (apiKey.data.isParticipant, apiKey.data.lastname, apiKey.data.firstname) {
              instance = new WsParticipant(ws, apiKey.data.lastname, apiKey.data.firstname)
              this.participants.push(instance)
              this.refreshParticipantsList()
              console.info('New participant WS connection')
            } else {
              throw new Error('Bad authorization message')
            }
          } else if (type === 'auth' && data.lastname && data.firstname) {
            instance = new WsPendingParticipant(ws, data.lastname, data.firstname)
            this.pendingParticipants.push(instance)
            this.refreshParticipantsList()
            console.info('New pending participant WS connection')
          } else {
            throw new Error('Missing authorization message')
          }
        } catch (err) {
          console.warn('WS.message.error', err.message)
          ws.close()
          this.refreshParticipantsList()
        }
      })

      ws.on('close', () => {
        this.admins = this.admins.filter(instance => instance.ws !== ws)
        this.participants = this.participants.filter(instance => instance.ws !== ws)
        this.refreshParticipantsList()
      })
    })

    setInterval(() => {
      for (const instance of [...this.admins, ...this.pendingParticipants, ...this.participants]) {
        if (!instance.isAlive) {
          instance.close()
        } else {
          instance.send('ping', {})
        }
      }
    }, 10 * 1000)
  }

  refreshParticipantsList () {
    for (const admin of this.admins) {
      admin.sendParticipantsList()
    }
  }

  async run () {
    this.server.listen(7813)
    console.log('Server running on port 7813')
  }
}

export default ServerHTTP
