// =====================================================================
// CAMERA SURVEILLANCE MODULE
// =====================================================================

// --- State ---
let camUserStream = null;       // local user's camera stream
let camMediaRecorder = null;    // recorder for local stream
let camRecChunks = [];          // recorded data chunks
let camRecording = false;
let camSignalingUnsub = null;   // Firebase listener for signaling
let camPeerConnections = {};    // username -> RTCPeerConnection (admin side)
let camLocalStream = null;      // admin's received streams

const CAM_ICE_SERVERS = { iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80',    username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443',   username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
]};

// =====================================================================
// TERMINAL-BASED CAMERA SYSTEM
// One stream per browser (terminal), identified by _terminal.id.
// Stream starts as soon as page loads — before login.
// Admin sees all terminals always; feed goes live when browser is open.
// =====================================================================

// ── USER SIDE: start broadcasting immediately when Firebase is ready ──

async function camTerminalStartBroadcast() {
  // Admins don't broadcast
  const fb = window.__firebase;
  if(!fb || !fb.CONFIGURED || !fb.db) return;
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  if(camUserStream) return; // already running

  try {
    camUserStream = await navigator.mediaDevices.getUserMedia({ video: { width:640, height:360 }, audio: true });
  } catch(e) {
    console.warn('[CAM] getUserMedia failed:', e);
    return;
  }

  const { db, doc, setDoc, onSnapshot } = fb;
  const tid = _terminal.id;

  // Write terminal signal — keyed by terminal ID, not username
  await setDoc(doc(db, 'cam_signals', tid), {
    terminalId:   tid,
    terminalName: _terminal.name,
    username:     currentUser ? currentUser.username : null,
    role:         currentUser ? (currentUser.role || '') : null,
    online: true,
    ts: Date.now(),
    offer: null, answer: null, ice_user: [], ice_admin: []
  });

  // Listen for admin answer / ICE
  camSignalingUnsub = onSnapshot(doc(db, 'cam_signals', tid), async snap => {
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

  // Create peer connection
  const pc = new RTCPeerConnection(CAM_ICE_SERVERS);
  window._camPC = pc;
  camUserStream.getTracks().forEach(track => pc.addTrack(track, camUserStream));

  const iceBuffer = [];
  pc.onicecandidate = async e => {
    if(e.candidate) {
      iceBuffer.push(JSON.stringify(e.candidate.toJSON()));
      await setDoc(doc(db, 'cam_signals', tid), { ice_user: iceBuffer }, { merge: true });
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await setDoc(doc(db, 'cam_signals', tid), { offer: JSON.stringify(offer) }, { merge: true });

  console.log('[CAM] Terminal broadcast started:', tid, _terminal.name);
  refreshProfilePanel();
}

// Called on login to update the username/role fields on the signal doc
async function camTerminalUpdateUser() {
  const fb = window.__firebase;
  if(!fb || !fb.CONFIGURED || !fb.db || !currentUser) return;
  const { db, doc, setDoc } = fb;
  await setDoc(doc(db, 'cam_signals', _terminal.id), {
    username: currentUser.username,
    role: currentUser.role || ''
  }, { merge: true });
}

// Called on logout
async function camTerminalClearUser() {
  const fb = window.__firebase;
  if(!fb || !fb.CONFIGURED || !fb.db) return;
  const { db, doc, setDoc } = fb;
  await setDoc(doc(db, 'cam_signals', _terminal.id), {
    username: null,
    role: null
  }, { merge: true });
}

async function camStopUserBroadcast() {
  if(camSignalingUnsub) { camSignalingUnsub(); camSignalingUnsub = null; }
  if(window._camPC) { window._camPC.close(); window._camPC = null; }
  if(camUserStream) { camUserStream.getTracks().forEach(t=>t.stop()); camUserStream = null; }
  const fb = window.__firebase;
  if(fb && fb.CONFIGURED && fb.db) {
    const { db, doc, setDoc } = fb;
    await setDoc(doc(db, 'cam_signals', _terminal.id), { online: false }, { merge: true });
  }
  refreshProfilePanel();
}

// ── ADMIN SIDE: camera panel build + refresh ──

function buildCameraPanel() {
  return `<div id="camera-panel-inner" style="padding:20px 0;"></div>`;
}

function refreshCameraPanel() {
  const el = document.getElementById('camera-panel-inner');
  if(!el) return;
  if(!currentUser || !currentUser.isAdmin) {
    el.innerHTML = `<div style="color:var(--text-dim);font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:20px;">// ADGANG NÆGTET — KUN ADMIN</div>`;
    return;
  }

  // If already built, just refresh the grid without destroying streams
  if(el.querySelector('#cam-live-grid')) {
    camRenderLiveGrid(camOnlineUsers);
    return;
  }

  el.innerHTML = `
    <div class="page-header" style="padding:0 0 16px 0;margin-bottom:24px;">
      <div class="page-title" style="color:var(--red);">📷 OVERVÅGNINGSCENTER</div>
      <div class="page-desc">// TERMINALER — LIVE FEEDS</div>
    </div>
    <div class="panel" style="border-color:var(--red);">
      <div class="panel-title" style="color:var(--red);">● LIVE FEEDS</div>
      <div style="font-size:11px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">
        // TERMINALER REGISTRERES AUTOMATISK NÅR EN BROWSER ÅBNER SIDEN
      </div>
      <div id="cam-live-grid" class="cam-grid">
        <div class="cam-placeholder" style="aspect-ratio:16/9;width:100%;max-width:340px;">
          <div style="font-size:24px;opacity:0.3;">📡</div>
          <div>SØGER TERMINALER...</div>
        </div>
      </div>
      <div id="cam-live-status" style="font-size:11px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;margin-top:10px;min-height:18px;"></div>
    </div>
    <div class="panel" style="margin-top:20px;">
      <div class="panel-title">📼 OPTAGELSESARKIV</div>
      <div style="display:flex;gap:10px;margin-bottom:16px;align-items:center;flex-wrap:wrap;">
        <button class="cam-rec-btn" onclick="camLoadRecordings()" style="border-color:var(--green);color:var(--green);">⟳ INDLÆS OPTAGELSER</button>
        <span id="rec-status" class="cam-status"></span>
      </div>
      <div id="rec-list" class="rec-list">
        <div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;">// TRYK "INDLÆS" FOR AT SE OPTAGELSER</div>
      </div>
    </div>`;

  camAdminWatchFeeds();
}

// ── ADMIN SIDE: watch all terminal signals and render grid ──

function camAdminWatchFeeds() {
  const fb = window.__firebase;
  const { db, collection, onSnapshot, CONFIGURED } = fb;
  if(!CONFIGURED || !db) return;
  if(window._camAdminUnsub) { window._camAdminUnsub(); }
  window._camAdminUnsub = onSnapshot(collection(db, 'cam_signals'), snap => {
    const signals = {};
    snap.forEach(d => { signals[d.id] = d.data(); });
    camOnlineUsers = signals;
    camRenderLiveGrid(signals);
    camAutoConnectAll(signals);
  });
}

function camRenderLiveGrid(signals) {
  const grid = document.getElementById('cam-live-grid');
  if(!grid) return;

  const terminals = Object.values(signals); // show ALL terminals, online or not
  if(!terminals.length) {
    grid.innerHTML = '<div class="cam-placeholder" style="border:1px solid var(--border);padding:24px 0;width:320px;"><div style="font-size:28px;opacity:0.3;">📡</div><div>INGEN TERMINALER REGISTRERET</div></div>';
    return;
  }

  // Sort: online first, then by name
  terminals.sort((a,b) => {
    if(a.online && !b.online) return -1;
    if(!a.online && b.online) return 1;
    return (a.terminalName||a.terminalId||a.username||'z').localeCompare(b.terminalName||b.terminalId||b.username||'z');
  });

  const existingIds = new Set([...grid.querySelectorAll('[data-cam-user]')].map(el => el.dataset.camUser));
  const currentIds  = new Set(terminals.map(t => t.terminalId || t.username));

  // Remove terminals no longer in Firestore
  existingIds.forEach(id => {
    if(!currentIds.has(id)) {
      const cell = grid.querySelector(`[data-cam-user="${id}"]`);
      if(cell) cell.remove();
    }
  });

  terminals.forEach(u => {
    const tid = u.terminalId || u.username; // fallback for old-style signals
    const displayName = (state && state.terminalNames && state.terminalNames[tid]) || u.terminalName || tid;
    const isOnline = !!u.online;
    const isConnected = !!camPeerConnections[tid];
    const recActive = window._camRecording && window._camRecording.username === tid;
    const loggedInUser = u.username;

    let cell = grid.querySelector(`[data-cam-user="${tid}"]`);
    if(!cell) {
      cell = document.createElement('div');
      cell.className = 'cam-cell' + (isConnected ? ' live' : '');
      cell.dataset.camUser = tid;
      grid.appendChild(cell);
    } else {
      cell.className = 'cam-cell' + (isConnected ? ' live' : '') + (isOnline ? '' : ' cam-offline');
    }

    // Header
    let header = cell.querySelector('.cam-cell-header');
    if(!header) { header = document.createElement('div'); header.className = 'cam-cell-header'; cell.insertBefore(header, cell.firstChild); }

    const userBadge = loggedInUser
      ? `<span style="color:var(--cortex-accent);font-size:10px;letter-spacing:1px;">👤 ${escHtml(loggedInUser)}</span>`
      : `<span style="color:var(--text-dim);font-size:10px;letter-spacing:1px;">— INGEN BRUGER</span>`;

    const loginHistory = u.loginHistory || [];
    const historyHtml = loginHistory.length > 1
      ? loginHistory.slice(1, 5).map(l =>
          `<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;padding:1px 0;">${escHtml(l.d)} ${escHtml(l.t)} — ${escHtml(l.username)}</div>`
        ).join('')
      : '';

    header.innerHTML = `
      <span style="display:flex;align-items:center;gap:6px;">
        ${isConnected ? '<span class="cam-live-dot"></span>' : isOnline ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--amber);display:inline-block;margin-right:2px;"></span>' : '<span class="cam-offline-dot"></span>'}
        <span id="cam-name-display-${escAttr(tid)}" style="font-weight:600;cursor:pointer;border-bottom:1px dashed var(--border-bright);" title="Klik for at omdøbe" onclick="camStartRename('${escAttr(tid)}')">${escHtml(displayName)}</span>
        <span id="cam-name-edit-${escAttr(tid)}" style="display:none;display:none;">
          <input id="cam-name-input-${escAttr(tid)}" value="${escAttr(displayName)}"
            style="background:var(--bg);border:1px solid var(--cortex-accent);color:var(--text-bright);padding:2px 8px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;outline:none;width:160px;"
            onkeydown="if(event.key==='Enter')camSaveRename('${escAttr(tid)}');if(event.key==='Escape')camCancelRename('${escAttr(tid)}');"/>
          <button onclick="camSaveRename('${escAttr(tid)}')" style="padding:2px 8px;background:rgba(0,170,255,0.15);border:1px solid var(--cortex-accent);color:var(--cortex-accent);font-family:'Share Tech Mono',monospace;font-size:10px;cursor:pointer;margin-left:4px;">✓</button>
          <button onclick="camCancelRename('${escAttr(tid)}')" style="padding:2px 6px;background:transparent;border:1px solid var(--border);color:var(--text-dim);font-family:'Share Tech Mono',monospace;font-size:10px;cursor:pointer;margin-left:2px;">✕</button>
        </span>
      </span>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
        ${userBadge}
        ${historyHtml ? `<details style="text-align:right;"><summary style="font-size:9px;color:var(--text-dim);letter-spacing:1px;cursor:pointer;outline:none;text-transform:uppercase;">historik</summary>${historyHtml}</details>` : ''}
      </div>`;

    // Video / placeholder
    const hasVideo = !!cell.querySelector('video');
    if(isConnected && !hasVideo) {
      const ph = cell.querySelector('.cam-placeholder'); if(ph) ph.remove();
      const vid = document.createElement('video');
      vid.id = 'cam-video-' + tid;
      vid.className = 'cam-video'; vid.autoplay = true; vid.playsInline = true; vid.muted = true;
      if(window._camStreams && window._camStreams[tid]) vid.srcObject = window._camStreams[tid];
      cell.insertBefore(vid, cell.querySelector('.cam-controls') || null);
    } else if(!isConnected && hasVideo) {
      const vid = cell.querySelector('video'); if(vid) vid.remove();
    }
    if(!isConnected && !cell.querySelector('.cam-placeholder')) {
      const ph = document.createElement('div');
      ph.className = 'cam-placeholder';
      ph.style.opacity = isOnline ? '1' : '0.4';
      ph.innerHTML = isOnline
        ? '<div style="font-size:28px;">📷</div><div>BROWSER ONLINE — KLIK FOR AT FORBINDE</div>'
        : '<div style="font-size:28px;opacity:0.4;">📷</div><div style="color:var(--border-bright);">TERMINAL OFFLINE</div>';
      cell.insertBefore(ph, cell.querySelector('.cam-controls') || null);
    } else if(!isConnected && cell.querySelector('.cam-placeholder')) {
      const ph = cell.querySelector('.cam-placeholder');
      ph.style.opacity = isOnline ? '1' : '0.4';
      ph.innerHTML = isOnline
        ? '<div style="font-size:28px;">📷</div><div>BROWSER ONLINE — KLIK FOR AT FORBINDE</div>'
        : '<div style="font-size:28px;opacity:0.4;">📷</div><div style="color:var(--border-bright);">TERMINAL OFFLINE</div>';
    }

    // Controls
    let controls = cell.querySelector('.cam-controls');
    if(!controls) { controls = document.createElement('div'); controls.className = 'cam-controls'; cell.appendChild(controls); }
    controls.innerHTML = `
      ${isOnline && !isConnected  ? `<button class="cam-rec-btn" onclick="camAdminConnect('${escAttr(tid)}')">▶ FORBIND</button>` : ''}
      ${isConnected               ? `<button class="cam-stop-btn" onclick="camAdminDisconnect('${escAttr(tid)}')">■ AFBRYD</button>` : ''}
      ${isConnected && !recActive ? `<button class="cam-rec-btn" onclick="camStartRecording('${escAttr(tid)}')">⏺ OPTAG</button>` : ''}
      ${recActive                 ? `<button class="cam-stop-btn recording" onclick="camStopRecording()">⏹ STOP OPTAGELSE</button>` : ''}
      <span class="cam-status">${isConnected ? '● LIVE' : isOnline ? '○ KLAR' : '○ OFFLINE'}</span>
      <button onclick="camAdminDeleteTerminal('${escAttr(tid)}')" style="margin-left:auto;padding:3px 8px;background:transparent;border:1px solid var(--border);color:var(--text-dim);font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;text-transform:uppercase;" title="Fjern terminal fra listen">✕</button>`;
  });
}

function camAutoConnectAll(signals) {
  Object.values(signals).filter(s => s.online && s.offer).forEach(u => {
    const tid = u.terminalId || u.username;
    if(!camPeerConnections[tid]) camAdminConnect(tid);
  });
}

async function camAdminDeleteTerminal(tid) {
  if(!confirm('Fjern denne terminal fra listen? (Sletter Firestore-signalet)')) return;
  const fb = window.__firebase;
  if(!fb || !fb.CONFIGURED || !fb.db) return;
  const { db, doc, deleteDoc } = fb;
  try { await deleteDoc(doc(db, 'cam_signals', tid)); } catch(e) { console.warn(e); }
}

function camStartRename(tid) {
  const display = document.getElementById('cam-name-display-' + tid);
  const edit    = document.getElementById('cam-name-edit-'    + tid);
  const input   = document.getElementById('cam-name-input-'   + tid);
  if(!display || !edit) return;
  display.style.display = 'none';
  edit.style.display = 'inline-flex';
  edit.style.alignItems = 'center';
  if(input) { input.focus(); input.select(); }
}

function camCancelRename(tid) {
  const display = document.getElementById('cam-name-display-' + tid);
  const edit    = document.getElementById('cam-name-edit-'    + tid);
  if(!display || !edit) return;
  display.style.display = '';
  edit.style.display = 'none';
}

function camSaveRename(tid) {
  const input = document.getElementById('cam-name-input-' + tid);
  if(!input) return;
  const newName = input.value.trim();
  if(!newName) { camCancelRename(tid); return; }
  if(!state.terminalNames) state.terminalNames = {};
  state.terminalNames[tid] = newName;
  saveState();
  // Update display immediately without rebuilding the whole grid
  const display = document.getElementById('cam-name-display-' + tid);
  if(display) { display.textContent = newName; }
  camCancelRename(tid);
  // Also refresh surveillance log if open
  const survEl = document.getElementById('surveillance-inner');
  if(survEl && survEl.innerHTML.trim()) renderSurveillanceLog();
}

function camAdminDisconnect(tid) {
  if(camPeerConnections[tid]) { camPeerConnections[tid].close(); delete camPeerConnections[tid]; }
  if(camFeedUnsubs[tid]) { camFeedUnsubs[tid](); delete camFeedUnsubs[tid]; }
  if(window._camStreams) delete window._camStreams[tid];
  if(window._camRecording && window._camRecording.username === tid) camStopRecording();
  camStopDailyRecording(tid);
  camRenderLiveGrid(camOnlineUsers);
}

// =====================================================================
// ADMIN CONNECT to a terminal's stream
// =====================================================================
async function camAdminConnect(tid) {
  const fb = window.__firebase;
  const { db, doc, setDoc, onSnapshot, CONFIGURED } = fb;
  if(!CONFIGURED || !db) return;

  const signal = camOnlineUsers[tid];
  if(!signal || !signal.offer) {
    const el = document.getElementById('cam-live-status');
    if(el) el.textContent = `// ${tid}: INGEN OFFER TILGÆNGELIGT`;
    return;
  }

  const pc = new RTCPeerConnection(CAM_ICE_SERVERS);
  camPeerConnections[tid] = pc;
  if(!window._camStreams) window._camStreams = {};

  pc.ontrack = e => {
    if(!window._camStreams[tid]) window._camStreams[tid] = e.streams[0];
    const vid = document.getElementById('cam-video-' + tid);
    if(vid) vid.srcObject = e.streams[0];
    else {
      // video element doesn't exist yet — update grid
      camRenderLiveGrid(camOnlineUsers);
      setTimeout(() => {
        const v = document.getElementById('cam-video-' + tid);
        if(v) v.srcObject = e.streams[0];
      }, 300);
    }
    const statusEl = document.getElementById('cam-status-' + tid);
    if(statusEl) statusEl.textContent = '● LIVE';
  };

  pc.onicecandidate = async e => {
    if(e.candidate) {
      const cur = (camOnlineUsers[tid] && camOnlineUsers[tid].ice_admin) || [];
      await setDoc(doc(db, 'cam_signals', tid), { ice_admin: [...cur, JSON.stringify(e.candidate.toJSON())] }, { merge: true });
    }
  };

  const offer = new RTCSessionDescription(JSON.parse(signal.offer));
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await setDoc(doc(db, 'cam_signals', tid), { answer: JSON.stringify(answer) }, { merge: true });

  // Apply any pending ICE from the terminal
  if(signal.ice_user) {
    for(const c of signal.ice_user) {
      try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(c))); } catch(e){}
    }
  }

  // Watch for new ICE from terminal
  camFeedUnsubs[tid] = onSnapshot(doc(db, 'cam_signals', tid), async snap => {
    const data = snap.data();
    if(!data || !camPeerConnections[tid]) return;
    if(data.ice_user) {
      const processed = camPeerConnections[tid]._processedUserIce || 0;
      for(let i = processed; i < data.ice_user.length; i++) {
        try { await camPeerConnections[tid].addIceCandidate(new RTCIceCandidate(JSON.parse(data.ice_user[i]))); } catch(e){}
      }
      camPeerConnections[tid]._processedUserIce = data.ice_user.length;
    }
  });

  const el = document.getElementById('cam-live-status');
  if(el) el.textContent = `// FORBUNDET TIL: ${(state.terminalNames && state.terminalNames[tid]) || signal.terminalName || tid}`;

  camRenderLiveGrid(camOnlineUsers);
  setTimeout(() => camAutoStartDailyRecording(tid), 2000);
}

// =====================================================================
// BACKGROUND DAILY RECORDING — automatic, no user interaction needed
// Runs silently on admin side whenever a user stream is connected.
// Saves one .webm file per user every 30 minutes to Downloads folder.
// Resets at midnight with a new date key.
// =====================================================================
// =====================================================================
// ALWAYS-ON SEGMENTED RECORDING
// Starts automatically when admin connects to a terminal.
// Records continuously in 30-minute segments.
// Each segment is auto-downloaded to Downloads with a timestamp filename.
// Format: terminal_NAVN_DATO_HH-MM_til_HH-MM.webm
// =====================================================================

if(!window._bgDailyRec) window._bgDailyRec = {};

const CAM_SEGMENT_MS = 30 * 60 * 1000; // 30 minutes

function camAutoStartDailyRecording(tid) {
  if(!window._camStreams || !window._camStreams[tid]) return;
  if(window._bgDailyRec[tid]) return; // already running

  _camStartSegment(tid);
}

function _camSegmentTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const d = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const t = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
  return { d, t, full: `${d}_${t}` };
}

function _camTerminalLabel(tid) {
  if(state && state.terminalNames && state.terminalNames[tid]) {
    return state.terminalNames[tid].replace(/[^a-zA-Z0-9æøåÆØÅ_\- ]/g,'').replace(/ /g,'_');
  }
  const sig = camOnlineUsers && camOnlineUsers[tid];
  if(sig && sig.terminalName) return sig.terminalName.replace(/[^a-zA-Z0-9æøåÆØÅ_\- ]/g,'').replace(/ /g,'_');
  return tid;
}

function _camStartSegment(tid) {
  const stream = window._camStreams && window._camStreams[tid];
  if(!stream) return;

  // Pick best available codec
  const mimeType = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']
    .find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  let chunks = [];
  let recorder;
  const startTs = _camSegmentTimestamp();

  try {
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 400000 });
  } catch(e) {
    console.warn('[CAM-REC] Could not create MediaRecorder:', e);
    return;
  }

  // Collect data every second — low latency chunks
  recorder.ondataavailable = e => { if(e.data && e.data.size > 0) chunks.push(e.data); };

  recorder.onstop = () => {
    _camSaveSegment(tid, chunks, startTs);
    chunks = [];
    // Immediately start the next segment if still connected
    if(window._bgDailyRec[tid] && window._camStreams && window._camStreams[tid]) {
      setTimeout(() => _camStartSegment(tid), 200);
    } else {
      delete window._bgDailyRec[tid];
    }
  };

  recorder.start(1000); // 1-second timeslices

  // Schedule the cut after CAM_SEGMENT_MS
  const cutTimer = setTimeout(() => {
    if(recorder.state === 'recording') recorder.stop();
  }, CAM_SEGMENT_MS);

  window._bgDailyRec[tid] = { recorder, cutTimer, startTs, active: true };

  // Update status indicator
  _camUpdateRecStatus();
  console.log(`[CAM-REC] Segment started for ${tid} at ${startTs.full}`);
}

async function _camSaveSegment(tid, chunks, startTs) {
  if(!chunks || chunks.length === 0) return;
  const blob = new Blob(chunks, { type: 'video/webm' });
  if(blob.size < 5000) return;

  const endTs   = _camSegmentTimestamp();
  const label   = _camTerminalLabel(tid);
  const filename = `${label}_${startTs.d}_${startTs.t}_til_${endTs.t}.webm`;

  // ── Electron: save directly to chosen folder ──────────────────────
  if(window.electronAPI) {
    try {
      const buffer = await blob.arrayBuffer();
      const result = await window.electronAPI.saveRecording(
        buffer, filename, window._recordingFolder || null
      );
      if(result.ok) {
        window._recordingFolder = result.dir; // remember folder for next segment
        console.log(`[CAM-REC] Saved to disk: ${result.path}`);
        _camUpdateRecStatus();
        return;
      }
    } catch(e) {
      console.warn('[CAM-REC] Electron save failed, falling back to download:', e);
    }
  }

  // ── Browser fallback: trigger download ────────────────────────────
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 5000);
  console.log(`[CAM-REC] Downloaded: ${filename} (${Math.round(blob.size/1024)} KB)`);
  _camUpdateRecStatus();
}

function camStopDailyRecording(tid) {
  const rec = window._bgDailyRec[tid];
  if(!rec) return;
  clearTimeout(rec.cutTimer);
  rec.active = false;
  if(rec.recorder && rec.recorder.state !== 'inactive') {
    rec.recorder.stop(); // will trigger onstop → _camSaveSegment
  } else {
    delete window._bgDailyRec[tid];
  }
  _camUpdateRecStatus();
  console.log(`[CAM-REC] Stopped recording for ${tid}`);
}

function _camUpdateRecStatus() {
  const statusEl = document.getElementById('cam-live-status');
  if(!statusEl) return;
  const active = Object.keys(window._bgDailyRec);
  if(active.length === 0) {
    statusEl.textContent = '';
    return;
  }
  const labels = active.map(tid => _camTerminalLabel(tid)).join(', ');
  const rec = window._bgDailyRec[active[0]];
  const since = rec && rec.startTs ? rec.startTs.t.replace('-',':') : '';
  statusEl.innerHTML = `<span style="color:var(--red);animation:blink 1.5s step-end infinite;">⏺</span> OPTAGER: ${escHtml(labels)} — segment startet ${escHtml(since)} — gemmes automatisk hvert 30 min til Downloads`;
}

// Manual start/stop for the per-terminal record button (still available)



function camStartRecording(username) {
  if(!window._camStreams || !window._camStreams[username]) {
    alert('Ingen live stream for ' + username); return;
  }
  const stream = window._camStreams[username];
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  camRecChunks = [];
  camMediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 500000 });
  camMediaRecorder.ondataavailable = e => { if(e.data.size > 0) camRecChunks.push(e.data); };
  camMediaRecorder.onstop = () => camUploadRecording(username);
  camMediaRecorder.start(1000); // collect every 1s
  camRecording = true;
  window._camRecording = { username };

  camRenderLiveGrid(camOnlineUsers);
  document.getElementById('cam-live-status').textContent = `// ⏺ OPTAGER: ${username}`;
}

function camStopRecording() {
  if(camMediaRecorder && camMediaRecorder.state !== 'inactive') {
    camMediaRecorder.stop();
  }
  camRecording = false;
  window._camRecording = null;
  camRenderLiveGrid(camOnlineUsers);
  document.getElementById('cam-live-status').textContent = `// OPTAGELSE STOPPET — UPLOADER...`;
}

// Daily local recording accumulator — kept for manual recordings via camSaveLocally
if(!window._dailyRecChunks) window._dailyRecChunks = {};

function camSaveLocally(blob, username) {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const filename = `optagelse_${username}_${dateStr}_${timeStr}.webm`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
}

async function camUploadRecording(username) {
  const { storage, ref, uploadBytes, CONFIGURED } = window.__firebase;
  const blob = new Blob(camRecChunks, { type: 'video/webm' });
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g,'_').slice(0,19);
  const filename = `recordings/${username}_${ts}.webm`;

  // 1. Always save locally first (instant, no Firebase needed)
  camSaveLocally(blob, username);
  document.getElementById('cam-live-status').textContent = `// ✓ GEMT LOKALT: ${username}_${ts}.webm`;

  // 2. Also upload to Firebase Storage if configured
  if(CONFIGURED && storage) {
    try {
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      document.getElementById('cam-live-status').textContent = `// ✓ GEMT LOKALT + FIREBASE: ${filename}`;
      // Auto-reload recordings list if visible
      const recList = document.getElementById('rec-list');
      if(recList) camLoadRecordings();
    } catch(err) {
      document.getElementById('cam-live-status').textContent = `// ✓ LOKALT GEMT — Firebase fejl: ${err.message}`;
    }
  }
  camRecChunks = [];
}

// =====================================================================
// RECORDINGS LIST
// =====================================================================
async function camLoadRecordings() {
  const { storage, ref, listAll, getDownloadURL, deleteObject, CONFIGURED } = window.__firebase;
  const recList = document.getElementById('rec-list');
  const recStatus = document.getElementById('rec-status');
  if(!recList) return;
  if(!CONFIGURED || !storage) {
    recList.innerHTML = `<div style="color:var(--red);font-size:12px;letter-spacing:2px;text-transform:uppercase;">// FIREBASE STORAGE IKKE KONFIGURERET</div>`;
    return;
  }
  recList.innerHTML = `<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;">// INDLÆSER...</div>`;
  if(recStatus) recStatus.textContent = 'INDLÆSER...';

  try {
    const listRef = ref(storage, 'recordings/');
    const result = await listAll(listRef);

    if(!result.items.length) {
      recList.innerHTML = `<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;">// INGEN OPTAGELSER FUNDET</div>`;
      if(recStatus) recStatus.textContent = '0 OPTAGELSER';
      return;
    }

    // Get download URLs
    const items = await Promise.all(result.items.map(async itemRef => {
      const url = await getDownloadURL(itemRef);
      const name = itemRef.name;
      // Parse username from filename: username_YYYY-MM-DDTHH_MM_SS.webm
      const parts = name.replace('.webm','').split('_');
      const username = parts.slice(0, parts.length - 3).join('_');
      const dateStr = parts.slice(-3).join(':').replace('T',' ').replace(/_/g,':');
      return { name, url, username, dateStr, fullPath: itemRef.fullPath };
    }));

    // Sort newest first
    items.sort((a, b) => b.name.localeCompare(a.name));

    recList.innerHTML = items.map(item => `
      <div class="rec-item" id="rec-${item.name.replace(/\W/g,'_')}">
        <video class="rec-thumb" src="${item.url}" preload="metadata" muted></video>
        <div class="rec-info">
          <div class="rec-name">📷 ${escHtml(item.username)}</div>
          <div class="rec-meta">${escHtml(item.dateStr)} · ${escHtml(item.name)}</div>
        </div>
        <div class="rec-actions">
          <a href="${item.url}" target="_blank" download="${item.name}">
            <button class="cam-stop-btn" style="border-color:var(--green);color:var(--green);">⬇ DOWNLOAD</button>
          </a>
          <button class="cam-stop-btn" onclick="camPlayRecording('${escAttr(item.url)}','${escAttr(item.name)}')">▶ AFSPIL</button>
          <button class="cam-rec-btn" onclick="camDeleteRecording('${escAttr(item.fullPath)}','${escAttr(item.name)}')">✕ SLET</button>
        </div>
      </div>`).join('');

    if(recStatus) recStatus.textContent = `${items.length} OPTAGELSE${items.length !== 1 ? 'R' : ''}`;
  } catch(err) {
    recList.innerHTML = `<div style="color:var(--red);font-size:12px;letter-spacing:2px;">// FEJL: ${escHtml(err.message)}</div>`;
    if(recStatus) recStatus.textContent = 'FEJL';
  }
}

function camPlayRecording(url, name) {
  // Create lightbox-style player
  let overlay = document.getElementById('cam-player-overlay');
  if(!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cam-player-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;';
    overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="max-width:90vw;width:800px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">
        <span>📼 ${escHtml(name)}</span>
        <button onclick="document.getElementById('cam-player-overlay').remove()" style="background:transparent;border:1px solid var(--border-bright);color:var(--text-dim);padding:5px 12px;font-family:'Share Tech Mono',monospace;cursor:pointer;font-size:12px;letter-spacing:2px;">✕ LUK</button>
      </div>
      <video src="${url}" controls autoplay style="width:100%;border:1px solid var(--border-bright);background:#000;display:block;"></video>
    </div>`;
}

async function camDeleteRecording(fullPath, name) {
  if(!confirm(`Slet optagelse: ${name}?`)) return;
  const { storage, ref, deleteObject, CONFIGURED } = window.__firebase;
  if(!CONFIGURED || !storage) return;
  try {
    await deleteObject(ref(storage, fullPath));
    camLoadRecordings();
  } catch(err) {
    alert('Fejl ved sletning: ' + err.message);
  }
}

// =====================================================================
// PROFILE PANEL: show live indicator + camera toggle
// =====================================================================
function camGetLiveIndicator() {
  return ''; // Observation is contractual — no UI indicator for subjects
}

// =====================================================================
// ADMIN: Add camera tab button in admin panel
// =====================================================================
function adminAddCameraTab() {
  if(!currentUser || !currentUser.isAdmin) return;
  if(state.tabs.find(t=>t.isCamera)) {
    showMsg('tab-msg','// KAMERA-TAB EKSISTERER ALLEREDE.');
    return;
  }
  const camTab = { id: 'camera', name: '📷 OVERVÅGNING', icon: '📷', isCamera: true };
  state.tabs.push(camTab);
  // Give all admins access
  state.users.forEach(u => { if(u.isAdmin && !u.tabs.includes('camera')) u.tabs.push('camera'); });
  saveState();
  renderTabs();
  switchTab('admin');
  showMsg('tab-msg','// KAMERA-TAB AKTIVERET.');
}

function adminRemoveCameraTab() {
  if(!currentUser || !currentUser.isAdmin) return;
  state.tabs = state.tabs.filter(t=>!t.isCamera);
  state.users.forEach(u=>{ u.tabs = u.tabs.filter(t=>t!=='camera'); });
  saveState();
  renderTabs();
  switchTab('admin');
  showMsg('tab-msg','// KAMERA-TAB FJERNET.');
}

// Hook into profile panel — inject camera control
const _origBuildProfilePanel = window.buildProfilePanel;
// We patch after DOM ready by wrapping the existing buildProfilePanel function later
function showMsg(id,msg) {
  const el=document.getElementById(id); if(!el) return;
  el.textContent=msg; setTimeout(()=>{if(el)el.textContent='';},3000);
}

function escHtml(str) {
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(str) {
  if(!str) return '';
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
