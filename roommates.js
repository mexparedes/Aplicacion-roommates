const { v4: uuidv4 } = require('uuid')
const axios = require('axios')

async function nuevoRoommate() {

    const { data } = await axios('https://randomuser.me/api')

    const user = {
        id: uuidv4().slice(30),
        nombre: `${data.results[0].name.first} ${data.results[0].name.last}`,
        debe: 0,
        recibe: 0,
        email: data.results[0].email
    }
    return user
}

module.exports = nuevoRoommate;