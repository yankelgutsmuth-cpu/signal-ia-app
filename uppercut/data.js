// =====================================================================
// data.js — La "base de données" de l'appli : le matériel et les exercices.
// Pour ajouter un exercice, il suffit de copier une ligne et de la modifier.
// =====================================================================

// Le matériel qu'on peut cocher dans le générateur.
// (Le tapis de sol est toujours considéré comme disponible.)
const MATERIEL = {
  hal: { nom: 'Haltères', emoji: '🏋️' },
  kb:  { nom: 'Kettlebells', emoji: '🔔' },
  mb:  { nom: 'Médecine-ball', emoji: '🏐' },
  el:  { nom: 'Élastiques', emoji: '➰' },
  tc:  { nom: 'Tapis de course', emoji: '🏃' },
  pb:  { nom: 'Punching-ball', emoji: '🥊' },
  esc: { nom: 'Escaliers', emoji: '🪜' },
};

// Ton matériel de départ (les poids sont en kg).
const MATERIEL_PAR_DEFAUT = {
  hal: [3, 6],
  kb: [6, 8, 12],
  mb: [4],
  el: true,
  tc: true,
  pb: true,
  esc: true,
};

// Les objectifs proposés dans le générateur.
const OBJECTIFS = {
  force:   { nom: 'Force', emoji: '💪', desc: 'Gros muscles moteurs, tempo lent, unilatéral' },
  explo:   { nom: 'Explosivité', emoji: '⚡', desc: 'Sauts, lancers, swings : vitesse maximale' },
  cardio:  { nom: 'Cardio boxe', emoji: '🔥', desc: 'Circuits HIIT et rounds au punching-ball' },
  gainage: { nom: 'Gainage', emoji: '🧱', desc: 'Tronc solide, rotation, anti-rotation' },
  complet: { nom: 'Athlète complet', emoji: '🏆', desc: 'Puissance + force + circuit boxe' },
};

// ---------------------------------------------------------------------
// LES EXERCICES
//  cats   : objectifs pour lesquels l'exercice est adapté
//  eq     : matériel OBLIGATOIRE ([] = poids du corps)
//  pat    : type de mouvement (jambes, hanche, pousser, tirer, rotation,
//           core, porte, boxe, complet, cardio)
//  uni    : true si on travaille un côté à la fois (unilatéral)
//  epuisant : true si très dur pour les jambes (évité la veille de boxe)
//  charge : quel poids choisir dans ton matériel (max / mid / min)
//  dose   : répétitions conseillées en séries classiques
//  tempo  : "3-1-1" = 3 s de descente, 1 s de pause, 1 s de montée rapide
// ---------------------------------------------------------------------
const EXOS = [
  // ===== FORCE — JAMBES =====
  { id: 'bulgare', nom: 'Fentes bulgares haltères', cats: ['force'], eq: ['hal'], pat: 'jambes', uni: true,
    charge: { t: 'hal', pref: 'max', paire: true }, dose: '8 / jambe', tempo: '3-1-1',
    note: 'Pied arrière sur une chaise ou une marche. Descends en 3 s, buste légèrement penché, remonte fort.' },
  { id: 'goblet', nom: 'Goblet squat tempo + pause', cats: ['force'], eq: ['kb'], pat: 'jambes',
    charge: { t: 'kb', pref: 'max' }, dose: '10', tempo: '4-2-1',
    note: 'Kettlebell contre la poitrine. 4 s de descente, 2 s de pause en bas, remonte vite.' },
  { id: 'fente_arr_kb', nom: 'Fentes arrière kettlebell en rack', cats: ['force'], eq: ['kb'], pat: 'jambes', uni: true,
    charge: { t: 'kb', pref: 'max' }, dose: '8 / jambe', tempo: '3-0-1',
    note: 'Kettlebell tenue à l\'épaule du côté de la jambe arrière. Genou arrière effleure le sol.' },
  { id: 'step_up', nom: 'Montées sur marche haltères', cats: ['force'], eq: ['hal', 'esc'], pat: 'jambes', uni: true,
    charge: { t: 'hal', pref: 'max', paire: true }, dose: '10 / jambe',
    note: 'Pousse uniquement avec la jambe du haut, sans rebondir sur celle du bas.' },
  { id: 'squat_1j', nom: 'Squat une jambe assisté (sur marche)', cats: ['force'], eq: [], pat: 'jambes', uni: true,
    dose: '6 / jambe', tempo: '3-1-1',
    note: 'Assis-debout sur une jambe depuis une marche ou une chaise basse. Tiens-toi à la rampe si besoin.' },
  { id: 'cossack', nom: 'Squat cosaque kettlebell', cats: ['force'], eq: ['kb'], pat: 'jambes', uni: true,
    charge: { t: 'kb', pref: 'min' }, dose: '6 / côté',
    note: 'Grand écart latéral, descends sur une jambe, l\'autre reste tendue. Excellent pour les appuis de boxe.' },

  // ===== FORCE — HANCHE / CHAÎNE ARRIÈRE =====
  { id: 'sdl_1j', nom: 'Soulevé de terre une jambe (kettlebell)', cats: ['force'], eq: ['kb'], pat: 'hanche', uni: true,
    charge: { t: 'kb', pref: 'max' }, dose: '8 / jambe', tempo: '3-0-1',
    note: 'Dos plat, la jambe libre part en arrière. Kettlebell dans la main opposée à la jambe d\'appui.' },
  { id: 'hip_thrust_1j', nom: 'Hip thrust une jambe', cats: ['force'], eq: ['kb'], pat: 'hanche', uni: true,
    charge: { t: 'kb', pref: 'mid' }, dose: '10 / jambe',
    note: 'Dos sur le canapé, kettlebell sur la hanche. Serre les fessiers 2 s en haut.' },
  { id: 'leg_curl_sol', nom: 'Leg curl glissé au sol', cats: ['force'], eq: [], pat: 'hanche',
    dose: '8-10', tempo: '3-0-1',
    note: 'Sur le dos, talons sur une serviette (sur sol lisse). Monte le bassin et ramène les talons.' },
  { id: 'swing_lourd', nom: 'Swing kettlebell lourd', cats: ['force', 'explo'], eq: ['kb'], pat: 'hanche',
    charge: { t: 'kb', pref: 'max' }, dose: '12',
    note: 'Le mouvement vient des hanches, pas des bras. Claque les fessiers en haut, bras relâchés.' },

  // ===== FORCE — POUSSER =====
  { id: 'pompes_tempo', nom: 'Pompes tempo lent', cats: ['force'], eq: [], pat: 'pousser',
    dose: '10-12', tempo: '3-1-1',
    note: 'Corps gainé comme une planche. 3 s de descente, poitrine à 2 cm du sol, remonte vite.' },
  { id: 'pompes_archer', nom: 'Pompes archer', cats: ['force'], eq: [], pat: 'pousser', uni: true,
    dose: '6 / côté',
    note: 'Mains très écartées, tu descends vers une main pendant que l\'autre bras reste tendu.' },
  { id: 'pompes_decl', nom: 'Pompes pieds surélevés', cats: ['force'], eq: [], pat: 'pousser',
    dose: '10-15', tempo: '2-1-1',
    note: 'Pieds sur une marche ou une chaise. Travaille le haut des pectoraux et les épaules.' },
  { id: 'dev_kb_1b', nom: 'Développé militaire kettlebell un bras', cats: ['force'], eq: ['kb'], pat: 'pousser', uni: true,
    charge: { t: 'kb', pref: 'max' }, dose: '8 / bras',
    note: 'Debout, fessiers et abdos serrés. Pousse au-dessus de la tête sans cambrer.' },
  { id: 'floor_press', nom: 'Développé au sol haltère un bras', cats: ['force'], eq: ['hal'], pat: 'pousser', uni: true,
    charge: { t: 'hal', pref: 'max' }, dose: '12 / bras', tempo: '3-1-1',
    note: 'Allongé, coude qui touche le sol en bas (pause 1 s), puis pousse vite. Le tronc résiste à la rotation.' },
  { id: 'pompes_pike', nom: 'Pompes piquées (épaules)', cats: ['force'], eq: [], pat: 'pousser',
    dose: '8-10', tempo: '2-1-1',
    note: 'Fesses en l\'air (position en V), descends le front entre les mains.' },

  // ===== FORCE — TIRER =====
  { id: 'row_kb', nom: 'Rowing kettlebell un bras', cats: ['force'], eq: ['kb'], pat: 'tirer', uni: true,
    charge: { t: 'kb', pref: 'max' }, dose: '10 / bras', tempo: '2-1-2',
    note: 'Une main sur une chaise, dos plat. Tire le coude vers la hanche, pause 1 s en haut.' },
  { id: 'row_el', nom: 'Rowing élastique', cats: ['force'], eq: ['el'], pat: 'tirer',
    dose: '15', tempo: '1-2-2',
    note: 'Élastique accroché à une poignée de porte. Serre les omoplates 2 s à chaque répétition.' },
  { id: 'face_pull', nom: 'Face pull élastique', cats: ['force'], eq: ['el'], pat: 'tirer',
    dose: '15',
    note: 'Tire l\'élastique vers ton visage, coudes hauts. Protège tes épaules de boxeur.' },
  { id: 'tirage_el_1b', nom: 'Tirage vertical élastique un bras', cats: ['force'], eq: ['el'], pat: 'tirer', uni: true,
    dose: '12 / bras',
    note: 'Élastique coincé en haut de la porte. Tire le coude vers la poche arrière.' },
  { id: 'pullover', nom: 'Pull-over haltère au sol', cats: ['force'], eq: ['hal'], pat: 'tirer',
    charge: { t: 'hal', pref: 'max' }, dose: '12', tempo: '3-0-1',
    note: 'Allongé, l\'haltère part derrière la tête bras presque tendus, côtes basses.' },
  { id: 'row_hal_inv', nom: 'Rowing haltères buste penché, pause', cats: ['force'], eq: ['hal'], pat: 'tirer',
    charge: { t: 'hal', pref: 'max', paire: true }, dose: '12', tempo: '2-2-2',
    note: 'Buste penché à 45°, dos plat. Tiens 2 s en haut : avec des haltères légers, c\'est la pause qui fait le travail.' },

  // ===== FORCE — COMPLET =====
  { id: 'tgu', nom: 'Turkish get-up', cats: ['force', 'gainage'], eq: ['kb'], pat: 'complet', uni: true,
    charge: { t: 'kb', pref: 'mid' }, dose: '2 / côté',
    note: 'Se relever du sol avec la kettlebell bras tendu au-dessus de soi. Lentement, les yeux sur la kettlebell.' },
  { id: 'clean_press', nom: 'Épaulé-développé kettlebell', cats: ['force', 'explo'], eq: ['kb'], pat: 'complet', uni: true,
    charge: { t: 'kb', pref: 'mid' }, dose: '6 / bras',
    note: 'Ramène la kettlebell à l\'épaule d\'un coup de hanches, puis pousse-la au-dessus de la tête.' },

  // ===== EXPLOSIVITÉ — BAS DU CORPS =====
  { id: 'squat_saute', nom: 'Squat sauté', cats: ['explo', 'cardio'], eq: [], pat: 'jambes', epuisant: true,
    dose: '6',
    note: 'Saute le plus haut possible, atterris en silence, genoux souples. Récupère bien entre les séries.' },
  { id: 'saut_long', nom: 'Saut en longueur sans élan', cats: ['explo'], eq: [], pat: 'jambes',
    dose: '5',
    note: 'Grand balancier des bras, saute loin, tiens la réception 2 s. Reviens en marchant.' },
  { id: 'saut_marche', nom: 'Sauts sur marche (escalier)', cats: ['explo'], eq: ['esc'], pat: 'jambes',
    dose: '6',
    note: 'Saute sur la 2e ou 3e marche, redescends en marchant. Qualité avant tout.' },
  { id: 'skater', nom: 'Sauts patineur latéraux', cats: ['explo', 'cardio'], eq: [], pat: 'jambes', uni: true,
    dose: '6 / côté',
    note: 'Bond latéral sur une jambe, stabilise 1 s. Développe la poussée latérale des déplacements.' },
  { id: 'fentes_sautees', nom: 'Fentes sautées alternées', cats: ['explo', 'cardio'], eq: [], pat: 'jambes', epuisant: true,
    dose: '6 / jambe',
    note: 'Change de jambe en l\'air, atterris doucement. Garde le buste droit.' },
  { id: 'pogo', nom: 'Pogo jumps (sauts de cheville)', cats: ['explo', 'cardio'], eq: [], pat: 'jambes',
    dose: '20',
    note: 'Petits sauts rapides sur l\'avant du pied, jambes presque tendues. Pour des appuis vifs.' },

  // ===== EXPLOSIVITÉ — HANCHE =====
  { id: 'swing_1b', nom: 'Swing kettlebell une main', cats: ['explo', 'cardio'], eq: ['kb'], pat: 'hanche', uni: true,
    charge: { t: 'kb', pref: 'mid' }, dose: '10 / bras',
    note: 'Comme le swing classique mais à une main : le tronc doit résister à la rotation.' },
  { id: 'snatch', nom: 'Arraché kettlebell', cats: ['explo'], eq: ['kb'], pat: 'hanche', uni: true,
    charge: { t: 'kb', pref: 'min' }, dose: '6 / bras',
    note: 'La kettlebell monte d\'un seul mouvement au-dessus de la tête. Poignet droit, elle ne doit pas taper l\'avant-bras.' },

  // ===== EXPLOSIVITÉ — HAUT DU CORPS =====
  { id: 'mb_poitrine', nom: 'Lancer poitrine médecine-ball contre un mur', cats: ['explo'], eq: ['mb'], pat: 'pousser',
    charge: { t: 'mb', pref: 'max' }, dose: '8',
    note: 'En fente, lance le ballon le plus fort possible contre le mur, rattrape-le et recommence.' },
  { id: 'pompes_explo', nom: 'Pompes explosives', cats: ['explo'], eq: [], pat: 'pousser',
    dose: '6-8',
    note: 'Pousse si fort que les mains décollent du sol. Réception bras souples.' },
  { id: 'push_press', nom: 'Push press haltères', cats: ['explo'], eq: ['hal'], pat: 'pousser',
    charge: { t: 'hal', pref: 'max', paire: true }, dose: '8',
    note: 'Petite flexion des jambes puis pousse explosive au-dessus de la tête. La vitesse compense la charge légère.' },
  { id: 'mb_slam', nom: 'Slam médecine-ball', cats: ['explo', 'cardio'], eq: ['mb'], pat: 'complet',
    charge: { t: 'mb', pref: 'max' }, dose: '8',
    note: 'Ballon au-dessus de la tête, écrase-le au sol sur le tapis de toutes tes forces.' },

  // ===== EXPLOSIVITÉ — ROTATION & BOXE =====
  { id: 'mb_rotatif', nom: 'Lancer rotatif médecine-ball contre un mur', cats: ['explo'], eq: ['mb'], pat: 'rotation', uni: true,
    charge: { t: 'mb', pref: 'max' }, dose: '6 / côté',
    note: 'De profil au mur, pivote le pied arrière comme pour un crochet et lance. LA base de la puissance des coups.' },
  { id: 'mb_scoop', nom: 'Lancer "uppercut" médecine-ball', cats: ['explo'], eq: ['mb'], pat: 'rotation', uni: true,
    charge: { t: 'mb', pref: 'max' }, dose: '6 / côté',
    note: 'Ballon bas sur la hanche, pivote et projette-le en diagonale vers le haut contre le mur.' },
  { id: 'directs_el', nom: 'Directs explosifs avec élastique', cats: ['explo'], eq: ['el'], pat: 'boxe', uni: true,
    dose: '10 / bras',
    note: 'Élastique accroché derrière toi. Frappe vite et reviens vite en garde. Vitesse maximale.' },
  { id: 'crochets_el', nom: 'Crochets avec élastique', cats: ['explo'], eq: ['el'], pat: 'boxe', uni: true,
    dose: '10 / bras',
    note: 'Élastique sur le côté. Pivote le pied et la hanche, le bras suit.' },
  { id: 'rotation_kb', nom: 'Rotation explosive kettlebell (half-moon)', cats: ['explo'], eq: ['kb'], pat: 'rotation',
    charge: { t: 'kb', pref: 'min' }, dose: '8 / côté',
    note: 'Kettlebell à deux mains, déplace-la d\'une hanche à l\'autre en pivotant les pieds.' },

  // ===== CARDIO (pour les circuits) =====
  { id: 'burpees', nom: 'Burpees', cats: ['cardio'], eq: [], pat: 'cardio', epuisant: true,
    dose: '10', note: 'Poitrine au sol, saute en haut. Garde un rythme régulier.' },
  { id: 'sprawl', nom: 'Sprawls', cats: ['cardio'], eq: [], pat: 'cardio',
    dose: '10', note: 'Défense contre une amenée au sol : hanches au sol, reviens vite en garde.' },
  { id: 'mountain', nom: 'Mountain climbers', cats: ['cardio', 'gainage'], eq: [], pat: 'cardio',
    dose: '30', note: 'Genoux vers la poitrine le plus vite possible, bassin bas.' },
  { id: 'corde', nom: 'Corde à sauter imaginaire (pas de boxeur)', cats: ['cardio'], eq: [], pat: 'cardio',
    dose: '60 s', note: 'Petits sauts sur l\'avant du pied en alternant les appuis comme un boxeur.' },
  { id: 'shadow', nom: 'Shadow boxing rapide', cats: ['cardio'], eq: [], pat: 'boxe',
    dose: '60 s', note: 'Enchaînements rapides, garde haute, déplacements constants.' },
  { id: 'shadow_hal', nom: 'Directs rapides tenus avec haltères 3 kg', cats: ['cardio'], eq: ['hal'], pat: 'boxe',
    charge: { t: 'hal', pref: 'min', paire: true }, dose: '30 s',
    note: 'Petits directs rapides, sans verrouiller les coudes. Brûle les épaules.' },
  { id: 'genoux', nom: 'Montées de genoux', cats: ['cardio'], eq: [], pat: 'cardio',
    dose: '30 s', note: 'Genoux à hauteur des hanches, bras actifs.' },
  { id: 'thruster_kb', nom: 'Thrusters kettlebell', cats: ['cardio'], eq: ['kb'], pat: 'complet',
    charge: { t: 'kb', pref: 'mid' }, dose: '12', note: 'Squat goblet puis pousse la kettlebell au-dessus de la tête en remontant.' },
  { id: 'swing_cardio', nom: 'Swings kettlebell rapides', cats: ['cardio'], eq: ['kb'], pat: 'hanche',
    charge: { t: 'kb', pref: 'mid' }, dose: '20', note: 'Rythme soutenu, respiration à chaque swing.' },
  { id: 'esquives', nom: 'Esquives rotatives + squat', cats: ['cardio'], eq: [], pat: 'boxe',
    dose: '30 s', note: 'Esquive à gauche, à droite, puis passe sous un crochet imaginaire (rotation en squat).' },
  { id: 'bear', nom: 'Bear crawl', cats: ['cardio', 'gainage'], eq: [], pat: 'cardio',
    dose: '30 s', note: 'À quatre pattes, genoux à 2 cm du sol, avance et recule.' },
  { id: 'pb_rafale', nom: 'Punching-ball : rafales', cats: ['cardio'], eq: ['pb'], pat: 'boxe',
    dose: '30 s', note: 'Enchaînements rapides et continus sur le punching-ball.' },
  { id: 'escaliers_cardio', nom: 'Montées d\'escaliers rapides', cats: ['cardio'], eq: ['esc'], pat: 'cardio', epuisant: true,
    dose: '30 s', note: 'Monte vite (une marche à la fois, appuis rapides), redescends prudemment.' },

  // ===== GAINAGE =====
  { id: 'planche', nom: 'Planche sur les avant-bras', cats: ['gainage'], eq: [], pat: 'core',
    dose: '45 s', note: 'Serre fessiers et abdos, ne laisse pas le bassin tomber.' },
  { id: 'planche_lat', nom: 'Planche latérale', cats: ['gainage'], eq: [], pat: 'core', uni: true,
    dose: '30 s / côté', note: 'Corps bien aligné, hanche haute.' },
  { id: 'hollow', nom: 'Hollow hold (position banane)', cats: ['gainage'], eq: [], pat: 'core',
    dose: '30 s', note: 'Bas du dos collé au sol, bras et jambes tendus au ras du sol.' },
  { id: 'deadbug', nom: 'Dead bug', cats: ['gainage'], eq: [], pat: 'core',
    dose: '10 / côté', note: 'Sur le dos, bras et jambe opposés descendent lentement, bas du dos plaqué.' },
  { id: 'planche_tap', nom: 'Planche bras tendus + touchers d\'épaules', cats: ['gainage'], eq: [], pat: 'core',
    dose: '20', note: 'Le bassin ne doit pas bouger pendant que tu touches tes épaules.' },
  { id: 'pallof', nom: 'Pallof press élastique', cats: ['gainage'], eq: ['el'], pat: 'rotation', uni: true,
    dose: '10 / côté', note: 'Élastique sur le côté, pousse les mains devant toi et résiste à la rotation.' },
  { id: 'woodchop', nom: 'Bûcheron élastique (woodchop)', cats: ['gainage'], eq: ['el'], pat: 'rotation', uni: true,
    dose: '10 / côté', note: 'Tire l\'élastique en diagonale, de haut en bas, en pivotant les hanches.' },
  { id: 'russian', nom: 'Russian twist médecine-ball', cats: ['gainage'], eq: ['mb'], pat: 'rotation',
    charge: { t: 'mb', pref: 'max' }, dose: '20', note: 'Pieds décollés si possible, touche le sol de chaque côté.' },
  { id: 'situp_directs', nom: 'Relevés de buste + 2 directs', cats: ['gainage'], eq: [], pat: 'rotation',
    dose: '12', note: 'Le classique des boxeurs : monte et envoie un jab-direct en haut.' },
  { id: 'mb_situp', nom: 'Relevé de buste + lancer médecine-ball', cats: ['gainage', 'explo'], eq: ['mb'], pat: 'rotation',
    charge: { t: 'mb', pref: 'max' }, dose: '10', note: 'Assis face au mur, lance le ballon en remontant, rattrape et redescends.' },
  { id: 'around', nom: 'Passages autour de la taille (kettlebell)', cats: ['gainage'], eq: ['kb'], pat: 'rotation',
    charge: { t: 'kb', pref: 'mid' }, dose: '10 / sens', note: 'Fais tourner la kettlebell autour de toi, bassin immobile.' },
  { id: 'leg_raise', nom: 'Relevés de jambes au sol', cats: ['gainage'], eq: [], pat: 'core',
    dose: '12', note: 'Jambes tendues, descends lentement sans décoller le bas du dos.' },
  { id: 'bird_dog', nom: 'Bird dog', cats: ['gainage'], eq: [], pat: 'core', uni: true,
    dose: '10 / côté', note: 'À quatre pattes, tends bras et jambe opposés, tiens 2 s.' },
  { id: 'copenhague', nom: 'Planche Copenhague (adducteurs)', cats: ['gainage'], eq: [], pat: 'core', uni: true,
    dose: '20 s / côté', note: 'Planche latérale avec la jambe du dessus posée sur une chaise. Version facile : genou sur la chaise.' },
  { id: 'windmill', nom: 'Moulin kettlebell (windmill)', cats: ['gainage'], eq: ['kb'], pat: 'rotation', uni: true,
    charge: { t: 'kb', pref: 'min' }, dose: '5 / côté', note: 'Kettlebell bras tendu au-dessus de la tête, penche-toi lentement pour toucher ton pied.' },
  { id: 'suitcase', nom: 'Marche du fermier une main', cats: ['gainage', 'force'], eq: ['kb'], pat: 'porte', uni: true,
    charge: { t: 'kb', pref: 'max' }, dose: '40 s / côté', note: 'Kettlebell d\'un seul côté, marche bien droit sans pencher.' },
  { id: 'rack_walk', nom: 'Marche kettlebell en rack', cats: ['gainage'], eq: ['kb'], pat: 'porte', uni: true,
    charge: { t: 'kb', pref: 'mid' }, dose: '40 s / côté', note: 'Kettlebell à l\'épaule, coude collé, marche lentement.' },
  { id: 'hal_overhead', nom: 'Marche haltère bras tendu au-dessus', cats: ['gainage'], eq: ['hal'], pat: 'porte', uni: true,
    charge: { t: 'hal', pref: 'max' }, dose: '30 s / côté', note: 'Bras verrouillé au-dessus de la tête, côtes basses. Stabilité des épaules.' },
];

// Thèmes des rounds de punching-ball.
const THEMES_ROUNDS = [
  'Jab-direct + déplacements',
  'Crochets + esquives',
  'Uppercuts + remises',
  'Enchaînements de 4-5 coups',
  'Puissance : 10 s à fond / 10 s technique',
  'Contre-attaques : esquive puis remise',
  'Travail au corps et à la tête',
  'Round libre, intensité maximale',
];
