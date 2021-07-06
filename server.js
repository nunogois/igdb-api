const express = require('express')
const cors = require('cors')
const axios = require('axios')
const asyncRedis = require('async-redis')

require('dotenv').config()

const app = express()
const redis = asyncRedis.createClient()

redis.on('error', function (err) {
  console.error(err)
})

app.use(cors())
app.use(express.json()) // Deprecated - Kept for now to prevent breaking previous versions. Use GET instead.

let token
let expirationDate

const check_token = (req, res, next) => {
  const token = req.headers['authorization']?.split('Bearer')[1].trim()
  if (token === process.env.TOKEN) next()
  else res.sendStatus(401)
}

const twitch_token = async () => {
  if (!expirationDate || expirationDate <= new Date()) {
    const { data } = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`
    )
    token = data.access_token
    expirationDate = new Date(new Date().getTime() + data.expires_in * 1000)
  }
}

app.get('/', ({ res }) => {
  res.redirect('https://github.com/nunogois/igdb-api')
})

// Deprecated - Kept for now to prevent breaking previous versions. Use GET instead.
app.post('/search', check_token, async (req, res) => {
  try {
    let redisExpire = 4 * 60 * 60 // 4h

    let query = `fields name, first_release_date, platforms.platform_logo.url, cover.url, total_rating, game_modes.name, summary, 
    genres.name, involved_companies.company.name, platforms.name, screenshots.url, similar_games.name, 
    similar_games.cover.url, themes.name, url;
    sort first_release_date desc;
    where rating >= 80;
    where total_rating_count > 10;`

    const search = req.body?.search?.trim().replace(/\W/gim, ' ')
    if (search) {
      query = `fields name, first_release_date, platforms.platform_logo.url, cover.url, total_rating, game_modes.name, summary, 
      genres.name, involved_companies.company.name, platforms.name, screenshots.url, similar_games.name, 
      similar_games.cover.url, themes.name, url;
      search "${search}";
      where version_parent = null;`
    }

    const id = +req.body?.id
    if (!isNaN(id)) {
      redisExpire = 24 * 60 * 60 // 24h

      query = `fields name, first_release_date, platforms.platform_logo.url, cover.url, total_rating, game_modes.name, summary, 
      genres.name, involved_companies.company.name, platforms.name, screenshots.url, similar_games.name, 
      similar_games.cover.url, themes.name, url;
      where id=${id};`
    }
    const value = await redis.get(`game-search-expo-query-${query}`)

    if (value) res.json(JSON.parse(value))
    else {
      await twitch_token()
      const { data } = await axios.post(
        'https://api.igdb.com/v4/games',
        query,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Client-ID': process.env.CLIENT_ID,
            'Content-Type': 'text/plain'
          }
        }
      )

      await redis.setex(
        `game-search-expo-query-${query}`,
        redisExpire,
        JSON.stringify(data)
      )
      res.json(data)
    }
  } catch (err) {
    res.status(500).send(err)
  }
})

app.get('/games', check_token, async (req, res) => {
  try {
    let redisExpire = 4 * 60 * 60 // 4h

    let query = `fields name, first_release_date, platforms.platform_logo.url, cover.url, total_rating, game_modes.name, summary, 
    genres.name, involved_companies.company.name, platforms.name, screenshots.url, similar_games.name, 
    similar_games.cover.url, themes.name, url;
    sort first_release_date desc;
    where rating >= 80;
    where total_rating_count > 10;`

    const search = req.query?.search?.trim().replace(/\W/gim, ' ')
    if (search) {
      query = `fields name, first_release_date, platforms.platform_logo.url, cover.url, total_rating, game_modes.name, summary, 
      genres.name, involved_companies.company.name, platforms.name, screenshots.url, similar_games.name, 
      similar_games.cover.url, themes.name, url;
      search "${search}";
      where version_parent = null;`
    }

    const id = +req.query?.id
    if (!isNaN(id)) {
      redisExpire = 24 * 60 * 60 // 24h

      query = `fields name, first_release_date, platforms.platform_logo.url, cover.url, total_rating, game_modes.name, summary, 
      genres.name, involved_companies.company.name, platforms.name, screenshots.url, similar_games.name, 
      similar_games.cover.url, themes.name, url;
      where id=${id};`
    }
    const value = await redis.get(`game-search-expo-query-${query}`)

    if (value) res.json(JSON.parse(value))
    else {
      await twitch_token()
      const { data } = await axios.post(
        'https://api.igdb.com/v4/games',
        query,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Client-ID': process.env.CLIENT_ID,
            'Content-Type': 'text/plain'
          }
        }
      )

      await redis.setex(
        `game-search-expo-query-${query}`,
        redisExpire,
        JSON.stringify(data)
      )
      res.json(data)
    }
  } catch (err) {
    res.status(500).send(err)
  }
})

app.listen(process.env.PORT || 3000)
