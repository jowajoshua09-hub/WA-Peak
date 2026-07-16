const nv = +process.versions.node.split('.')[0];
if(nv!==20){ console.error('❌ NEED NODE 20, have',process.versions.node); process.exit(1); }
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = process.env.API_BASE;
const KEY = process.env.BLACKNODE_API_KEY;
const EP = process.env.ENDPOINT_PAIR_CODE||'/pair/code';
const PS = process.env.PAIR_SITE||'https://blacknodezw.zone.id/pair';
const OID = process.env.TELEGRAM_OWNER_ID||'';
const PORT = process.env.PORT||10000;
if(!TOKEN||!KEY) throw new Error('MISSING TOKEN OR API KEY');

const bot = new TelegramBot(TOKEN,{polling:true});
const app = express();
app.get('/',(r,res)=>res.send('⚡ PEAK‑MD TG PAIR BOT'));
app.get('/health',(r,res)=>res.json({ok:1,node:process.versions.node}));
app.listen(PORT,'0.0.0.0',()=>console.log('🤖 TG bot port',PORT));

const rl = new Map();
const lim = id => { const n=Date.now(); if(n-(rl.get(id)||0)<12000) return true; rl.set(id,n); return false; };
const cln = n => { let x=String(n).replace(/\D/g,''); if(x.startsWith('0'))x='263'+x.slice(1); return x.length>=9?x:null; };
async function api(num){
  try{
    const {data}=await axios.get(API_BASE+EP,{params:{number:num,apikey:KEY},headers:{'x-api-key':KEY},timeout:25000});
    return {ok:1,d:data.data||data};
  }catch(e){ return {ok:0,e:e.response?.data?.message||e.message}; }
}

bot.onText(/^\/start$/i,m=>bot.sendMessage(m.chat.id,
`⚡ **PEAK‑MD TELEGRAM PAIR BOT**
👤 StarDev‑il • Star Tech
⚙️ Node.js ${process.versions.node}
💬 The Peak of Automation

/pair 263781234567 → get code
/pair 0781234567 → auto ZW format
/help → guide
${OID?'/restartwa → restart WA bot':''}`,{parse_mode:'Markdown'}));

bot.onText(/^\/help$/i,m=>bot.sendMessage(m.chat.id,
`1. /pair number\n2. Copy 8‑digit code\n3. WhatsApp → Linked devices → Link with phone number instead\n4. Paste code\n⏳ 60s expiry\n🌐 ${PS}`,{parse_mode:'Markdown'}));

bot.onText(/^\/pair\s*(.+)?$/i,async(m,mt)=>{
  const id=m.chat.id, u=String(m.from.id);
  if(OID && u!==OID) return bot.sendMessage(id,'❌ Owner only');
  if(lim(u)) return bot.sendMessage(id,'⏳ Wait 12s');
  const raw=(mt[1]||'').trim();
  if(!raw) return bot.sendMessage(id,'❌ /pair 263781234567');
  const num=cln(raw);
  if(!num) return bot.sendMessage(id,'❌ Bad number');
  const s=await bot.sendMessage(id,`🔗 PAIRING… \`${num}\``,{parse_mode:'Markdown'});
  const r=await api(num);
  bot.deleteMessage(id,s.message_id).catch(()=>{});
  if(!r.ok) return bot.sendMessage(id,'❌ '+r.e);
  const cd=(r.d.code||r.d.data?.code||'XXXX-XXXX').toString().replace(/(.{4})(?=.)/,'$1‑');
  bot.sendMessage(id,
`🔐 **PEAK‑MD PAIR CODE**
📱 \`${num}\`
🔢 \`${cd}\`
⏳ Expires 60s

1. WhatsApp → ⋮ → Linked devices
2. Link a device → Link with phone number instead
3. Enter code

🌐 ${PS}
> The Peak of Automation`,{parse_mode:'Markdown'});
});

if(OID) bot.onText(/^\/restartwa$/i,m=>{
  if(String(m.from.id)!==OID) return;
  bot.sendMessage(m.chat.id,'🔄 Restarting WA…');
  require('child_process').exec('pkill -f "node index" ; sleep 1 ; node index.js &');
});
bot.on('polling_error',e=>console.log('TG ERR',e.code));
console.log('✅ TG Pair Bot running');
