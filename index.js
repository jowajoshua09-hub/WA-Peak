const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const express = require('express');
require('dotenv').config();
const config = require('./config');
const modeGuard = require('./lib/modeGuard'); // ✅ NOW EXISTS

const START = Date.now();
global.PEAK = {
  config,
  blacknode: require('./lib/blacknode'),
  uptime: () => {
    const s = Math.floor((Date.now() - START) / 1000);
    const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    return `${d}d ${h}h ${m}m ${s % 60}s`;
  }
};

// =========================================================
// 🌐 RENDER REQUIRES — BIND 0.0.0.0 + PORT=10000
// =========================================================
const app = express();
const PORT = process.env.PORT || 10000; // ⚠️ RENDER SETS THIS AUTOMATICALLY
app.get('/', (r, res) => res.send('⚡ PEAK‑MD WhatsApp Bot • ONLINE'));
app.get('/health', (r, res) => res.json({
  status: 'ok', bot: 'PEAK‑MD',
  node: process.versions.node, uptime: PEAK.uptime()
}));
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🌐 HTTP server bound → 0.0.0.0:${PORT}`) // ✅ RENDER DETECTS THIS
);

const cmds = {};
fs.readdirSync('./commands').filter(f => f.endsWith('.js')).forEach(f => {
  Object.entries(require('./commands/' + f)).forEach(([n, h]) => cmds[n.toLowerCase()] = h);
});

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
      const jid = config.get('OWNER_NUMBER') + '@s.whatsapp.net';
      const txt =
`Connected ✅ to PEAK
╭━━★彡 PEAK MD 彡★━━╮
┃ Owner: ${config.get('OWNER_NAME')}
┃ Mode: ${config.modeText()}
┃ Version: 1.0.0
┃ Status: Ready
╰━━━━━━━━━━━━━╯
Type .menu`;
      sock.sendMessage(jid, { text: txt }).catch(() => {});
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const M = messages[0];
    if (!M.message) return;
    const body = M.message.conversation || M.message.extendedTextMessage?.text || M.message.imageMessage?.caption || '';
    if (!body.startsWith(config.get('PREFIX'))) return;
    const [c, ...a] = body.slice(1).trim().split(/\s+/);
    const cmd = c.toLowerCase(), args = a.join(' ');
    const from = M.key.remoteJid, isGrp = from.endsWith('@g.us');
    const sender = isGrp ? M.key.participant : from;

    if (M.pushName && config.isOwner(sender) && config.get('OWNER_NAME') !== M.pushName)
      config.set('OWNER_NAME', M.pushName);

    const g = modeGuard(cmd, sender);
    if (!g.allow) return;

    const ctx = {
      sock, msg: M, from, sender, isGrp, cmd, args, argsArr: a,
      pushName: M.pushName || 'User',
      reply: t => sock.sendMessage(from, { text: t }, { quoted: M }),
      send: p => sock.sendMessage(from, p, { quoted: M }),
      react: e => sock.sendMessage(from, { react: { text: e, key: M.key } })
    };
    if (cmds[cmd]) cmds[cmd](ctx).catch(console.error);
  });
}
connect().catch(console.error);
