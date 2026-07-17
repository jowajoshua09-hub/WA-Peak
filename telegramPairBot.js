require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = "https://site-pair-qcnp.onrender.com";
const EP = "/api/pair";

if(!TOKEN){ console.log('⚠️ No TELEGRAM_BOT_TOKEN, skipping TG bot'); return; }

const bot = new TelegramBot(TOKEN,{polling:true});
console.log('✅ TG Pair Bot running - PUBLIC');

const rl = new Map();
const lim = id => { const n=Date.now(); const l=rl.get(id)||0; if(n-l<12000) return true; rl.set(id,n); return false; };
const cln = n => { let x=String(n).replace(/\D/g,''); if(x.startsWith('0'))x='263'+x.slice(1); return x.length>=10?x:null; };

async function api(num){
  try{
    const {data}=await axios.get(API_BASE+EP,{params:{number:num},timeout:40000});
    return {ok:1,d:data};
  }catch(e){ return {ok:0,e:e.response?.data?.error||e.message}; }
}

bot.onText(/^\/start$/i,m=>bot.sendMessage(m.chat.id,
`⚡ *PEAK-MD TELEGRAM PAIR BOT*\n💬 The Peak of Automation\n\n/pair 263781234567\n/pair 0781234567`,{parse_mode:'Markdown'}));

bot.onText(/^\/pair\s*(.+)?$/i,async(m,mt)=>{
  const id=m.chat.id;
  if(lim(id)) return bot.sendMessage(id,'⏳ Wait 12s');
  const raw=(mt[1]||'').trim();
  if(!raw) return bot.sendMessage(id,'❌ Usage: /pair 263...');
  const num=cln(raw);
  if(!num) return bot.sendMessage(id,'❌ Bad number');
  const s=await bot.sendMessage(id,`🔗 PAIRING \`${num}\``, {parse_mode:'Markdown'});
  const r=await api(num);
  bot.deleteMessage(id,s.message_id).catch(()=>{});
  if(!r.ok) return bot.sendMessage(id,'❌ '+r.e);
  const cd=(r.d.code||'').toString();
  bot.sendMessage(id,`🔐 *CODE*\n📱 \`${num}\`\n🔢 \`${cd}\`\n⏳ 60s\n\nWhatsApp > Linked devices > Link with phone number`,{parse_mode:'Markdown'});
});

bot.on('polling_error',e=>console.log('TG ERR',e.message));
