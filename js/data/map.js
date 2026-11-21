/* =====================================================================
 * map.js — the adventure map: one REGION per curriculum domain (PE C4),
 * inspired by Luxembourg landscapes; STAGES are topics. Also badges and
 * avatar items. Text for every id is in lang/*.js (region.*, stage.*,
 * badge.*, av.*).
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};
  MQ.MAP = {
    regions: [
      { id: 'NO', domain: 'NO', theme: 'city', color: '#c8102e', pos: [36, 58],   // Luxembourg City – the fortress of numbers
        stages: ['no_big', 'no_dec', 'no_frac', 'no_equiv', 'no_calc', 'no_ops', 'no_check', 'no_struct', 'no_data'] },
      { id: 'EF', domain: 'EF', theme: 'castle', color: '#6a3d9a', pos: [40, 22],  // Vianden castle – shapes
        stages: ['ef_coord', 'ef_angles', 'ef_shapes', 'ef_solids', 'ef_sym', 'ef_area', 'ef_volume'] },
      { id: 'GM', domain: 'GM', theme: 'forest', color: '#1b7a3a', pos: [70, 38],  // Mullerthal – measures
        stages: ['gm_length', 'gm_masscap', 'gm_time', 'gm_money', 'gm_units', 'gm_data'] },
      { id: 'RP', domain: 'RP', theme: 'fair', color: '#d97706', pos: [66, 84],    // Schueberfouer & Moselle – problems
        stages: ['rp_analyse', 'rp_solve', 'rp_prop', 'rp_open', 'rp_check'] }
    ],
    // badges tied to real skills. test(p, G) gets the profile and the game helpers
    // badges: see js/data/badges.js (families with five tiers)
    // avatar options (the mascot is Léo, a young red lion from the Luxembourg coat of arms)
    avatar: {
      // lock rules: lvl = player level needed; league = index in MQ.game.LEAGUES needed
      style: [{ id: 'boy', lvl: 1 }, { id: 'girl', lvl: 1 }],
      fur: [{ id: 'red', c: '#d7263d', lvl: 1 }, { id: 'gold', c: '#e8a317', lvl: 1 }, { id: 'blue', c: '#1f78b4', lvl: 2 }, { id: 'green', c: '#2e8b57', lvl: 3 }, { id: 'pink', c: '#e75480', lvl: 4 }, { id: 'purple', c: '#7b3fa0', lvl: 5 }, { id: 'brown', c: '#8b5a2b', lvl: 6 }, { id: 'silver', c: '#8a95a5', lvl: 7 }, { id: 'white', c: '#e9e4da', lvl: 12 }, { id: 'rainbow', c: 'url(#mqRainbow)', lvl: 20 }],
      acc: [{ id: 'none', lvl: 1 }, { id: 'cap', lvl: 1 }, { id: 'bow', lvl: 2 }, { id: 'scarf', lvl: 2 }, { id: 'flower', lvl: 3 }, { id: 'glasses', lvl: 3 }, { id: 'headphones', lvl: 4 }, { id: 'crown', lvl: 6 }, { id: 'wizard', lvl: 8 }, { id: 'sunglasses', lvl: 9 }, { id: 'chef', lvl: 11 }, { id: 'pirate', lvl: 13 }, { id: 'viking', lvl: 15 }, { id: 'graduate', lvl: 18 }, { id: 'astronaut', lvl: 21 }, { id: 'hero', lvl: 25 }, { id: 'diamondcrown', lvl: 30 }],
      frame: [{ id: 'none', lvl: 1 }, { id: 'auto', lvl: 1 }, { id: 'winter', lvl: 1 }, { id: 'spring', lvl: 1 }, { id: 'summer', lvl: 1 }, { id: 'autumn', lvl: 1 }, { id: 'christmas', lvl: 1 }, { id: 'halloween', lvl: 1 }, { id: 'nationalday', lvl: 4 }, { id: 'fouer', lvl: 6 }, { id: 'silver', league: 1 }, { id: 'gold', league: 2 }, { id: 'platinum', league: 3 }, { id: 'diamond', league: 4 }, { id: 'legend', league: 5 }],
      bg: [{ id: 'sky', c: '#d8ecff', lvl: 1 }, { id: 'meadow', c: '#dff5d8', lvl: 1 }, { id: 'sunset', c: '#ffe3c7', lvl: 3 }, { id: 'night', c: '#2a3550', lvl: 5 }, { id: 'sea', c: '#bfe6f0', lvl: 8 }, { id: 'candy', c: '#ffd6ea', lvl: 10 }, { id: 'space', c: '#140a33', lvl: 14 }, { id: 'goldbg', c: '#ffe9a8', lvl: 22 }]
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
