const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const express = require('express');
require('dotenv').config();

// Fix paths for FLAT structure
let config;
try { config = require('./lib/config'); } catch { config = require('./config'); }
let blacknode;
try { blacknode = require('./lib/blacknode'); } catch { blacknode = require('./blacknode'); }
let modeGuard;
try { modeGuard = require('./lib/modeGuard'); } catch { modeGuard = require('./modeGuard'); }

const START = Date.now();
global.PEAK = {
  config,
  blacknode,
  uptime: () => {
    const s = Math.floor((Date.now() - START) / 1000);
    const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    return `${d}d ${h}h ${m}m ${s % 60}s`;
  }
};

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (r, res) => res.send('⚡ PEAK‑MD WhatsApp Bot • ONLINE'));
app.get('/health', (r, res) => res.json({ status: 'ok', bot: 'PEAK‑MD', uptime: PEAK.uptime() }));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 HTTP server bound → 0.0.0.0:${PORT}`));

const cmds = {};
// Load commands from ROOT since you have no /commands folder
const files = fs.readdirSync('./').filter(f => ['general.js','downloader.js','genai.js','group.js','tools.js','ai.js'].includes(f));
files.forEach(f => {
  try {
    Object.entries(require('./' + f)).forEach(([n, h]) => cmds[n.toLowerCase()] = h);
  } catch(e){ console.log('skip', f, e.message) }
});
console.log('Loaded commands:', Object.keys(cmds));

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({
    auth: state, printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['PEAK‑MD', 'Chrome', '1.0.0']
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', u => {
    if (u.connection === 'close') {
      const r = new Boom(u.lastDisconnect?.error)?.output.statusCode;
      if (r === DisconnectReason.loggedOut) fs.removeSync('./auth');
      setTimeout(connect, 3500);
    }
    if (u.connection === 'open') {
      console.log('✅ PEAK‑MD WHATSAPP CONNECTED');
      try {
        const jid = config.get('OWNER_NUMBER') + '@s.whatsapp.net';
        sock.sendMessage(jid, { text: `PEAK-MD Connected ✅ Mode: ${config.modeText()} | Uptime: ${PEAK.uptime()}` }).catch(()=>{});
      } catch {}
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type!== 'notify') return;
    const M = messages[0];
    if (!M.message) return;
    const body = M.message.conversation || M.message.extendedTextMessage?.text || M.message.imageMessage?.caption || '';
    if (!body.startsWith(config.get('PREFIX'))) return;
    const [c,...a] = body.slice(1).trim().split(/\s+/);
    const cmd = c.toLowerCase(), args = a.join(' ');
    const from = M.key.remoteJid, isGrp = from.endsWith('@g.us');
    const sender = isGrp? M.key.participant : from;
    if (M.pushName && config.isOwner(sender) && config.get('OWNER_NAME')!== M.pushName) config.set('OWNER_NAME', M.pushName);
    const g = modeGuard(cmd, sender);
    if (!g.allow) return;
    const ctx = { sock, msg: M, from, sender, isGrp, cmd, args, argsArr: a, pushName: M.pushName || 'User', reply: t => sock.sendMessage(from, { text: t }, { quoted: M }), send: p => sock.sendMessage(from, p, { quoted: M }), react: e => sock.sendMessage(from, { react: { text: e, key: M.key } }) };
    if (cmds[cmd]) cmds[cmd](ctx).catch(console.error);
  });
}
connect().catch(console.error);
