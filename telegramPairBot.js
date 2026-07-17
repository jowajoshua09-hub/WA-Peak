require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// USE YOUR RENDER LINK DIRECTLY
const API_BASE = "https://site-pair-qcnp.onrender.com";
const EP = "/api/pair"; 
const PS = "https://site-pair-qcnp.onrender.com";
const PORT = process.env.PORT || 10000;

if(!TOKEN) throw new Error('MISSING TELEGRAM_BOT_TOKEN');

const bot = new TelegramBot(TOKEN,{polling:true});
const app = express();
app.get('/',(r,res)=>res.send('⚡ PEAK-MD TG PAIR BOT - PUBLIC'));
app.get('/health',(r,res)=>res.json({ok:1}));
app.listen(PORT,'0.0.0.0',()=>console.log('🤖 TG bot port',PORT));

const rl = new Map();
const lim = id => { const n=Date.now(); const last=rl.get(id)||0; if(n-last<12000) return true; rl.set(id,n); return false; };
const cln = n => { let x=String(n).replace(/\D/g,''); if(x.startsWith('0'))x='263'+x.slice(1); return x.length>=10?x:null; };

async function api(num){
  try{
    // This matches your Next.js route: /api/pair?number=263...
    const {data}=await axios.get(API_BASE+EP,{params:{number:num}, timeout: 40000});
    return {ok:1, d:data};
  }catch(e){ 
    console.log("API ERR", e.response?.status, e.response?.data || e.message);
    return {ok:0, e: e.response?.data?.error || e.message}; 
  }
}

bot.onText(/^\/start$/i,m=>bot.sendMessage(m.chat.id,
`⚡ *PEAK-MD TELEGRAM PAIR BOT*
💬 The Peak of Automation
🌍 Public Mode

/pair 263781234567 → get code
/pair 0781234567 → auto ZW

🌐 ${PS}`,{parse_mode:'Markdown'}));

bot.onText(/^\/pair\s*(.+)?$/i,async(m,mt)=>{
  const id=m.chat.id;
  if(lim(id)) return bot.sendMessage(id,'⏳ Wait 12s');
  const raw=(mt[1]||'').trim();
  if(!raw) return bot.sendMessage(id,'❌ Usage: /pair 263781234567');
  const num=cln(raw);
  if(!num) return bot.sendMessage(id,'❌ Bad number, use 263... or 07...');
  
  const s=await bot.sendMessage(id,`🔗 PAIRING… \`${num}\``, {parse_mode:'Markdown'});
  const r=await api(num);
  bot.deleteMessage(id,s.message_id).catch(()=>{});
  
  if(!r.ok) return bot.sendMessage(id,`❌ ${r.e}\n\nTry again in 10s. If still fails, WhatsApp is rate-limiting.` );
  
  const cd=(r.d.code||'').toString();
  if(!cd) return bot.sendMessage(id,'❌ No code returned, try again');
  
  bot.sendMessage(id,
`🔐 *PEAK-MD PAIR CODE*
📱 \`${num}\`
🔢 \`${cd}\`
⏳ Expires 60s

1. WhatsApp → ⋮ → Linked devices
2. Link a device → Link with phone number
3. Enter code

> The Peak of Automation`,{parse_mode:'Markdown'});
});

bot.on('polling_error',e=>console.log('TG ERR',e.message));
console.log('✅ TG Pair Bot running - PUBLIC, NO OWNER CHECK');
