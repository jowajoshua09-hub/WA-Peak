const fs = require('fs-extra');
const cfg = require('../config');
const PEAK = global.PEAK;
function menu(){return`
╭━━★彡 PEAK MD 彡★━━╮
┃ Creator: StarDev‑il
┃ Owner: ${cfg.get('OWNER_NAME')}
┃ Mode: ${cfg.modeText()}
┃ v1.0.0
╰━━━━━━━━━━━━━╯
╭─❖ GENERAL ─╮
│.peak .menu .help
│.ping .alive .uptime
│.owner .mode .settings
╰─────────────╯
╭─❖ DL ─╮ .play .song .videos
│.yt .tiktok .fb .ig
│.spotify .twitter .pinterest
│.lyrics .spotifysearch
╰────────╯
╭─❖ AI ─╮ .ai .gpt .deepseek
│.claude .gemini .imagine
│.veo .removebg .toanime .remini
╰───────╯
> The Peak of Automation`.trim();}
module.exports={
  peak:({reply})=>reply('⚡ PEAK‑MD'),
  menu:async({sock,from,msg})=>sock.sendMessage(from,{text:menu()},{quoted:msg}),
  help:c=>module.exports.menu(c),
  ping:({reply})=>reply('🏓 Pong'),
  alive:({reply})=>reply(`✅ ALIVE\n${PEAK.uptime()}\n${cfg.modeText()}`),
  uptime:({reply})=>reply(PEAK.uptime()),
  owner:({reply})=>reply(cfg.get('OWNER_NUMBER')),
  mode:({args,reply,sender})=>{
    if(!cfg.isOwner(sender))return;
    if(['private','public','ghost'].includes(args?.toLowerCase())){
      cfg.set('MODE',args); reply('✅ → '+cfg.modeText());
    }
  }
};
