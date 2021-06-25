const express = require('express')
const cors = require('cors')
const axios = require('axios')

require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

let token
let expirationDate

const check_token = (req, res, next) => {
  const token = req.headers['authorization']?.split('Bearer')[1].trim()
  if (token === process.env.TOKEN) next()
  else res.sendStatus(401)
}

app.get('/', ({ res }) => {
  res.redirect('https://github.com/nunogois/igdb-api')
})

app.post('/list', check_token, async (req, res) => {
  try {
    if (!expirationDate || expirationDate <= new Date()) {
      const { data } = await axios.post(
        `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`
      )
      token = data.access_token
      expirationDate = new Date(new Date().getTime() + data.expires_in * 1000)
    }

    let query = `fields id, name, first_release_date, platforms.platform_logo.url, cover.url, total_rating;
    sort first_release_date desc;
    where rating >= 80;
    where total_rating_count > 10;`

    const search = req.body?.search?.trim().replace(/\W/gim, ' ')
    if (search) {
      query = `fields id, name, first_release_date, platforms.platform_logo.url, cover.url, total_rating;
      search "${search}";
      where version_parent = null;`
    }

    const { data } = await axios.post('https://api.igdb.com/v4/games', query, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-ID': process.env.CLIENT_ID,
        'Content-Type': 'text/plain'
      }
    })

    res.json(data)
  } catch (err) {
    res.status(500).send(err)
  }
})

app.listen(process.env.PORT || 3000)
