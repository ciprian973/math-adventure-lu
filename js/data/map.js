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
    badges: [
      { id: 'firstStep', icon: '👣', test: p => p.stats.correct >= 1 },
      { id: 'fractionMaster', icon: '🍕', test: (p, G) => ['no_frac', 'no_equiv'].every(s => G.stars(p, s) >= 3) },
      { id: 'decimalDetective', icon: '🔍', test: (p, G) => G.stars(p, 'no_dec') >= 3 },
      { id: 'bigNumbers', icon: '🏰', test: (p, G) => G.stars(p, 'no_big') >= 2 },
      { id: 'calcChampion', icon: '🧮', test: (p, G) => ['no_calc', 'no_ops'].every(s => G.stars(p, s) >= 2) },
      { id: 'angleAce', icon: '📐', test: (p, G) => G.stars(p, 'ef_angles') >= 2 },
      { id: 'areaArchitect', icon: '🏗️', test: (p, G) => ['ef_area', 'ef_volume'].every(s => G.stars(p, s) >= 2) },
      { id: 'mirrorMaster', icon: '🪞', test: (p, G) => G.stars(p, 'ef_sym') >= 2 },
      { id: 'timeKeeper', icon: '⏰', test: (p, G) => G.stars(p, 'gm_time') >= 2 },
      { id: 'moneyWizard', icon: '💶', test: (p, G) => G.stars(p, 'gm_money') >= 2 },
      { id: 'dataExplorer', icon: '📊', test: (p, G) => ['no_data', 'gm_data'].every(s => G.stars(p, s) >= 2) },
      { id: 'problemSolver', icon: '🧩', test: (p, G) => ['rp_solve', 'rp_prop', 'rp_open'].every(s => G.stars(p, s) >= 2) },
      { id: 'detective', icon: '🕵️', test: (p, G) => G.stars(p, 'rp_check') >= 2 },
      { id: 'bossNO', icon: '👑', test: p => (p.boss.NO || 0) >= 2 },
      { id: 'bossEF', icon: '🛡️', test: p => (p.boss.EF || 0) >= 2 },
      { id: 'bossGM', icon: '🌲', test: p => (p.boss.GM || 0) >= 2 },
      { id: 'bossRP', icon: '🎡', test: p => (p.boss.RP || 0) >= 2 },
      { id: 'noHints10', icon: '💡', test: p => (p.stats.noHintStreakBest || 0) >= 10 },
      { id: 'daily5', icon: '📅', test: p => (p.stats.questsDone || 0) >= 5 },
      { id: 'explorer', icon: '🧭', test: (p, G) => MQ.MAP.regions.every(r => r.stages.some(s => (p.stages[s] || {}).attempts > 0)) },
      { id: 'persistent', icon: '💪', test: p => (p.stats.retrySuccess || 0) >= 10 }
    ],
    // avatar options (the mascot is Léo, a young red lion from the Luxembourg coat of arms)
    avatar: {
      fur: [{ id: 'red', c: '#d7263d', lvl: 1 }, { id: 'gold', c: '#e8a317', lvl: 1 }, { id: 'blue', c: '#1f78b4', lvl: 2 }, { id: 'green', c: '#2e8b57', lvl: 3 }, { id: 'purple', c: '#7b3fa0', lvl: 5 }, { id: 'silver', c: '#8a95a5', lvl: 7 }],
      acc: [{ id: 'none', lvl: 1 }, { id: 'cap', lvl: 1 }, { id: 'scarf', lvl: 2 }, { id: 'glasses', lvl: 3 }, { id: 'headphones', lvl: 4 }, { id: 'crown', lvl: 6 }, { id: 'wizard', lvl: 8 }],
      bg: [{ id: 'sky', c: '#d8ecff', lvl: 1 }, { id: 'meadow', c: '#dff5d8', lvl: 1 }, { id: 'sunset', c: '#ffe3c7', lvl: 3 }, { id: 'night', c: '#2a3550', lvl: 5 }]
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
