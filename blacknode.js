const axios = require('axios');
require('dotenv').config();
const BASE = process.env.API_BASE;
const KEY  = process.env.BLACKNODE_API_KEY;

const http = axios.create({
  baseURL: BASE,
  timeout: 120000,
  headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' }
});

async function req(epVar, p = {}, m = 'GET') {
  const url = process.env[epVar];
  if (!url) throw new Error('MISSING ENV: ' + epVar);
  const q = { apikey: KEY };
  const body = m === 'POST' ? { ...p, apikey: KEY } : (Object.assign(q, p), undefined);
  try {
    const r = await http({ method: m, url, params: q, data: body });
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, err: e.response?.data?.message || e.message };
  }
}

module.exports = {
  // DOWNLOADERS — GET
  youtubeMp3: i => req('ENDPOINT_YOUTUBE_MP3', i.startsWith('http') ? { url: i } : { q: i }),
  youtubeMp4: (i, q) => {
    const p = i.startsWith('http') ? { url: i } : { q: i };
    if (q) p.quality = q;
    return req('ENDPOINT_YOUTUBE_MP4', p);
  },
  youtubeInfo: u => req('ENDPOINT_YOUTUBE_INFO', { url: u }),
  tiktok: u => req('ENDPOINT_TIKTOK_DOWNLOAD', { url: u }),
  facebook: u => req('ENDPOINT_FACEBOOK_DOWNLOAD', { url: u }),
  instagram: u => req('ENDPOINT_INSTAGRAM_DOWNLOAD', { url: u }),
  spotifyTrack: u => req('ENDPOINT_SPOTIFY_TRACK', { url: u }),
  pinterestDl: u => req('ENDPOINT_PINTEREST_DOWNLOAD', { url: u }),
  twitter: u => req('ENDPOINT_TWITTER_DOWNLOAD', { url: u }),
  spotifySearch: q => req('ENDPOINT_SPOTIFY_SEARCH', { q }),
  lyrics: q => req('ENDPOINT_LYRICS_SEARCH', { q }),
  pinterestSearch: q => req('ENDPOINT_PINTEREST_SEARCH', { q }),
  weather: q => req('ENDPOINT_WEATHER', { q }),
  news: q => req('ENDPOINT_NEWS', { query: q || 'general' }),
  country: q => req('ENDPOINT_COUNTRY', { q }),
  pair: n => req('ENDPOINT_PAIR_CODE', { number: n }),
  // AI — POST
  gpt: q => req('ENDPOINT_AI_CHATGPT', { q }, 'POST'),
  deepseek: q => req('ENDPOINT_AI_DEEPSEEK', { q }, 'POST'),
  claude: q => req('ENDPOINT_AI_CLAUDE', { q }, 'POST'),
  gemini: q => req('ENDPOINT_AI_GEMINI', { q }, 'POST'),
  video: q => req('ENDPOINT_AI_VIDEO', { prompt: q }, 'POST'),
  imagine: (p, s) => {
    const b = { prompt: p }; if (s) b.style = s;
    return req('ENDPOINT_IMAGE_GENERATE', b, 'POST');
  },
  removebg: u => req('ENDPOINT_IMAGE_REMOVEBG', { url: u }, 'POST'),
  toanime: u => req('ENDPOINT_AI_TOANIME', { url: u }, 'POST'),
  remini: u => req('ENDPOINT_AI_REMINI', { url: u }, 'POST')
};
