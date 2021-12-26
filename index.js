import ServerHTTP from './server/http.js'
import ApiKey from './server/apikey.js'

console.log('New Admin ApiKey', await ApiKey.encrypt({ isAdmin: true }, new Date().getTime() + (1000 * 60 * 60 * 24 * 3)))

const server = new ServerHTTP()

await server.run()
