const axios = require('axios');
const PEAK = global.PEAK;
const buf=async u=>{try{return(await axios.get(u,{responseType:'arraybuffer',timeout:180000})).data}catch{}};
const url = d => d.download_url||d.url||d.image_url||d.video_url||(Array.isArray(d.images)?d.images[0]:'');

module.exports = {
  imagine:async({args,reply,send,react})=>{
    const S=['realistic','anime','art','cartoon'];
    if(!args) return reply('❌ .imagine prompt [style]\nStyles: '+S.join('/'));
    const p=args.split(' '), s=S.includes(p.at(-1).toLowerCase())?p.pop().toLowerCase():null;
    await react('🎨'); const d=(await PEAK.blacknode.imagine(p.join(' '),s)).data?.data||{};
    const b=await buf(url(d)); if(!b) return reply(JSON.stringify(d,null,2).slice(0,600));
    react('✅'); send({image:b,caption:`✨ ${p.join(' ')}${s?' • '+s:''}`});
  },
  veo:async({args,reply,send,react})=>{
    if(!args) return; await react('🎬');
    const d=(await PEAK.blacknode.video(args)).data?.data||{}; const b=await buf(url(d));
    b?send({video:b,caption:args}):reply(url(d)||JSON.stringify(d));
  },
  removebg:async({args,reply,send,react})=>{
    if(!args.startsWith('http')) return; await react('✂️');
    const d=(await PEAK.blacknode.removebg(args)).data?.data||{}; const b=await buf(url(d));
    b?send({image:b}):reply(url(d));
  },
  toanime:async({args,reply,send,react})=>{
    if(!args.startsWith('http')) return; await react('🎎');
    const d=(await PEAK.blacknode.toanime(args)).data?.data||{}; const b=await buf(url(d));
    b?send({image:b}):reply(url(d));
  },
  remini:async({args,reply,send,react})=>{
    if(!args.startsWith('http')) return; await react('🖼️');
    const d=(await PEAK.blacknode.remini(args)).data?.data||{}; const b=await buf(url(d));
    b?send({image:b}):reply(url(d));
  }
};
