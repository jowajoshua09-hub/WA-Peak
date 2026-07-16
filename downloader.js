const axios = require('axios');
const PEAK = global.PEAK;
const buf = async u => {try{return (await axios.get(u,{responseType:'arraybuffer',timeout:120000})).data}catch{return null}};
const $ = r => r.ok ? (r.data?.data||r.data||{}) : {};

module.exports = {
  play:async({args,reply,send,react})=>{
    if(!args) return reply('❌ .play song name');
    await react('🔍'); const r=await PEAK.blacknode.youtubeMp3(args); const d=$(r);
    if(!d.download_url) return react('❌')||reply('❌ Not found');
    const b=await buf(d.download_url); if(!b) return reply(d.download_url);
    react('✅'); send({audio:b,mimetype:'audio/mpeg',fileName:(d.title||'audio')+'.mp3'});
  },
  song:c=>module.exports.play(c), songs:c=>module.exports.play(c),
  videos:async({args,argsArr,reply,send,react})=>{
    if(!argsArr[0]) return reply('❌ .videos name [1080/720/480/360]');
    const q=['360','480','720','1080'].includes(argsArr.at(-1))?argsArr.pop():null;
    await react('🔍'); const r=await PEAK.blacknode.youtubeMp4(argsArr.join(' '),q||'720'); const d=$(r);
    if(!d.download_url) return react('❌');
    const b=await buf(d.download_url); if(!b) return reply(d.download_url);
    react('✅'); send({video:b,caption:`🎬 ${d.title||''}\n👤 ${d.channel||''}`});
  },
  yt:async({args,reply,send,react})=>{
    if(!args.startsWith('http')) return reply('❌ .yt LINK');
    let r=await PEAK.blacknode.youtubeMp4(args,'720'), d=$(r);
    let audio=false; if(!d.download_url){r=await PEAK.blacknode.youtubeMp3(args);d=$(r);audio=true}
    if(!d.download_url) return reply('❌');
    const b=await buf(d.download_url); if(!b) return reply(d.download_url);
    react('✅'); audio?send({audio:b,mimetype:'audio/mpeg'}):send({video:b,caption:d.title||''});
  },
  tiktok:async({args,reply,send,react})=>{
    if(!args.startsWith('http')) return reply('❌ LINK');
    const d=$(await PEAK.blacknode.tiktok(args)); if(!d.download_url) return reply('❌');
    const b=await buf(d.download_url); react('✅'); send({video:b,caption:d.title||''});
  },
  facebook:async({args,reply,send,react})=>{
    if(!args.startsWith('http')) return; const d=$(await PEAK.blacknode.facebook(args));
    const b=await buf(d.download_url); react('✅'); send({video:b});
  },
  instagram:async({args,reply,send,react})=>{
    if(!args.startsWith('http')) return; const d=$(await PEAK.blacknode.instagram(args));
    const b=await buf(d.download_url); react('✅');
    d.download_url.includes('.mp4')?send({video:b}):send({image:b});
  },
  spotify:async({args,reply,send,react})=>{
    if(!args.startsWith('http')) return; const d=$(await PEAK.blacknode.spotifyTrack(args));
    const b=await buf(d.download_url); react('✅'); send({audio:b,mimetype:'audio/mpeg',fileName:(d.title||'track')+'.mp3'});
  },
  spotifysearch:async({args,reply})=>{
    if(!args) return; const d=$(await PEAK.blacknode.spotifySearch(args));
    const l=(d.tracks?.items||[]).slice(0,8).map((t,i)=>`${i+1}. ${t.name} — ${t.artists.map(x=>x.name).join(', ')}`).join('\n');
    reply('🎵\n'+(l||'none'));
  },
  pinterest:async({args,reply,send,react})=>{
    const d=args.startsWith('http')?$(await PEAK.blacknode.pinterestDl(args)):$(await PEAK.blacknode.pinterestSearch(args));
    const b=await buf(d.download_url||d.url); if(!b) return reply('❌');
    react('✅'); send({image:b});
  },
  pinterestsearch:c=>module.exports.pinterest(c),
  twitter:async({args,reply,send,react})=>{
    const d=$(await PEAK.blacknode.twitter(args)); const b=await buf(d.download_url);
    react('✅'); d.download_url.includes('.mp4')?send({video:b}):send({image:b});
  },
  lyrics:async({args,reply})=>{
    if(!args) return; const d=$(await PEAK.blacknode.lyrics(args));
    reply(`🎤 ${d.title||args}\n\n${d.lyrics||d.text||'—'}`);
  },
  weather:async({args,reply})=>{ if(!args) return; const d=$(await PEAK.blacknode.weather(args)); reply('🌤️\n'+JSON.stringify(d,null,2).slice(0,3000)); },
  news:async({args,reply})=>{
    const d=$(await PEAK.blacknode.news(args));
    const a=(d.articles||[]).slice(0,5).map(x=>`• *${x.title}*\n${x.source} • ${x.published_at?.split(' ')[0]}\n${x.url}`).join('\n\n');
    reply('📰\n'+a,{parse_mode:'Markdown'});
  },
  country:async({args,reply})=>{ if(!args) return; const d=$(await PEAK.blacknode.country(args)); reply('🌍\n'+JSON.stringify(d,null,2).slice(0,3000)); }
};
