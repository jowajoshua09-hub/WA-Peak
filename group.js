let cfg; try{ cfg = require('./config'); } catch { cfg = { get:()=>'.', isOwner:()=>true } }
const own = (s,r) => cfg.isOwner(s)?true:(r('❌ Owner only'),false);
module.exports = {
  tagall:async({sock,from,msg,args,isGrp,sender,reply})=>{
    if(!isGrp||!own(sender,reply)) return;
    const m=await sock.groupMetadata(from);
    sock.sendMessage(from,{text:'📢\n'+args,mentions:m.participants.map(p=>p.id)},{quoted:msg});
  },
  hidetag:async({sock,from,msg,args,isGrp,sender,reply})=>{
    if(!isGrp||!own(sender,reply)) return;
    const m=await sock.groupMetadata(from);
    sock.sendMessage(from,{text:args||'👥',mentions:m.participants.map(p=>p.id)},{quoted:msg});
  },
  kick:async({sock,from,msg,isGrp,sender,reply})=>{
    if(!isGrp||!own(sender,reply)) return;
    const u=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    if(!u.length) return reply('tag users');
    sock.groupParticipantsUpdate(from,u,'remove'); reply('✅ kicked');
  },
  add:async({sock,from,argsArr,isGrp,sender,reply})=>{
    if(!isGrp||!own(sender,reply)) return;
    const u=argsArr.map(x=>x.replace(/\D/g,'')+'@s.whatsapp.net').filter(x=>x.length>15);
    sock.groupParticipantsUpdate(from,u,'add'); reply('✅ added');
  },
  promote:async({sock,from,msg,isGrp,sender,reply})=>{
    if(!isGrp||!own(sender,reply)) return;
    const u=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    sock.groupParticipantsUpdate(from,u,'promote');
  },
  demote:async({sock,from,msg,isGrp,sender,reply})=>{
    if(!isGrp||!own(sender,reply)) return;
    const u=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    sock.groupParticipantsUpdate(from,u,'demote');
  },
  link:async({sock,from,isGrp,sender,reply})=>{
    if(!isGrp||!own(sender,reply)) return;
    reply('🔗 https://chat.whatsapp.com/'+await sock.groupInviteCode(from));
  },
  revoke:async({sock,from,isGrp,sender,reply})=>{
    if(!isGrp||!own(sender,reply)) return;
    reply('🔄 https://chat.whatsapp.com/'+await sock.groupRevokeInvite(from));
  }
};
