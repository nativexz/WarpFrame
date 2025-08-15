// 9 + 10 = 21

const express = require('express')
const axios = require('axios')
const sharp = require('sharp')
const crypto = require('crypto')

// you can add one "n" on sfw cfg, very interesting. BUT ON GIF DONT BECAUSE THEY DONT HAVE. sad

const cfg = {
  port: 3000,
  apis: {
    sfw: 'https://api.waifu.pics/sfw/waifu',
    gif: 'https://api.waifu.pics/sfw/dance'
  },
  imgSize: 256,
  chunks: 4
}

class Session {
  constructor(id, type, w, h, data) {
    this.id = id
    this.type = type
    this.w = w
    this.h = h
    this.data = data
    this.created = Date.now()
  }
}

class SessionManager {
  constructor() {
    this.sessions = new Map()
    this.urlCache = new Map()
    setInterval(() => this.cleanup(), 300000)
  }

  async createSession(options) {
    const type = options.type || 'sfw'
    const apiUrl = cfg.apis[type] || cfg.apis.sfw
    const apiRes = await axios.get(apiUrl)
    const imageUrl = apiRes.data.url

    if (this.urlCache.has(imageUrl)) {
      const { type: sessType, data, meta } = this.urlCache.get(imageUrl)
      const sid = crypto.randomBytes(16).toString('hex')
      const session = new Session(sid, sessType, cfg.imgSize, cfg.imgSize, data)
      this.sessions.set(sid, session)
      return { sid, type: sessType, w: cfg.imgSize, h: cfg.imgSize, ...meta }
    }

    const imgBuf = (await axios.get(imageUrl, { responseType: 'arraybuffer' })).data
    let sessionType, sessionData, metaData

    if (type === 'gif') {
      const gif = sharp(imgBuf, { animated: true })
      const meta = await gif.metadata()
      const frames = []
      const delays = meta.delay.map(d => d || 100)
      for (let i = 0; i < meta.pages; i++) {
        const buf = await sharp(imgBuf, { page: i })
          .resize(cfg.imgSize, cfg.imgSize)
          .ensureAlpha()
          .raw()
          .toBuffer()
        frames.push(buf)
      }
      sessionType = 'gif'
      sessionData = frames
      metaData = { total: frames.length, delays }
    } else {
      const img = sharp(imgBuf).resize(cfg.imgSize, cfg.imgSize)
      const chunks = []
      const grid = Math.sqrt(cfg.chunks)
      const cw = Math.floor(cfg.imgSize / grid)
      const ch = Math.floor(cfg.imgSize / grid)
      for (let y = 0; y < grid; y++) {
        for (let x = 0; x < grid; x++) {
          const buf = await img.clone()
            .extract({ left: x * cw, top: y * ch, width: cw, height: ch })
            .ensureAlpha()
            .raw()
            .toBuffer()
          chunks.push({ buf, x: x * cw, y: y * ch, w: cw, h: ch })
        }
      }
      sessionType = 'static'
      sessionData = chunks
      metaData = { total: chunks.length }
    }

    this.urlCache.set(imageUrl, { type: sessionType, data: sessionData, meta: metaData })
    const sid = crypto.randomBytes(16).toString('hex')
    const session = new Session(sid, sessionType, cfg.imgSize, cfg.imgSize, sessionData)
    this.sessions.set(sid, session)
    return { sid, type: sessionType, w: cfg.imgSize, h: cfg.imgSize, ...metaData }
  }

  getData(sid, i, count) {
    const session = this.sessions.get(sid)
    if (!session) return null
    if (session.type === 'gif') {
      const batch = count || 10
      return session.data.slice(i, i + batch)
    } else {
      return session.data[i] ? [session.data[i]] : null
    }
  }

  cleanup() {
    const now = Date.now()
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.created > 600000) this.sessions.delete(id)
    }
  }
}

class Server {
  constructor(port) {
    this.app = express()
    this.mgr = new SessionManager()
    this.app.use(express.json())
    this.app.post('/init', async (req, res) => {
      try {
        const result = await this.mgr.createSession(req.body)
        res.json(result)
      } catch (e) {
        res.status(500).json({ e: e.message })
      }
    })
    this.app.post('/data', (req, res) => {
      try {
        const { sid, i, c } = req.body
        const data = this.mgr.getData(sid, i, c)
        if (!data) return res.status(404).json({ e: 'not found' })
        if (this.mgr.sessions.get(sid).type === 'gif') {
          res.json({ frames: data.map(buf => Array.from(buf)), delays: this.mgr.sessions.get(sid).data.delays })
        } else {
          res.json({ chunks: data.map(chunk => ({ bytes: Array.from(chunk.buf), x: chunk.x, y: chunk.y, w: chunk.w, h: chunk.h })) })
        }
      } catch {
        res.status(400).json({ e: 'bad request' })
      }
    })
    this.app.listen(port)
  }
}

new Server(cfg.port)
