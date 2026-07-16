const P=global.PEAK;
const a=(r)=>r.ok?(r.data?.data?.answer||r.data?.answer||JSON.stringify(r.data)).slice(0,4000):'❌ '+r.err;
const run=async(c,fn,l)=>{if(!c.args)return c.reply('❌ text');c.reply(`🤖 ${l.toUpperCase()}\n\n${a(await fn(c.args))}`);};
module.exports={ai:c=>run(c,P.blacknode.gpt,'gpt'),gpt:c=>run(c,P.blacknode.gpt,'gpt'),deepseek:c=>run(c,P.blacknode.deepseek,'ds'),claude:c=>run(c,P.blacknode.claude,'claude'),gemini:c=>run(c,P.blacknode.gemini,'gemini')};
