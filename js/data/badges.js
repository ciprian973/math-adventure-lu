/* =====================================================================
 * badges.js — badges in families with five tiers:
 *   1 Level I (bronze, ribbon)        2 Level II (silver, oak leaves)
 *   3 Level III (gold, laurels)        4 Supreme (diamond, laurels + swords)
 *   5 Maximum (legendary: crown, rays, everything)
 * A badge id is "family:tier" (e.g. "hardWorker:3"); "firstStep" is the only
 * single badge. Texts: badgef.* (and legacy badge.* names) in lang/*.js.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};
  const stars = (p, G, s) => G.stars(p, s);
  const l4 = (p, s) => ((p.stages[s] || {}).byLevel || { 4: { c: 0 } })[4].c;
  // topic groups (together they cover all 27 stages)
  const TOPICS = [
    ['fractionMaster', '🍕', ['no_frac', 'no_equiv']], ['decimalDetective', '🔍', ['no_dec']], ['bigNumbers', '🏰', ['no_big']],
    ['calcChampion', '🧮', ['no_calc', 'no_ops', 'no_check', 'no_struct']], ['dataExplorer', '📊', ['no_data', 'gm_data']],
    ['angleAce', '📐', ['ef_coord', 'ef_angles']], ['shapeMaster', '🔷', ['ef_shapes', 'ef_solids']], ['mirrorMaster', '🪞', ['ef_sym']],
    ['areaArchitect', '🏗️', ['ef_area', 'ef_volume']], ['measureMaster', '⚖️', ['gm_length', 'gm_masscap', 'gm_units']],
    ['timeKeeper', '⏰', ['gm_time']], ['moneyWizard', '💶', ['gm_money']],
    ['problemSolver', '🧩', ['rp_analyse', 'rp_solve', 'rp_prop', 'rp_open']], ['detective', '🕵️', ['rp_check']]
  ];
  const REGIONS = [['NO', 'bossNO', '👑'], ['EF', 'bossEF', '🛡️'], ['GM', 'bossGM', '🌲'], ['RP', 'bossRP', '🎡']];
  const fam = [];
  // 1. regions: share of all stars of the region (Maximum also needs 3 stars in the region challenge)
  REGIONS.forEach(([rid, nameKey, icon]) => fam.push({ id: 'region' + rid, cat: 'region', icon, nameKey: 'badge.' + nameKey, region: rid,
    value: (p, G) => G.regionStars(p, MQ.MAP.regions.find(r => r.id === rid)),
    max: () => MQ.MAP.regions.find(r => r.id === rid).stages.length * 3,
    test: (p, G, t) => { const r = MQ.MAP.regions.find(x => x.id === rid), mx = r.stages.length * 3, v = G.regionStars(p, r); return t < 5 ? v >= Math.ceil(mx * t / 5) : v >= mx && (p.boss[rid] || 0) >= 3; } }));
  // 2. topics: stars in every stage of the group, then hard (level 4) work
  TOPICS.forEach(([id, icon, st]) => fam.push({ id, cat: 'topic', icon, nameKey: 'badge.' + id, stages: st,
    value: (p, G) => Math.min(...st.map(s => stars(p, G, s))),
    test: (p, G, t) => t <= 3 ? st.every(s => stars(p, G, s) >= t) : st.every(s => stars(p, G, s) >= 3 && l4(p, s) >= (t === 4 ? 10 : 25)) }));
  // 3. effort: counts with five thresholds
  const COUNT = [
    ['hardWorker', '🐝', [50, 250, 750, 2000, 5000], p => p.stats.correct || 0],
    ['noHints', '💡', [10, 20, 35, 60, 100], p => p.stats.noHintStreakBest || 0],
    ['streak', '🔥', [3, 7, 14, 30, 60], p => Math.max(p.stats.bestStreak || 0, (p.streak || {}).days || 0)],
    ['daily5', '📅', [3, 10, 30, 75, 150], p => p.stats.questsDone || 0],
    ['thinker', '🧠', [20, 75, 200, 500, 1200], p => Object.values(p.stages).reduce((a, s) => a + ((s.byLevel || {})[4] || { c: 0 }).c, 0)],
    ['persistent', '💪', [10, 40, 100, 250, 500], p => p.stats.retrySuccess || 0],
    ['lightning', '⚡', [5, 8, 11, 14, 18], p => Math.max(0, ...Object.values(p.blitz || {}))],
    ['setMaster', '📚', [1, 3, 8, 20, 40], p => p.stats.setsDone || 0],
    ['explorer', '🧭', [3, 9, 15, 21, 27], (p, G) => MQ.MAP.regions.flatMap(r => r.stages).filter(s => G.stars(p, s) >= 1).length]
  ];
  COUNT.forEach(([id, icon, th, value]) => fam.push({ id, cat: 'effort', icon, nameKey: (['daily5', 'persistent', 'explorer'].includes(id) ? 'badge.' : 'badgef.') + id, thresholds: th, value, test: (p, G, t) => value(p, G) >= th[t - 1] }));
  // 4. region challenges
  fam.push({ id: 'champion', cat: 'effort', icon: '⚔️', nameKey: 'badgef.champion', value: p => REGIONS.filter(([r]) => (p.boss[r] || 0) >= 2).length,
    test: (p, G, t) => t < 5 ? REGIONS.filter(([r]) => (p.boss[r] || 0) >= 2).length >= t : REGIONS.every(([r]) => (p.boss[r] || 0) >= 3) });

  const list = [{ id: 'firstStep', icon: '👣', tier: 1, single: true, test: p => p.stats.correct >= 1 }];
  fam.forEach(f => { for (let t = 1; t <= 5; t++) list.push({ id: f.id + ':' + t, fam: f.id, tier: t, icon: f.icon, test: (p, G) => f.test(p, G, t) }); });
  MQ.MAP = MQ.MAP || {};
  MQ.MAP.badgeFamilies = fam;
  MQ.MAP.badges = list;
  MQ.MAP.BADGE_CATS = ['region', 'topic', 'effort'];

  /* name and requirement of a badge, in a language */
  MQ.badgeText = (id, lang) => {
    const t = (k, v) => MQ.t(k, v || {}, lang);
    if (id === 'firstStep') return { name: t('badge.firstStep'), desc: t('badge.firstStep.d'), tier: 1, icon: '👣' };
    const [fid, ts] = id.split(':'); const tier = +ts; const f = fam.find(x => x.id === fid); if (!f) return { name: id, desc: '', tier: 1, icon: '🏅' };
    let desc;
    if (f.cat === 'region') desc = tier < 5 ? t('badgef.k.region', { n: Math.ceil(f.max() * tier / 5), m: f.max(), r: { k: 'region.' + f.region } }) : t('badgef.k.region5', { r: { k: 'region.' + f.region } });
    else if (f.cat === 'topic') desc = t('badgef.k.topic' + (f.stages.length === 1 ? 'One' : '') + tier, { g: { raw: f.stages.map(s => t('stage.' + s)).join(', ') }, n: tier === 4 ? 10 : 25 });
    else if (f.id === 'champion') desc = tier < 5 ? t('badgef.champion.d', { n: tier }) : t('badgef.champion.d5');
    else desc = t('badgef.' + f.id + '.d', { n: f.thresholds[tier - 1] });
    return { name: t(f.nameKey), tierName: t('badge.tier.' + tier), desc, tier, icon: f.icon };
  };
  if (typeof module !== 'undefined') module.exports = MQ.MAP;
})(typeof window !== 'undefined' ? window : globalThis);
