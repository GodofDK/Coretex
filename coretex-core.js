// =====================================================================
// TERMINAL ID — persistent browser fingerprint stored in localStorage
// Generated once per browser; admin can rename it from the admin panel.
// =====================================================================
const TERMINAL_STORAGE_KEY = 'coretex_terminal_id';
const TERMINAL_NAME_KEY    = 'coretex_terminal_name';

const _TID_ADJ  = ['Kold','Mørk','Stille','Grå','Brudt','Stenet','Hvid','Dyb','Skarp','Tom','Skjult','Frosset','Svag','Fjern','Tung','Rød','Blå','Gammel','Ny','Lukket'];
const _TID_NOUN = ['Komet','Signal','Kobolt','Orbit','Kode','Relay','Celle','Nexus','Node','Kanal','Echo','Vektor','Krypt','Sektor','Matrix','Reflex','Puls','Ark','Uplink','Freki'];

function _generateTerminalId() {
  const arr = new Uint8Array(5);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
}

function _generateTerminalName() {
  const adj  = _TID_ADJ [Math.floor(Math.random()*_TID_ADJ.length)];
  const noun = _TID_NOUN[Math.floor(Math.random()*_TID_NOUN.length)];
  return adj + ' ' + noun + ' Terminal';
}

function getTerminalInfo() {
  let id   = localStorage.getItem(TERMINAL_STORAGE_KEY);
  let name = localStorage.getItem(TERMINAL_NAME_KEY);
  if(!id) {
    id   = _generateTerminalId();
    name = _generateTerminalName();
    localStorage.setItem(TERMINAL_STORAGE_KEY, id);
    localStorage.setItem(TERMINAL_NAME_KEY, name);
  }
  if(!name) {
    name = _generateTerminalName();
    localStorage.setItem(TERMINAL_NAME_KEY, name);
  }
  return { id, name };
}

function adminRenameTerminal(terminalId) {
  const current = (state.terminalNames && state.terminalNames[terminalId]) || '';
  const val = prompt('Omdøb terminal:\n(lad stå tomt for at nulstille til auto-genereret navn)', current);
  if(val === null) return;
  if(!state.terminalNames) state.terminalNames = {};
  if(val.trim()) {
    state.terminalNames[terminalId] = val.trim();
  } else {
    delete state.terminalNames[terminalId];
  }
  saveState();
  renderSurveillanceLog();
}

function getTerminalDisplayName(terminalId) {
  if(!terminalId) return '—';
  if(state && state.terminalNames && state.terminalNames[terminalId]) return state.terminalNames[terminalId];
  const log = (state && state.activityLog) || [];
  const entry = log.find(e => e.terminalId === terminalId);
  return entry && entry.terminalName ? entry.terminalName : terminalId;
}

const _terminal = getTerminalInfo();

// =====================================================================
// DEFAULT DATA
// =====================================================================
const DEFAULT_DATA = {
  tabs: [
    { id:"frontpage", name:"☽ Chronicle", icon:"☽", isFrontPage:true },
    { id:"lorehub", name:"📚 Archive", icon:"📚", isLoreHub:true },
    { id:"lore", name:"Lore & History", icon:"📜",
      content:"The realm's ancient lore is recorded here. Edit this content from the Admin panel.",
      images:[] },
    { id:"factions", name:"Factions", icon:"⚔",
      folders:[
        { id:"f_noble", name:"Noble Houses", icon:"🏰", entries:[
          {id:"e1", title:"House Valdris", body:"Ancient bloodline of the northern marches. Known for their grey cloaks and cold pragmatism.", images:[], protected:false},
          {id:"e2", title:"House Maren", body:"Merchant nobility who rose through trade and coin. Allies of the Crown, enemies of tradition.", images:[], protected:false}
        ]},
        { id:"f_guild", name:"Guilds & Orders", icon:"⚖", entries:[
          {id:"e3", title:"The Gilded Chain", body:"A merchant guild with fingers in every port. Their ledgers are said to contain more secrets than coin.", images:[], protected:false}
        ]},
        { id:"f_fringe", name:"Fringe Groups", icon:"🗡", entries:[] }
      ]
    },
    { id:"quests", name:"Quest Board", icon:"🗺",
      folders:[
        { id:"q_active", name:"Active Missions", icon:"🔥", entries:[
          {id:"q1", title:"The Missing Envoy", body:"Ambassador Thalen has not returned from the eastern provinces. Find him — or what remains.", images:[], protected:false}
        ]},
        { id:"q_completed", name:"Completed", icon:"✅", entries:[] },
        { id:"q_rumours", name:"Rumours", icon:"👁", entries:[
          {id:"q2", title:"Lights over the Moor", body:"Shepherds report strange fires moving across the Darkfen Moor at night. No natural explanation found.", images:[], protected:false}
        ]}
      ]
    },
    { id:"secrets", name:"Hidden Knowledge", icon:"🔮",
      content:"Ancient secrets not meant for all ears. Edit this content from the Admin panel.",
      images:[] },
    { id:"council", name:"High Council", icon:"🏛",
      folders:[
        { id:"c_decrees", name:"Decrees", icon:"📋", entries:[] },
        { id:"c_minutes", name:"Meeting Minutes", icon:"🖋", entries:[] }
      ]
    },
    { id:"shadow", name:"Shadow Network", icon:"🌑",
      folders:[
        { id:"s_obs", name:"Observations", icon:"👁", entries:[
          {id:"s1", title:"The Merchant Aldric", body:"Seen meeting with northern representatives thrice this moon. He pays in unmarked silver.", images:[], protected:false},
          {id:"s2", title:"Gate Watch Rotation", body:"Guards rotate at the second bell. A window of six minutes exists at the eastern postern gate.", images:[], protected:false}
        ]},
        { id:"s_bounty", name:"Bounties", icon:"💀", entries:[
          {id:"s3", title:"Wanted: Sera of the Red Hand", body:"50 gold crowns for information on her whereabouts. Alive preferred. Proof of death accepted.", images:[], protected:false}
        ]},
        { id:"s_contacts", name:"Contacts", icon:"🕵", entries:[] },
        { id:"s_drop", name:"Dead Drops", icon:"📍", entries:[] }
      ]
    },
    { id:"hub_cortex",   name:"📡 Cortex",        icon:"📡", isHub:true, hubType:"cortex",   activeTab:"newspaper",
      newspaper: { id:"newspaper", name:"📰 Avisen", icon:"📰", isNewspaper:true, articles:[
        { id:"art_1", title:"Uroligheder ved Byportene", author:"Red.", date:"// DATO: 3. MÅNED", body:"Bystyret rapporterer om tiltagende uro ved de nordlige porte. Borgere opfordres til at udvise forsigtighed ved nattetide.", criminalNotes:"", images:[] },
        { id:"art_2", title:"Markeder Lukker Tidligt", author:"Red.", date:"// DATO: 2. MÅNED", body:"Grundet mystiske hændelser har Rådet besluttet at lukkemarkederne en time før solnedgang. Handelsmændene protesterer, men efterkommer ordren.", criminalNotes:"", images:[] }
      ]},
      sysnews: { id:"sysnews", name:"📡 System Nyheder", icon:"📡", isSysNews:true, entries:[
        { id:"sys_1", title:"Systemet er Operationelt", body:"Alle noder er online. Krypteret forbindelse aktiv. Ingen brud registreret.", date:"// SYSTEM LOG: INITIALISERING", priority:"normal" },
        { id:"sys_2", title:"Spilleder-Meddelelse", body:"Velkommen til spillet. Husk: Al kommunikation via portalen er IC. Kontakt spilleder OOC via separat kanal.", date:"// GM BROADCAST", priority:"high" }
      ]}
    },
    { id:"hub_legal",    name:"⚖ Juridisk",        icon:"⚖", isHub:true, hubType:"legal",    activeTab:"ident",
      ident:           { id:"ident",           name:"🆔 Ident-Reg",          icon:"🆔", isIdent:true,   cards:[] },
      wanted_alliance: { id:"wanted_alliance", name:"⚠ Alliance Wanted",    icon:"⚠", isWanted:true,  wantedType:"alliance", listings:[] },
      wanted_criminal: { id:"wanted_criminal", name:"💀 Black Market",       icon:"💀", isWanted:true,  wantedType:"criminal", listings:[] }
    },
    { id:"hub_ship",     name:"🚢 Ship Registry",   icon:"🚢", isHub:true, hubType:"ship",     activeTab:"manifest" },
    { id:"hub_crew",     name:"🎰 Crew",             icon:"🎰", isHub:true, hubType:"crew",     activeTab:"market" },
    { id:"admin", name:"⚙ Admin", icon:"⚙", isAdmin:true },
    { id:"hacker", name:"[ HACK ]", icon:"💀", isHacker:true },
    { id:"chat", name:"💬 Comms", icon:"💬", isChat:true },
    { id:"profile", name:"Profile", icon:"👤", isProfile:true }
  ],
  users:[
    { username:"admin", password:"admin1", role:"Game Master", tags:["Game Master"], isAdmin:true, tabs:["frontpage","lorehub","lore","factions","quests","secrets","council","shadow","hub_cortex","hub_legal","hub_ship","hub_crew","admin","hacker","chat","profile"], locked:false, credits:500 },
    { username:"knight", password:"sword", role:"Knight", tags:["Knight"], tabs:["frontpage","lorehub","lore","factions","quests","hub_cortex","hub_legal","hub_ship","hub_crew","chat","profile"], locked:false, credits:500, rumorLevel:1 },
    { username:"mage", password:"arcane", role:"Court Mage", tags:["Court Mage"], tabs:["frontpage","lorehub","lore","secrets","council","hub_cortex","hub_legal","hub_ship","hub_crew","chat","profile"], locked:false, credits:500, rumorLevel:1 },
    { username:"spy", password:"shadow", role:"Shadow Agent", tags:["Shadow Agent"], tabs:["frontpage","lorehub","lore","factions","shadow","hub_cortex","hub_legal","hub_ship","hub_crew","chat","profile"], locked:false, credits:500, rumorLevel:2 },
    { username:"h4ck3r", password:"d3f4c3", role:"Hacker", tags:["Hacker"], isHacker:true, alterEgo:"Ghost", tabs:["frontpage","lorehub","lore","factions","quests","hub_cortex","hub_legal","hub_ship","hub_crew","hacker","chat","profile"], locked:false, credits:500, rumorLevel:1 },
    { username:"betjent", password:"lov123", role:"ordensmagt", tags:["ordensmagt"], tabs:["frontpage","lorehub","lore","factions","quests","hub_cortex","hub_legal","hub_ship","hub_crew","chat","profile"], locked:false, credits:500, rumorLevel:1 },
    { username:"journalist", password:"presse1", role:"Journalist", tags:["Journalist"], tabs:["frontpage","lorehub","lore","hub_cortex","hub_legal","hub_ship","hub_crew","chat","profile"], locked:false, credits:500, rumorLevel:1 }
  ],
  roles:["Game Master","Knight","Court Mage","Shadow Agent","Hacker","Adventurer","ordensmagt","Journalist"],
  frontpage: {
    heroTitle: "THE CHRONICLE",
    heroSub: "// SECURE NODE — CLASSIFIED INTEL DATABASE",
    sections: [
      { id:"fp1", title:"WELCOME, OPERATIVE", content:"This is the Chronicle — the secure intelligence database for active field agents.\n\nAll information here is classified. Distribute intel through authorised channels only. Compromised data should be reported to the Game Master immediately." },
      { id:"fp2", title:"ACTIVE OPERATION", content:"The current operation is UNDERWAY.\n\nCheck the Quest Board for active missions and the Factions archive for known allegiances. Stay sharp — the Shadow Network has eyes everywhere." },
      { id:"fp3", title:"SYSTEM STATUS", content:"All nodes online. Encryption active. Firebase sync live.\n\nReport any anomalies to Admin." }
    ]
  },
  defacements:{}, // tabId -> { text, by, timestamp }
  broadcasts:[], // [ { id, title, body, priority, by, ts, expires } ]
  credits:{}, // username -> balance
  commsSabotage: null, // null | { by, timestamp, adminLocked (bool) }
  polls: [],        // [ { id, question, options:[{id,label,votes:[username]}], createdBy, ts, open } ]
  manifest: [],     // [ { id, name, role, status, note, ts } ]
  cargo: [],        // [ { id, name, qty, unit, addedBy, ts } ]
  cortexSearch: {}, // keyword -> { result, addedBy, ts }
  missions: [],     // [ { id, title, desc, reward, status, assignedTo:[], deadline, createdBy, ts } ]
  diceLog: [],      // [ { id, username, notation, rolls, total, ts } ]
  dmMessages: {},   // "user1__user2" -> [ { id, from, body, ts } ]
  siteOverlay: null, // null | { type: 'offline'|'maintenance', by, timestamp }
  chats:{
    "open_comms":     { id:"open_comms",     name:"Open Comms",         icon:"📡", messages:[], access:"all" },
    "shadow_network": { id:"shadow_network", name:"Shadow Network",     icon:"🌑", messages:[], access:"shadow", shadowMode:true },
    "hacker_underground": { id:"hacker_underground", name:"Hacker Underground", icon:"💀", messages:[], access:"hacker" }
  }
};

// =====================================================================
// STATE
// =====================================================================
// =====================================================================
// SYNC STATUS
// =====================================================================
function setSyncStatus(status, label) {
  const el = document.getElementById('sync-status');
  const lbl = document.getElementById('sync-label');
  if(!el) return;
  el.className = status;
  if(lbl) lbl.textContent = label || { live:'LIVE', saving:'SAVING', error:'OFFLINE', local:'LOCAL' }[status] || status.toUpperCase();
}

// =====================================================================
// STATE  (Firebase real-time, falls back to localStorage)
// =====================================================================
let state = null;
let currentUser = null;
// Helper: find a sub-tab by id (could be standalone or inside a hub)
function findSubTab(id) {
  for(const t of state.tabs) {
    if(t.id===id) return t;
    if(t.isHub && t[id]) return t[id];
  }
  return null;
}

// Helper: save state and refresh the hub that contains a sub-tab
function saveAndRefreshHub(subTabId) {
  saveState();
  const hub = state.tabs.find(t=>t.isHub && (t[subTabId]||t.hubType&&_getHubSubIds(t).includes(subTabId)));
  if(hub) { const p=document.getElementById('hub-panel-'+hub.id); if(p) refreshHubPanel(hub); }
}

function _getHubSubIds(hub) {
  const cfg=HUB_CONFIGS[hub.hubType]; return cfg?cfg.tabs.map(t=>t.id):[];
}

let activeTab = null;
let hackerCooldowns = {}; // synced via state._hackerCooldowns (Firebase)
let hackerTarget = null;
let hackerEditTarget = null;
let selectedHackLevel = null; // chosen by hacker per action; null = use their max level
let _remoteUpdatePending = false; // kept for compatibility but no longer used for echo suppression

// Called once on boot
async function initState() {
  const fb = window.__firebase;
  if(fb && fb.CONFIGURED && fb.db) {
    setSyncStatus('saving', 'CONNECTING');
    try {
      const { db, doc, getDoc, setDoc, onSnapshot } = fb;

      // Load all 4 docs in parallel
      const [coreSnap, chatSnap, actSnap, volSnap] = await Promise.all([
        getDoc(doc(db,'game','state')),
        getDoc(doc(db,'game','chat')).catch(()=>null),
        getDoc(doc(db,'game','activity')).catch(()=>null),
        getDoc(doc(db,'game','volatile')).catch(()=>null),
      ]);

      if(coreSnap.exists() && coreSnap.data().data) {
        const core    = JSON.parse(coreSnap.data().data);
        const chat    = chatSnap    && chatSnap.exists()    ? JSON.parse(chatSnap.data().data)    : {};
        const act     = actSnap     && actSnap.exists()     ? JSON.parse(actSnap.data().data)     : {};
        const vol     = volSnap     && volSnap.exists()     ? JSON.parse(volSnap.data().data)     : {};
        state = migrateState(_mergeDocuments(core, chat, act, vol));
      } else {
        state = migrateState(JSON.parse(JSON.stringify(DEFAULT_DATA)));
        // First boot — write all docs
        const { coreDoc, chatDoc, activityDoc, volatileDoc } = _splitState();
        await Promise.all([
          setDoc(doc(db,'game','state'),    { data: JSON.stringify(coreDoc) }),
          setDoc(doc(db,'game','chat'),     { data: JSON.stringify(chatDoc) }),
          setDoc(doc(db,'game','activity'), { data: JSON.stringify(activityDoc) }),
          setDoc(doc(db,'game','volatile'), { data: JSON.stringify(volatileDoc) }),
        ]);
      }
      if(state._hackerCooldowns) hackerCooldowns = state._hackerCooldowns;
      setSyncStatus('live', 'LIVE');
    } catch(e) {
      console.warn('Firebase init failed, using localStorage:', e);
      setSyncStatus('error', 'OFFLINE');
      state = loadStateFromLocal();
    }

    // Subscribe to real-time updates on each doc separately
    _subscribeToDoc('state',    (data) => { _mergeIncoming('core',    data); });
    _subscribeToDoc('chat',     (data) => { _mergeIncoming('chat',    data); });
    _subscribeToDoc('activity', (data) => { _mergeIncoming('activity',data); });
    _subscribeToDoc('volatile', (data) => { _mergeIncoming('volatile',data); });

  } else {
    state = loadStateFromLocal();
    setSyncStatus('local', 'LOCAL');
  }
  bootApp();
}

// Track our own writes so we can ignore the echo from Firebase
const _myWriteVersions = {}; // docId -> version string we last wrote

function _subscribeToDoc(docId, handler) {
  const fb = window.__firebase; if(!fb||!fb.db) return;
  let isFirstSnapshot = true; // first snapshot is just the initial load, not a remote change
  const unsub = fb.onSnapshot(fb.doc(fb.db,'game',docId), (snap) => {
    if(!snap.exists()) return;
    if(isFirstSnapshot) { isFirstSnapshot = false; return; } // skip — already loaded in initState
    try {
      const raw = snap.data();
      // If this snapshot matches a version we wrote, it's our own echo — skip UI refresh
      if(raw._v && _myWriteVersions[docId] === raw._v) return;
      const data = JSON.parse(raw.data);
      handler(data);
    } catch(e) { console.warn('Snapshot parse error:', docId, e); }
  }, (err) => {
    if(docId==='state') setSyncStatus('error','OFFLINE');
  });
  if(!fb.unsubscribers) fb.unsubscribers = [];
  fb.unsubscribers.push(unsub);
}

// Merge an incoming document update into state
let _mergeDebounce = null;
function _mergeIncoming(docType, data) {
  if(docType === 'core') {
    // Merge core fields (tabs, users, defacements, etc.) preserving live chat/activity
    Object.assign(state, data);
    // Restore heavy fields from current state (not in core doc)
    // (they were stripped in _splitState, so incoming core won't have them)
  } else if(docType === 'chat') {
    if(data.chats)      state.chats      = data.chats;
    if(data.dmMessages) state.dmMessages = data.dmMessages;
  } else if(docType === 'activity') {
    if(data.diceLog)        state.diceLog        = data.diceLog;
    if(data.activityLog)    state.activityLog    = data.activityLog;
    if(data.creditLog)      state.creditLog      = data.creditLog;
    if(data.terminalLogins) state.terminalLogins = data.terminalLogins;
  } else if(docType === 'volatile') {
    if(data.broadcasts)   state.broadcasts   = data.broadcasts;
    if(data.polls)        state.polls        = data.polls;
    if(data.missions)     state.missions     = data.missions;
    if(data.manifest)     state.manifest     = data.manifest;
    if(data.cargo)        state.cargo        = data.cargo;
    if(data.cortexSearch) state.cortexSearch = data.cortexSearch;
    if(data.credits)      state.credits      = data.credits;
    if(data._pendingBroadcast !== undefined) state._pendingBroadcast = data._pendingBroadcast;
    // Restore listings into hub sub-tabs
    state.tabs.forEach(t=>{
      if(!t.isHub) return;
      if(t.wanted_alliance && data.wanted_alliance) t.wanted_alliance.listings = data.wanted_alliance;
      if(t.wanted_criminal && data.wanted_criminal) t.wanted_criminal.listings = data.wanted_criminal;
      if(t.market          && data.market_listings) t.market.listings          = data.market_listings;
      if(t.rumors          && data.rumors_list)     t.rumors.rumors            = data.rumors_list;
    });
  }
  if(state._hackerCooldowns) hackerCooldowns = state._hackerCooldowns;

  if(!currentUser) return;
  const freshMe = state.users ? state.users.find(u=>u.username===currentUser.username) : null;
  if(freshMe) currentUser = freshMe;

  // Debounce the UI refresh so multiple incoming docs don't cause multiple redraws
  clearTimeout(_mergeDebounce);
  _mergeDebounce = setTimeout(()=>{
    _throttledRemoteRefresh();
    applySiteOverlay();
    setSyncStatus('live','LIVE');
  }, 150);
}

// Merge all 4 docs back into a single state object
function _mergeDocuments(core, chat, act, vol) {
  return {
    ...core,
    chats:          chat.chats         || core.chats         || {},
    dmMessages:     chat.dmMessages    || core.dmMessages    || {},
    diceLog:        act.diceLog        || core.diceLog       || [],
    activityLog:    act.activityLog    || core.activityLog   || [],
    creditLog:      act.creditLog      || core.creditLog     || [],
    terminalLogins: act.terminalLogins || core.terminalLogins|| {},
    broadcasts:     vol.broadcasts     || core.broadcasts    || [],
    polls:          vol.polls          || core.polls         || [],
    missions:       vol.missions       || core.missions      || [],
    manifest:       vol.manifest       || core.manifest      || [],
    cargo:          vol.cargo          || core.cargo         || [],
    cortexSearch:   vol.cortexSearch   || core.cortexSearch  || {},
    credits:        vol.credits        || core.credits       || {},
    _pendingBroadcast: vol._pendingBroadcast ?? core._pendingBroadcast ?? null,
  };
}

// ---- CREDIT HELPERS (per-hacker, level-based pool) ----
// hackerLevel: 1, 2, or 3 (set by admin on user object)
// hackerCredits: current available credits (pool)
// Each hack costs hackerLevel credits; each hack stores its hackLevel
// Unhacking costs credits summing to hackLevel of the target hack

function getHackerLevel(user) {
  if(!user) return 1;
  return user.hackerLevel || 1;
}

// Returns the hack cost the hacker has chosen (or their max level if none chosen)
function getSelectedHackCost() {
  if(!currentUser) return 1;
  const max = getHackerLevel(currentUser);
  if(selectedHackLevel && selectedHackLevel >= 1 && selectedHackLevel <= max) return selectedHackLevel;
  return max;
}

function hackerCredits(user) {
  if(!user) return 0;
  if(user.isAdmin) return Infinity;
  const u = state.users.find(u=>u.username===user.username) || user;
  return typeof u.hackerCredits === 'number' ? u.hackerCredits : getHackerLevel(u);
}

function hackerHasCredit(costOverride) {
  if(!currentUser) return false;
  if(currentUser.isAdmin) return true;
  if(!currentUser.isHacker) return false;
  const cost = costOverride !== undefined ? costOverride : getHackerLevel(currentUser);
  return hackerCredits(currentUser) >= cost;
}

function hackerCreditMinutesLeft() { return 0; } // no timer

function spendHackerCredit(costOverride) {
  if(!currentUser || currentUser.isAdmin) return;
  const cost = costOverride !== undefined ? costOverride : getHackerLevel(currentUser);
  const su = state.users.find(u=>u.username===currentUser.username);
  const cur = hackerCredits(currentUser);
  const newVal = Math.max(0, cur - cost);
  if(su) su.hackerCredits = newVal;
  currentUser.hackerCredits = newVal;
  saveState();
}

// Admin gives credits to a hacker
function adminGiveCredits(username, amount) {
  const u = state.users.find(u=>u.username===username);
  if(!u || !u.isHacker) return;
  u.hackerCredits = (typeof u.hackerCredits === 'number' ? u.hackerCredits : (2 + getHackerLevel(u))) + amount;
  if(currentUser && currentUser.username === username) currentUser.hackerCredits = u.hackerCredits;
  saveState();
  renderUserTable();
  refreshHackerPanel();
}

// Admin removes credits from a hacker
function adminTakeCredits(username, amount) {
  const u = state.users.find(u=>u.username===username);
  if(!u || !u.isHacker) return;
  u.hackerCredits = Math.max(0, (typeof u.hackerCredits === 'number' ? u.hackerCredits : (2 + getHackerLevel(u))) - amount);
  if(currentUser && currentUser.username === username) currentUser.hackerCredits = u.hackerCredits;
  saveState();
  renderUserTable();
  refreshHackerPanel();
}

// Admin resets credits to level default
function adminResetCredits(username) {
  const u = state.users.find(u=>u.username===username);
  if(!u || !u.isHacker) return;
  u.hackerCredits = 2 + getHackerLevel(u);
  if(currentUser && currentUser.username === username) currentUser.hackerCredits = u.hackerCredits;
  saveState();
  renderUserTable();
  refreshHackerPanel();
}

// Admin sets hacker level
function adminSetHackerLevel(username, level) {
  const u = state.users.find(u=>u.username===username);
  if(!u || !u.isHacker) return;
  u.hackerLevel = parseInt(level);
  if(currentUser && currentUser.username === username) currentUser.hackerLevel = u.hackerLevel;
  saveState();
  renderUserTable();
  refreshHackerPanel();
}

// Cost to un-do a hack of a given level (any combination summing to hackLevel)
// We just require the counter-hacker to spend hackLevel credits
function hackLevelCost(hackLevel) {
  return hackLevel || 1;
}

const HACK_EXPIRY_MS = 999 * 24 * 3600 * 1000; // effectively permanent — no auto-expiry

function expireHacks(parsed) {
  // No auto-expiry — hacks persist until manually removed
}

// Pull from localStorage (offline fallback)
function loadStateFromLocal() {
  try {
    const s = localStorage.getItem('larp_chronicle_retro_v2');
    if(s) return migrateState(JSON.parse(s));
    return migrateState(JSON.parse(JSON.stringify(DEFAULT_DATA)));
  } catch(e) {
    return migrateState(JSON.parse(JSON.stringify(DEFAULT_DATA)));
  }
}

// All version-migration logic lives here — used for both localStorage and Firestore data
function migrateState(parsed) {
  if(!parsed) parsed = JSON.parse(JSON.stringify(DEFAULT_DATA));
      let adminUser = parsed.users.find(u=>u.isAdmin);
      if(!adminUser) parsed.users.unshift(JSON.parse(JSON.stringify(DEFAULT_DATA.users[0])));
      else {
        if(!adminUser.tabs.includes('hacker')) adminUser.tabs.push('hacker');
        if(!adminUser.tabs.includes('chat')) adminUser.tabs.push('chat');
        if(!adminUser.tabs.includes('admin')) adminUser.tabs.push('admin');
      }
      if(!parsed.defacements) parsed.defacements={};
      if(parsed.commsSabotage === undefined) parsed.commsSabotage = null;
      if(parsed.siteOverlay === undefined) parsed.siteOverlay = null;
      if(!parsed.terminalNames) parsed.terminalNames = {};
      if(!parsed.terminalLogins) parsed.terminalLogins = {};
      // Migrate roles list
      if(!parsed.roles || !Array.isArray(parsed.roles)) parsed.roles = [...DEFAULT_DATA.roles];
      // Migrate: add systemShutdown state
      if(parsed.systemShutdown === undefined) parsed.systemShutdown = null;
      // Migrate: convert role (string) to tags (array) for all users
      parsed.users.forEach(u => {
        if(!u.tags || !Array.isArray(u.tags)) {
          u.tags = u.role ? [u.role] : [];
        }
        // Keep role as first tag for backward compat
        if(u.tags.length > 0 && u.role !== u.tags[0]) u.role = u.tags[0];
        else if(u.tags.length === 0 && u.role) u.tags = [u.role];
      });
      // Ensure all chats have a roles array field (for role-gated channels)
      Object.values(parsed.chats||{}).forEach(ch=>{ if(!ch.roles) ch.roles=[]; });
      // Ensure chat tab exists in tabs list
      if(!parsed.tabs.find(t=>t.isChat)) {
        const profileIdx = parsed.tabs.findIndex(t=>t.isProfile);
        parsed.tabs.splice(profileIdx>=0?profileIdx:parsed.tabs.length, 0, { id:"chat", name:"💬 Comms", icon:"💬", isChat:true });
      }
      // Ensure all users have chat tab access
      parsed.users.forEach(u=>{ if(!u.tabs.includes('chat')) u.tabs.push('chat'); });
      // Migrate chats
      if(!parsed.chats) parsed.chats = JSON.parse(JSON.stringify(DEFAULT_DATA.chats));
      else {
        // Ensure all three channels exist
        Object.keys(DEFAULT_DATA.chats).forEach(k=>{
          if(!parsed.chats[k]) parsed.chats[k] = JSON.parse(JSON.stringify(DEFAULT_DATA.chats[k]));
        });
        // Ensure all chats have id and access fields
        Object.keys(parsed.chats).forEach(k=>{
          if(!parsed.chats[k].id) parsed.chats[k].id = k;
          if(!parsed.chats[k].access) parsed.chats[k].access = 'all';
          // Migrate shadow_network to shadowMode
          if(k==='shadow_network' && parsed.chats[k].shadowMode===undefined) parsed.chats[k].shadowMode=true;
        });
      }
      // Migrate: add newspaper/sysnews tabs if missing
      const hasNewspaper = parsed.tabs.find(t=>t.isNewspaper);
      const hasSysNews = parsed.tabs.find(t=>t.isSysNews);
      if(!hasNewspaper) {
        const adminIdx = parsed.tabs.findIndex(t=>t.isAdmin);
        const newspTab = {id:"newspaper",name:"📰 Avisen",icon:"📰",isNewspaper:true,articles:[]};
        parsed.tabs.splice(adminIdx,0,newspTab);
        parsed.users.forEach(u=>{ if(!u.tabs.includes('newspaper')) u.tabs.splice(u.tabs.indexOf('chat'),0,'newspaper'); });
      }
      if(!hasSysNews) {
        const adminIdx = parsed.tabs.findIndex(t=>t.isAdmin);
        const sysTab = {id:"sysnews",name:"📡 System Nyheder",icon:"📡",isSysNews:true,entries:[]};
        parsed.tabs.splice(adminIdx,0,sysTab);
        parsed.users.forEach(u=>{ if(!u.tabs.includes('sysnews')) u.tabs.splice(u.tabs.indexOf('chat'),0,'sysnews'); });
      }
      // Ensure criminalNotes field exists on articles
      parsed.tabs.forEach(t=>{
        if(t.isNewspaper && t.articles) t.articles.forEach(a=>{ if(a.criminalNotes===undefined) a.criminalNotes=''; });
      });
      // Ensure all users have required fields
      parsed.users.forEach(u=>{
        if(u.locked===undefined) u.locked=false;
        if(u.alterEgo===undefined) u.alterEgo='';
        if(u.isHacker && u.hackerCredits===undefined) u.hackerCredits = 2 + getHackerLevel(u);
        if(u.rumorLevel===undefined) u.rumorLevel = u.isAdmin ? 99 : 0;
      });
      // Migrate: ensure rumors tab exists
      if(!parsed.tabs.find(t=>t.isRumors)) {
        const adminIdx = parsed.tabs.findIndex(t=>t.isAdmin);
        parsed.tabs.splice(adminIdx>=0?adminIdx:parsed.tabs.length-4, 0, { id:"rumors", name:"🕵 Rumor Has It", icon:"🕵", isRumors:true, rumors:[] });
      }
      // Give ALL users access to the rumors tab (admin can remove it per-user via tab toggle if needed)
      parsed.users.forEach(u=>{
        if(!u.tabs.includes('rumors')) {
          const chatIdx = u.tabs.indexOf('chat');
          u.tabs.splice(chatIdx>=0?chatIdx:u.tabs.length, 0, 'rumors');
        }
      });
      // Ensure rumors array exists on rumors tab
      parsed.tabs.forEach(t=>{ if(t.isRumors && !t.rumors) t.rumors=[]; });
      // Migrate: ensure market tab exists
      if(!parsed.tabs.find(t=>t.isMarket)) {
        const adminIdx = parsed.tabs.findIndex(t=>t.isAdmin);
        parsed.tabs.splice(adminIdx>=0?adminIdx:parsed.tabs.length-4, 0, { id:"market", name:"🏪 Marked", icon:"🏪", isMarket:true, listings:[] });
      }
      // Give ALL users access to the market tab
      parsed.users.forEach(u=>{
        if(!u.tabs.includes('market')) {
          const chatIdx = u.tabs.indexOf('chat');
          u.tabs.splice(chatIdx>=0?chatIdx:u.tabs.length, 0, 'market');
        }
      });
      // Ensure listings array exists on market tab
      parsed.tabs.forEach(t=>{ if(t.isMarket && !t.listings) t.listings=[]; });
      // Migrate: ident, wanted, broadcasts, credits
      if(!parsed.tabs.find(t=>t.isIdent)) {
        const adminIdx = parsed.tabs.findIndex(t=>t.isAdmin);
        parsed.tabs.splice(adminIdx>=0?adminIdx:parsed.tabs.length-1, 0,
          { id:"ident", name:"🆔 Ident-Reg", icon:"🆔", isIdent:true, cards:[] },
          { id:"wanted_alliance", name:"⚠ Alliance Wanted", icon:"⚠", isWanted:true, wantedType:"alliance", listings:[] },
          { id:"wanted_criminal", name:"💀 Black Market Bounties", icon:"💀", isWanted:true, wantedType:"criminal", listings:[] }
        );
      }
      parsed.tabs.forEach(t=>{ if(t.isIdent && !t.cards) t.cards=[]; if(t.isWanted && !t.listings) t.listings=[]; });
      if(!parsed.broadcasts) parsed.broadcasts = [];
      if(!parsed.credits) parsed.credits = {};
      if(!parsed.polls) parsed.polls = [];
      if(!parsed.manifest) parsed.manifest = [];
      if(!parsed.cargo) parsed.cargo = [];
      if(!parsed.cortexSearch) parsed.cortexSearch = {};
      if(!parsed.missions) parsed.missions = [];
      if(!parsed.diceLog) parsed.diceLog = [];
      if(!parsed.dmMessages) parsed.dmMessages = {};
      // Migrate new tabs
      // Migrate old individual tabs → hub tabs
      const hubDefs = [
        { id:"hub_cortex", name:"📡 Cortex",       icon:"📡", isHub:true, hubType:"cortex", activeTab:"newspaper",
          newspaper:{id:"newspaper",name:"📰 Avisen",icon:"📰",isNewspaper:true,articles:[]},
          sysnews:{id:"sysnews",name:"📡 System Nyheder",icon:"📡",isSysNews:true,entries:[]}
        },
        { id:"hub_legal",  name:"⚖ Juridisk",      icon:"⚖", isHub:true, hubType:"legal",  activeTab:"ident",
          ident:{id:"ident",name:"🆔 Ident-Reg",icon:"🆔",isIdent:true,cards:[]},
          wanted_alliance:{id:"wanted_alliance",name:"⚠ Alliance Wanted",icon:"⚠",isWanted:true,wantedType:"alliance",listings:[]},
          wanted_criminal:{id:"wanted_criminal",name:"💀 Black Market",icon:"💀",isWanted:true,wantedType:"criminal",listings:[]}
        },
        { id:"hub_ship",   name:"🚢 Ship Registry", icon:"🚢", isHub:true, hubType:"ship",   activeTab:"manifest" },
        { id:"hub_crew",   name:"🎰 Crew",           icon:"🎰", isHub:true, hubType:"crew",   activeTab:"market"   },
      ];
      hubDefs.forEach(def => {
        if(!parsed.tabs.find(t=>t.id===def.id)) {
          const adminIdx = parsed.tabs.findIndex(t=>t.isAdmin);
          parsed.tabs.splice(adminIdx>=0?adminIdx:parsed.tabs.length-1, 0, def);
        }
        parsed.users.forEach(u=>{
          if(!u.tabs.includes(def.id)) {
            const ci = u.tabs.indexOf('chat');
            u.tabs.splice(ci>=0?ci:u.tabs.length, 0, def.id);
          }
        });
      });
      // Remove old standalone tabs that are now inside hubs
      const oldStandaloneIds = ['newspaper','sysnews','rumors','market','ident','wanted_alliance','wanted_criminal','manifest','cargo','cortexsearch','missions','dice','polls','dm'];
      oldStandaloneIds.forEach(oid => {
        const oldTab = parsed.tabs.find(t=>t.id===oid);
        if(oldTab) {
          if(oid==='newspaper'||oid==='sysnews') {
            const hub=parsed.tabs.find(t=>t.id==='hub_cortex');
            if(hub&&!hub[oid])hub[oid]=oldTab;
          }
          if(oid==='ident'||oid==='wanted_alliance'||oid==='wanted_criminal') {
            const hub=parsed.tabs.find(t=>t.id==='hub_legal');
            if(hub&&!hub[oid])hub[oid]=oldTab;
          }
          parsed.tabs=parsed.tabs.filter(t=>t.id!==oid);
        }
        parsed.users.forEach(u=>{ u.tabs=u.tabs.filter(id=>id!==oid); });
      });
      // Ensure hub sub-data exists
      const cHub=parsed.tabs.find(t=>t.id==='hub_cortex');
      if(cHub){if(!cHub.newspaper)cHub.newspaper={id:"newspaper",name:"📰 Avisen",icon:"📰",isNewspaper:true,articles:[]};if(!cHub.sysnews)cHub.sysnews={id:"sysnews",name:"📡 System Nyheder",icon:"📡",isSysNews:true,entries:[]};}
      const lHub=parsed.tabs.find(t=>t.id==='hub_legal');
      if(lHub){if(!lHub.ident)lHub.ident={id:"ident",name:"🆔 Ident-Reg",icon:"🆔",isIdent:true,cards:[]};if(!lHub.wanted_alliance)lHub.wanted_alliance={id:"wanted_alliance",name:"⚠ Alliance Wanted",icon:"⚠",isWanted:true,wantedType:"alliance",listings:[]};if(!lHub.wanted_criminal)lHub.wanted_criminal={id:"wanted_criminal",name:"💀 Black Market",icon:"💀",isWanted:true,wantedType:"criminal",listings:[]};}
      // Ensure all entries have required fields
      parsed.tabs.forEach(t=>{
        if(t.folders) t.folders.forEach(f=>{
          f.entries.forEach(e=>{
            if(e.protected===undefined) e.protected=false;
            if(e.adminBody===undefined) e.adminBody=e.body||'';
            if(e.hackerBody===undefined) e.hackerBody='';
            if(e.criminalNotes===undefined) e.criminalNotes='';
          });
        });
      });
      // Migrate: ensure Journalist role exists
      if(!parsed.roles) parsed.roles = [];
      if(!parsed.roles.includes('Journalist')) parsed.roles.push('Journalist');
      // Migrate: ensure journalist default user exists
      if(!parsed.users.find(u=>u.username==='journalist')) {
        parsed.users.push({ username:'journalist', password:'presse1', role:'Journalist', tabs:['lore','newspaper','sysnews','chat','profile'], locked:false, credits:500, alterEgo:'' });
      }
      // Migrate: ensure frontpage and lorehub tabs exist
      if(!parsed.tabs.find(t=>t.isFrontPage)) {
        parsed.tabs.unshift({ id:"frontpage", name:"☽ Chronicle", icon:"☽", isFrontPage:true });
      }
      if(!parsed.tabs.find(t=>t.isLoreHub)) {
        const loreIdx = parsed.tabs.findIndex(t=>t.id==="lore");
        parsed.tabs.splice(loreIdx>=0?loreIdx:1, 0, { id:"lorehub", name:"📚 Archive", icon:"📚", isLoreHub:true });
      }
      // Migrate: ensure frontpage data exists
      if(!parsed.frontpage) parsed.frontpage = JSON.parse(JSON.stringify(DEFAULT_DATA.frontpage));
      // Migrate: give all users access to frontpage + lorehub
      parsed.users.forEach(u=>{
        if(!u.tabs.includes("frontpage")) u.tabs.unshift("frontpage");
        if(!u.tabs.includes("lorehub")) {
          const li = u.tabs.indexOf("lore"); u.tabs.splice(li>=0?li:1, 0, "lorehub");
        }
      });
      expireHacks(parsed);
      return parsed;
}

let _saveStateTimer = null;
let _soloMode = false; // when true: skip all Firebase reads/writes, pure localStorage

function toggleSoloMode() {
  if(!currentUser || !currentUser.isAdmin) return; // only admin can toggle
  _soloMode = !_soloMode;
  if(_soloMode) {
    const el = document.getElementById('sync-status');
    if(el) el.className = 'solo';
    const lbl = document.getElementById('sync-label');
    if(lbl) lbl.textContent = '⚡ SOLO';
    // Pause all Firebase listeners
    const fb = window.__firebase;
    if(fb && fb.unsubscribers) { fb.unsubscribers.forEach(u=>u()); fb.unsubscribers=[]; }
    clearTimeout(_saveStateTimer);
    showToast('SOLO MODE — ingen Firebase sync. Kun du ser ændringer.');
  } else {
    showToast('SYNC MODE — Firebase genaktiveret. Genindlæser...');
    setSyncStatus('saving','CONNECTING');
    // Flush current state to Firebase then re-subscribe
    _soloMode = false;
    saveState();
    // Re-subscribe
    _subscribeToDoc('state',    (data) => { _mergeIncoming('core',     data); });
    _subscribeToDoc('chat',     (data) => { _mergeIncoming('chat',     data); });
    _subscribeToDoc('activity', (data) => { _mergeIncoming('activity', data); });
    _subscribeToDoc('volatile', (data) => { _mergeIncoming('volatile', data); });
  }
}

function showToast(msg) {
  let t = document.getElementById('_toast');
  if(!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid var(--cortex-accent);color:var(--text-bright);font-family:"Share Tech Mono",monospace;font-size:12px;letter-spacing:2px;padding:10px 22px;z-index:9999;pointer-events:none;text-transform:uppercase;transition:opacity 0.4s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}
// =====================================================================
// SPLIT-DOCUMENT SYNC
// game/state    — core: tabs, users, settings, defacements, frontpage
// game/chat     — all chat messages + DMs
// game/activity — dice log, activity log, credit log
// game/volatile — broadcasts, polls, market, missions, cargo, manifest, cortexSearch, wanted
// =====================================================================

function _splitState() {
  const s = state;
  // Extract chat messages
  const chatDoc = { chats:{}, dmMessages: s.dmMessages||{} };
  if(s.chats) Object.entries(s.chats).forEach(([k,ch])=>{
    chatDoc.chats[k] = { ...ch, messages:(ch.messages||[]).slice(-200) }; // keep last 200 msgs
  });

  // Extract heavy logs
  const activityDoc = {
    diceLog:    (s.diceLog||[]).slice(0,100),
    activityLog:(s.activityLog||[]).slice(0,200),
    creditLog:  (s.creditLog||[]).slice(0,200),
    terminalLogins: s.terminalLogins||{}
  };

  // Extract volatile but shared data
  const volatileDoc = {
    broadcasts:    s.broadcasts||[],
    polls:         s.polls||[],
    missions:      s.missions||[],
    manifest:      s.manifest||[],
    cargo:         s.cargo||[],
    cortexSearch:  s.cortexSearch||{},
    credits:       s.credits||{},
    _pendingBroadcast: s._pendingBroadcast||null,
  };
  // Also grab wanted/market/rumors from hubs
  state.tabs.forEach(t=>{
    if(!t.isHub) return;
    if(t.wanted_alliance) volatileDoc.wanted_alliance = t.wanted_alliance.listings||[];
    if(t.wanted_criminal) volatileDoc.wanted_criminal = t.wanted_criminal.listings||[];
    if(t.market)          volatileDoc.market_listings = t.market.listings||[];
    if(t.rumors)          volatileDoc.rumors_list     = t.rumors.rumors||[];
  });

  // Core = everything else (strip the heavy stuff)
  const coreDoc = { ...s };
  delete coreDoc.chats;
  delete coreDoc.dmMessages;
  delete coreDoc.diceLog;
  delete coreDoc.activityLog;
  delete coreDoc.creditLog;
  delete coreDoc.terminalLogins;
  delete coreDoc.broadcasts;
  delete coreDoc.polls;
  delete coreDoc.missions;
  delete coreDoc.manifest;
  delete coreDoc.cargo;
  delete coreDoc.cortexSearch;
  delete coreDoc.credits;
  delete coreDoc._pendingBroadcast;

  return { coreDoc, chatDoc, activityDoc, volatileDoc };
}

// Which doc does a given save belong to?
let _dirtyDocs = new Set();

function _markDirty(docName) { _dirtyDocs.add(docName); }

async function saveState(hint) {
  // hint = 'core'|'chat'|'activity'|'volatile'|null (null = core)
  _dirtyDocs.add(hint||'core');
  localStorage.setItem('larp_chronicle_retro_v2', JSON.stringify(state));
  const fb = window.__firebase;
  if(!fb || !fb.CONFIGURED || !fb.db || _soloMode) return; // solo mode = localStorage only
  clearTimeout(_saveStateTimer);
  _saveStateTimer = setTimeout(async () => {
    const { coreDoc, chatDoc, activityDoc, volatileDoc } = _splitState();
    const db = fb.db; const setDoc = fb.setDoc; const doc = fb.doc;
    setSyncStatus('saving','SAVING');
    try {
      const writes = [];
      const stamp = () => Date.now() + '_' + Math.random().toString(36).slice(2,6);
      if(_dirtyDocs.has('core'))     { const v=stamp(); _myWriteVersions['state']   =v; writes.push(setDoc(doc(db,'game','state'),    { data: JSON.stringify(coreDoc),    _v:v })); }
      if(_dirtyDocs.has('chat'))     { const v=stamp(); _myWriteVersions['chat']     =v; writes.push(setDoc(doc(db,'game','chat'),     { data: JSON.stringify(chatDoc),    _v:v })); }
      if(_dirtyDocs.has('activity')) { const v=stamp(); _myWriteVersions['activity'] =v; writes.push(setDoc(doc(db,'game','activity'), { data: JSON.stringify(activityDoc),_v:v })); }
      if(_dirtyDocs.has('volatile')) { const v=stamp(); _myWriteVersions['volatile'] =v; writes.push(setDoc(doc(db,'game','volatile'), { data: JSON.stringify(volatileDoc),_v:v })); }
      await Promise.all(writes);
      _dirtyDocs.clear();
      setSyncStatus('live','LIVE');
    } catch(e) {
      console.warn('Firebase write failed:', e);
      setSyncStatus('error','OFFLINE');
    }
  }, 600);
}

// Throttle remote refresh — don't process incoming changes more than once per 1.5s
let _lastRemoteRefresh = 0;
function _throttledRemoteRefresh() {
  const now = Date.now();
  if(now - _lastRemoteRefresh < 1500) return;
  _lastRemoteRefresh = now;
  smartRemoteRefresh();
  checkPendingBroadcast();
}

function saveCooldowns() {
  localStorage.setItem('hacker_cooldowns_v2', JSON.stringify(hackerCooldowns));
  // merge into state so it goes up with the NEXT saveState() call — do NOT call saveState() here
  // to avoid triggering a Firebase write loop
  if(state) state._hackerCooldowns = hackerCooldowns;
}

// =====================================================================
// CLOCK
// =====================================================================
function updateClock() {
  const now = new Date();
  document.getElementById('sys-clock').textContent =
    now.toLocaleTimeString('en-GB',{hour12:false}) + ' // ' +
    now.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});
  // Tick: expire hacks every clock pulse (every 60s is fine but we run on 1s for clock)
  if(currentUser) tickExpireHacks();
}
setInterval(updateClock, 1000);
updateClock();

// Run expiry check and persist if anything changed
function tickExpireHacks() {
  const now = Date.now();
  let dirty = false;
  // Defacements
  Object.keys(state.defacements||{}).forEach(tabId=>{
    const d = state.defacements[tabId];
    if(d && d.timestamp && (now - d.timestamp) >= HACK_EXPIRY_MS) {
      delete state.defacements[tabId];
      dirty = true;
      // Remove defaced class from tab button
      const btn = document.querySelector(`.tab-btn[data-id="${tabId}"]`);
      if(btn) btn.classList.remove('defaced');
    }
  });
  // Entry hacker edits
  state.tabs.forEach(t=>{
    if(t.folders) t.folders.forEach(f=>{
      f.entries.forEach(e=>{
        if(e.hackerEdited && e.hackerEditedAt && (now - e.hackerEditedAt) >= HACK_EXPIRY_MS) {
          e.body = e.adminBody || e.body;
          e.hackerBody = '';
          delete e.hackerEdited; delete e.hackerEditedBy; delete e.hackerEditedAt;
          delete e.hackerInjectedImg; delete e.originalBody; delete e.originalImages;
          dirty = true;
        }
      });
    });
  });
  // Lockouts persist until manually removed (no auto-expiry)
  // Comms sabotage — expire after 30 min unless adminLocked
  if(state.commsSabotage && !state.commsSabotage.adminLocked) {
    if((now - state.commsSabotage.timestamp) >= HACK_EXPIRY_MS) {
      state.commsSabotage = null;
      dirty = true;
    }
  }
  if(dirty) { saveCooldowns(); saveState(); } // saveCooldowns merges into state first
}

// =====================================================================
// AUTH
// =====================================================================
function doLogin() {
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');

  const user = state.users.find(x => x.username.toLowerCase()===u.toLowerCase() && x.password===p);
  if(!user){ err.textContent="// ACCESS DENIED — INVALID CREDENTIALS"; document.getElementById('login-password').value=''; return; }

  // Check if hacker-locked
  if(!user.isAdmin) {
    const lockKey = 'lock.'+user.username;
    const lockData = hackerCooldowns[lockKey];
    if(lockData) {
      err.textContent=`// ACCESS SUSPENDED — LOCKED OUT BY SYSTEM. CONTACT GAME MASTER.`;
      document.getElementById('login-password').value=''; return;
    }
  }
  // Check admin-locked
  if(user.locked && !user.isAdmin) {
    err.textContent="// ACCESS REVOKED — CONTACT GAME MASTER.";
    document.getElementById('login-password').value=''; return;
  }

  err.textContent=''; currentUser=user;

  // Record this terminal's login in state AND in Firestore signal
  if(!user.isAdmin) {
    if(!state.terminalLogins) state.terminalLogins = {};
    const now = new Date();
    const loginEntry = {
      username: user.username,
      ts: Date.now(),
      t: now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
      d: now.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'2-digit'}),
      terminalName: _terminal.name
    };
    if(!state.terminalLogins[_terminal.id]) state.terminalLogins[_terminal.id] = [];
    state.terminalLogins[_terminal.id].unshift(loginEntry);
    if(state.terminalLogins[_terminal.id].length > 20) state.terminalLogins[_terminal.id].length = 20;
    saveState();
    // Also push to Firestore signal doc so admin camera panel updates in real-time
    const fb = window.__firebase;
    if(fb && fb.CONFIGURED && fb.db) {
      const logins = state.terminalLogins[_terminal.id].slice(0, 10);
      fb.setDoc(fb.doc(fb.db, 'cam_signals', _terminal.id), {
        username: user.username,
        role: user.role || '',
        loginHistory: logins
      }, { merge: true }).catch(()=>{});
    }
  }

  // Auto-ensure camera tab exists for admins
  if(user.isAdmin) {
    if(!state.tabs.find(t=>t.isCamera)) {
      state.tabs.push({ id:'camera', name:'📷 OVERVÅGNING', icon:'📷', isCamera:true });
    }
    state.users.forEach(u=>{ if(u.isAdmin && !u.tabs.includes('camera')) u.tabs.push('camera'); });
    // Sync currentUser tabs too
    if(!user.tabs.includes('camera')) user.tabs.push('camera');
    saveState();
  }

  // Hide login, show loading screen, then reveal app directly
  // (camera now starts at page load, before login — no gate needed)
  document.getElementById('login-screen').style.display='none';
  showLoginLoadingScreen(()=>{ camRevealApp(); });
}

function camRevealApp() {
  document.getElementById('cam-gate').style.display='none';
  const user = currentUser;
  const app=document.getElementById('app'); app.style.display='flex';
  document.getElementById('header-username').textContent = user.username;
  const roleEl = document.getElementById('header-role');
  roleEl.textContent = (user.tags && user.tags.length > 0) ? user.tags.join(' · ') : user.role;
  roleEl.className = 'user-role';
  if(user.isAdmin) roleEl.classList.add('admin-role');
  else if(user.isHacker) roleEl.classList.add('hacker-role');
  else if(user.isModerator) roleEl.classList.add('mod-role');
  else if(user.isOffworlder) roleEl.classList.add('offworlder-role');
  else if(user.isCriminal) roleEl.classList.add('criminal-role');
  if(user.isHacker || user.isAdmin) {
    document.getElementById('hacker-status-item').style.display = user.isHacker ? 'flex' : 'none';
  }
  document.getElementById('profile-btn').style.display = 'inline-block';
  document.getElementById('online-count').textContent = Math.floor(Math.random()*8)+2;
  renderTabs();
  applySiteOverlay();
  // Update terminal signal with logged-in user's name (non-admins only)
  if(!user.isAdmin) camTerminalUpdateUser();
}

// =====================================================================
// CAMERA GATE — mandatory camera grant before entering app
// =====================================================================
let _camGateStream = null;

function camGateStart() {
  const statusEl = document.getElementById('cam-gate-status');
  const deniedEl = document.getElementById('cam-gate-denied');
  const overlayEl = document.getElementById('cam-gate-overlay');
  const btn = document.getElementById('cam-gate-btn');
  if(deniedEl) deniedEl.style.display = 'none';
  if(overlayEl) overlayEl.style.display = 'flex';

  // Immediately check if we can even use camera (requires HTTPS/localhost)
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if(!isSecure || !navigator.mediaDevices) {
    if(statusEl) { statusEl.textContent = '// FEJL: HTTPS KRÆVET FOR KAMERA'; statusEl.style.color = 'var(--red)'; }
    if(btn) btn.disabled = false;
    // Show a clear explanation
    const existing = document.getElementById('https-warning');
    if(!existing) {
      const warn = document.createElement('div');
      warn.id = 'https-warning';
      warn.style.cssText = 'margin-top:14px;padding:14px 16px;border:1px solid var(--amber);background:rgba(255,176,0,0.05);font-family:Share Tech Mono,monospace;font-size:11px;letter-spacing:2px;color:var(--amber);text-transform:uppercase;line-height:2;';
      warn.innerHTML = [
        '<div style="font-size:13px;margin-bottom:8px;">⚠ HTTPS KRÆVET</div>',
        '<div style="color:var(--text-dim)">Kamera virker kun når siden er åbnet via <span style="color:var(--text-bright)">HTTPS</span>.<br>',
        'Din nuværende adresse starter med <span style="color:var(--red)">http://</span><br><br>',
        'Løsning: Åbn siden via dit Firebase/hosting domæne<br>',
        '(fx <span style="color:var(--cortex-accent)">https://dit-projekt.web.app</span>)</div>'
      ].join('');
      if(deniedEl && deniedEl.parentNode) deniedEl.parentNode.insertBefore(warn, deniedEl);
    }
    return;
  }
  if(statusEl) statusEl.textContent = '// KLAR — TRYK PÅ KNAPPEN FOR AT STARTE';
}

async function camGateRequest() {
  const statusEl  = document.getElementById('cam-gate-status');
  const deniedEl  = document.getElementById('cam-gate-denied');
  const previewEl = document.getElementById('cam-gate-preview');
  const overlayEl = document.getElementById('cam-gate-overlay');
  const scanEl    = document.getElementById('cam-gate-scanline');
  const btn       = document.getElementById('cam-gate-btn');

  if(deniedEl) deniedEl.style.display = 'none';
  if(btn) btn.disabled = true;

  // Check if mediaDevices is available — requires HTTPS or localhost
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if(statusEl) { statusEl.textContent = '// FEJL: SIDEN SKAL ÅBNES OVER HTTPS'; statusEl.style.color = 'var(--red)'; }
    if(btn) btn.disabled = false;
    const httpsMsg = document.createElement('div');
    httpsMsg.style.cssText = 'margin-top:14px;padding:12px;border:1px solid var(--amber);background:rgba(255,176,0,0.06);font-family:Share Tech Mono,monospace;font-size:11px;letter-spacing:2px;color:var(--amber);text-transform:uppercase;line-height:1.9;';
    httpsMsg.innerHTML = '⚠ KAMERA KRÆVER HTTPS<br><span style="color:var(--text-dim)">Din side er åbnet over HTTP — kamera virker kun over HTTPS.<br>Åbn siden via dit rigtige domæne (https://...) i stedet for en lokal fil.</span>';
    const gate = document.getElementById('cam-gate-denied');
    if(gate && gate.parentNode && !document.getElementById('https-warning')) {
      httpsMsg.id = 'https-warning';
      gate.parentNode.insertBefore(httpsMsg, gate);
    }
    return;
  }

  if(statusEl) statusEl.textContent = '// ANMODER OM KAMERAADGANG...';

  try {
    // Stop any existing stream first
    if(_camGateStream) { _camGateStream.getTracks().forEach(t=>t.stop()); _camGateStream = null; }

    const stream = await navigator.mediaDevices.getUserMedia({ video: { width:640, height:360, frameRate:15 }, audio: true });
    _camGateStream = stream;

    // Show preview
    if(previewEl) { previewEl.srcObject = stream; previewEl.play().catch(()=>{}); }
    if(overlayEl) overlayEl.style.display = 'none';
    if(scanEl) scanEl.style.display = 'block';
    if(statusEl) { statusEl.textContent = '// ● KAMERA GODKENDT — VERIFICERER...'; statusEl.style.color = 'var(--green)'; }

    // Brief "scanning" delay for atmosphere, then enter app and start broadcasting
    await new Promise(r => setTimeout(r, 1800));

    // Hand off stream to the broadcasting system
    camUserStream = stream;
    _camGateStream = null; // transferred

    // Write online signal to Firestore
    const fb = window.__firebase;
    if(fb.CONFIGURED && fb.db) {
      try {
        await fb.setDoc(fb.doc(fb.db, 'cam_signals', currentUser.username), {
          username: currentUser.username,
          role: currentUser.role || '',
          online: true,
          ts: Date.now(),
          offer: null, answer: null, ice_user: [], ice_admin: []
        });
      } catch(e) { console.warn('[CAM] Firestore signal write failed:', e); }
    }

    // Start the WebRTC broadcast with the already-granted stream
    camStartBroadcastWithStream(stream);

    // Enter the app
    camRevealApp();

  } catch(err) {
    if(btn) btn.disabled = false;
    if(scanEl) scanEl.style.display = 'none';
    const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
    const noDevice = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError';
    if(statusEl) { statusEl.textContent = isDenied ? '// ADGANG NÆGTET' : noDevice ? '// INGEN KAMERA FUNDET' : '// FEJL: ' + err.message; statusEl.style.color = 'var(--red)'; }
    if(deniedEl) deniedEl.style.display = noDevice ? 'none' : 'block';
    if(noDevice) {
      // No camera on this device — let them in anyway (edge case)
      if(statusEl) statusEl.textContent = '// INGEN KAMERA — FORTSÆTTER UDEN';
      setTimeout(camRevealApp, 1500);
    }
    console.warn('[CAM] Gate failed:', err);
  }
}

// Start broadcasting using an already-acquired stream (avoids double permission prompt)
function camStartBroadcastWithStream(stream) {
  if(!currentUser || currentUser.isAdmin || currentUser.isModerator || currentUser.isOffworlder) return;
  const fb = window.__firebase;
  if(!fb.CONFIGURED || !fb.db) return;

  camUserStream = stream;

  try {
    const pc = new RTCPeerConnection(CAM_ICE_SERVERS);
    window._camPC = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const iceBuffer = [];
    const iceGatheringDone = new Promise(resolve => {
      pc.onicecandidate = e => { if(e.candidate) iceBuffer.push(JSON.stringify(e.candidate.toJSON())); else resolve(); };
      setTimeout(resolve, 3000);
    });

    pc.createOffer().then(async offer => {
      await pc.setLocalDescription(offer);
      await iceGatheringDone;
      await fb.setDoc(fb.doc(fb.db, 'cam_signals', currentUser.username), {
        username: currentUser.username,
        role: currentUser.role || '',
        online: true,
        ts: Date.now(),
        offer: JSON.stringify(offer),
        answer: null,
        ice_user: iceBuffer,
        ice_admin: []
      });

      // Listen for admin answer
      camSignalingUnsub = fb.onSnapshot(fb.doc(fb.db, 'cam_signals', currentUser.username), async snap => {
        const data = snap.data();
        if(!data) return;
        if(data.answer && window._camPC && !window._camPC.currentRemoteDescription) {
          try { await window._camPC.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.answer))); } catch(e){}
        }
        if(data.ice_admin && data.ice_admin.length > 0 && window._camPC) {
          const processed = window._camPC._processedAdminIce || 0;
          for(let i = processed; i < data.ice_admin.length; i++) {
            try { await window._camPC.addIceCandidate(new RTCIceCandidate(JSON.parse(data.ice_admin[i]))); } catch(e){}
          }
          window._camPC._processedAdminIce = data.ice_admin.length;
        }
      });
    }).catch(e => console.warn('[CAM] Offer failed:', e));

  } catch(err) {
    console.warn('[CAM] camStartBroadcastWithStream failed:', err);
  }
}

function doLogout() {
  // Clear user from terminal signal (camera keeps running, user shown as null)
  camTerminalClearUser();
  currentUser=null; activeTab=null;
  clearInterval(window._offlineMsgTimer);
  document.getElementById('site-overlay').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('app').style.display='none';
  document.getElementById('login-username').value='';
  document.getElementById('login-password').value='';
  document.getElementById('login-error').textContent='';
  document.getElementById('profile-btn').style.display='none';
}
document.getElementById('login-password').addEventListener('keydown',e=>{ if(e.key==='Enter') doLogin(); });
document.getElementById('login-username').addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('login-password').focus(); });


// =====================================================================
// LOADING SCREEN
// =====================================================================
function showLoginLoadingScreen(onDone) {
  const screen = document.getElementById("loading-screen");
  const bar    = document.getElementById("loading-bar-fill");
  const status = document.getElementById("loading-status");
  if(!screen) { if(onDone) onDone(); return; }
  // Reset bar
  if(bar) { bar.classList.remove("go"); void bar.offsetWidth; }
  screen.classList.remove("fade-out");
  screen.style.display = "flex";
  const msgs = ["AUTHENTICATING CREDENTIALS...","LOADING ENCRYPTED ARCHIVE...","SYNCING LIVE STATE...","DECRYPTING INTEL DATABASE...","ESTABLISHING UPLINK...","ALMOST THERE..."];
  let msgIdx = 0;
  if(status) status.textContent = msgs[0];
  setTimeout(()=>{ if(bar) bar.classList.add("go"); }, 80);
  const msgTimer = setInterval(()=>{
    msgIdx = (msgIdx+1) % msgs.length;
    if(status) status.textContent = msgs[msgIdx];
  }, 520);
  function dismissLoader() {
    clearInterval(msgTimer);
    if(status) status.textContent = "ACCESS GRANTED";
    setTimeout(()=>{
      screen.classList.add("fade-out");
      setTimeout(()=>{ screen.style.display="none"; if(onDone) onDone(); }, 800);
    }, 400);
  }
  // Dismiss after bar animation finishes (~3.2s) + small buffer
  setTimeout(dismissLoader, 5200);
}


// App boot — called after Firebase module is ready (or immediately if already fired)
function bootApp() {
  const fb = window.__firebase;
  if(!fb || !fb.CONFIGURED) {
    const notice = document.getElementById('firebase-setup-notice');
    if(notice) notice.style.display = 'block';
  }
}

// Wait for the Firebase module script to fire 'firebase-ready', then init
if(window.__firebase) {
  initState();
} else {
  window.addEventListener('firebase-ready', () => {
    initState();
    // Start terminal camera broadcast immediately — before login
    // (skipped if this is an admin browser — checked inside camTerminalStartBroadcast)
    setTimeout(camTerminalStartBroadcast, 1000);
  }, { once: true });
  // Fallback: if firebase-ready never fires, boot with localStorage after short delay
  setTimeout(() => { if(!state) { state = loadStateFromLocal(); setSyncStatus('local','LOCAL'); bootApp(); } }, 3000);
}

// =====================================================================
// TABS
// =====================================================================
// Smart remote refresh — called when Firestore pushes an update from another user.
// Preserves any unsaved text in inputs/textareas by NOT rebuilding the active panel
// if it contains focused or dirty fields. Only fully rebuilds hidden (inactive) panels.
function smartRemoteRefresh() {
  const allowed = state.tabs.filter(t => currentUser.tabs.includes(t.id));

  // ---- 1. Update tab bar only (lightweight) ----
  const bar = document.getElementById('tab-bar');
  if(bar) {
    let needsFullRebuild = false;
    const currentBtns = new Set([...bar.querySelectorAll('[data-id]')].map(b=>b.dataset.id));
    const allowedIds = new Set(allowed.map(t=>t.id));
    // Check for added/removed tabs
    for(const t of allowed) { if(!currentBtns.has(t.id)) { needsFullRebuild=true; break; } }
    for(const id of currentBtns) { if(!allowedIds.has(id)) { needsFullRebuild=true; break; } }
    if(needsFullRebuild) {
      renderTabs(activeTab);
      if(activeTab) switchTab(activeTab);
      return;
    }
    // Just update text and defacement classes
    allowed.forEach(tab => {
      const btn = bar.querySelector(`[data-id="${tab.id}"]`);
      if(!btn) return;
      btn.textContent = tab.name;
      if(state.defacements && state.defacements[tab.id]) btn.classList.add('defaced');
      else btn.classList.remove('defaced');
    });
  }

  // ---- 2. Only refresh the ACTIVE panel ----
  if(!activeTab) return;
  const tab = state.tabs.find(t=>t.id===activeTab);
  if(!tab) return;

  const panel = document.getElementById('panel-'+tab.id);
  if(!panel) return;

  // Don't rebuild if user has unsaved input in this panel
  if(hasDirtyFields(panel)) return;

  // Don't rebuild panels that manage their own state
  if(tab.isAdmin)  { renderUserTable(); return; }
  if(tab.isHacker) { refreshHackerPanel(); return; }
  if(tab.isCamera) return;
  if(tab.isChat)   { refreshChatPanel(); return; }

  const scrollPos = panel.scrollTop || 0;

  if(tab.isFrontPage)   panel.innerHTML = buildFrontPagePanel();
  else if(tab.isLoreHub) panel.innerHTML = buildLoreHubPanel();
  else if(tab.isProfile) panel.innerHTML = buildProfilePanel();
  else if(tab.isNewspaper) panel.innerHTML = buildNewspaperPanel(tab);
  else if(tab.isSysNews)   panel.innerHTML = buildSysNewsPanel(tab);
  else if(tab.isRumors)    panel.innerHTML = buildRumorsPanel(tab);
  else if(tab.isMarket)  { refreshMarketPanel(tab); return; }
  else if(tab.isIdent)   { refreshIdentPanel(tab);  return; }
  else if(tab.isWanted)  { refreshWantedPanel(tab); return; }
  else if(tab.isHub)     { refreshHubPanel(tab);    return; }
  else panel.innerHTML = buildContentPanel(tab);

  panel.scrollTop = scrollPos;

  // Profile panel refresh if it's a sidebar-style element
  applySiteOverlay();
}

// Returns true if a panel contains any input/textarea with content that differs
// from its defaultValue (i.e. the user has typed something unsaved)
function hasDirtyFields(panel) {
  const inputs = panel.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
  for(const el of inputs) {
    if(document.activeElement === el) return true; // cursor is in a field
    if(el.tagName === 'SELECT') continue; // selects reset fine
    if(el.tagName === 'TEXTAREA' && el.value !== el.defaultValue) return true;
    if(el.tagName === 'INPUT' && el.value !== el.defaultValue) return true;
  }
  return false;
}

// Placeholder for targeted live-region updates inside dirty panels.
// Extend this if you add data-live-region markers to specific HTML sections.
function buildLiveRegion(tab, regionId) {
  return null; // no-op by default; region stays as-is
}

function renderTabs(keepTab) {
  const bar = document.getElementById('tab-bar');
  const panels = document.getElementById('tab-panels');
  bar.innerHTML=''; panels.innerHTML='';

  const allowed = state.tabs.filter(t => currentUser.tabs.includes(t.id));
  allowed.forEach(tab => {
    if(tab.isProfile) return; // profile accessible via header btn only
    // Content tabs live inside the Archive — hide from main tab bar
    if(!tab.isAdmin && !tab.isHacker && !tab.isChat && !tab.isFrontPage && !tab.isLoreHub && !tab.isNewspaper && !tab.isSysNews && !tab.isRumors && !tab.isCamera && !tab.isMarket && !tab.isHub) return;

    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (tab.isAdmin?' admin-tab':'') + (tab.isHacker?' hacker-tab':'') + (tab.isChat?' chat-tab':'') + (tab.isNewspaper?' newspaper-tab':'') + (tab.isSysNews?' sysnews-tab':'') + (tab.isRumors?' rumors-tab':'') + (tab.isCamera?' camera-tab':'') + (tab.isMod?' mod-tab':'') + (tab.isMarket?' market-tab':'') + (tab.isIdent?' ident-tab':'') + (tab.isWanted?' wanted-tab':'');
    if(state.defacements[tab.id]) btn.classList.add('defaced');
    btn.textContent = tab.name;
    btn.dataset.id = tab.id;
    btn.onclick = ()=>switchTab(tab.id);
    bar.appendChild(btn);

    const panel = document.createElement('div');
    panel.className='tab-content'; panel.id='panel-'+tab.id;
    if(tab.isFrontPage) panel.innerHTML = buildFrontPagePanel();
    else if(tab.isLoreHub) panel.innerHTML = buildLoreHubPanel();
    else if(tab.isAdmin) panel.innerHTML = buildAdminPanel();
    else if(tab.isMod) panel.innerHTML = buildModPanel();
    else if(tab.isHacker) panel.innerHTML = buildHackerPanel();
    else if(tab.isProfile) panel.innerHTML = buildProfilePanel();
    else if(tab.isChat) panel.innerHTML = buildChatPanel();
    else if(tab.isCamera) panel.innerHTML = buildCameraPanel();
    else if(tab.isNewspaper) panel.innerHTML = buildNewspaperPanel(tab);
    else if(tab.isSysNews) panel.innerHTML = buildSysNewsPanel(tab);
    else if(tab.isRumors) panel.innerHTML = buildRumorsPanel(tab);
    else if(tab.isMarket) panel.innerHTML = buildMarketPanel(tab);
    else if(tab.isIdent)  panel.innerHTML = buildIdentPanel(tab);
    else if(tab.isWanted) panel.innerHTML = buildWantedPanel(tab);
    else if(tab.isHub) {
      panel.innerHTML = buildHubPanel(tab);
      // Don't refresh hub content until it's actually activated
    }
    else panel.innerHTML = buildContentPanel(tab);
    panels.appendChild(panel);
  });

  // Profile panel always built even if not in bar
  const profileTab = state.tabs.find(t=>t.isProfile);
  if(profileTab && currentUser.tabs.includes('profile')) {
    const panel = document.createElement('div');
    panel.className='tab-content'; panel.id='panel-profile';
    panel.innerHTML = buildProfilePanel();
    panels.appendChild(panel);
  }

  const firstTab = allowed.filter(t=>!t.isProfile)[0];
  const tabToActivate = keepTab && allowed.find(t=>t.id===keepTab) ? keepTab : (firstTab ? firstTab.id : null);
  if(tabToActivate) switchTab(tabToActivate);
}

// =====================================================================
// ACTIVITY SURVEILLANCE LOG
// =====================================================================
const MAX_LOG_ENTRIES = 500;

function logActivity(type, details) {
  if(!currentUser) return;
  if(currentUser.isAdmin) return; // don't log admins
  const now = new Date();
  const entry = {
    t: now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    d: now.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit'}),
    ts: Date.now(),
    user: currentUser.username,
    role: currentUser.role || '',
    type: type,
    details: details,
    terminalId:   _terminal.id,
    terminalName: _terminal.name
  };
  if(!state.activityLog) state.activityLog = [];
  state.activityLog.unshift(entry);
  if(state.activityLog.length > MAX_LOG_ENTRIES) state.activityLog.length = MAX_LOG_ENTRIES;
  saveState('activity');
}

function switchTab(id) {
  activeTab=id;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
  document.querySelectorAll('.tab-content').forEach(p=>p.classList.toggle('active',p.id==='panel-'+id));
  const fpTab = state.tabs.find(t=>t.isFrontPage); if(fpTab && id===fpTab.id) refreshFrontPagePanel();
  const lhTab = state.tabs.find(t=>t.isLoreHub); if(lhTab && id===lhTab.id) refreshLoreHubPanel();
  if(id==='admin') refreshAdminPanel();
  if(id==='hacker') refreshHackerPanel();
  if(id==='profile') refreshProfilePanel();
  if(id==='chat') refreshChatPanel();
  if(id==='camera') refreshCameraPanel();
  // Log tab view (skip system tabs)
  if(!['admin','hacker','profile','chat'].includes(id)) {
    const tab = state.tabs.find(t=>t.id===id);
    if(tab) logActivity('TAB', tab.name);
  }
  // News panels refresh on switch
  const tab = state.tabs.find(t=>t.id===id);
  if(tab && (tab.isNewspaper || tab.isSysNews || tab.isRumors || tab.isMarket || tab.isIdent || tab.isWanted || tab.isHub)) {
    const panel = document.getElementById('panel-'+id);
    if(panel) {
      if(tab.isNewspaper) panel.innerHTML = buildNewspaperPanel(tab);
      else if(tab.isSysNews) panel.innerHTML = buildSysNewsPanel(tab);
      else if(tab.isMarket) refreshMarketPanel(tab);
      else if(tab.isIdent)  refreshIdentPanel(tab);
      else if(tab.isWanted) refreshWantedPanel(tab);
      else if(tab.isHub) refreshHubPanel(tab);
    }
  }
}

