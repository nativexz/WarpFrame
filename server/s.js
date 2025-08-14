const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const crypto = require('crypto');

const cfg = {
    port: 3000,
    apis: {
        sfw: 'https://api.waifu.pics/sfw/waifu',
        gif: 'https://api.waifu.pics/sfw/dance',
    },
    imgSize: 256,
    chunks: 4,
};

class Session {
    constructor(id, type, w, h, data) {
        this.id = id; this.type = type; this.w = w; this.h = h; this.data = data; this.created = Date.now();
    }
}

class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.urlCache = new Map();
        setInterval(() => this.cleanup(), 300000);
    }

    async createSession(options) {
        const type = options.type || 'sfw';
        const apiUrl = cfg.apis[type] || cfg.apis.sfw;
        const apiRes = await axios.get(apiUrl);
        const imageUrl = apiRes.data.url;

        if (this.urlCache.has(imageUrl)) {
            const cachedData = this.urlCache.get(imageUrl);
            const id = crypto.randomBytes(16).toString('hex');
            const session = new Session(id, cachedData.type, cfg.imgSize, cfg.imgSize, cachedData.data);
            this.sessions.set(id, session);
            return { sid: id, type: session.type, w: session.w, h: session.h, ...cachedData.meta };
        }

        const imgBuf = (await axios.get(imageUrl, { responseType: 'arraybuffer' })).data;
        let sessionData, sessionType, metaData;

        if (type === 'gif') {
            sessionType = 'gif';
            const gif = sharp(imgBuf, { animated: true });
            const meta = await gif.metadata();
            const frames = [];
            const delays = meta.delay.map(d => d || 100);
            
            for (let i = 0; i < meta.pages; i++) {
                const frameBuf = await sharp(imgBuf, { page: i }).resize(cfg.imgSize, cfg.imgSize).ensureAlpha().raw().toBuffer();
                frames.push({ b64: frameBuf.toString('base64') });
            }
            
            sessionData = frames;
            metaData = { total: frames.length, delays: delays };
        } else {
            sessionType = 'static';
            const img = sharp(imgBuf).resize(cfg.imgSize, cfg.imgSize);
            const chunks = [];
            const grid_size = Math.sqrt(cfg.chunks);
            const chunk_w = Math.floor(cfg.imgSize / grid_size);
            const chunk_h = Math.floor(cfg.imgSize / grid_size);
            for (let y = 0; y < grid_size; y++) {
                for (let x = 0; x < grid_size; x++) {
                    const chunk_x = x * chunk_w; const chunk_y = y * chunk_h;
                    const chunkBuf = await img.clone().extract({ left: chunk_x, top: chunk_y, width: chunk_w, height: chunk_h }).ensureAlpha().raw().toBuffer();
                    chunks.push({ b64: chunkBuf.toString('base64'), x: chunk_x, y: chunk_y, w: chunk_w, h: chunk_h });
                }
            }
            sessionData = chunks;
            metaData = { total: chunks.length };
        }
        this.urlCache.set(imageUrl, { type: sessionType, data: sessionData, meta: metaData });
        return this.createSession(options);
    }

    getData(sid, i, count) {
        const session = this.sessions.get(sid);
        if (!session) return null;
        if (session.type === 'gif') {
            const batch_count = count || 10;
            return session.data.slice(i, i + batch_count);
        } else {
            return session.data[i] ? [session.data[i]] : null;
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [id, session] of this.sessions.entries()) {
            if (now - session.created > 600000) { this.sessions.delete(id); }
        }
    }
}

class Server {
    constructor(p) {
        this.app = express(); this.port = p; this.mgr = new SessionManager();
        this.app.use(express.text({ type: '*/*' }));
        this.routes();
    }
    routes() {
        this.app.post('/init', async (req, res) => {
            try { res.json(await this.mgr.createSession(JSON.parse(req.body || '{}'))); } 
            catch (e) { console.error(e); res.status(500).json({e: e.message}); }
        });
        this.app.post('/data', (req, res) => {
            try {
                const d = JSON.parse(req.body); 
                const data = this.mgr.getData(d.sid, d.i, d.c);
                if (data) { res.json(data); } else { res.status(404).json({e: 'not found'}); }
            } catch (e) { res.status(400).json({e: 'bad request'}); }
        });
    }
    run() { this.app.listen(this.port, () => console.log(`ok: ${this.port}`)); }
}

new Server(cfg.port).run();
