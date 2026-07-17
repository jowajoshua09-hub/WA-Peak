require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const express = require('express');

// START TELEGRAM PAIR BOT - NO PORT, NO CONFLICT
try { require('./telegramPairBot.js'); console.log('✅ TG Pair module loaded'); } catch(e){ console.log('TG skip:', e.message); }

let config;
try { config = require('./lib/config'); } catch { try{ config = require('./config'); }catch{ config = { get:()=> '!', set:()=>{}, isOwner:()=>true, modeText:()=>'PUBLIC' }; } }
let blacknode;
try { blacknode = require('./lib/blacknode'); } catch { try{ blacknode = require('./blacknode'); }catch{ blacknode = {}; } }
let modeGuard;
try { modeGuard = require('./lib/modeGuard'); } catch { try{ modeGuard = require('./modeGuard'); }catch{ modeGuard = ()=>({allow:true}); } }

const START = Date.now();
global.PEAK = {
  config, blacknode,
  uptime: () => {
    const s = Math.floor((Date.now() - START) / 1000);
    const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    return `${d}d ${h}h ${m}m ${s % 60}s`;
  }
};

const app = express();
app.use(express.json());
app.use((req,res,next)=>{ res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); next(); });

const PORT = process.env.PORT || 10000;

// === FIXED PAIR ENDPOINT - SUPPORTS BOTH /pair AND /api/pair ===
async function handlePair(req, res){
  let n = (req.query.number || '').toString().replace(/\D/g,'');
  if(!n) return res.json({error:'number required?number=263783633309'});
  if(n.startsWith('0')) n = '263' + n.slice(1);
  try{
    if(global.sock && global.sock.requestPairingCode && global.sock.user){
      const code = await global.sock.requestPairingCode(n);
      return res.json({code: code.match(/.{1,4}/g)?.join('-') || code});
    }
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./auth_pair_temp');
    const tmp = makeWASocket({
      version,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
      logger: pino({level:'silent'}), browser: ['PEAK-MD','Chrome','122.0.0.0'], printQRInTerminal: false
    });
    tmp.ev.on('creds.update', saveCreds);
    await delay(2000);
    const code = await tmp.requestPairingCode(n);
    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
    setTimeout(()=>{ try{ tmp.end(); fs.removeSync('./auth_pair_temp'); }catch{} }, 3000);
    return res.json({code: formatted});
  }catch(e){
    console.log('Pair error:', e.message);
    return res.status(500).json({error: e.message || 'Retry - Connection Closed'});
  }
}

app.get('/pair', handlePair);
app.get('/api/pair', handlePair); // <--- ADDED THIS LINE FIXES 404
app.get('/', (r, res) => res.send('⚡ PEAK-MD WhatsApp Bot • ONLINE • Pair: /pair?number=263... or /api/pair?number=...'));
app.get('/health', (r, res) => res.json({ status: 'ok', bot: 'PEAK-MD', uptime: PEAK.uptime() }));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 HTTP server bound → 0.0.0.0:${PORT}`));

// Commands loader
const cmds = {};
try{
  const files = fs.readdirSync('./').filter(f => ['general.js','downloader.js','genai.js','group.js','tools.js','ai.js'].includes(f));
  files.forEach(f => { try { Object.entries(require('./' + f)).forEach(([n, h]) => cmds[n.toLowerCase()] = h); } catch(e){ console.log('skip', f, e.message) } });
  console.log('Loaded commands:', Object.keys(cmds));
}catch(e){ console.log('cmd load skip', e.message); }

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['PEAK-MD', 'Chrome', '1.0.0']
  });
  global.sock = sock;
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', u => {
    if (u.connection === 'close') {
      const r = new Boom(u.lastDisconnect?.error)?.output.statusCode;
      if (r === DisconnectReason.loggedOut) fs.removeSync('./auth');
      setTimeout(connect, 3500);
    }
    if (u.connection === 'open') {
      console.log('✅ PEAK-MD WHATSAPP CONNECTED');
      try {
        const num = config.get? config.get('OWNER_NUMBER') : null;
        if(num){ const jid = num + '@s.whatsapp.net'; sock.sendMessage(jid, { text: `PEAK-MD Connected ✅` }).catch(()=>{}); }
      } catch {}
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type!== 'notify') return;
    const M = messages[0]; if (!M.message) return;
    const body = M.message.conversation || M.message.extendedTextMessage?.text || M.message.imageMessage?.caption || '';
    const prefix = config.get? config.get('PREFIX') : '!';
    if (!body.startsWith(prefix)) return;
    const [c,...a] = body.slice(1).trim().split(/\s+/);
    const cmd = c.toLowerCase(), args = a.join(' ');
    const from = M.key.remoteJid, isGrp = from.endsWith('@g.us');
    const sender = isGrp? M.key.participant : from;
    if (M.pushName && config.isOwner && config.isOwner(sender) && config.get('OWNER_NAME')!== M.pushName) config.set('OWNER_NAME', M.pushName);
    const g = modeGuard(cmd, sender); if (!g.allow) return;
    const ctx = { sock, msg: M, from, sender, isGrp, cmd, args, argsArr: a, pushName: M.pushName || 'User', reply: t => sock.sendMessage(from, { text: t }, { quoted: M }), send: p => sock.sendMessage(from, p, { quoted: M }), react: e => sock.sendMessage(from, { react: { text: e, key: M.key } }) };
    if (cmds[cmd]) cmds[cmd](ctx).catch(console.error);
  });
}
connect().catch(console.error);
