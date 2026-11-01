// =====================================================================
// app.js — Le "cerveau" de l'appli Uppercut.
//   1. Sauvegarde des données sur le téléphone
//   2. Outils (dates, formats…)
//   3. Générateur de séances
//   4. Affichage des écrans (Séance, Carnet, Plus)
// =====================================================================

// ---------------------------------------------------------------------
// 1. SAUVEGARDE — tout est stocké dans le navigateur (localStorage)
// ---------------------------------------------------------------------
const CLE_STOCKAGE = 'uppercut.v1';
const JOURS_BOXE = [1, 3, 5]; // 0 = dimanche, 1 = lundi … 6 = samedi

function etatParDefaut() {
  return {
    version: 1,
    materiel: JSON.parse(JSON.stringify(MATERIEL_PAR_DEFAUT)),
    joursBoxe: JOURS_BOXE.slice(),
    carnet: [],      // toutes les séances terminées
    seance: null,    // la dernière séance générée
    form: null,      // les derniers choix du générateur
    installVu: false,
  };
}

let memoireSecours = null; // si le stockage est bloqué (navigation privée…)

function charger() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (brut) return Object.assign(etatParDefaut(), JSON.parse(brut));
  } catch (e) { /* stockage indisponible */ }
  return memoireSecours || etatParDefaut();
}

function sauver() {
  try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat)); }
  catch (e) { memoireSecours = etat; }
}

let etat = charger();

// ---------------------------------------------------------------------
// 2. OUTILS
// ---------------------------------------------------------------------
const NOMS_JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const COURTS_JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const NOMS_MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const $ = (sel, racine = document) => racine.querySelector(sel);
const $$ = (sel, racine = document) => [...racine.querySelectorAll(sel)];

function isoLocal(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${j}`;
}
function depuisIso(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return new Date(a, m - 1, j);
}
function dateLisible(iso) {
  const d = depuisIso(iso);
  return `${NOMS_JOURS[d.getDay()]} ${d.getDate()} ${NOMS_MOIS[d.getMonth()]}`;
}
function debutSemaine(d = new Date()) { // lundi de la semaine
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const decalage = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - decalage);
  return r;
}
function fmtSec(s) {
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${m} min ${r}` : `${m} min`;
}
function hasard(tab) { return tab[Math.floor(Math.random() * tab.length)]; }
function melanger(tab) {
  const t = tab.slice();
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}
function echapper(txt) {
  return String(txt ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function idUnique() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function exo(id) { return EXOS.find(e => e.id === id); }
function estJourBoxe(jour) { return etat.joursBoxe.includes(jour); }

// ---------------------------------------------------------------------
// 3. GÉNÉRATEUR DE SÉANCES
// ---------------------------------------------------------------------

// Les "emplacements" : quel genre d'exercice on cherche.
// fb = emplacement de secours si aucun exercice ne correspond au matériel.
const SLOTS = {
  force_jambes:  { cat: 'force', pats: ['jambes'] },
  force_hanche:  { cat: 'force', pats: ['hanche'], fb: 'force_jambes' },
  force_pousser: { cat: 'force', pats: ['pousser'] },
  force_tirer:   { cat: 'force', pats: ['tirer'], fb: 'force_hanche' },
  force_complet: { cat: 'force', pats: ['complet', 'porte'], fb: 'force_pousser' },
  explo_bas:     { cat: 'explo', pats: ['jambes'] },
  explo_hanche:  { cat: 'explo', pats: ['hanche'], fb: 'explo_bas' },
  explo_haut:    { cat: 'explo', pats: ['pousser', 'complet'] },
  explo_rot:     { cat: 'explo', pats: ['rotation', 'boxe'], fb: 'explo_haut' },
  gainage_anti:  { cat: 'gainage', pats: ['core'] },
  gainage_rot:   { cat: 'gainage', pats: ['rotation'], fb: 'gainage_anti' },
  gainage_porte: { cat: 'gainage', pats: ['porte', 'complet'], fb: 'gainage_anti' },
  gainage:       { cat: 'gainage' },
  cardio:        { cat: 'cardio' },
};

// Le matériel vraiment utilisable aujourd'hui (coché ET possédé).
function materielDispo(coches) {
  const m = etat.materiel;
  return new Set(coches.filter(k => Array.isArray(m[k]) ? m[k].length > 0 : !!m[k]));
}

function choisirExo(slotCle, ctx) {
  const s = SLOTS[slotCle];
  const candidats = EXOS.filter(e =>
    e.cats.includes(s.cat) &&
    (!s.pats || s.pats.includes(e.pat)) &&
    e.eq.every(k => ctx.dispo.has(k)) &&
    !(ctx.veille && e.epuisant));
  const neufs = candidats.filter(e => !ctx.utilises.has(e.id));
  if (!neufs.length && s.fb) return choisirExo(s.fb, ctx);
  const pool = neufs.length ? neufs : candidats;
  if (!pool.length) return null;
  const e = hasard(pool);
  ctx.utilises.add(e.id);
  return e;
}

// Choisit le bon poids dans TON matériel.
function poidsPour(e) {
  if (!e.charge) return null;
  const liste = [...(etat.materiel[e.charge.t] || [])].sort((a, b) => a - b);
  if (!liste.length) return null;
  const p = e.charge.pref;
  return p === 'max' ? liste[liste.length - 1] : p === 'min' ? liste[0] : liste[Math.floor((liste.length - 1) / 2)];
}
function texteCharge(e) {
  const kg = poidsPour(e);
  if (kg == null) return '';
  if (e.charge.t === 'kb') return `Kettlebell ${kg} kg`;
  if (e.charge.t === 'mb') return `Médecine-ball ${kg} kg`;
  return e.charge.paire ? `2 haltères de ${kg} kg` : `Haltère ${kg} kg`;
}

function creerItem(e, slot, enCircuit, travail) {
  let dose = e.dose;
  if (enCircuit) dose = `${travail} s` + (e.uni ? ' (change de côté à mi-temps)' : '');
  return { id: e.id, slot, dose, charge: texteCharge(e), circuit: !!enCircuit, travail: travail || 0 };
}

// --- Fabrication des blocs ---
function nbSeries(n, ctx) { return ctx.veille ? Math.max(2, n - 1) : n; }

function blocSeries(slot, ctx, series, repos, titre) {
  const e = choisirExo(slot, ctx);
  if (!e) return null;
  return { type: 'series', titre: titre || 'Séries', series: nbSeries(series, ctx), repos, items: [creerItem(e, slot)] };
}
function blocSuperset(slots, ctx, series, repos, titre) {
  const items = slots.map(s => { const e = choisirExo(s, ctx); return e && creerItem(e, s); }).filter(Boolean);
  if (!items.length) return null;
  if (items.length === 1) return { type: 'series', titre: titre || 'Séries', series: nbSeries(series, ctx), repos, items };
  return { type: 'superset', titre: titre || 'Superset', series: nbSeries(series, ctx), repos, items };
}
function blocCircuit(slots, ctx, tours, travail, reposEx, repos, titre) {
  const items = slots.map(s => { const e = choisirExo(s, ctx); return e && creerItem(e, s, true, travail); }).filter(Boolean);
  if (items.length < 2) return null;
  return { type: 'circuit', titre, series: nbSeries(tours, ctx), travail, reposEx, repos, items };
}
function blocRounds(ctx, n, titre) {
  const avecSac = ctx.dispo.has('pb');
  return {
    type: 'rounds',
    titre: titre || (avecSac ? 'Rounds au punching-ball' : 'Rounds de shadow boxing'),
    series: n, travail: 180, repos: 60,
    themes: melanger(THEMES_ROUNDS).slice(0, n),
  };
}
function blocFractionne(ctx, n) {
  if (ctx.dispo.has('tc')) {
    return { type: 'fractionne', titre: 'Fractionné tapis de course', series: n, travail: 30, repos: 30,
      texte: '30 s de course rapide / 30 s de marche (règle la vitesse pour que le sprint soit dur à tenir).' };
  }
  if (ctx.dispo.has('esc') && !ctx.veille) {
    return { type: 'fractionne', titre: 'Sprints dans les escaliers', series: n, travail: 20, repos: 40,
      texte: 'Monte les escaliers le plus vite possible, redescends en marchant prudemment.' };
  }
  return { type: 'fractionne', titre: 'Fractionné shadow boxing', series: n, travail: 20, repos: 10,
    texte: '20 s de shadow à fond (rafales de directs) / 10 s de repos.' };
}

// Estimation de la durée d'un bloc (en secondes).
function tempsTravail(e) {
  if (!e) return 40;
  if (e.cats.includes('explo') && !e.cats.includes('force')) return e.uni ? 35 : 20;
  if (e.pat === 'porte') return 80;
  if (e.id === 'tgu') return 120;
  return e.uni ? 60 : 40;
}
function estimer(b) {
  switch (b.type) {
    case 'series': return b.series * (tempsTravail(exo(b.items[0].id)) + b.repos) + 45;
    case 'superset': {
      const travail = b.items.reduce((t, it) => t + tempsTravail(exo(it.id)), 0) + 15 * (b.items.length - 1);
      return b.series * (travail + b.repos) + 60;
    }
    case 'circuit': return b.series * b.items.length * (b.travail + b.reposEx) + (b.series - 1) * b.repos + 45;
    default: return b.series * (b.travail + b.repos);
  }
}

// Les "recettes" : l'ordre des blocs selon l'objectif.
// Les premiers sont prioritaires ; les derniers sautent si le temps manque.
const RECETTES = {
  force: ctx => [
    blocSeries('explo_haut', ctx, 3, 60, 'Activation explosive'),
    blocSuperset(['force_jambes', 'force_pousser'], ctx, 4, 75),
    blocSuperset(['force_hanche', 'force_tirer'], ctx, 4, 75),
    blocSuperset(['force_jambes', 'force_tirer'], ctx, 4, 75),
    blocCircuit(['gainage_anti', 'gainage_rot', 'gainage_porte'], ctx, 3, 40, 15, 60, 'Circuit gainage'),
    blocSuperset(['force_complet', 'force_pousser'], ctx, 3, 75),
  ],
  explo: ctx => [
    blocSuperset(['force_jambes', 'explo_bas'], ctx, 4, 90, 'Contraste : lourd puis explosif'),
    blocSeries('explo_hanche', ctx, 4, 60, 'Puissance des hanches'),
    blocSuperset(['explo_haut', 'explo_rot'], ctx, 4, 75, 'Puissance haut du corps'),
    blocSuperset(['explo_bas', 'explo_rot'], ctx, 3, 75, 'Vitesse & rotation'),
    blocCircuit(['gainage_anti', 'gainage_rot', 'gainage'], ctx, 3, 40, 15, 60, 'Circuit gainage'),
  ],
  cardio: ctx => [
    blocCircuit(['cardio', 'cardio', 'cardio', 'cardio'], ctx, 4, 40, 20, 60, 'Circuit HIIT n°1'),
    blocRounds(ctx, ctx.veille ? 3 : 4),
    blocCircuit(['cardio', 'gainage_anti', 'cardio', 'gainage_rot'], ctx, 3, 40, 20, 60, 'Circuit n°2 — cardio & gainage'),
    blocFractionne(ctx, ctx.veille ? 6 : 8),
    blocCircuit(['cardio', 'cardio', 'cardio'], ctx, 3, 30, 15, 60, 'Circuit n°3 — finition'),
    blocCircuit(['gainage', 'gainage', 'gainage'], ctx, 2, 40, 15, 45, 'Gainage final'),
  ],
  gainage: ctx => [
    blocCircuit(['gainage_anti', 'gainage_rot', 'gainage_anti', 'gainage_porte'], ctx, 3, 40, 20, 60, 'Circuit gainage A'),
    blocSeries('force_complet', ctx, 3, 60, 'Force du tronc'),
    blocCircuit(['gainage_rot', 'gainage_anti', 'gainage_rot', 'cardio'], ctx, 3, 40, 20, 60, 'Circuit B — rotation & frappe'),
    blocSuperset(['force_hanche', 'gainage_porte'], ctx, 3, 60, 'Chaîne arrière & portés'),
    blocCircuit(['gainage', 'gainage', 'gainage'], ctx, 3, 45, 15, 60, 'Circuit C'),
    blocCircuit(['cardio', 'gainage', 'cardio', 'gainage'], ctx, 2, 30, 15, 60, 'Circuit D'),
  ],
  complet: ctx => [
    blocSuperset(['explo_bas', 'explo_rot'], ctx, 3, 75, 'Puissance'),
    blocSuperset(['force_jambes', 'force_tirer'], ctx, 4, 75, 'Force A'),
    blocSuperset(['force_hanche', 'force_pousser'], ctx, 4, 75, 'Force B'),
    blocCircuit(['cardio', 'gainage_anti', 'cardio', 'gainage_rot'], ctx, 3, 40, 20, 60, 'Circuit boxe'),
    blocSeries('explo_hanche', ctx, 3, 60, 'Puissance des hanches'),
    blocSuperset(['force_complet', 'gainage_porte'], ctx, 3, 60, 'Force du tronc'),
  ],
};

function echauffement(objectif, dispo, duree) {
  const lignes = [
    dispo.has('tc') ? 'Tapis de course : 3 min de footing léger qui accélère' : 'Corde à sauter imaginaire / pas de boxeur : 3 min',
    'Cercles de bras, de hanches et de chevilles : 10 de chaque',
    'World\'s greatest stretch (fente + rotation du buste) : 4 / côté',
    '10 squats + 8 pompes + 10 ponts fessiers',
  ];
  if (dispo.has('el')) lignes.push('Écartés élastique (pull-apart) : 15 répétitions');
  const specifique = {
    force: '1 série légère des deux exercices du premier superset',
    explo: '3 sauts progressifs + 3 lancers ou swings légers',
    cardio: '1 round de shadow boxing progressif (2 min)',
    gainage: '30 s de planche + 10 dead bugs',
    complet: '3 sauts progressifs + 1 min de shadow boxing',
  };
  lignes.push(specifique[objectif]);
  return { minutes: duree <= 45 ? 8 : 10, lignes };
}

const RETOUR_CALME = {
  minutes: 5,
  lignes: [
    'Respiration lente : 1 min (inspire 4 s, expire 6 s)',
    'Étirement des fléchisseurs de hanche (fente basse) : 30 s / côté',
    'Pectoraux contre un mur : 30 s / côté',
    'Ischios (jambe tendue sur une marche) : 30 s / côté',
    'Posture de l\'enfant (dos et épaules) : 45 s',
  ],
};

// La fonction principale : fabrique une séance complète.
function genererSeance({ objectif, duree, date, coches }) {
  const jour = depuisIso(date).getDay();
  const veille = estJourBoxe((jour + 1) % 7);
  const jourBoxe = estJourBoxe(jour);
  const dispo = materielDispo(coches);
  const ctx = { dispo, veille, utilises: new Set() };

  const echauf = echauffement(objectif, dispo, duree);
  let budget = duree * 60 - echauf.minutes * 60 - RETOUR_CALME.minutes * 60;
  const blocs = [];

  // On ajoute les blocs dans l'ordre tant qu'il reste du temps.
  for (const b of RECETTES[objectif](ctx)) {
    if (!b) continue;
    let est = estimer(b);
    while (est > budget && b.series > 2) { b.series--; est = estimer(b); }
    if (est <= budget + 60) { blocs.push(b); budget -= est; }
  }

  // Finisher : rounds de boxe ou fractionné pour terminer fort.
  if (objectif !== 'cardio' && budget >= 240) {
    const n = Math.min(Math.floor(budget / 240), ctx.veille ? 3 : 5);
    let fin;
    if (n < 2) {
      fin = { type: 'fractionne', titre: 'Tabata shadow boxing', series: 8, travail: 20, repos: 10,
        texte: '8 × (20 s de rafales de directs à fond / 10 s de repos). 4 minutes, tout donner !' };
    } else {
      fin = (dispo.has('pb') || !dispo.has('tc')) ? blocRounds(ctx, n, null) : blocFractionne(ctx, Math.min(10, n * 3));
    }
    fin.finisher = true;
    blocs.push(fin);
    budget -= estimer(fin);
  }
  // S'il reste beaucoup de temps (peu de matériel coché…), on complète.
  let securite = 0;
  while (budget >= 300 && securite++ < 3) {
    const extra = blocCircuit(['gainage', 'cardio', 'gainage'], ctx, 3, 40, 20, 60, 'Circuit bonus');
    if (!extra) break;
    while (estimer(extra) > budget && extra.series > 1) extra.series--;
    blocs.push(extra);
    budget -= estimer(extra);
  }

  const total = echauf.minutes * 60 + RETOUR_CALME.minutes * 60 + blocs.reduce((t, b) => t + estimer(b), 0);
  return {
    id: idUnique(), objectif, duree, date, coches, veille, jourBoxe,
    estimation: Math.round(total / 60),
    echauffement: echauf, blocs, retourCalme: RETOUR_CALME,
    chargesLegeres: chargesLegeres(dispo),
  };
}

function chargesLegeres(dispo) {
  const m = etat.materiel;
  const maxHal = Math.max(0, ...(m.hal || []));
  return dispo.has('hal') && maxHal < 10;
}

// Remplacer un exercice par un autre du même type.
function changerExo(iBloc, iItem) {
  const s = etat.seance;
  const b = s.blocs[iBloc];
  const it = b.items[iItem];
  const ctx = {
    dispo: materielDispo(s.coches), veille: s.veille,
    utilises: new Set(s.blocs.flatMap(bl => (bl.items || []).map(x => x.id))),
  };
  const e = choisirExo(it.slot, ctx);
  if (!e || e.id === it.id) { toast('Pas d\'autre exercice possible avec ce matériel'); return; }
  b.items[iItem] = creerItem(e, it.slot, it.circuit, it.travail);
  sauver();
  afficher();
}

// ---------------------------------------------------------------------
// ÉQUILIBRE DE LA SEMAINE
// ---------------------------------------------------------------------
const TYPES_SEANCE = {
  muscu:  { nom: 'Muscu', emoji: '💪' },
  boxe:   { nom: 'Boxe (club)', emoji: '🥊' },
  sac:    { nom: 'Punching-ball', emoji: '🎯' },
  course: { nom: 'Course', emoji: '🏃' },
  autre:  { nom: 'Autre', emoji: '⭐' },
};

function statsSemaine(ref = new Date()) {
  const debut = debutSemaine(ref);
  const fin = new Date(debut); fin.setDate(fin.getDate() + 7);
  const dans = etat.carnet.filter(s => { const d = depuisIso(s.date); return d >= debut && d < fin; });
  return {
    debut,
    seances: dans,
    muscu: dans.filter(s => s.type === 'muscu').length,
    boxe: dans.filter(s => s.type === 'boxe').length,
    minutes: dans.reduce((t, s) => t + (Number(s.duree) || 0), 0),
    objectifs: dans.filter(s => s.type === 'muscu').map(s => s.objectif),
  };
}

// Programme type pour chaque jour (0 = dimanche).
const PROGRAMME_TYPE = {
  2: { objectif: 'force', duree: 60 },
  4: { objectif: 'explo', duree: 45 },
  6: { objectif: 'complet', duree: 90 },
  0: { objectif: 'gainage', duree: 60 },
  1: { objectif: 'gainage', duree: 30 },
  3: { objectif: 'gainage', duree: 30 },
  5: { objectif: 'gainage', duree: 30 },
};

function conseilPour(dateIso) {
  const d = depuisIso(dateIso);
  const jour = d.getDay();
  const st = statsSemaine(d);
  const base = { ...PROGRAMME_TYPE[jour] };
  const messages = [];

  if (estJourBoxe(jour)) {
    messages.push({ niveau: 'alerte', txt: `🥊 Tu as boxe ce ${NOMS_JOURS[jour]} soir. Si tu t'entraînes quand même : séance courte de gainage, pas plus.` });
  } else if (estJourBoxe((jour + 1) % 7)) {
    messages.push({ niveau: 'info', txt: `⚠️ Veille de boxe (${NOMS_JOURS[(jour + 1) % 7]}) : séance intense mais sans aller à l'échec, volume des jambes réduit.` });
  } else {
    messages.push({ niveau: 'ok', txt: '✅ Pas de boxe le lendemain : c\'est le jour pour la grosse séance.' });
  }

  // Équilibre : on évite de refaire le même objectif deux fois dans la semaine.
  if (!estJourBoxe(jour) && st.objectifs.includes(base.objectif)) {
    const ordre = ['force', 'explo', 'complet', 'gainage'];
    const moinsFait = ordre.slice().sort((a, b) =>
      st.objectifs.filter(o => o === a).length - st.objectifs.filter(o => o === b).length)[0];
    if (moinsFait !== base.objectif) {
      messages.push({ niveau: 'info', txt: `🔄 Tu as déjà fait « ${OBJECTIFS[base.objectif].nom} » cette semaine : je te propose « ${OBJECTIFS[moinsFait].nom} » pour équilibrer.` });
      base.objectif = moinsFait;
    }
  }

  // Un jour de repos le week-end.
  const samedi = isoLocal(new Date(st.debut.getFullYear(), st.debut.getMonth(), st.debut.getDate() + 5));
  const samediFait = st.seances.some(s => s.date === samedi && s.type === 'muscu');
  if (jour === 0 && samediFait) {
    messages.push({ niveau: 'alerte', txt: '😴 Grosse séance déjà faite samedi : dimanche = repos conseillé (ou 30 min de gainage léger).' });
    base.objectif = 'gainage'; base.duree = 30;
  }
  if (st.muscu >= 3) {
    messages.push({ niveau: 'alerte', txt: `🛑 Déjà ${st.muscu} séances de muscu + ${st.boxe} de boxe cette semaine : pense à récupérer.` });
  }
  return { ...base, messages };
}

// ---------------------------------------------------------------------
// 4. AFFICHAGE
// ---------------------------------------------------------------------
let ongletActif = 'seance';

function formActuel() {
  if (!etat.form) {
    const aujourdHui = isoLocal(new Date());
    const c = conseilPour(aujourdHui);
    etat.form = { date: aujourdHui, objectif: c.objectif, duree: c.duree, coches: Object.keys(MATERIEL) };
  }
  // Si la date choisie est passée, on revient à aujourd'hui.
  if (etat.form.date < isoLocal(new Date())) etat.form.date = isoLocal(new Date());
  return etat.form;
}

function afficher() {
  const vue = $('#vue');
  if (ongletActif === 'seance') vue.innerHTML = vueSeance();
  if (ongletActif === 'carnet') vue.innerHTML = vueCarnet();
  if (ongletActif === 'plus') vue.innerHTML = vuePlus();
  $$('.onglet').forEach(b => b.classList.toggle('actif', b.dataset.onglet === ongletActif));
}

// ----- Bandeau de la semaine -----
function bandeauSemaine() {
  const st = statsSemaine();
  const aujourdHui = isoLocal(new Date());
  let jours = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(st.debut); d.setDate(d.getDate() + i);
    const iso = isoLocal(d);
    const faites = st.seances.filter(s => s.date === iso);
    const boxePrevue = estJourBoxe(d.getDay());
    const icones = faites.length
      ? faites.map(s => TYPES_SEANCE[s.type]?.emoji || '⭐').join('')
      : (boxePrevue ? '<span class="prevu">🥊</span>' : '<span class="vide">·</span>');
    jours += `<div class="jour ${iso === aujourdHui ? 'auj' : ''}">
      <span class="jl">${COURTS_JOURS[d.getDay()]}</span><span class="ji">${icones}</span></div>`;
  }
  return `<div class="carte semaine">
    <div class="semaine-titre"><b>Cette semaine</b>
      <span>${st.muscu} muscu · ${st.boxe} boxe · ${st.minutes} min</span></div>
    <div class="jours">${jours}</div>
  </div>`;
}

// ----- Onglet SÉANCE -----
function vueSeance() {
  const f = formActuel();
  const conseil = conseilPour(f.date);

  let chipsJours = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const iso = isoLocal(d);
    const label = i === 0 ? 'Auj.' : i === 1 ? 'Demain' : COURTS_JOURS[d.getDay()];
    const boxe = estJourBoxe(d.getDay()) ? ' 🥊' : '';
    chipsJours += `<button class="chip ${f.date === iso ? 'on' : ''}" data-action="jour" data-val="${iso}">${label}${boxe}</button>`;
  }
  const chipsObj = Object.entries(OBJECTIFS).map(([k, o]) =>
    `<button class="chip gros ${f.objectif === k ? 'on' : ''}" data-action="objectif" data-val="${k}">${o.emoji} ${o.nom}</button>`).join('');
  const chipsDuree = [30, 45, 60, 75, 90].map(m =>
    `<button class="chip ${f.duree === m ? 'on' : ''}" data-action="duree" data-val="${m}">${m === 60 ? '1 h' : m === 75 ? '1 h 15' : m === 90 ? '1 h 30' : m + ' min'}</button>`).join('');
  const chipsMat = Object.entries(MATERIEL).map(([k, m]) => {
    const possede = Array.isArray(etat.materiel[k]) ? etat.materiel[k].length > 0 : !!etat.materiel[k];
    if (!possede) return '';
    return `<button class="chip ${f.coches.includes(k) ? 'on' : ''}" data-action="materiel" data-val="${k}">${m.emoji} ${m.nom}</button>`;
  }).join('');

  const messages = conseil.messages.map(m => `<div class="msg ${m.niveau}">${m.txt}</div>`).join('');
  const suggestion = (conseil.objectif !== f.objectif || conseil.duree !== f.duree)
    ? `<button class="lien" data-action="appliquer-conseil">💡 Conseil : ${OBJECTIFS[conseil.objectif].nom}, ${conseil.duree} min — appliquer</button>` : '';

  return `
    ${bandeauInstallation()}
    ${bandeauSemaine()}
    <div class="carte">
      <h2>Générer une séance</h2>
      <label class="etiquette">Pour quel jour ?</label>
      <div class="chips defile">${chipsJours}</div>
      ${messages}
      <label class="etiquette">Objectif</label>
      <div class="chips">${chipsObj}</div>
      <p class="aide">${OBJECTIFS[f.objectif].desc}</p>
      <label class="etiquette">Durée</label>
      <div class="chips">${chipsDuree}</div>
      <label class="etiquette">Matériel disponible</label>
      <div class="chips">${chipsMat}</div>
      ${suggestion}
      <button class="bouton principal" data-action="generer">⚡ Générer ma séance</button>
    </div>
    ${etat.seance ? vueSeanceGeneree(etat.seance) : ''}
  `;
}

function vueItem(it, iBloc, iItem, prefixe) {
  const e = exo(it.id);
  if (!e) return '';
  const tempo = e.tempo && !it.circuit ? `<span class="tag">Tempo ${e.tempo}</span>` : '';
  const charge = it.charge ? `<span class="tag charge">${echapper(it.charge)}</span>` : '';
  return `<div class="exo">
    <div class="exo-ligne">
      <span class="exo-num">${prefixe}</span>
      <div class="exo-corps">
        <div class="exo-nom">${echapper(e.nom)}</div>
        <div class="exo-dose"><b>${echapper(/^\d+(-\d+)?$/.test(it.dose) ? it.dose + ' rép.' : it.dose)}</b> ${charge} ${tempo}</div>
      </div>
      <button class="changer" data-action="changer" data-bloc="${iBloc}" data-item="${iItem}" aria-label="Changer d'exercice">↻</button>
    </div>
    <details><summary>Comment faire ?</summary><p>${echapper(e.note)}</p></details>
  </div>`;
}

function vueBloc(b, i, lettre) {
  let entete = '', corps = '';
  if (b.type === 'series') {
    entete = `${b.series} séries · repos ${fmtSec(b.repos)}`;
    corps = vueItem(b.items[0], i, 0, lettre);
  } else if (b.type === 'superset') {
    entete = `${b.series} tours · enchaîne ${b.items.map((_, k) => lettre + (k + 1)).join(' + ')} · repos ${fmtSec(b.repos)} après chaque tour`;
    corps = b.items.map((it, k) => vueItem(it, i, k, lettre + (k + 1))).join('');
  } else if (b.type === 'circuit') {
    entete = `${b.series} tours · ${b.travail} s d'effort / ${b.reposEx} s de repos · ${fmtSec(b.repos)} entre les tours`;
    corps = b.items.map((it, k) => vueItem(it, i, k, lettre + (k + 1))).join('');
  } else if (b.type === 'rounds') {
    entete = `${b.series} round${b.series > 1 ? 's' : ''} · 3 min de travail / 1 min de repos`;
    corps = `<ol class="rounds">${b.themes.map(t => `<li>${echapper(t)}</li>`).join('')}</ol>`;
  } else if (b.type === 'fractionne') {
    entete = `${b.series} répétitions · ${b.travail} s / ${b.repos} s`;
    corps = `<p class="texte-bloc">${echapper(b.texte)}</p>`;
  }
  return `<div class="bloc ${b.finisher ? 'finisher' : ''}">
    <div class="bloc-tete"><span class="lettre">${lettre}</span>
      <div><h3>${echapper(b.finisher ? '🔥 Finisher — ' + b.titre : b.titre)}</h3><p>${entete}</p></div>
      <span class="bloc-duree">~${Math.round(estimer(b) / 60)} min</span></div>
    ${corps}
  </div>`;
}

function vueSeanceGeneree(s) {
  const o = OBJECTIFS[s.objectif];
  const alertes = [];
  if (s.jourBoxe) alertes.push('<div class="msg alerte">🥊 Jour de boxe : reste léger, ta séance du soir est prioritaire.</div>');
  else if (s.veille) alertes.push('<div class="msg info">⚠️ Veille de boxe : garde 1 à 2 répétitions en réserve à chaque série. Intense, mais pas épuisant.</div>');
  if (s.chargesLegeres) alertes.push('<div class="msg info">🏋️ Tes haltères sont légers : respecte le tempo (descente lente) et la pause. Si une série est facile, ajoute 2 répétitions la prochaine fois.</div>');

  const lettres = 'ABCDEFGHIJ';
  return `<div class="carte seance" id="seance">
    <div class="seance-tete">
      <h2>${o.emoji} ${o.nom}</h2>
      <p>${dateLisible(s.date)} · ≈ ${s.estimation} min · intensité ${s.veille || s.jourBoxe ? 'contrôlée' : 'élevée'}</p>
    </div>
    ${alertes.join('')}
    <div class="bloc echauf">
      <div class="bloc-tete"><span class="lettre">🔥</span><div><h3>Échauffement</h3><p>${s.echauffement.minutes} min, sans pause</p></div></div>
      <ul>${s.echauffement.lignes.map(l => `<li>${echapper(l)}</li>`).join('')}</ul>
    </div>
    ${s.blocs.map((b, i) => vueBloc(b, i, lettres[i])).join('')}
    <div class="bloc calme">
      <div class="bloc-tete"><span class="lettre">🧘</span><div><h3>Retour au calme</h3><p>${s.retourCalme.minutes} min</p></div></div>
      <ul>${s.retourCalme.lignes.map(l => `<li>${echapper(l)}</li>`).join('')}</ul>
    </div>
    <div class="actions">
      <button class="bouton" data-action="generer">↻ Autre séance</button>
      <button class="bouton principal" data-action="terminer">✓ Séance faite !</button>
    </div>
  </div>`;
}

// ----- Onglet CARNET -----
function vueCarnet() {
  const st = statsSemaine();
  const liste = etat.carnet.slice().sort((a, b) => b.date.localeCompare(a.date) || b.cree - a.cree);
  let html = '';
  let moisCourant = '';
  for (const s of liste) {
    const d = depuisIso(s.date);
    const mois = `${NOMS_MOIS[d.getMonth()]} ${d.getFullYear()}`;
    if (mois !== moisCourant) { html += `<h4 class="mois">${mois}</h4>`; moisCourant = mois; }
    const t = TYPES_SEANCE[s.type] || TYPES_SEANCE.autre;
    const etoiles = s.ressenti ? '★'.repeat(s.ressenti) + '☆'.repeat(5 - s.ressenti) : '';
    html += `<div class="entree" data-action="voir" data-id="${s.id}">
      <span class="entree-emoji">${t.emoji}</span>
      <div class="entree-corps">
        <div class="entree-titre">${echapper(s.titre || t.nom)}</div>
        <div class="entree-meta">${dateLisible(s.date)} · ${s.duree} min ${etoiles ? '· <span class="etoiles">' + etoiles + '</span>' : ''}</div>
      </div><span class="fleche">›</span></div>`;
  }
  if (!liste.length) {
    html = `<div class="vide-carnet">📓<p>Ton carnet est vide.<br>Génère une séance et coche « Séance faite », ou ajoute ta séance de boxe.</p></div>`;
  }
  return `
    ${bandeauSemaine()}
    <div class="actions haut">
      <button class="bouton principal" data-action="ajouter" data-type="boxe">🥊 + Séance de boxe</button>
      <button class="bouton" data-action="ajouter" data-type="autre">+ Autre</button>
    </div>
    <div class="carte liste">${html}</div>
    <p class="aide centre">${etat.carnet.length} séance${etat.carnet.length > 1 ? 's' : ''} au total · ${st.minutes} min cette semaine</p>
  `;
}

// ----- Onglet PLUS -----
function estIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function estInstallee() { return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches; }

function bandeauInstallation() {
  if (estInstallee() || etat.installVu) return '';
  return `<div class="msg info installer">📲 <b>Installe l'appli :</b> dans Safari, touche le bouton Partager <span class="partage">⬆︎</span> puis « Sur l'écran d'accueil ».
    <button class="fermer" data-action="fermer-install" aria-label="Fermer">✕</button></div>`;
}

function vuePlus() {
  const m = etat.materiel;
  const lignesMat = Object.entries(MATERIEL).map(([k, info]) => {
    const v = m[k];
    const detail = Array.isArray(v) ? (v.length ? v.map(x => x + ' kg').join(', ') : 'aucun') : (v ? 'oui' : 'non');
    return `<li><span>${info.emoji} ${info.nom}</span><b>${detail}</b></li>`;
  }).join('');
  return `
    <div class="carte">
      <h2>📲 Installer sur l'iPhone / iPad</h2>
      <ol class="etapes">
        <li>Ouvre cette page dans <b>Safari</b>.</li>
        <li>Touche le bouton <b>Partager</b> (carré avec une flèche ⬆︎).</li>
        <li>Choisis <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>.</li>
        <li>Lance ensuite toujours l'appli depuis son icône : c'est là que tes données sont gardées.</li>
      </ol>
      <p class="aide">${estInstallee() ? '✅ L\'appli est installée.' : 'Statut : pas encore installée.'}</p>
    </div>
    <div class="carte">
      <h2>🏋️ Mon matériel</h2>
      <ul class="materiel">${lignesMat}</ul>
      <p class="aide">Bientôt : tu pourras modifier ton matériel ici (nouveaux haltères…) et le générateur s'adaptera tout seul.</p>
    </div>
    <div class="carte">
      <h2>💾 Sauvegarde</h2>
      <p class="aide">Tes données restent sur ton appareil. Fais une sauvegarde de temps en temps (par exemple dans Fichiers ou par e-mail).</p>
      <div class="actions">
        <button class="bouton" data-action="exporter">⬇︎ Exporter</button>
        <button class="bouton" data-action="importer">⬆︎ Importer</button>
      </div>
      <input type="file" id="fichier-import" accept="application/json,.json" hidden>
      <button class="lien danger" data-action="reinitialiser">Tout effacer</button>
    </div>
    <p class="aide centre">Uppercut · version 1 · ${etat.carnet.length} séances enregistrées</p>
  `;
}

// ---------------------------------------------------------------------
// FENÊTRES (formulaires qui montent du bas de l'écran)
// ---------------------------------------------------------------------
function ouvrirFeuille(html) {
  const fond = $('#feuille');
  fond.innerHTML = `<div class="feuille-contenu">${html}</div>`;
  fond.hidden = false;
  requestAnimationFrame(() => fond.classList.add('ouverte'));
}
function fermerFeuille() {
  const fond = $('#feuille');
  fond.classList.remove('ouverte');
  setTimeout(() => { fond.hidden = true; fond.innerHTML = ''; }, 200);
}

function choixEtoiles(valeur) {
  return `<div class="etoiles-choix" data-valeur="${valeur}">${[1, 2, 3, 4, 5].map(n =>
    `<button type="button" class="etoile ${n <= valeur ? 'on' : ''}" data-action="etoile" data-val="${n}">★</button>`).join('')}</div>`;
}

function formulaireSeance({ titreFenetre, type, date, duree, ressenti, notes, typeModifiable }) {
  const options = Object.entries(TYPES_SEANCE).map(([k, t]) =>
    `<option value="${k}" ${k === type ? 'selected' : ''}>${t.emoji} ${t.nom}</option>`).join('');
  return `<h2>${titreFenetre}</h2>
    <form id="form-seance">
      ${typeModifiable ? `<label class="etiquette">Type</label><select name="type">${options}</select>` : `<input type="hidden" name="type" value="${type}">`}
      <label class="etiquette">Date</label>
      <input type="date" name="date" value="${date}" max="${isoLocal(new Date())}" required>
      <label class="etiquette">Durée (minutes)</label>
      <input type="number" name="duree" value="${duree}" min="1" max="300" inputmode="numeric" required>
      <label class="etiquette">Ressenti</label>
      ${choixEtoiles(ressenti)}
      <p class="aide" id="ressenti-texte">${TEXTES_RESSENTI[ressenti]}</p>
      <label class="etiquette">Notes</label>
      <textarea name="notes" rows="3" placeholder="Ex. : sparring, super cardio, mal au poignet…">${echapper(notes || '')}</textarea>
      <div class="actions">
        <button type="button" class="bouton" data-action="fermer">Annuler</button>
        <button type="submit" class="bouton principal">Enregistrer</button>
      </div>
    </form>`;
}
const TEXTES_RESSENTI = ['', '1/5 — Très dur, épuisé', '2/5 — Difficile', '3/5 — Correct', '4/5 — Bonne séance', '5/5 — Au top !'];

let enregistrementEnCours = null; // ce qu'on enregistre quand le formulaire est validé

function ouvrirAjout(type) {
  enregistrementEnCours = { mode: 'ajout' };
  ouvrirFeuille(formulaireSeance({
    titreFenetre: type === 'boxe' ? '🥊 Séance de boxe' : 'Ajouter une séance',
    type, date: isoLocal(new Date()), duree: type === 'boxe' ? 120 : 45, ressenti: 4, notes: '',
    typeModifiable: type !== 'boxe',
  }));
}

function ouvrirTerminer() {
  const s = etat.seance;
  enregistrementEnCours = { mode: 'seance' };
  const aujourdHui = isoLocal(new Date());
  ouvrirFeuille(formulaireSeance({
    titreFenetre: '✓ Bravo ! Comment c\'était ?',
    type: 'muscu', date: s.date > aujourdHui ? aujourdHui : s.date, duree: s.estimation, ressenti: 4, notes: '',
    typeModifiable: false,
  }));
}

function resumeSeance(s) {
  const lettres = 'ABCDEFGHIJ';
  return s.blocs.map((b, i) => {
    let lignes;
    if (b.items) lignes = b.items.map(it => `${exo(it.id)?.nom || it.id} — ${it.dose}${it.charge ? ' · ' + it.charge : ''}`);
    else if (b.type === 'rounds') lignes = [`${b.series} rounds de 3 min`];
    else lignes = [b.texte];
    const tete = b.type === 'circuit' || b.type === 'superset' ? `${b.series} tours` : `${b.series} ${b.type === 'series' ? 'séries' : 'fois'}`;
    return { titre: `${lettres[i]}. ${b.titre} (${tete})`, lignes };
  });
}

function enregistrerFormulaire(form) {
  const donnees = Object.fromEntries(new FormData(form));
  const ressenti = Number($('.etoiles-choix', form).dataset.valeur);
  const entree = {
    id: idUnique(), cree: Date.now(),
    type: donnees.type, date: donnees.date, duree: Number(donnees.duree),
    ressenti, notes: donnees.notes.trim(),
  };
  if (enregistrementEnCours?.mode === 'seance' && etat.seance) {
    const s = etat.seance;
    entree.objectif = s.objectif;
    entree.titre = `${OBJECTIFS[s.objectif].nom} — ${s.duree} min`;
    entree.detail = resumeSeance(s);
    etat.seance = null;
  } else {
    entree.titre = TYPES_SEANCE[entree.type].nom;
  }
  etat.carnet.push(entree);
  sauver();
  fermerFeuille();
  toast('Séance enregistrée dans le carnet 💪');
  ongletActif = 'carnet';
  afficher();
  window.scrollTo(0, 0);
}

function voirEntree(id) {
  const s = etat.carnet.find(x => x.id === id);
  if (!s) return;
  const t = TYPES_SEANCE[s.type] || TYPES_SEANCE.autre;
  const detail = (s.detail || []).map(b =>
    `<div class="detail-bloc"><b>${echapper(b.titre)}</b><ul>${b.lignes.map(l => `<li>${echapper(l)}</li>`).join('')}</ul></div>`).join('');
  ouvrirFeuille(`<h2>${t.emoji} ${echapper(s.titre || t.nom)}</h2>
    <p class="aide">${dateLisible(s.date)} · ${s.duree} min</p>
    ${s.ressenti ? `<p class="etoiles grand">${'★'.repeat(s.ressenti)}${'☆'.repeat(5 - s.ressenti)}</p>` : ''}
    ${s.notes ? `<p class="notes">${echapper(s.notes)}</p>` : ''}
    ${detail}
    <div class="actions">
      <button class="bouton danger" data-action="supprimer" data-id="${s.id}">Supprimer</button>
      <button class="bouton principal" data-action="fermer">Fermer</button>
    </div>`);
}

// ---------------------------------------------------------------------
// SAUVEGARDE : export / import
// ---------------------------------------------------------------------
async function exporter() {
  const texte = JSON.stringify(etat, null, 2);
  const nom = `uppercut-sauvegarde-${isoLocal(new Date())}.json`;
  try {
    const fichier = new File([texte], nom, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
      await navigator.share({ files: [fichier], title: 'Sauvegarde Uppercut' });
      return;
    }
  } catch (e) { if (e.name === 'AbortError') return; }
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
  lien.download = nom;
  document.body.appendChild(lien); lien.click(); lien.remove();
}

function importer(fichier) {
  const lecteur = new FileReader();
  lecteur.onload = () => {
    try {
      const donnees = JSON.parse(lecteur.result);
      if (!Array.isArray(donnees.carnet)) throw new Error('format');
      if (!confirm(`Remplacer tes données par cette sauvegarde (${donnees.carnet.length} séances) ?`)) return;
      etat = Object.assign(etatParDefaut(), donnees);
      sauver(); afficher(); toast('Sauvegarde importée ✅');
    } catch (e) { alert('Ce fichier n\'est pas une sauvegarde Uppercut valide.'); }
  };
  lecteur.readAsText(fichier);
}

// ---------------------------------------------------------------------
// PETIT MESSAGE TEMPORAIRE
// ---------------------------------------------------------------------
let minuteurToast;
function toast(txt) {
  const t = $('#toast');
  t.textContent = txt;
  t.classList.add('visible');
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => t.classList.remove('visible'), 2500);
}

// ---------------------------------------------------------------------
// GESTION DES CLICS (un seul écouteur pour toute l'appli)
// ---------------------------------------------------------------------
document.addEventListener('click', ev => {
  const cible = ev.target.closest('[data-action], .onglet');
  if (!cible) {
    if (ev.target.id === 'feuille') fermerFeuille();
    return;
  }
  if (cible.classList.contains('onglet')) {
    ongletActif = cible.dataset.onglet; afficher(); window.scrollTo(0, 0); return;
  }
  const action = cible.dataset.action;
  const val = cible.dataset.val;
  const f = etat.form;

  switch (action) {
    case 'jour': {
      f.date = val;
      const c = conseilPour(val);
      f.objectif = c.objectif; f.duree = c.duree;
      break;
    }
    case 'objectif': f.objectif = val; break;
    case 'duree': f.duree = Number(val); break;
    case 'materiel':
      f.coches = f.coches.includes(val) ? f.coches.filter(k => k !== val) : [...f.coches, val];
      break;
    case 'appliquer-conseil': {
      const c = conseilPour(f.date);
      f.objectif = c.objectif; f.duree = c.duree;
      break;
    }
    case 'generer':
      etat.seance = genererSeance(f);
      sauver(); afficher();
      setTimeout(() => $('#seance')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return;
    case 'changer': changerExo(Number(cible.dataset.bloc), Number(cible.dataset.item)); return;
    case 'terminer': ouvrirTerminer(); return;
    case 'ajouter': ouvrirAjout(cible.dataset.type); return;
    case 'voir': voirEntree(cible.dataset.id); return;
    case 'fermer': fermerFeuille(); return;
    case 'etoile': {
      const boite = cible.closest('.etoiles-choix');
      boite.dataset.valeur = val;
      $$('.etoile', boite).forEach(b => b.classList.toggle('on', Number(b.dataset.val) <= Number(val)));
      const txt = $('#ressenti-texte'); if (txt) txt.textContent = TEXTES_RESSENTI[val];
      return;
    }
    case 'supprimer':
      if (confirm('Supprimer cette séance du carnet ?')) {
        etat.carnet = etat.carnet.filter(s => s.id !== cible.dataset.id);
        sauver(); fermerFeuille(); afficher();
      }
      return;
    case 'fermer-install': etat.installVu = true; break;
    case 'exporter': exporter(); return;
    case 'importer': $('#fichier-import').click(); return;
    case 'reinitialiser':
      if (confirm('Effacer TOUTES tes données ? (pense à exporter avant)')) {
        etat = etatParDefaut(); sauver(); afficher(); toast('Données effacées');
      }
      return;
  }
  sauver();
  afficher();
});

document.addEventListener('submit', ev => {
  if (ev.target.id === 'form-seance') { ev.preventDefault(); enregistrerFormulaire(ev.target); }
});
document.addEventListener('change', ev => {
  if (ev.target.id === 'fichier-import' && ev.target.files[0]) importer(ev.target.files[0]);
});

// ---------------------------------------------------------------------
// DÉMARRAGE
// ---------------------------------------------------------------------
afficher();

// Le "service worker" permet à l'appli de marcher même sans internet.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
