require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const cfgPath = path.join(__dirname,'config.json');

const def = {
  OWNER_NUMBER: process.env.OWNER_NUMBER.replace(/\D/g,''),
  SESSION_ID: process.env.SESSION_ID,
  MODE: process.env.MODE || 'private',
  PREFIX: process.env.PREFIX || '.',
  BOT_NAME: process.env.BOT_NAME || 'PEAK-MD',
  OWNER_NAME: process.env.OWNER_NAME || 'Owner',
  API_BASE: process.env.API_BASE,
  BLACKNODE_API_KEY: process.env.BLACKNODE_API_KEY,
  PAIR_SITE: process.env.PAIR_SITE,
  CREATOR: 'StarDev-il',
  CREATOR_AKA: 'Star Tech',
  VERSION: '1.0.0',
  TAGLINE: 'The Peak of Automation',
  BOT_IMAGE: './media/angel.jpg'
};

let rt = {...def};
if(fs.existsSync(cfgPath)) try { rt = {...rt, ...fs.readJsonSync(cfgPath)} } catch(e){}
function save(){ try{ fs.writeJsonSync(cfgPath,{MODE:rt.MODE,OWNER_NAME:rt.OWNER_NAME},{spaces:2}) }catch(e){} }

module.exports = {
  get: k => rt[k],
  set: (k,v) => { rt[k]=v; if(['MODE','OWNER_NAME'].includes(k)) save(); return v },
  getAll: () => ({...rt}),
  isOwner: j => j.replace(/\D/g,'').includes(rt.OWNER_NUMBER),
  modeText: () => rt.MODE==='public'?'Public':'Ghost Private ✓'
};
