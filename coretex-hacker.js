// =====================================================================
// IMAGE UPLOAD
// =====================================================================
function handleImageUpload(event, ctx, tabId, folderId, entryId) {
  const files = event.target.files;
  if(!files||!files.length) return;
  Array.from(files).forEach(file => {
    if(!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if(ctx==='tab') {
        const tab = state.tabs.find(t=>t.id===tabId);
        if(!tab) return;
        if(!tab.images) tab.images=[];
        tab.images.push(dataUrl);
      } else if(ctx==='entry') {
        const tab = state.tabs.find(t=>t.id===tabId);
        if(!tab||!tab.folders) return;
        const folder = tab.folders.find(f=>f.id===folderId);
        if(!folder) return;
        const entry = folder.entries.find(e=>e.id===entryId);
        if(!entry) return;
        if(!entry.images) entry.images=[];
        entry.images.push(dataUrl);
      }
      saveState();
      renderTabs(); switchTab(activeTab);
    };
    reader.readAsDataURL(file);
  });
}

function removeImage(ctx, tabId, folderId, entryId, idx) {
  if(!confirm('Remove this image?')) return;
  if(ctx==='tab') {
    const tab = state.tabs.find(t=>t.id===tabId);
    if(tab&&tab.images) tab.images.splice(idx,1);
  } else {
    const tab = state.tabs.find(t=>t.id===tabId);
    if(!tab||!tab.folders) return;
    const folder = tab.folders.find(f=>f.id===folderId);
    if(!folder) return;
    const entry = folder.entries.find(e=>e.id===entryId);
    if(entry&&entry.images) entry.images.splice(idx,1);
  }
  saveState(); renderTabs(); switchTab(activeTab);
}

function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }

// Build the hacker "INFILTRATE ENTRY" button with cooldown state
function buildHackerEntryEditBtn(tabId, folderId, entryId) {
  const cost = getSelectedHackCost();
  const hasCredit = hackerHasCredit(cost);
  const myCredits = currentUser.isAdmin ? Infinity : hackerCredits(currentUser);

  if(!hasCredit && !currentUser.isAdmin) {
    return `<div style="color:var(--hacker-dim);font-size:12px;letter-spacing:2px;margin-top:12px;text-transform:uppercase;">⚡ NO CREDITS — NEED ${cost} TO INFILTRATE</div>`;
  }
  return `<div style="margin-top:12px;">
    <button class="hacker-btn" style="font-size:16px;" onclick="openHackerEntryEdit('${tabId}','${folderId}','${entryId}')">
      ⚡ INFILTRATE THIS ENTRY (COSTS ${cost} CREDIT${cost!==1?'S':''})
    </button>
  </div>
  <div id="hacker-entry-edit-${tabId}-${folderId}-${entryId}" style="display:none;margin-top:14px;">
    ${buildHackerEntryEditForm(tabId, folderId, entryId)}
  </div>`;
}

function buildHackerEntryEditForm(tabId, folderId, entryId) {
  const tab = state.tabs.find(t=>t.id===tabId);
  if(!tab) return '';
  const folder = tab.folders.find(f=>f.id===folderId);
  if(!folder) return '';
  const entry = folder.entries.find(e=>e.id===entryId);
  if(!entry) return '';
  return `<div class="hacker-panel" style="margin-top:0;">
    <div class="hacker-title" style="font-size:20px;">⚡ ENTRY INFILTRATION MODE</div>
    <p style="color:var(--hacker-dim);font-size:11px;letter-spacing:2px;margin-bottom:14px;text-transform:uppercase;">// EDITING: ${escHtml(entry.title)} — LVL ${getSelectedHackCost()} HACK — ${getSelectedHackCost()} CREDIT${getSelectedHackCost()!==1?'S':''} ON COMMIT</p>
    <div style="margin-bottom:14px;padding:10px;background:var(--bg3);border:1px solid var(--border-bright);">
      <div style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">// CANONICAL TEXT (what it says before your hack):</div>
      <div style="color:var(--text-bright);font-size:13px;line-height:1.7;white-space:pre-wrap;">${escHtml(entry.adminBody||entry.body||'')}</div>
    </div>
    <div style="margin-bottom:12px;">
      <label class="field-label" style="color:var(--hacker-dim);">YOUR HACKER OVERLAY (replaces what players see):</label>
      <textarea class="hacker-input" id="hedit-body-${tabId}-${folderId}-${entryId}" style="min-height:100px;resize:vertical;">${escHtml(entry.hackerBody||entry.adminBody||entry.body||'')}</textarea>
    </div>
    <div style="margin-bottom:12px;">
      <label class="field-label" style="color:var(--hacker-dim);">INJECT IMAGE (optional):</label>
      <label class="upload-zone" style="border-color:var(--hacker-dim);" for="hedit-img-${tabId}-${folderId}-${entryId}">📷 SELECT IMAGE TO INJECT</label>
      <input type="file" id="hedit-img-${tabId}-${folderId}-${entryId}" accept="image/*" style="display:none" onchange="previewHackerImg(event,'${tabId}','${folderId}','${entryId}')"/>
      <div id="hedit-img-preview-${tabId}-${folderId}-${entryId}" style="margin-top:8px;"></div>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="hacker-btn" onclick="saveHackerEntryEdit('${tabId}','${folderId}','${entryId}')">[ COMMIT INFILTRATION ]</button>
      <button class="hacker-btn" style="border-color:var(--border-bright);color:var(--text-dim);" onclick="document.getElementById('hacker-entry-edit-${tabId}-${folderId}-${entryId}').style.display='none'">[ ABORT ]</button>
    </div>
  </div>`;
}

let hackerEntryImgBuffer = {}; // keyed by entryId

function openHackerEntryEdit(tabId, folderId, entryId) {
  const el = document.getElementById(`hacker-entry-edit-${tabId}-${folderId}-${entryId}`);
  if(el) el.style.display = el.style.display==='none' ? 'block' : 'none';
}

function previewHackerImg(event, tabId, folderId, entryId) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    hackerEntryImgBuffer[entryId] = e.target.result;
    const prev = document.getElementById(`hedit-img-preview-${tabId}-${folderId}-${entryId}`);
    if(prev) prev.innerHTML = `<img src="${e.target.result}" style="max-width:200px;max-height:120px;border:1px solid var(--hacker);margin-top:4px;"/>`;
  };
  reader.readAsDataURL(file);
}

function saveHackerEntryEdit(tabId, folderId, entryId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.folders) return;
  const folder = tab.folders.find(f=>f.id===folderId); if(!folder) return;
  const entry = folder.entries.find(e=>e.id===entryId); if(!entry) return;

  if(entry.protected){ showMsg('hacker-msg','// BLOCKED: ENTRY IS PROTECTED'); return; }
  const cost = getSelectedHackCost();
  if(!hackerHasCredit(cost)){ showMsg('hacker-msg','// NO CREDITS — NEED '+cost+' CREDIT'+(cost!==1?'S':'')+'.'); return; }

  const bodyEl = document.getElementById(`hedit-body-${tabId}-${folderId}-${entryId}`);
  const newBody = bodyEl ? bodyEl.value : (entry.adminBody||entry.body);

  // Preserve canonical/admin text — only overlay changes
  if(!entry.adminBody) entry.adminBody = entry.body || '';

  entry.hackerBody = newBody;
  entry.hackerEdited = true;
  entry.hackerEditedBy = currentUser.alterEgo || currentUser.username;
  entry.hackerEditedAt = Date.now();
  entry.hackLevel = cost;
  // body shown to regular users = hacker overlay
  entry.body = newBody;

  if(hackerEntryImgBuffer[entryId]) {
    if(!entry.images) entry.images=[];
    entry.images.push(hackerEntryImgBuffer[entryId]);
    entry.hackerInjectedImg = true;
    delete hackerEntryImgBuffer[entryId];
  }

  spendHackerCredit(cost);
  hackerCooldowns['entryEdit'] = Date.now();
  hackerCooldowns['entryEditTarget'] = `${tabId}|${folderId}|${entryId}`;
  saveCooldowns(); saveState();
  renderTabs(); switchTab(activeTab);
}

function toggleProtect(tabId, folderId, entryId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.folders) return;
  const folder = tab.folders.find(f=>f.id===folderId); if(!folder) return;
  const entry = folder.entries.find(e=>e.id===entryId); if(!entry) return;
  entry.protected = !entry.protected;
  saveState(); renderTabs(); switchTab(activeTab);
}

function adminRestoreEntry(tabId, folderId, entryId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.folders) return;
  const folder = tab.folders.find(f=>f.id===folderId); if(!folder) return;
  const entry = folder.entries.find(e=>e.id===entryId); if(!entry) return;
  // Restore body to canonical admin text
  entry.body = entry.adminBody || entry.body;
  entry.hackerBody = '';
  delete entry.hackerEdited; delete entry.hackerEditedBy;
  delete entry.hackerInjectedImg;
  // Remove hacker-injected images (those added after originalImages)
  if(entry.originalImages !== undefined) {
    entry.images = JSON.parse(JSON.stringify(entry.originalImages));
    delete entry.originalImages;
  }
  delete entry.originalBody;
  saveState(); renderTabs(); switchTab(activeTab);
}

// =====================================================================
// ADMIN ENTRY EDIT (inline, dedicated form)
// =====================================================================
function buildAdminEntryEditForm(tabId, folderId, entryId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return '';
  const folder = tab.folders.find(f=>f.id===folderId); if(!folder) return '';
  const entry = folder.entries.find(e=>e.id===entryId); if(!entry) return '';
  const cyan = 'var(--cyan)';
  return `<div style="border:2px solid ${cyan};background:var(--bg2);padding:20px;box-shadow:0 0 16px rgba(0,255,255,0.1);">
    <div style="font-family:'VT323',monospace;font-size:22px;color:${cyan};letter-spacing:4px;margin-bottom:12px;text-transform:uppercase;">✏ ADMIN EDIT — ${escHtml(entry.title)}</div>
    <p style="color:var(--text-dim);font-size:11px;letter-spacing:2px;margin-bottom:16px;text-transform:uppercase;">// THIS IS THE CANONICAL TEXT. HACKER EDITS ARE SEPARATE AND CAN BE RESET.</p>
    <div style="margin-bottom:12px;">
      <label class="field-label">ENTRY TITLE:</label>
      <input class="retro-input" id="aedit-title-${tabId}-${folderId}-${entryId}" value="${escAttr(entry.title)}" style="border-color:${cyan};"/>
    </div>
    <div style="margin-bottom:12px;">
      <label class="field-label">CANONICAL TEXT (Admin base — this is the "true" content):</label>
      <textarea class="retro-textarea" id="aedit-body-${tabId}-${folderId}-${entryId}" style="min-height:120px;border-color:${cyan};">${escHtml(entry.adminBody||entry.body||'')}</textarea>
    </div>
    ${entry.hackerEdited ? `
    <div style="margin-bottom:12px;padding:10px;border:1px solid var(--hacker-dim);background:rgba(255,0,255,0.04);">
      <div style="font-size:10px;letter-spacing:2px;color:var(--hacker);text-transform:uppercase;margin-bottom:6px;">// CURRENT HACKER OVERLAY (visible to players):</div>
      <div style="color:var(--hacker);font-size:13px;line-height:1.7;white-space:pre-wrap;">${escHtml(entry.hackerBody||'')}</div>
      <button class="delete-btn" style="margin-top:8px;" onclick="adminRestoreEntry('${tabId}','${folderId}','${entryId}')">↩ RESET HACKER TEXT (restore canonical)</button>
    </div>` : ''}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;">
      <button class="save-btn" style="border-color:${cyan};color:${cyan};" onclick="saveAdminEntryEdit('${tabId}','${folderId}','${entryId}')">[ SAVE CANONICAL TEXT ]</button>
      <button class="hdr-btn" onclick="document.getElementById('admin-entry-edit-${tabId}-${folderId}-${entryId}').style.display='none'">[ CLOSE ]</button>
    </div>
    <span class="success-msg" id="aedit-msg-${tabId}-${folderId}-${entryId}" style="display:block;margin-top:8px;"></span>
  </div>`;
}

function openAdminEntryEdit(tabId, folderId, entryId) {
  const el = document.getElementById(`admin-entry-edit-${tabId}-${folderId}-${entryId}`);
  if(!el) return;
  el.innerHTML = buildAdminEntryEditForm(tabId, folderId, entryId);
  el.style.display = el.style.display==='none' ? 'block' : 'none';
}

function saveAdminEntryEdit(tabId, folderId, entryId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.folders) return;
  const folder = tab.folders.find(f=>f.id===folderId); if(!folder) return;
  const entry = folder.entries.find(e=>e.id===entryId); if(!entry) return;

  const titleEl = document.getElementById(`aedit-title-${tabId}-${folderId}-${entryId}`);
  const bodyEl = document.getElementById(`aedit-body-${tabId}-${folderId}-${entryId}`);
  if(titleEl) entry.title = titleEl.value.trim() || entry.title;
  if(bodyEl) {
    entry.adminBody = bodyEl.value;
    // Only update body if no hacker overlay active (so canonical is shown when no hack)
    if(!entry.hackerEdited) entry.body = bodyEl.value;
  }
  saveState();
  const msg = document.getElementById(`aedit-msg-${tabId}-${folderId}-${entryId}`);
  if(msg){ msg.textContent='// CANONICAL TEXT SAVED.'; setTimeout(()=>{if(msg)msg.textContent='';},3000); }
  renderTabs(); switchTab(activeTab);
}

// =====================================================================
// HACKER PANEL
// =====================================================================
function buildHackerPanel() {
  return `<div id="hacker-panel-inner"></div>`;
}

function buildHackLevelSelector() {
  const max = getHackerLevel(currentUser);
  const cur = getSelectedHackCost();
  if(currentUser.isAdmin) return ''; // admin has no level restriction
  let html = `<div style="margin-bottom:20px;padding:14px 18px;border:1px solid var(--hacker-dim);background:rgba(255,0,255,0.05);">
    <div style="font-size:10px;letter-spacing:3px;color:var(--hacker-dim);text-transform:uppercase;margin-bottom:10px;">// SELECT HACK STRENGTH FOR THIS SESSION:</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">`;
  for(let lvl = 1; lvl <= max; lvl++) {
    const active = cur === lvl;
    html += `<button onclick="setSelectedHackLevel(${lvl})" style="
      padding:10px 22px;background:${active?'rgba(255,0,255,0.25)':'rgba(255,0,255,0.07)'};
      border:2px solid ${active?'var(--hacker)':'var(--hacker-dim)'};
      color:${active?'var(--hacker)':'var(--hacker-dim)'};
      font-family:'VT323',monospace;font-size:20px;letter-spacing:3px;cursor:pointer;
      text-transform:uppercase;transition:all 0.2s;
      ${active?'box-shadow:0 0 14px rgba(255,0,255,0.4);text-shadow:0 0 8px var(--hacker);':''}
    ">LVL ${lvl}${active?' ◀':''}</button>`;
  }
  html += `</div>
    <div style="margin-top:10px;font-size:11px;letter-spacing:2px;color:var(--hacker-dim);text-transform:uppercase;">
      SELECTED: <span style="color:var(--hacker);">LEVEL ${cur} HACK</span> — COSTS <span style="color:var(--hacker);">${cur} CREDIT${cur!==1?'S':''}</span> TO PLACE · <span style="color:var(--text-dim);">REMOVAL COSTS SAME</span>
    </div>
  </div>`;
  return html;
}

function setSelectedHackLevel(lvl) {
  selectedHackLevel = lvl;
  refreshHackerPanel();
}

function refreshHackerPanel() {
  const el = document.getElementById('hacker-panel-inner');
  if(!el) return;
  const now = Date.now();
  const myLevel = getHackerLevel(currentUser);
  const myCost = getSelectedHackCost(); // the chosen hack strength
  const myCredits = currentUser.isAdmin ? Infinity : hackerCredits(currentUser);
  const hasCredit = hackerHasCredit(myCost);
  const minsLeft = 0;
  const isAdmin = !!currentUser.isAdmin;
  const hackableTabs = state.tabs.filter(t=>!t.isAdmin&&!t.isHacker&&!t.isProfile&&!t.isChat);

  // ---- CREDIT DISPLAY ----
  const panelBorder = isAdmin ? 'var(--amber)' : myCredits > 0 ? 'var(--green)' : 'var(--red)';
  const panelGlow   = isAdmin ? 'rgba(255,176,0,0.15)' : myCredits > 0 ? 'rgba(0,255,65,0.15)' : 'rgba(255,0,0,0.15)';
  const creditColor = isAdmin ? 'var(--amber)' : myCredits > 0 ? 'var(--green)' : 'var(--red)';
  const creditLabel = isAdmin ? '[ ∞ UNLIMITED — GAME MASTER ]' : `[ ${myCredits} CREDIT${myCredits!==1?'S':''} AVAILABLE — LEVEL ${myLevel} HACKER ]`;
  let html = `<div class="hacker-panel" style="border-color:${panelBorder};box-shadow:0 0 20px ${panelGlow};">
    <div class="hacker-title" style="color:${isAdmin?'var(--amber)':'var(--hacker)'};">⚡ SYSTEM INTRUSION TOOLKIT ⚡</div>
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:20px;">
      <div style="flex:1;min-width:200px;">
        <div style="font-size:11px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">// HACK CREDITS</div>
        <div style="font-family:'VT323',monospace;font-size:40px;line-height:1;color:${creditColor};text-shadow:0 0 15px ${creditColor};">
          ${creditLabel}
        </div>
        ${(!isAdmin) ? `
        <div style="margin-top:8px;">
          <div style="margin-top:6px;display:flex;gap:6px;align-items:center;">
            ${[...Array(Math.max(6,myCredits+1))].map((_,i)=>i<myCredits?`<div style="width:18px;height:18px;background:var(--green);border:1px solid var(--green);box-shadow:0 0 6px var(--green);"></div>`:`<div style="width:18px;height:18px;background:transparent;border:1px solid var(--border);"></div>`).join('')}
          </div>
          <div style="margin-top:10px;font-size:11px;letter-spacing:2px;color:var(--hacker-dim);text-transform:uppercase;">
            // LEVEL CAPABILITIES:
            <span style="color:${myLevel>=1?'var(--green)':'var(--text-dim)'};">LVL1: DEFACE + INFILTRATE</span> &nbsp;
            <span style="color:${myLevel>=2?'var(--hacker)':'var(--text-dim)'};">LVL2: LOCKOUT + FOLDERS</span> &nbsp;
            <span style="color:${myLevel>=3?'var(--red)':'var(--text-dim)'};">LVL3: COMMS + SHUTDOWN(10⚡)</span>
          </div>
        </div>` : `
        <div style="font-size:11px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;margin-top:6px;">// USE ON: DEFACE A NODE · LOCK OUT A USER · INFILTRATE AN ENTRY</div>`}
      </div>
    </div>

    ${!isAdmin ? buildHackLevelSelector() : ''}

    <!-- SECTION 1: DEFACE -->
    <div style="font-size:11px;letter-spacing:3px;color:var(--hacker-dim);text-transform:uppercase;margin-bottom:8px;">// TARGET NODE TO DEFACE (COSTS ${myCost} CREDIT${myCost!==1?'S':''}):</div>
    <div class="hacker-site-grid">`;

  hackableTabs.forEach(tab => {
    const defaced = !!state.defacements[tab.id];
    const defData = state.defacements[tab.id];
    const defLevel = defData ? (defData.hackLevel || 1) : 0;
    const clickable = hackerHasCredit(myCost);
    html += `<div class="hacker-site-card ${!clickable?'on-cooldown':''}" onclick="${clickable?'selectHackerTarget(\''+tab.id+'\')':''}" id="hacker-card-${tab.id}" style="${defaced?'border-color:var(--hacker);':''}">
      <div class="hacker-site-name">${tab.icon} ${escHtml(tab.name)}</div>
      ${defaced ? `<div style="font-size:10px;color:var(--hacker);margin-top:4px;letter-spacing:1px;animation:blink 2s step-end infinite;">[ DEFACED — LVL ${defLevel} ]</div>
      <div style="font-size:10px;color:var(--hacker-dim);letter-spacing:1px;">REMOVE COSTS: ${defLevel} CREDIT${defLevel!==1?'S':''}</div>` : `<div style="font-size:10px;color:var(--text-dim);margin-top:6px;letter-spacing:1px;">${hasCredit?'[ CLICK TO TARGET ]':'[ NO CREDITS ]'}</div>`}
    </div>`;
  });

  html += `</div>
    <div id="hacker-deface-area" style="display:none;margin-top:14px;">
      <div style="font-size:13px;color:var(--hacker);letter-spacing:2px;margin-bottom:12px;text-transform:uppercase;">// TARGET SELECTED: <span id="hacker-target-name"></span></div>
      <div class="hacker-deface-form">
        <label class="field-label" style="color:var(--hacker-dim);">DEFACE MESSAGE:</label>
        <input class="hacker-input" id="hacker-message" placeholder="Enter your defacement message..." maxlength="200"/>
        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
          <button class="hacker-btn" onclick="executeDeface()">[ EXECUTE — SPEND ${myCost} CREDIT${myCost!==1?'S':''} ]</button>
          <button class="hacker-btn" style="border-color:var(--border-bright);color:var(--text-dim);" onclick="clearDeface()">[ ABORT ]</button>
        </div>
      </div>
    </div>
    <div class="success-msg" id="hacker-msg"></div>
  </div>`;

  // ---- SECTION 2: LOCKOUT USERS ----
  const lockableUsers = state.users.filter(u=>!u.isAdmin && u.username!==currentUser.username);
  const canLockout = isAdmin || myLevel >= 2;
  html += `<div class="hacker-panel" style="margin-top:20px;${!canLockout&&!isAdmin?'opacity:0.4;':''}">
    <div class="hacker-title" style="font-size:22px;">🔐 USER LOCKOUT MODULE</div>
    <p style="color:var(--hacker-dim);font-size:12px;letter-spacing:2px;margin-bottom:14px;text-transform:uppercase;">
      // LOCK ANY NON-ADMIN USER — COSTS ${myCost} CREDIT${myCost!==1?'S':''} TO LOCK, COSTS LOCKOUT LEVEL TO UNLOCK
      ${!canLockout?'<br/><span style="color:var(--red);font-size:11px;">⛔ REQUIRES LEVEL 2 HACKER</span>':''}
    </p>
    <div class="hacker-site-grid">`;

  lockableUsers.forEach(user => {
    const lockData = hackerCooldowns['lock.'+user.username];
    const lockedOut = !!lockData;
    const lockLevel = lockData ? (lockData.hackLevel || 1) : 0;
    const canLock = canLockout && hackerHasCredit(myCost) && !lockedOut;

    const targetIsHacker = !!user.isHacker;
    html += `<div class="hacker-site-card ${!canLock&&!lockedOut?'on-cooldown':''}" style="${lockedOut?'border-color:var(--red);':targetIsHacker?'border-color:var(--hacker);border-style:dashed;':''}">
      <div class="hacker-site-name" style="color:${lockedOut?'var(--red)':'var(--hacker)'};">👤 ${escHtml(user.username)}${targetIsHacker?' <span style="font-size:9px;letter-spacing:1px;color:var(--hacker-dim);">[HACKER]</span>':''}</div>
      <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">${escHtml(user.role)}</div>
      ${lockedOut ? `
        <div style="font-size:10px;color:var(--red);margin-top:4px;letter-spacing:1px;animation:blink 1s step-end infinite;">[ LOCKED OUT — LVL ${lockLevel} HACK ]</div>
        <div style="font-size:10px;color:var(--red-dim);letter-spacing:1px;">UNLOCK COSTS: ${lockLevel} CREDIT${lockLevel!==1?'S':''}</div>
        ${myCredits >= lockLevel ? `<button class="hacker-btn" style="margin-top:8px;font-size:13px;padding:5px 12px;border-color:var(--green);color:var(--green);" onclick="hackUnlockUser('${escAttr(user.username)}')">[ UNLOCK — SPEND ${lockLevel} CREDIT${lockLevel!==1?'S':''} ]</button>` : ''}
      ` : `<div style="font-size:10px;color:var(--text-dim);margin-top:6px;letter-spacing:1px;">${canLockout&&hasCredit?'[ CLICK TO LOCK ]':canLockout?'[ NO CREDITS ]':'[ LVL 2 REQUIRED ]'}</div>`}
      ${canLock ? `<button class="hacker-btn" style="margin-top:8px;font-size:14px;padding:6px 14px;" onclick="hackLockUser('${escAttr(user.username)}')">[ LOCK OUT — SPEND ${myCost} CREDIT${myCost!==1?'S':''} ]</button>` : ''}
    </div>`;
  });

  html += `</div></div>`;

  // ---- SECTION 3: FOLDER LOCKDOWN ----
  const lockableFolderTabs = state.tabs.filter(t=>!t.isAdmin&&!t.isHacker&&!t.isProfile&&!t.isChat&&t.folders&&t.folders.length>0);
  const canLockFolders = isAdmin || myLevel >= 2;
  if(lockableFolderTabs.length > 0) {
    html += `<div class="hacker-panel" style="margin-top:20px;${!canLockFolders&&!isAdmin?'opacity:0.4;':''}">
      <div class="hacker-title" style="font-size:22px;">📁 FOLDER LOCKDOWN MODULE</div>
      <p style="color:var(--hacker-dim);font-size:12px;letter-spacing:2px;margin-bottom:14px;text-transform:uppercase;">
        // LOCK A FOLDER — USERS CANNOT ACCESS ITS CONTENTS — COSTS ${myCost} CREDIT${myCost!==1?'S':''}
        ${!canLockFolders?'<br/><span style="color:var(--red);font-size:11px;">⛔ REQUIRES LEVEL 2 HACKER</span>':''}
      </p>`;
    lockableFolderTabs.forEach(tab => {
      html += `<div style="margin-bottom:16px;">
        <div style="font-size:11px;color:var(--hacker-dim);letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">// ${escHtml(tab.name)}</div>
        <div class="hacker-site-grid">`;
      tab.folders.forEach(f => {
        const flKey = 'folderlock.'+tab.id+'.'+f.id;
        const flData = hackerCooldowns[flKey];
        const flLocked = !!flData;
        const flLevel = flData ? (flData.hackLevel || 1) : 0;
        const canLockFolder = canLockFolders && hackerHasCredit(myCost) && !flLocked;
        const canUnlockFolder = flLocked && myCredits >= flLevel;
        html += `<div class="hacker-site-card" style="${flLocked?'border-color:var(--hacker);border-style:dashed;':''}">
          <div class="hacker-site-name" style="color:${flLocked?'var(--hacker)':'var(--text-bright)'};">
            📁 ${escHtml(f.name)} ${flLocked?'<span style="font-size:9px;color:var(--hacker);animation:blink 1s step-end infinite;">⚡ LOCKED</span>':''}
          </div>
          <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">${tab.name}</div>
          ${flLocked ? `
            <div style="font-size:10px;color:var(--hacker);margin-top:4px;letter-spacing:1px;">[ LVL ${flLevel} HACK — REMOVE COSTS ${flLevel} CREDIT${flLevel!==1?'S':''} ]</div>
            ${canUnlockFolder ? `<button class="hacker-btn" style="margin-top:8px;font-size:13px;padding:5px 12px;border-color:var(--green);color:var(--green);" onclick="hackUnlockFolder('${escAttr(tab.id)}','${escAttr(f.id)}')">[ UNLOCK — SPEND ${flLevel} CREDIT${flLevel!==1?'S':''} ]</button>` : `<div style="font-size:10px;color:var(--red);margin-top:4px;letter-spacing:1px;">[ NEED ${flLevel} CREDITS TO UNLOCK ]</div>`}
          ` : `
            <div style="font-size:10px;color:var(--text-dim);margin-top:6px;letter-spacing:1px;">${hasCredit?'[ CLICK TO LOCK FOLDER ]':'[ NO CREDITS ]'}</div>
            ${canLockFolder ? `<button class="hacker-btn" style="margin-top:8px;font-size:13px;padding:5px 12px;" onclick="hackLockFolder('${escAttr(tab.id)}','${escAttr(f.id)}')">[ LOCK — SPEND ${myCost} CREDIT${myCost!==1?'S':''} ]</button>` : ''}
          `}
        </div>`;
      });
      html += `</div></div>`;
    });
    html += `</div>`;
  }

  // ---- SECTION 4: ENTRY INFILTRATION ----
  const editTarget = hackerCooldowns['entryEditTarget']||'—';
  html += `<div class="hacker-panel" style="margin-top:20px;">
    <div class="hacker-title" style="font-size:22px;">📝 ENTRY INFILTRATION</div>
    <p style="color:var(--hacker-dim);font-size:12px;letter-spacing:2px;margin-bottom:14px;text-transform:uppercase;">
      // NAVIGATE TO ANY ENTRY IN ANY TAB AND USE THE ⚡ INFILTRATE BUTTON — COSTS ${myCost} CREDIT${myCost!==1?'S':''}.
      // PROTECTED ENTRIES CANNOT BE ALTERED.
    </p>
    <div style="border:1px solid var(--hacker-dim);padding:16px;">
      <div style="color:var(--hacker);font-size:13px;letter-spacing:2px;text-transform:uppercase;">
        CREDIT STATUS: <span style="color:${currentUser.isAdmin?'var(--amber)':myCredits>0?'var(--green)':'var(--red)'};">${currentUser.isAdmin?'∞ UNLIMITED (GAME MASTER)':myCredits+' CREDIT'+(myCredits!==1?'S':'')+' AVAILABLE'}</span>
      </div>
      ${hackerCooldowns['entryEditTarget'] ? `<div style="color:var(--hacker-dim);font-size:11px;margin-top:6px;letter-spacing:1px;">LAST INFILTRATED: ${escHtml(editTarget)}</div>` : ''}
    </div>
  </div>`;

  // ---- SECTION 5: COMMS SABOTAGE ----
  const sabotage = state.commsSabotage;
  const isJammed = !!sabotage;
  const sabLevel = sabotage ? (sabotage.hackLevel || 1) : 0;
  const canJamComms = isAdmin || myLevel >= 3;
  html += `<div class="hacker-panel" style="margin-top:20px;border-color:var(--hacker);${!canJamComms&&!isAdmin?'opacity:0.4;':''}">
    <div class="hacker-title" style="font-size:22px;color:var(--hacker);">📡 COMMS SABOTAGE MODULE</div>
    <p style="color:var(--hacker-dim);font-size:12px;letter-spacing:2px;margin-bottom:14px;text-transform:uppercase;">
      // JAM ALLE KOMMUNIKATIONSKANALER — INGEN KAN SENDE ELLER MODTAGE — KOSTER ${myCost} CREDIT${myCost!==1?'S':''}
      ${!canJamComms?'<br/><span style="color:var(--red);font-size:11px;">⛔ REQUIRES LEVEL 3 HACKER</span>':''}
    </p>
    ${isJammed ? `
      <div style="border:1px solid var(--hacker);padding:16px;background:rgba(255,0,255,0.06);margin-bottom:14px;">
        <div style="font-family:'VT323',monospace;font-size:28px;color:var(--hacker);letter-spacing:4px;animation:glitch 0.8s infinite;">⚡ SIGNAL JAMMED</div>
        <div style="font-size:11px;color:var(--hacker-dim);letter-spacing:2px;text-transform:uppercase;margin-top:6px;">
          AKTIVERET AF: ${escHtml(sabotage.by)} &nbsp;|&nbsp; LVL ${sabLevel} HACK — REMOVAL COSTS ${sabLevel} CREDIT${sabLevel!==1?'S':''}
        </div>
      </div>
      ${isAdmin ? `<button class="hacker-btn" style="border-color:var(--green);color:var(--green);" onclick="adminLiftCommsSabotage()">[ OPHÆV SABOTAGE ]</button>` : myCredits >= sabLevel ? `<button class="hacker-btn" style="border-color:var(--green);color:var(--green);" onclick="hackUnjamComms()">[ UNJAM — SPEND ${sabLevel} CREDIT${sabLevel!==1?'S':''} ]</button>` : `<div style="color:var(--hacker-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;">// NEED ${sabLevel} CREDITS TO UNJAM</div>`}
    ` : `
      <div class="hacker-site-grid">
        <div class="hacker-site-card ${!canJamComms||!hasCredit?'on-cooldown':''}" style="border-color:var(--hacker);">
          <div class="hacker-site-name" style="color:var(--hacker);">📡 COMMS NETVÆRK</div>
          <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">Alle kanaler</div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:6px;letter-spacing:1px;">${canJamComms&&hasCredit?'[ KLAR TIL SABOTAGE ]':canJamComms?'[ INGEN CREDITS ]':'[ LVL 3 REQUIRED ]'}</div>
          ${canJamComms && hasCredit ? `<button class="hacker-btn" style="margin-top:8px;font-size:14px;padding:6px 14px;border-color:var(--hacker);color:var(--hacker);" onclick="hackJamComms()">[ JAM SIGNAL — BRUG ${myCost} CREDIT${myCost!==1?'S':''} ]</button>` : ''}
        </div>
      </div>
    `}
    <div class="success-msg" id="comms-jam-msg" style="margin-top:10px;"></div>
  </div>`;

  // ---- SECTION 6: SYSTEM SHUTDOWN ----
  const shutdownCost = 10;
  const canShutdown = isAdmin || myLevel >= 3;
  const isShutdown = !!state.systemShutdown;
  const shutdownData = state.systemShutdown;
  html += `<div class="hacker-panel" style="margin-top:20px;border-color:var(--red);box-shadow:0 0 20px rgba(255,34,34,0.15);${!canShutdown&&!isAdmin?'opacity:0.4;':''}">
    <div class="hacker-title" style="font-size:22px;color:var(--red);">💀 SYSTEM SHUTDOWN MODULE</div>
    <p style="color:rgba(255,34,34,0.6);font-size:12px;letter-spacing:2px;margin-bottom:14px;text-transform:uppercase;">
      // CLOSE THE ENTIRE SYSTEM FOR ALL NON-ADMIN USERS — COSTS ${shutdownCost} CREDITS — LASTS UNTIL MANUALLY RESTORED
      ${!canShutdown?'<br/><span style="color:var(--red);font-size:11px;">⛔ REQUIRES LEVEL 3 HACKER</span>':''}
    </p>
    ${isShutdown ? `
      <div style="border:2px solid var(--red);padding:20px;background:rgba(255,34,34,0.08);margin-bottom:14px;text-align:center;">
        <div style="font-family:'VT323',monospace;font-size:36px;color:var(--red);letter-spacing:6px;animation:glitch 1.2s infinite;text-shadow:0 0 20px var(--red);">⚠ SYSTEM OFFLINE ⚠</div>
        <div style="font-size:11px;color:var(--red-dim);letter-spacing:2px;text-transform:uppercase;margin-top:8px;">
          SHUTDOWN BY: ${escHtml(shutdownData.by)} &nbsp;|&nbsp; LVL ${shutdownData.hackLevel||3} HACK — RESTORE COSTS ${shutdownData.hackLevel||3} CREDITS
        </div>
      </div>
      ${isAdmin ? `<button class="hacker-btn" style="border-color:var(--green);color:var(--green);" onclick="adminRestoreSystem()">[ RESTORE SYSTEM ]</button>` 
        : myCredits >= (shutdownData.hackLevel||3) 
          ? `<button class="hacker-btn" style="border-color:var(--green);color:var(--green);" onclick="hackRestoreSystem()">[ RESTORE — SPEND ${shutdownData.hackLevel||3} CREDIT${(shutdownData.hackLevel||3)!==1?'S':''} ]</button>` 
          : `<div style="color:var(--red-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;">// NEED ${shutdownData.hackLevel||3} CREDITS TO RESTORE</div>`}
    ` : `
      <div class="hacker-site-grid">
        <div class="hacker-site-card ${!canShutdown||myCredits<shutdownCost?'on-cooldown':''}" style="border-color:var(--red);">
          <div class="hacker-site-name" style="color:var(--red);">💀 ENTIRE SYSTEM</div>
          <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">All nodes — full lockout</div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:6px;letter-spacing:1px;">${canShutdown&&myCredits>=shutdownCost?'[ READY — HIGH COST ]':canShutdown?`[ NEED ${shutdownCost} CREDITS ]`:'[ LVL 3 REQUIRED ]'}</div>
          ${canShutdown && (myCredits>=shutdownCost||isAdmin) ? `<button class="hacker-btn" style="margin-top:8px;font-size:14px;padding:6px 14px;border-color:var(--red);color:var(--red);" onclick="hackShutdownSystem()">[ SHUTDOWN — COST ${shutdownCost} CREDITS ]</button>` : ''}
        </div>
      </div>
    `}
    <div class="success-msg" id="shutdown-msg" style="margin-top:10px;"></div>
  </div>`;

  el.innerHTML = html;
}

function hackJamComms() {
  const cost = getSelectedHackCost();
  const myLevel = getHackerLevel(currentUser);
  if(myLevel < 3 && !currentUser.isAdmin){ showMsg('comms-jam-msg','// LEVEL 3 REQUIRED TO JAM COMMS.'); return; }
  if(!hackerHasCredit(cost)){ showMsg('comms-jam-msg','// INGEN CREDITS — KRÆVER '+cost+'.'); return; }
  if(state.commsSabotage){ showMsg('comms-jam-msg','// SIGNAL ALLEREDE JAMMED.'); return; }
  state.commsSabotage = { by: currentUser.alterEgo||currentUser.username, timestamp: Date.now(), adminLocked: false, hackLevel: cost };
  spendHackerCredit(cost);
  saveState();
  showMsg('comms-jam-msg','// SIGNAL JAMMED — '+cost+' CREDIT'+(cost!==1?'S':'')+' BRUGT.');
  setTimeout(()=>refreshHackerPanel(), 800);
}

function hackUnjamComms() {
  const sabotage = state.commsSabotage;
  if(!sabotage) return;
  const cost = sabotage.hackLevel || 1;
  if(!hackerHasCredit(cost)){ showMsg('comms-jam-msg','// KRÆVER '+cost+' CREDIT'+(cost!==1?'S':'')+'.');  return; }
  state.commsSabotage = null;
  spendHackerCredit(cost);
  saveState();
  showMsg('comms-jam-msg','// SIGNAL UNJAMMED — '+cost+' CREDIT'+(cost!==1?'S':'')+' BRUGT.');
  setTimeout(()=>{ refreshHackerPanel(); refreshChatPanel(); }, 800);
}

function adminActivateCommsSabotage() {
  state.commsSabotage = { by: currentUser.username, timestamp: Date.now(), adminLocked: true };
  saveState(); refreshChatPanel();
}

function adminLockCommsSabotage() {
  if(!state.commsSabotage) return;
  state.commsSabotage.adminLocked = true;
  saveState(); refreshChatPanel();
}

function adminLiftCommsSabotage() {
  state.commsSabotage = null;
  saveState(); refreshChatPanel(); refreshHackerPanel();
}

// =====================================================================
// SYSTEM SHUTDOWN (Level 3 Hack)
// =====================================================================
function hackShutdownSystem() {
  const cost = 10;
  if(!hackerHasCredit(cost) && !currentUser.isAdmin){ showMsg('shutdown-msg','// INSUFFICIENT CREDITS — NEED 10.'); return; }
  if(state.systemShutdown){ showMsg('shutdown-msg','// SYSTEM ALREADY OFFLINE.'); return; }
  const myLevel = getHackerLevel(currentUser);
  if(myLevel < 3 && !currentUser.isAdmin){ showMsg('shutdown-msg','// LEVEL 3 REQUIRED.'); return; }
  state.systemShutdown = { by: currentUser.alterEgo||currentUser.username, timestamp: Date.now(), hackLevel: myLevel };
  if(!currentUser.isAdmin) spendHackerCredit(cost);
  saveState();
  applySiteOverlay();
  showMsg('shutdown-msg','// SYSTEM SHUTDOWN EXECUTED — 10 CREDITS SPENT.');
  setTimeout(()=>refreshHackerPanel(), 800);
}

function hackRestoreSystem() {
  const sd = state.systemShutdown; if(!sd) return;
  const cost = sd.hackLevel || 3;
  if(!hackerHasCredit(cost)){ showMsg('shutdown-msg','// NEED '+cost+' CREDITS TO RESTORE.'); return; }
  state.systemShutdown = null;
  spendHackerCredit(cost);
  saveState();
  applySiteOverlay();
  showMsg('shutdown-msg','// SYSTEM RESTORED — '+cost+' CREDITS SPENT.');
  setTimeout(()=>refreshHackerPanel(), 800);
}

function adminRestoreSystem() {
  state.systemShutdown = null;
  saveState();
  applySiteOverlay();
  refreshHackerPanel();
  refreshAdminPanel();
}

function selectHackerTarget(tabId) {
  hackerTarget = tabId;
  const tab = state.tabs.find(t=>t.id===tabId);
  const area = document.getElementById('hacker-deface-area');
  if(!area) return;
  area.style.display='block';
  document.getElementById('hacker-target-name').textContent = tab ? tab.name.toUpperCase() : tabId;
  if(state.defacements[tabId]) {
    document.getElementById('hacker-message').value = state.defacements[tabId].text;
  } else {
    document.getElementById('hacker-message').value='';
  }
  document.getElementById('hacker-message').focus();
}

function executeDeface() {
  if(!hackerTarget) return;
  const cost = getSelectedHackCost();
  if(!hackerHasCredit(cost)){ showMsg('hacker-msg','// NO CREDITS — NEED '+cost+' CREDIT'+(cost!==1?'S':'')+'.'); return; }
  const msg = document.getElementById('hacker-message').value.trim();
  if(!msg){ showMsg('hacker-msg','// ERROR: MESSAGE REQUIRED'); return; }
  state.defacements[hackerTarget] = { text:msg, by:currentUser.alterEgo||currentUser.username, timestamp:Date.now(), hackLevel:cost };
  hackerCooldowns['deface.'+hackerTarget] = Date.now();
  spendHackerCredit(cost);
  saveCooldowns(); saveState();
  // Update tab button
  const btn = document.querySelector(`.tab-btn[data-id="${hackerTarget}"]`);
  if(btn) btn.classList.add('defaced');
  showMsg('hacker-msg','// DEFACE EXECUTED. TARGET COMPROMISED.');
  hackerTarget=null;
  setTimeout(()=>{ refreshHackerPanel(); renderTabs(); switchTab('hacker'); }, 1000);
}

function clearDeface() {
  hackerTarget=null;
  document.getElementById('hacker-deface-area').style.display='none';
}

function hackLockUser(username) {
  const user = state.users.find(u=>u.username===username);
  if(!user || user.isAdmin || user.username===currentUser.username) return;
  const myLevel = getHackerLevel(currentUser);
  if(myLevel < 2 && !currentUser.isAdmin){ showMsg('hacker-msg','// LEVEL 2 REQUIRED TO LOCK USERS.'); return; }
  const cost = getSelectedHackCost();
  if(!hackerHasCredit(cost)){ showMsg('hacker-msg','// NO CREDITS — NEED '+cost+'.'); return; }
  const cdKey = 'lock.'+username;
  if(hackerCooldowns[cdKey]) return; // already locked
  hackerCooldowns[cdKey] = { timestamp: Date.now(), hackLevel: cost };
  spendHackerCredit(cost);
  saveCooldowns();
  showMsg('hacker-msg','// LOCKOUT EXECUTED — '+cost+' CREDIT'+(cost!==1?'S':'')+' SPENT.');
  setTimeout(()=>refreshHackerPanel(), 800);
}

function hackLockFolder(tabId, folderId) {
  const myLevel = getHackerLevel(currentUser);
  if(myLevel < 2 && !currentUser.isAdmin){ showMsg('hacker-msg','// LEVEL 2 REQUIRED TO LOCK FOLDERS.'); return; }
  const cost = getSelectedHackCost();
  if(!hackerHasCredit(cost)){ showMsg('hacker-msg','// NO CREDITS — NEED '+cost+'.'); return; }
  const flKey = 'folderlock.'+tabId+'.'+folderId;
  if(hackerCooldowns[flKey]) return;
  hackerCooldowns[flKey] = { timestamp: Date.now(), hackLevel: cost };
  spendHackerCredit(cost);
  saveCooldowns();
  showMsg('hacker-msg','// FOLDER LOCKED — '+cost+' CREDIT'+(cost!==1?'S':'')+' SPENT.');
  setTimeout(()=>{ refreshHackerPanel(); renderTabs(); if(activeTab) switchTab(activeTab); }, 800);
}

function hackUnlockFolder(tabId, folderId) {
  const flKey = 'folderlock.'+tabId+'.'+folderId;
  const flData = hackerCooldowns[flKey];
  if(!flData) return;
  const cost = flData.hackLevel || 1;
  if(!hackerHasCredit(cost)){ showMsg('hacker-msg','// NEED '+cost+' CREDIT'+(cost!==1?'S':'')+' TO UNLOCK.'); return; }
  delete hackerCooldowns[flKey];
  spendHackerCredit(cost);
  saveCooldowns();
  showMsg('hacker-msg','// FOLDER UNLOCKED — '+cost+' CREDIT'+(cost!==1?'S':'')+' SPENT.');
  setTimeout(()=>{ refreshHackerPanel(); renderTabs(); if(activeTab) switchTab(activeTab); }, 800);
}

function hackUnlockUser(username) {
  const cdKey = 'lock.'+username;
  const lockData = hackerCooldowns[cdKey];
  if(!lockData) return;
  const cost = lockData.hackLevel || 1;
  if(!hackerHasCredit(cost)){ showMsg('hacker-msg','// NEED '+cost+' CREDIT'+(cost!==1?'S':'')+' TO UNLOCK.'); return; }
  delete hackerCooldowns[cdKey];
  spendHackerCredit(cost);
  saveCooldowns();
  showMsg('hacker-msg','// USER UNLOCKED — '+cost+' CREDIT'+(cost!==1?'S':'')+' SPENT.');
  setTimeout(()=>refreshHackerPanel(), 800);
}

function removeDeface() {
  if(!hackerTarget) return;
  delete state.defacements[hackerTarget];
  saveState();
  showMsg('hacker-msg','// DEFACEMENT REMOVED.');
  hackerTarget=null;
  setTimeout(()=>{ refreshHackerPanel(); renderTabs(); switchTab('hacker'); },800);
}

// Auto-refresh hacker panel to update cooldowns
setInterval(()=>{
  if(activeTab==='hacker') refreshHackerPanel();
}, 30000);

// =====================================================================
// PROFILE PANEL
// =====================================================================
function buildProfilePanel() {
  return `<div id="profile-inner"></div>`;
}

function refreshProfilePanel() {
  const el = document.getElementById('profile-inner');
  if(!el) return;
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">👤 YOUR PROFILE</div>
      <div class="page-desc">// MANAGE YOUR ACCOUNT SETTINGS</div>
    </div>
    <div class="profile-section">
      <div class="admin-title" style="color:var(--green)">// ACCOUNT DETAILS</div>
      <div class="profile-grid">
        <div>
          <label class="field-label">New Username</label>
          <input class="retro-input" id="prof-username" value="${escAttr(currentUser.username)}" placeholder="New handle..."/>
        </div>
        <div>
          <label class="field-label">Role / Tags</label>
          <div style="padding:9px 12px;border:1px solid var(--border);background:var(--bg3);color:var(--text-dim);font-family:'Share Tech Mono',monospace;font-size:14px;letter-spacing:1px;">
            ${(currentUser.tags||[currentUser.role]).map((t,i)=>`<span style="border:1px solid ${i===0?'var(--cyan)':'var(--border-bright)'};padding:2px 8px;font-size:11px;color:${i===0?'var(--cyan)':'var(--text-dim)'};margin-right:4px;">${escHtml(t)}${i===0?' ★':''}</span>`).join('')}
          </div>
        </div>
        <div>
          <label class="field-label">New Password</label>
          <input class="retro-input" type="password" id="prof-password" placeholder="Leave blank to keep current..."/>
        </div>
        <div>
          <label class="field-label">Confirm Password</label>
          <input class="retro-input" type="password" id="prof-password2" placeholder="Confirm new password..."/>
        </div>
        ${true ? `
        <div style="grid-column:1/-1;">
          <label class="field-label" style="color:${currentUser.isHacker?'var(--hacker)':currentUser.isCriminal?'var(--red)':'var(--green-dim)'};">Alter Ego <span style="color:var(--text-dim);font-size:9px;letter-spacing:1px;">(used in shadow channels & infiltrations — leave blank to use your username)</span></label>
          <input class="retro-input" id="prof-alterego" value="${escAttr(currentUser.alterEgo||'')}" placeholder="Your alias..." style="border-color:${currentUser.isHacker?'var(--hacker-dim)':currentUser.isCriminal?'var(--red-dim)':'var(--border-bright)'};color:${currentUser.isHacker?'var(--hacker)':currentUser.isCriminal?'var(--red)':'var(--text-bright)'};caret-color:${currentUser.isHacker?'var(--hacker)':'var(--green)'};"/>
        </div>` : ''}
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;align-items:center;">
        <button class="add-btn" onclick="saveProfile()">[ SAVE CHANGES ]</button>
        <span class="success-msg" id="profile-msg" style="text-align:left;margin-top:0;"></span>
      </div>
    </div>
    <div class="profile-section">
      <div class="admin-title" style="color:var(--green)">// CURRENT SESSION</div>
      <div style="font-size:13px;color:var(--text-dim);letter-spacing:1px;line-height:2;">
        <div>USERNAME : <span style="color:var(--text-bright)">${escHtml(currentUser.username)}</span></div>
        <div>ROLE     : <span style="color:var(--text-bright)">${escHtml(currentUser.role)}</span></div>
        <div>TAGS     : <span style="color:var(--text-bright)">${(currentUser.tags||[currentUser.role]).join(' · ')}</span></div>
        <div>ACCESS   : <span style="color:var(--text-bright)">${currentUser.tabs.filter(t=>t!=='admin'&&t!=='hacker'&&t!=='profile').join(', ')}</span></div>
        <div>TYPE     : <span style="color:${currentUser.isAdmin?'var(--amber)':currentUser.isHacker?'var(--hacker)':'var(--green)'}">${currentUser.isAdmin?'ADMIN':currentUser.isHacker?'HACKER':'STANDARD'}</span></div>
      </div>
    </div>
    ${!currentUser.isAdmin ? `
    <div class="profile-section" style="border-color:var(--cortex-accent);">
      <div class="admin-title" style="color:var(--cortex-accent);">// CORTEX IDENT</div>
      ${renderLinkedIdentCard(currentUser.username)}
    </div>
    <div class="profile-section" style="border-color:var(--market-sell);">
      <div class="admin-title" style="color:var(--market-sell);">// CREDITS</div>
      ${renderCreditsWidget(currentUser.username)}
    </div>` : ''}
    ${camGetLiveIndicator()}`;
}

function saveProfile() {
  const newUser = document.getElementById('prof-username').value.trim();
  const newPass = document.getElementById('prof-password').value;
  const newPass2 = document.getElementById('prof-password2').value;

  if(!newUser){ showMsg('profile-msg','// USERNAME CANNOT BE EMPTY'); return; }

  const conflict = state.users.find(u=>u.username.toLowerCase()===newUser.toLowerCase() && u!==currentUser);
  if(conflict){ showMsg('profile-msg','// USERNAME ALREADY TAKEN'); return; }

  if(newPass && newPass!==newPass2){ showMsg('profile-msg','// PASSWORDS DO NOT MATCH'); return; }

  currentUser.username = newUser;
  if(newPass) currentUser.password = newPass;
  const egoEl = document.getElementById('prof-alterego');
  if(egoEl) currentUser.alterEgo = egoEl.value.trim();

  saveState();
  document.getElementById('header-username').textContent = currentUser.username;
  showMsg('profile-msg','// PROFILE UPDATED.');
  refreshProfilePanel();
}

// =====================================================================
// CHAT PANEL
// =====================================================================
let activeChatChannel = null;

function buildChatPanel() {
  return `<div id="chat-panel-inner"></div>`;
}

function refreshChatPanel() {
  const el = document.getElementById('chat-panel-inner');
  if(!el) return;

  // Check comms sabotage — admins always see normal view
  const sabotage = state.commsSabotage;
  const isJammed = sabotage && !currentUser.isAdmin;
  if(isJammed) {
    el.innerHTML = `
      <div class="page-header">
        <div class="page-title" style="color:var(--hacker)">💬 COMMUNICATIONS</div>
        <div class="page-desc" style="color:var(--hacker-dim)">// SIGNAL FORSTYRRET</div>
      </div>
      <div class="comms-jammed">
        <div class="comms-jammed-title">⚡ SIGNAL JAMMED ⚡</div>
        <div class="comms-jammed-sub">// ALLE KANALER FORSTYRRET — KOMMUNIKATION UMULIG — HACK LVL ${sabotage.hackLevel||1}</div>
        <div style="margin-top:16px;font-size:11px;color:var(--hacker-dim);letter-spacing:2px;">FORSTYRRET AF: ${escHtml(sabotage.by||'UKENDT')}</div>
      </div>`;
    return;
  }

  // Filter channels the current user can see
  const allChannels = Object.values(state.chats||{});

  // Helper: does current user have access to read/write this channel?
  function userCanAccessChannel(ch) {
    if(currentUser.isAdmin) return true;
    if(ch.access === 'hacker') return !!currentUser.isHacker;
    if(ch.access === 'shadow') return currentUser.tabs.includes('shadow') || currentUser.isHacker || currentUser.isAdmin || currentUser.isCriminal;
    if(ch.access === 'roles' || ch.access === 'exclusive') {
      const fresh = state.users.find(u=>u.username===currentUser.username);
      const myTags = (fresh||currentUser).tags || [(fresh||currentUser).role] || [];
      return (ch.roles||[]).some(r => myTags.includes(r));
    }
    return true;
  }

  // All channel types are hidden if user lacks access
  const visibleChannels = allChannels.filter(ch => userCanAccessChannel(ch));

  if(!activeChatChannel || !state.chats[activeChatChannel] || !visibleChannels.find(c=>c.id===activeChatChannel)) {
    activeChatChannel = visibleChannels.length ? visibleChannels[0].id : null;
  }

  const activeChannel = activeChatChannel ? state.chats[activeChatChannel] : null;
  const isShadow = activeChannel && !!activeChannel.shadowMode;

  // Determine display name for current user
  function getDisplayName(ch) {
    if(!ch) return currentUser.username;
    // Open Comms: always use real username, no alter ego
    if(ch.id === 'open_comms') return currentUser.username;
    if(ch && ch.shadowMode) {
      // Shadow Network: hackers MUST use alter ego, others show username
      if(currentUser.isHacker) return currentUser.alterEgo || null; // null = not set
      return currentUser.alterEgo || currentUser.username;
    }
    // Other channels: use alter ego if set
    return (currentUser.alterEgo) ? currentUser.alterEgo : currentUser.username;
  }

  const displayName = getDisplayName(activeChannel);

  // Build channel tabs
  let tabsHtml = `<div class="chat-tabs">`;
  visibleChannels.forEach(ch => {
    const isActive = activeChatChannel === ch.id;
    const shadowStyle = ch.shadowMode ? `style="color:var(--hacker);${isActive?'border-bottom-color:var(--hacker);background:rgba(255,0,255,0.06);':''};"` : '';
    tabsHtml += `<button class="chat-tab-btn ${isActive?'active':''}" ${shadowStyle} onclick="switchChatChannel('${ch.id}')">${ch.icon} ${escHtml(ch.name)}</button>`;
  });
  tabsHtml += `</div>`;

  // Build each channel pane
  let panesHtml = '';
  visibleChannels.forEach(ch => {
    const isActive = activeChatChannel === ch.id;
    const msgs = (ch.messages||[]);
    const msgsHtml = msgs.length === 0
      ? `<div style="color:${ch.shadowMode?'var(--hacker-dim)':'var(--text-dim)'};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:auto;text-align:center;">// NO TRANSMISSIONS ON THIS CHANNEL</div>`
      : msgs.map(m => {
          const isShadowMsg = !!ch.shadowMode;
          const mSenderClass = isShadowMsg ? 'shadow-sender' : (m.isAdmin ? 'admin-sender' : m.isHacker ? 'hacker-sender' : '');
          const mBodyClass = isShadowMsg ? 'chat-msg-body shadow-msg-body' : 'chat-msg-body';
          return `<div class="chat-msg">
            <div class="chat-msg-meta">
              <span class="chat-sender ${mSenderClass}">${escHtml(m.sender)}</span>
              <span style="margin-left:8px;color:var(--text-dim);">${m.time}</span>
              ${currentUser.isAdmin && m.realSender && m.realSender!==m.sender ? `<span style="color:var(--text-dim);font-size:9px;margin-left:6px;">(${escHtml(m.realSender)})</span>` : ''}
            </div>
            <div class="${mBodyClass}">${escHtml(m.text)}</div>
          </div>`;
        }).join('');

    // Input area - check if shadow mode requires alter ego
    const dn = getDisplayName(ch);
    const needsEgo = ch.shadowMode && !dn;
    const inputColor = ch.shadowMode ? 'var(--hacker)' : 'var(--cyan)';
    const inputArea = needsEgo
      ? `<div class="shadow-no-ego">⚠ YOU MUST SET AN ALTER EGO IN YOUR PROFILE BEFORE TRANSMITTING ON THE SHADOW NETWORK. <button class="hacker-btn" style="font-size:13px;padding:4px 12px;margin-left:10px;" onclick="switchTab('profile')">[ SET EGO → ]</button></div>`
      : `<div class="chat-input-row">
          <span style="color:${inputColor};font-size:13px;white-space:nowrap;letter-spacing:1px;">${escHtml(dn||currentUser.username)}&gt;</span>
          <input class="chat-input" id="chat-input-${ch.id}" placeholder="${ch.shadowMode?'Transmit encrypted...':'Transmit message...'}" maxlength="500"
            onkeydown="if(event.key==='Enter')sendChatMessage('${ch.id}')"
            style="${ch.shadowMode?'border-color:var(--hacker-dim);caret-color:var(--hacker);':''}"/>
          <button class="chat-send-btn" style="border-color:${inputColor};color:${inputColor};${ch.shadowMode?'background:rgba(255,0,255,0.1);':''}" onclick="sendChatMessage('${ch.id}')">[ SEND ]</button>
        </div>`;

    const shadowHeader = ch.shadowMode ? `
      <div class="shadow-chat-header">
        <div class="shadow-chat-title">🌑 SHADOW NETWORK</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="shadow-chat-tag">ENCRYPTED</span>
          <span class="shadow-chat-tag">ALTER EGO REQUIRED</span>
        </div>
      </div>` : '';

    panesHtml += `<div class="chat-pane ${isActive?'active':''}" id="chat-pane-${ch.id}" style="${ch.shadowMode?'border:none;':''}">
      ${shadowHeader}
      <div class="chat-messages" id="chat-msgs-${ch.id}" style="${ch.shadowMode?'background:rgba(20,0,20,0.6);':''}">${msgsHtml}</div>
      ${inputArea}
    </div>`;
  });

  const wrapStyle = isShadow ? 'shadow-chat-wrap' : '';
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:${isShadow?'var(--hacker)':'var(--cyan)'}">
        ${isShadow ? '🌑 SHADOW NETWORK' : '💬 COMMUNICATIONS'}
      </div>
      <div class="page-desc" style="color:${isShadow?'var(--hacker-dim)':''}">
        ${isShadow ? '// ENCRYPTED CHANNEL — IDENTITIES MASKED — ALTER EGOS ONLY' : '// SECURE CHANNEL NETWORK — TRANSMIT WITH CARE'}
      </div>
    </div>
    <div class="${wrapStyle}" style="border:${isShadow?'2px solid var(--hacker)':'1px solid var(--cyan)'};box-shadow:${isShadow?'0 0 20px rgba(255,0,255,0.15)':'0 0 12px rgba(0,255,255,0.08)'};">
      ${tabsHtml}
      ${panesHtml}
    </div>
    ${currentUser.isAdmin ? `
    <div style="margin-top:12px;padding:14px 16px;border:1px solid var(--hacker-dim);background:rgba(255,0,255,0.04);">
      <div style="font-size:11px;color:var(--hacker);letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">// ADMIN: COMMS SABOTAGE KONTROL</div>
      ${state.commsSabotage
        ? `<div style="font-size:12px;color:var(--hacker);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">⚡ AKTIV SABOTAGE — AF: ${escHtml(state.commsSabotage.by)} ${state.commsSabotage.adminLocked ? '[ ADMIN-LÅST — INGEN UDLØBSTID ]' : '[ HACKER — UDLØBER AUTO ]'}</div>
           <button class="hacker-btn" style="border-color:var(--green);color:var(--green);" onclick="adminLiftCommsSabotage()">[ OPHÆV SABOTAGE ]</button>
           ${!state.commsSabotage.adminLocked ? `<button class="hacker-btn" style="margin-left:10px;" onclick="adminLockCommsSabotage()">[ LÅS PERMANENT ]</button>` : ''}`
        : `<div style="font-size:12px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">// INGEN AKTIV SABOTAGE</div>
           <button class="hacker-btn" onclick="adminActivateCommsSabotage()">[ AKTIVER SABOTAGE — INGEN UDLØBSTID ]</button>`}
    </div>` : ''}`;

  // Scroll to bottom of active channel
  if(activeChatChannel) {
    const msgEl = document.getElementById('chat-msgs-'+activeChatChannel);
    if(msgEl) setTimeout(()=>{ msgEl.scrollTop = msgEl.scrollHeight; }, 50);
  }
}

function switchChatChannel(channelId) {
  activeChatChannel = channelId;
  refreshChatPanel();
}

function sendChatMessage(channelId) {
  const inputEl = document.getElementById('chat-input-'+channelId);
  if(!inputEl) return;
  const text = inputEl.value.trim();
  if(!text) return;
  const ch = state.chats[channelId];
  if(!ch) return;

  // Shadow Network: everyone MUST have an alter ego set
  if(ch.shadowMode && !currentUser.alterEgo) {
    showMsg('chat-warn-'+channelId, '// ALTER EGO REQUIRED — SET ONE IN YOUR PROFILE');
    return;
  }

  // Determine sender display name
  let displayName;
  if(ch.id === 'open_comms') {
    // Open Comms: always real username
    displayName = currentUser.username;
  } else if(ch.shadowMode) {
    displayName = currentUser.alterEgo || currentUser.username;
  } else {
    displayName = (currentUser.alterEgo) ? currentUser.alterEgo : currentUser.username;
  }

  const now = new Date();
  const time = now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

  const msg = {
    id: 'msg_'+Date.now(),
    sender: displayName,
    realSender: currentUser.username,
    text: text,
    time: time,
    isAdmin: !!currentUser.isAdmin,
    isHacker: !!currentUser.isHacker,
    isShadow: !!ch.shadowMode
  };

  if(!ch.messages) ch.messages = [];
  ch.messages.push(msg);
  saveState('chat');

  inputEl.value = '';
  refreshChatPanel();
}

