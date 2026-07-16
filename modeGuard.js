/* =========================================================
   PEAK‑MD — MODE GUARD
   private/ghost = ONLY OWNER CAN USE, SILENT TO OTHERS
   public = EVERYONE
  .pair = ALWAYS WORKS FOR EVERYONE
   ========================================================= */
let cfg;
try {
  cfg = require('./config');
} catch {
  try {
    cfg = require('./lib/config');
  } catch {
    cfg = {
      get: (k) => ({ MODE: 'public' }[k] || 'public'),
      isOwner: () => true
    };
  }
}

module.exports = (cmd, senderJid) => {
  // ✅.pair is HIDDEN + WORKS FOR EVERYONE EVEN IN PRIVATE
  if (cmd === 'pair') return { allow: true };

  const mode = (cfg.get('MODE') || 'private').toLowerCase();

  // ✅ PUBLIC = OPEN
  if (mode === 'public') return { allow: true };

  // ✅ PRIVATE / GHOST = OWNER ONLY — TOTAL SILENCE IF NOT OWNER
  return cfg.isOwner(senderJid)
   ? { allow: true }
    : { allow: false, silent: true };
};
