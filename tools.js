const {downloadContentFromMessage}=require('@whiskeysockets/baileys');
const qts = ['"The Peak of Automation — StarDev‑il"','"Excellence is a habit"','"Dream it, build it"'];
module.exports = {
  sticker:async({sock,from,msg})=>{
    const q=msg.message?.imageMessage||msg.message?.videoMessage||msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if(!q||(!q.imageMessage&&!q.videoMessage)) return;
    const t=q.imageMessage||q.videoMessage;
    const s=await downloadContentFromMessage(t,t.mimetype.includes('video')?'video':'image');
    let b=Buffer.from([]); for await(const c of s) b=Buffer.concat([b,c]);
    sock.sendMessage(from,{sticker:b},{quoted:msg});
  },
  toimg:async({sock,from,msg})=>{
    const q=msg.message?.stickerMessage||msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
    if(!q||q.isAnimated) return;
    const s=await downloadContentFromMessage(q,'image');
    let b=Buffer.from([]); for await(const c of s) b=Buffer.concat([b,c]);
    sock.sendMessage(from,{image:b},{quoted:msg});
  },
  quotes:({reply})=>reply('💬 '+qts[Math.floor(Math.random()*qts.length)]),
  calc:({args,reply})=>{
    if(!args||!/^[\d+\-*/().%\s]+$/.test(args)) return reply('❌ bad math');
    try{reply('🧮 = '+eval(args))}catch{reply('❌')}
  }
};
