// =====================================================================
// NEWSPAPER PANEL
// =====================================================================
function isOrdensmagt() {
  if(!currentUser) return false;
  if(currentUser.isAdmin) return true;
  const tags = (currentUser.tags || [currentUser.role]).map(t => t.toLowerCase());
  return tags.includes('ordensmagt');
}

function isJournalist() {
  if(!currentUser) return false;
  if(currentUser.isAdmin) return true;
  const tags = (currentUser.tags || [currentUser.role]).map(t => t.toLowerCase());
  return tags.includes('journalist');
}

function buildNewspaperPanel(tab) {
  const articles = tab.articles || [];
  const canEdit = isJournalist() || (currentUser && currentUser.isModerator);
  const canSeeCriminal = isOrdensmagt();

  let html = `<div class="page-header">
    <div class="page-title" style="color:var(--amber)">📰 ${escHtml(tab.name)}</div>
    <div class="page-desc">// NYHEDER — SENESTE UDGAVE</div>
  </div>
  ${buildDefacementBanner(tab.id)}`;

  // Admin: add article form
  if(canEdit) {
    html += `<div class="news-admin-form">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div>
          <label class="field-label">Overskrift</label>
          <input class="retro-input" id="newart-title" placeholder="Artiklens overskrift..." style="border-color:var(--amber);"/>
        </div>
        <div>
          <label class="field-label">Forfatter / Kilde</label>
          <input class="retro-input" id="newart-author" placeholder="Red. / Korrespondent..." style="border-color:var(--amber);"/>
        </div>
        <div>
          <label class="field-label">Dato (IC)</label>
          <input class="retro-input" id="newart-date" placeholder="// DATO: ..." style="border-color:var(--amber);"/>
        </div>
      </div>
      <label class="field-label">Brødtekst</label>
      <textarea class="retro-textarea" id="newart-body" placeholder="Artiklens indhold..." style="min-height:100px;border-color:var(--amber);"></textarea>
      <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="save-btn" style="border-color:var(--amber);color:var(--amber);" onclick="addNewsArticle('${tab.id}')">+ UDGIV ARTIKEL</button>
        <span class="success-msg" id="newart-msg"></span>
      </div>
    </div>`;
  }

  if(articles.length === 0) {
    html += `<div style="color:var(--text-dim);font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:20px 0;">// INGEN ARTIKLER ENDNU — BLADET ER TOMT</div>`;
  } else {
    // Newest first
    const sorted = [...articles].reverse();
    sorted.forEach(art => {
      html += `<div class="article-card">
        <div class="article-header">
          <div class="article-title">${escHtml(art.title)}</div>
          <div class="article-meta">${escHtml(art.author||'Red.')} &nbsp;|&nbsp; ${escHtml(art.date||'')}</div>
        </div>
        <div class="article-body">${escHtml(art.body||'')}</div>`;

      // Article images
      if(art.images && art.images.length) {
        html += `<div class="article-images">${art.images.map((img,i)=>`
          <img src="${img}" alt="" onclick="openLightbox('${escAttr(img)}')" title="Forstør"/>
          ${canEdit ? `<button class="delete-btn" style="display:block;margin-top:2px;font-size:9px;" onclick="removeArticleImage('${tab.id}','${art.id}',${i})">✕</button>` : ''}
        `).join('')}</div>`;
      }

      // Admin controls
      if(canEdit) {
        const isOwnArticle = currentUser.isAdmin || art.authorUsername === currentUser.username;
        html += `<div style="padding:8px 22px 14px;display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--border);">
          <label class="upload-zone" style="font-size:10px;padding:5px 12px;" for="artimg-${art.id}">📷 TILFØJ BILLEDE</label>
          <input type="file" id="artimg-${art.id}" accept="image/*" multiple style="display:none" onchange="handleArticleImageUpload(event,'${tab.id}','${art.id}')"/>
          ${isOwnArticle ? `<button class="delete-btn" style="font-size:10px;" onclick="deleteNewsArticle('${tab.id}','${art.id}')">✕ SLET ARTIKEL</button>` : ''}
        </div>`;
      }

      html += `</div>`; // close article-card
    });
  }

  return html;
}

function toggleCriminalEdit(tabId, artId) {
  const editDiv = document.getElementById('criminal-edit-'+artId);
  if(!editDiv) return;
  editDiv.style.display = editDiv.style.display==='none' ? 'block' : 'none';
}

function toggleCriminalEntryEdit(tabId, folderId, entryId) {
  const editDiv = document.getElementById('criminal-entry-edit-'+entryId);
  if(!editDiv) return;
  editDiv.style.display = editDiv.style.display==='none' ? 'block' : 'none';
}

function saveCriminalEntryNotes(tabId, folderId, entryId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.folders) return;
  const folder = tab.folders.find(f=>f.id===folderId); if(!folder) return;
  const entry = folder.entries.find(e=>e.id===entryId); if(!entry) return;
  const ta = document.getElementById('criminal-entry-textarea-'+entryId);
  if(!ta) return;
  entry.criminalNotes = ta.value;
  saveState();
  showMsg('criminal-entry-msg-'+entryId, '// SAGSNOTER GEMT.');
  renderTabs(); switchTab(activeTab);
}

function saveCriminalNotes(tabId, artId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.articles) return;
  const art = tab.articles.find(a=>a.id===artId); if(!art) return;
  const ta = document.getElementById('criminal-textarea-'+artId);
  if(!ta) return;
  art.criminalNotes = ta.value;
  saveState();
  showMsg('criminal-msg-'+artId, '// SAGSNOTER GEMT.');
  // Refresh panel
  const panel = document.getElementById('panel-'+tabId);
  if(panel) panel.innerHTML = buildNewspaperPanel(tab);
}

function addNewsArticle(tabId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const title = document.getElementById('newart-title').value.trim();
  if(!title){ showMsg('newart-msg','// OVERSKRIFT KRÆVES.'); return; }
  const author = document.getElementById('newart-author').value.trim() || 'Red.';
  const date = document.getElementById('newart-date').value.trim() || ('// DATO: '+new Date().toLocaleDateString('da-DK'));
  const body = document.getElementById('newart-body').value.trim();
  if(!tab.articles) tab.articles = [];
  tab.articles.push({ id:'art_'+Date.now(), title, author, date, body, authorUsername: currentUser.username, criminalNotes:'', images:[] });
  saveState();
  const panel = document.getElementById('panel-'+tabId);
  if(panel) panel.innerHTML = buildNewspaperPanel(tab);
  showMsg('newart-msg','// ARTIKEL UDGIVET.');
}

function deleteNewsArticle(tabId, artId) {
  if(!confirm('Slet denne artikel?')) return;
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.articles) return;
  tab.articles = tab.articles.filter(a=>a.id!==artId);
  saveState();
  const panel = document.getElementById('panel-'+tabId);
  if(panel) panel.innerHTML = buildNewspaperPanel(tab);
}

function handleArticleImageUpload(event, tabId, artId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.articles) return;
  const art = tab.articles.find(a=>a.id===artId); if(!art) return;
  const files = Array.from(event.target.files);
  let loaded = 0;
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = e => {
      if(!art.images) art.images=[];
      art.images.push(e.target.result);
      loaded++;
      if(loaded===files.length){ saveState(); const p=document.getElementById('panel-'+tabId); if(p)p.innerHTML=buildNewspaperPanel(tab); }
    };
    reader.readAsDataURL(file);
  });
}

function removeArticleImage(tabId, artId, idx) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.articles) return;
  const art = tab.articles.find(a=>a.id===artId); if(!art||!art.images) return;
  art.images.splice(idx,1);
  saveState();
  const p=document.getElementById('panel-'+tabId); if(p)p.innerHTML=buildNewspaperPanel(tab);
}

// =====================================================================
// SYSNEWS PANEL
// =====================================================================
function buildSysNewsPanel(tab) {
  const entries = tab.entries || [];
  const canEdit = currentUser.isAdmin || currentUser.isModerator;

  let html = `<div class="page-header">
    <div class="page-title" style="color:var(--cyan)">📡 ${escHtml(tab.name)}</div>
    <div class="page-desc">// SYSTEM BROADCASTS — OFFICIELLE MEDDELELSER</div>
  </div>
  ${buildDefacementBanner(tab.id)}`;

  if(canEdit) {
    html += `<div style="border:1px solid var(--cyan);background:var(--bg2);padding:18px 20px;margin-bottom:18px;position:relative;">
      <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);color:var(--cyan);font-size:10px;letter-spacing:3px;padding:0 8px;">// ADMIN: BROADCAST MEDDELELSE</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div>
          <label class="field-label">Titel</label>
          <input class="retro-input" id="sysnews-title" placeholder="Meddelelsens titel..." style="border-color:var(--cyan);"/>
        </div>
        <div>
          <label class="field-label">Prioritet</label>
          <select id="sysnews-priority" style="background:var(--bg);border:1px solid var(--cyan);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:100%;">
            <option value="normal">Normal</option>
            <option value="high">Høj ⚠</option>
            <option value="critical">Kritisk 🚨</option>
          </select>
        </div>
      </div>
      <label class="field-label">Besked</label>
      <textarea class="retro-textarea" id="sysnews-body" placeholder="Systemmeddelelse..." style="min-height:80px;border-color:var(--cyan);"></textarea>
      <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="save-btn" style="border-color:var(--cyan);color:var(--cyan);" onclick="addSysNewsEntry('${tab.id}')">📡 UDSEND BROADCAST</button>
        <span class="success-msg" id="sysnews-msg"></span>
      </div>
    </div>`;
  }

  if(entries.length === 0) {
    html += `<div style="color:var(--text-dim);font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:20px 0;">// INGEN SYSTEMMEDDELELSER</div>`;
  } else {
    const sorted = [...entries].reverse();
    sorted.forEach(entry => {
      const prioColor = entry.priority==='critical'?'var(--red)':entry.priority==='high'?'var(--amber)':'var(--cyan)';
      const prioLabel = entry.priority==='critical'?'🚨 KRITISK':entry.priority==='high'?'⚠ HØJ':'● NORMAL';
      html += `<div class="sysnews-entry" style="border-left-color:${prioColor};">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:6px;">
          <div class="sysnews-entry-title" style="color:${prioColor};">${escHtml(entry.title)}</div>
          <div style="font-size:10px;color:${prioColor};letter-spacing:2px;text-transform:uppercase;white-space:nowrap;padding-top:4px;">${prioLabel}</div>
        </div>
        <div class="sysnews-entry-body">${escHtml(entry.body||'')}</div>
        <div class="sysnews-entry-meta">${escHtml(entry.date||'')}</div>
        ${canEdit ? `<button class="delete-btn" style="margin-top:10px;font-size:10px;" onclick="deleteSysNewsEntry('${tab.id}','${entry.id}')">✕ SLET</button>` : ''}
      </div>`;
    });
  }

  return html;
}

function addSysNewsEntry(tabId) {
  const tab = findSubTab(tabId) || state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const title = document.getElementById('sysnews-title').value.trim();
  if(!title){ showMsg('sysnews-msg','// TITEL KRÆVES.'); return; }
  const body = document.getElementById('sysnews-body').value.trim();
  const priority = document.getElementById('sysnews-priority').value;
  const date = '// ' + new Date().toLocaleString('da-DK');
  if(!tab.entries) tab.entries = [];
  tab.entries.push({ id:'sys_'+Date.now(), title, body, priority, date });
  saveState();
  const panel = document.getElementById('panel-'+tabId);
  if(panel) panel.innerHTML = buildSysNewsPanel(tab);
  showMsg('sysnews-msg','// BROADCAST SENDT.');
}

function deleteSysNewsEntry(tabId, entryId) {
  if(!confirm('Slet denne systemmeddelelse?')) return;
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.entries) return;
  tab.entries = tab.entries.filter(e=>e.id!==entryId);
  saveState();
  const panel = document.getElementById('panel-'+tabId);
  if(panel) panel.innerHTML = buildSysNewsPanel(tab);
}

// =====================================================================
// RUMOR HAS IT PANEL
// =====================================================================
function getUserRumorLevel() {
  if(!currentUser) return 0;
  if(currentUser.isAdmin) return 99;
  // Fresh from state in case admin changed it
  const fresh = state.users.find(u=>u.username===currentUser.username);
  return (fresh ? fresh.rumorLevel : currentUser.rumorLevel) || 0;
}

function buildRumorsPanel(tab) {
  const rumors = (tab.rumors || []).slice().reverse(); // newest first
  const isAdmin = currentUser && currentUser.isAdmin;
  const myLevel = getUserRumorLevel();
  const maxLevel = 3;

  // Pips helper
  function pips(level) {
    return Array.from({length: maxLevel}, (_,i) =>
      `<div class="rumor-pip ${i < level ? 'filled' : ''}"></div>`
    ).join('');
  }

  let html = `<div class="page-header">
    <div class="page-title" style="color:var(--rumor);">🕵 RUMOR HAS IT</div>
    <div class="page-desc" style="color:var(--rumor-dim);">// CLASSIFIED INTELLIGENCE — CLEARANCE LEVEL ${isAdmin ? '∞ (GAME MASTER)' : myLevel}</div>
  </div>
  ${buildDefacementBanner(tab.id)}`;

  // Admin post form
  if(isAdmin || (currentUser && currentUser.isModerator)) {
    html += `<div style="border:1px solid var(--rumor);background:rgba(255,153,0,0.04);padding:18px 20px;margin-bottom:20px;position:relative;">
      <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);padding:0 8px;font-size:10px;color:var(--rumor);letter-spacing:3px;text-transform:uppercase;">// POST NEW RUMOR</div>
      <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex:1;min-width:240px;">
          <label class="field-label" style="color:var(--rumor);">RUMOR TEXT</label>
          <textarea id="new-rumor-text" class="retro-textarea" placeholder="What are people whispering about..." style="min-height:80px;border-color:var(--rumor-dim);color:var(--text-bright);caret-color:var(--rumor);resize:vertical;"></textarea>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <label class="field-label" style="color:var(--rumor);">CLEARANCE LEVEL</label>
            <div style="display:flex;gap:6px;margin-top:4px;">
              ${Array.from({length:maxLevel},(_,i)=>`
                <button onclick="selectRumorLevel(${i+1})" id="rlvl-btn-${i+1}"
                  style="width:36px;height:36px;font-family:'VT323',monospace;font-size:20px;cursor:pointer;transition:all 0.15s;
                  background:${i===0?'rgba(255,153,0,0.3)':'rgba(255,153,0,0.07)'};
                  border:2px solid ${i===0?'var(--rumor)':'var(--rumor-dim)'};
                  color:${i===0?'var(--rumor)':'var(--rumor-dim)'};">${i+1}</button>`).join('')}
            </div>
            <div id="rumor-level-display" style="font-size:10px;color:var(--rumor-dim);letter-spacing:2px;text-transform:uppercase;margin-top:6px;">LEVEL 1 — VISIBLE TO ALL WITH ACCESS</div>
          </div>
          <button class="save-btn" style="border-color:var(--rumor);color:var(--rumor);padding:10px 20px;font-size:14px;letter-spacing:2px;" onclick="addRumor('${tab.id}')">[ POST RUMOR ]</button>
        </div>
      </div>
      <span class="success-msg" id="rumor-msg" style="display:block;margin-top:8px;"></span>
    </div>`;
  }

  // Level indicator for non-admins
  if(!isAdmin) {
    html += `<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid var(--rumor-dim);background:rgba(255,153,0,0.04);margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:3px;color:var(--rumor-dim);text-transform:uppercase;">YOUR CLEARANCE:</div>
      <div class="rumor-level-indicator">${pips(myLevel)}</div>
      <div style="font-family:'VT323',monospace;font-size:26px;color:var(--rumor);letter-spacing:2px;">LEVEL ${myLevel}</div>
      ${myLevel===0?`<div style="font-size:11px;color:var(--red);letter-spacing:2px;text-transform:uppercase;">// NO CLEARANCE — CONTACT GAME MASTER</div>`:''}
    </div>`;
  }

  // Filter visible rumors
  const visible = isAdmin ? rumors : rumors.filter(r => r.level <= myLevel);

  if(visible.length === 0) {
    html += `<div style="color:var(--rumor-dim);font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:20px 0;text-align:center;">
      // ${myLevel===0?'NO CLEARANCE — YOU HAVE NOT BEEN BRIEFED':'NO RUMORS AT YOUR CLEARANCE LEVEL'}
    </div>`;
  } else {
    visible.forEach(r => {
      const date = r.date || '';
      html += `<div class="rumor-card">
        <div style="display:flex;align-items:flex-start;gap:14px;padding:16px 18px;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;">
            <div class="rumor-level-badge">${r.level}</div>
            <div class="rumor-level-indicator" style="flex-direction:column;gap:3px;">${pips(r.level)}</div>
          </div>
          <div style="flex:1;">
            <div class="rumor-body">"${escHtml(r.text)}"</div>
            <div class="rumor-meta">// CLEARANCE LVL ${r.level} &nbsp;|&nbsp; ${escHtml(date)}${r.postedBy?` &nbsp;|&nbsp; VIA: ${escHtml(r.postedBy)}`:''}</div>
          </div>
          ${isAdmin ? `<button class="delete-btn" style="padding:4px 10px;font-size:10px;flex-shrink:0;" onclick="deleteRumor('${tab.id}','${r.id}')">✕</button>` : ''}
        </div>
      </div>`;
    });
  }

  // Admin sees a count of hidden rumors per level for context
  if(isAdmin && rumors.length > 0) {
    const byLevel = {};
    rumors.forEach(r=>{ byLevel[r.level]=(byLevel[r.level]||0)+1; });
    html += `<div style="margin-top:16px;padding:12px 16px;border:1px solid var(--border);background:var(--bg3);font-size:11px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">
      // TOTAL RUMORS: ${rumors.length} &nbsp;|&nbsp;
      ${Object.keys(byLevel).sort().map(l=>`LVL ${l}: ${byLevel[l]}`).join(' &nbsp;·&nbsp; ')}
    </div>`;
  }

  return html;
}

let _selectedRumorLevel = 1;
function selectRumorLevel(lvl) {
  _selectedRumorLevel = lvl;
  const max = 5;
  for(let i=1;i<=max;i++){
    const btn = document.getElementById('rlvl-btn-'+i);
    if(!btn) continue;
    const active = i <= lvl;
    btn.style.background = active ? 'rgba(255,153,0,0.3)' : 'rgba(255,153,0,0.07)';
    btn.style.borderColor = active ? 'var(--rumor)' : 'var(--rumor-dim)';
    btn.style.color = active ? 'var(--rumor)' : 'var(--rumor-dim)';
  }
  const desc = document.getElementById('rumor-level-display');
  if(desc) desc.textContent = `LEVEL ${lvl} — VISIBLE TO CLEARANCE ${lvl}+`;
}

function addRumor(tabId) {
  const tab = findSubTab(tabId) || state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const textEl = document.getElementById('new-rumor-text');
  const text = textEl ? textEl.value.trim() : '';
  if(!text){ showMsg('rumor-msg','// RUMOR TEXT REQUIRED.'); return; }
  if(!tab.rumors) tab.rumors = [];
  const now = new Date();
  const date = '// ' + now.toLocaleString('da-DK', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  tab.rumors.push({
    id: 'rum_'+Date.now(),
    text,
    level: _selectedRumorLevel,
    date,
    postedBy: currentUser.username
  });
  saveState();
  if(textEl) textEl.value = '';
  const panel = document.getElementById('panel-'+tabId);
  if(panel) panel.innerHTML = buildRumorsPanel(tab);
  showMsg('rumor-msg','// RUMOR POSTED — LEVEL ' + _selectedRumorLevel + ' CLEARANCE REQUIRED.');
}

function deleteRumor(tabId, rumorId) {
  if(!confirm('Delete this rumor?')) return;
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.rumors) return;
  tab.rumors = tab.rumors.filter(r=>r.id!==rumorId);
  saveState();
  const panel = document.getElementById('panel-'+tabId);
  if(panel) panel.innerHTML = buildRumorsPanel(tab);
}

// =====================================================================
// MARKET PANEL
// =====================================================================
let _marketTypeNew = 'sell'; // 'sell' or 'want'
let _marketFilter = 'all';   // 'all', 'sell', 'want'

function buildMarketPanel(tab) {
  return `<div id="market-panel-inner"></div>`;
}

function refreshMarketPanel(tab) {
  const el = document.getElementById('market-panel-inner');
  if(!el) return;
  const listings = (tab && tab.listings) ? tab.listings : [];
  const isAdmin = currentUser && currentUser.isAdmin;
  const isMod   = currentUser && (currentUser.isAdmin || currentUser.isModerator);
  const now     = new Date();
  const filterType = _marketFilter;

  // ---- New listing form ----
  let formHtml = `<div class="market-new-form">
    <div class="market-type-toggle">
      <button class="market-type-btn sell ${_marketTypeNew==='sell'?'active':''}" onclick="marketSetType('sell')">📦 UDBUD — Jeg sælger / tilbyder</button>
      <button class="market-type-btn want ${_marketTypeNew==='want'?'active':''}" onclick="marketSetType('want')">🔍 EFTERSPØRGSEL — Jeg søger / vil købe</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <label class="field-label" style="color:${_marketTypeNew==='sell'?'var(--market-sell)':'var(--market-want)'};">VARE / YDELSE</label>
        <input class="retro-input" id="mkt-title" placeholder="Hvad sælger / søger du?" style="border-color:${_marketTypeNew==='sell'?'var(--market-dim)':'rgba(255,204,0,0.3)'};"/>
      </div>
      <div>
        <label class="field-label" style="color:${_marketTypeNew==='sell'?'var(--market-sell)':'var(--market-want)'};">PRIS / BETALING</label>
        <input class="retro-input" id="mkt-price" placeholder="Pris, bytte, aftales..." style="border-color:${_marketTypeNew==='sell'?'var(--market-dim)':'rgba(255,204,0,0.3)'};"/>
      </div>
    </div>
    <label class="field-label" style="color:${_marketTypeNew==='sell'?'var(--market-sell)':'var(--market-want)'};">BESKRIVELSE</label>
    <textarea class="retro-textarea" id="mkt-body" placeholder="Beskriv varen, tilstanden, betingelser..." style="min-height:80px;border-color:${_marketTypeNew==='sell'?'var(--market-dim)':'rgba(255,204,0,0.3)'};"></textarea>
    <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <button class="save-btn" style="border-color:${_marketTypeNew==='sell'?'var(--market-sell)':'var(--market-want)'};color:${_marketTypeNew==='sell'?'var(--market-sell)':'var(--market-want)'};" onclick="marketAddListing('${tab.id}')">
        ${_marketTypeNew==='sell'?'📦 OPRET UDBUD':'🔍 OPRET EFTERSPØRGSEL'}
      </button>
      <span class="success-msg" id="mkt-msg"></span>
    </div>
  </div>`;

  // ---- Filter bar ----
  const sellCount = listings.filter(l=>l.type==='sell').length;
  const wantCount = listings.filter(l=>l.type==='want').length;
  let filterHtml = `<div class="market-filter-bar">
    <span style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;">// FILTER:</span>
    <button onclick="marketSetFilter('all')" style="padding:5px 14px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;text-transform:uppercase;
      background:${_marketFilter==='all'?'rgba(0,255,204,0.15)':'transparent'};
      border:1px solid ${_marketFilter==='all'?'var(--market)':'var(--border-bright)'};
      color:${_marketFilter==='all'?'var(--market)':'var(--text-dim)'};">
      ALL (${listings.length})
    </button>
    <button onclick="marketSetFilter('sell')" style="padding:5px 14px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;text-transform:uppercase;
      background:${_marketFilter==='sell'?'rgba(0,255,136,0.15)':'transparent'};
      border:1px solid ${_marketFilter==='sell'?'var(--market-sell)':'var(--border-bright)'};
      color:${_marketFilter==='sell'?'var(--market-sell)':'var(--text-dim)'};">
      📦 UDBUD (${sellCount})
    </button>
    <button onclick="marketSetFilter('want')" style="padding:5px 14px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;text-transform:uppercase;
      background:${_marketFilter==='want'?'rgba(255,204,0,0.12)':'transparent'};
      border:1px solid ${_marketFilter==='want'?'var(--market-want)':'var(--border-bright)'};
      color:${_marketFilter==='want'?'var(--market-want)':'var(--text-dim)'};">
      🔍 EFTERSPØRGSEL (${wantCount})
    </button>
  </div>`;

  // ---- Listings ----
  const visible = filterType === 'all' ? [...listings].reverse()
    : [...listings].filter(l=>l.type===filterType).reverse();

  let listingsHtml = '';
  if(visible.length === 0) {
    const emptyMsg = filterType === 'sell' ? '// INGEN AKTIVE UDBUD'
      : filterType === 'want' ? '// INGEN AKTIVE EFTERSPØRGSLER'
      : '// MARKEDET ER TOMT — VÆR DEN FØRSTE TIL AT POSTE';
    listingsHtml = `<div style="color:var(--text-dim);font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:30px 0;text-align:center;">${emptyMsg}</div>`;
  } else {
    visible.forEach(lst => {
      const isSell = lst.type === 'sell';
      const typeLabel = isSell ? '📦 UDBUD' : '🔍 EFTERSPØRGSEL';
      const typeClass = isSell ? 'sell' : 'want';
      const canDelete = isAdmin || lst.postedBy === currentUser.username;
      listingsHtml += `<div class="market-listing ${typeClass}">
        <div class="market-listing-header">
          <div style="display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap;">
            <span class="market-listing-type ${typeClass}">${typeLabel}</span>
            <div class="market-listing-title ${typeClass}">${escHtml(lst.title)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <div class="market-listing-meta">${escHtml(lst.date||'')}</div>
            <div class="market-listing-meta" style="color:var(--market);">${escHtml(lst.postedBy||'?')}</div>
          </div>
        </div>
        ${lst.body ? `<div class="market-listing-body">${escHtml(lst.body)}</div>` : ''}
        ${lst.price ? `<div class="market-listing-price" style="color:${isSell?'var(--market-sell)':'var(--market-want)'};">
          ${isSell?'💰 PRIS:':'💳 TILBYDER:'} ${escHtml(lst.price)}
        </div>` : ''}
        ${canDelete ? `<div style="padding:8px 18px 12px;">
          <button class="delete-btn" style="font-size:10px;" onclick="marketDeleteListing('${tab.id}','${lst.id}')">✕ FJERN OPSLAG</button>
        </div>` : ''}
      </div>`;
    });
  }

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:var(--market);">🏪 ${escHtml(tab.name)}</div>
      <div class="page-desc" style="color:var(--market-dim);">// MARKED — UDBYD ELLER EFTERSPØRG VARER & YDELSER</div>
    </div>
    ${buildDefacementBanner(tab.id)}
    ${formHtml}
    ${filterHtml}
    ${listingsHtml}`;
}

function marketSetType(type) {
  _marketTypeNew = type;
  const tab = state.tabs.find(t=>t.isMarket);
  if(tab) refreshMarketPanel(tab);
}

function marketSetFilter(filter) {
  _marketFilter = filter;
  const tab = state.tabs.find(t=>t.isMarket);
  if(tab) refreshMarketPanel(tab);
}

function marketAddListing(tabId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const title = (document.getElementById('mkt-title')||{}).value.trim();
  if(!title){ showMsg('mkt-msg','// VARE/YDELSE KRÆVES'); return; }
  const price = (document.getElementById('mkt-price')||{}).value.trim();
  const body  = (document.getElementById('mkt-body')||{}).value.trim();
  if(!tab.listings) tab.listings = [];
  const now = new Date();
  tab.listings.push({
    id: 'mkt_'+Date.now(),
    type: _marketTypeNew,
    title,
    price,
    body,

    date: '// ' + now.toLocaleString('da-DK',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
  });
  saveState('volatile');
  // Clear form
  ['mkt-title','mkt-price','mkt-body'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  showMsg('mkt-msg', _marketTypeNew==='sell' ? '// UDBUD OPRETTET.' : '// EFTERSPØRGSEL OPRETTET.');
  refreshMarketPanel(tab);
}

function marketDeleteListing(tabId, listingId) {
  if(!confirm('Fjern dette opslag?')) return;
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab||!tab.listings) return;
  tab.listings = tab.listings.filter(l=>l.id!==listingId);
  saveState();
  refreshMarketPanel(tab);
}

// =====================================================================
// IDENT REGISTRY
// =====================================================================

if(!window._identSearch) window._identSearch = '';

function buildIdentPanel(tab) {
  return `<div id="ident-panel-inner"></div>`;
}

function refreshIdentPanel(tab) {
  const el = document.getElementById('ident-panel-inner'); if(!el) return;
  const isAdmin    = currentUser && currentUser.isAdmin;
  const isHacker   = currentUser && currentUser.isHacker;
  const isLaw      = currentUser && (currentUser.tags||[]).some(t => t.toLowerCase().includes('ordensmagt'));
  const canCreate  = isAdmin || isHacker;
  const canSeeAll  = isAdmin || isLaw;  // only admin + ordensmagt see the full registry
  const cards      = tab.cards || [];

  // Determine form style — hacker gets a different colour scheme
  const accentColor = isHacker && !isAdmin ? 'var(--hacker)' : 'var(--cortex-accent)';
  const accentDim   = isHacker && !isAdmin ? 'rgba(255,0,255,0.25)' : 'rgba(79,195,247,0.3)';
  const formLabel   = isHacker && !isAdmin ? '// FORGE FAKE IDENT' : '// REGISTRER NY IDENT';
  const btnLabel    = isHacker && !isAdmin ? '⚡ FORGE IDENT' : '🆔 REGISTRER IDENT';
  // Hacker-forged idents default to validated (that's the whole point of a forgery)
  const defaultStatus = isHacker && !isAdmin ? 'validated' : 'pending';

  let formHtml = '';
  if(canCreate) {
    formHtml = `<div class="market-new-form" style="border-color:${accentDim};">
      <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);color:${accentColor};font-size:10px;letter-spacing:3px;padding:0 8px;">${formLabel}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px;">
        <div><label class="field-label" style="color:${accentColor};">FULDT NAVN</label><input class="retro-input" id="ident-name" placeholder="Vera Lin" style="border-color:${accentDim};"/></div>
        <div><label class="field-label" style="color:${accentColor};">FØDESTED / PLANET</label><input class="retro-input" id="ident-planet" placeholder="Persephone" style="border-color:${accentDim};"/></div>
        <div><label class="field-label" style="color:${accentColor};">OCCUPATION</label><input class="retro-input" id="ident-job" placeholder="Registered Companion" style="border-color:${accentDim};"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div><label class="field-label" style="color:${accentColor};">ALLIANCE CITIZEN ID</label><input class="retro-input" id="ident-id" placeholder="Auto-genereres" style="border-color:${accentDim};"/></div>
        <div><label class="field-label" style="color:${accentColor};">STATUS</label>
          <select class="retro-input" id="ident-status" style="cursor:pointer;border-color:${accentDim};">
            <option value="validated" ${defaultStatus==='validated'?'selected':''}>✓ VALIDATED</option>
            <option value="pending"   ${defaultStatus==='pending'  ?'selected':''}>⏳ PENDING</option>
            <option value="flagged"                                               >⚠ FLAGGED</option>
          </select>
        </div>
      </div>
      <label class="field-label" style="color:${accentColor};">NOTER / BEMÆRKNINGER</label>
      <textarea class="retro-textarea" id="ident-notes" placeholder="${isHacker&&!isAdmin?'Baghistorie der holder vand...':'Alliance-registrerede noter...'}" style="min-height:60px;border-color:${accentDim};"></textarea>
      <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="save-btn" style="border-color:${accentColor};color:${accentColor};" onclick="identAddCard('${tab.id}')">${btnLabel}</button>
        ${isHacker&&!isAdmin?`<span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">// FORGED IDENT VISES SOM VALIDATED — ADMIN KAN SE DET ER FORGED</span>`:''}
        <span class="success-msg" id="ident-msg"></span>
      </div>
    </div>`;
  }

  // ---- Search bar — only shown to those who can see all ----
  const searchVal = window._identSearch || '';
  const searchBar = canSeeAll ? `<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;padding:10px 14px;border:1px solid var(--border-bright);background:var(--bg2);">
    <span style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;white-space:nowrap;">🔍 SØG:</span>
    <input id="ident-search-input" class="retro-input" value="${escAttr(searchVal)}"
      placeholder="navn, planet, occupation, citizen ID..."
      style="flex:1;border-color:var(--border-bright);"
      oninput="window._identSearch=this.value;_identRenderCards('${tab.id}')"/>
    ${searchVal ? `<button onclick="window._identSearch='';document.getElementById('ident-search-input').value='';_identRenderCards('${tab.id}')"
      style="padding:4px 12px;font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--border);color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;">✕ RYDDE</button>` : ''}
    <span id="ident-count" style="font-size:10px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;white-space:nowrap;"></span>
  </div>` : '';

  const accessNote = !canSeeAll && !isHacker
    ? `<div style="border:1px solid var(--border-bright);padding:12px 16px;margin-bottom:16px;font-size:11px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;">
        // ADGANG BEGRÆNSET — DU KAN KUN SE DIT EGET REGISTREREDE IDENT-KORT
      </div>` : '';

  const hackerNote = isHacker && !isAdmin
    ? `<div style="border:1px solid var(--hacker-dim);padding:12px 16px;margin-bottom:16px;font-size:11px;color:var(--hacker);letter-spacing:2px;text-transform:uppercase;">
        // HACKER ACCESS — DU KAN SE DINE EGNE FORGED IDENTS
      </div>` : '';

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:${accentColor};">🆔 ${escHtml(tab.name)}</div>
      <div class="page-desc">// ALLIANCE CORTEX IDENT REGISTRY${isHacker&&!isAdmin?' — <span style="color:var(--hacker);">HACKER ACCESS ACTIVE</span>':isLaw?' — <span style="color:var(--amber);">ORDENSMAGT ADGANG</span>':''}</div>
    </div>
    ${buildDefacementBanner(tab.id)}
    ${formHtml}
    ${accessNote}${hackerNote}
    ${searchBar}
    <div id="ident-cards-list"></div>`;

  _identRenderCards(tab.id);
}

function _identRenderCards(tabId) {
  const list = document.getElementById('ident-cards-list'); if(!list) return;
  const countEl = document.getElementById('ident-count');
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const cards = tab.cards || [];
  const isAdmin  = currentUser && currentUser.isAdmin;
  const isHacker = currentUser && currentUser.isHacker;
  const isLaw    = currentUser && (currentUser.tags||[]).some(t => t.toLowerCase().includes('ordensmagt'));
  const canSeeAll  = isAdmin || isLaw;
  const canManage  = isAdmin || isHacker;

  // Determine which cards this user can see
  const myLinkedCard = cards.find(c => c.linkedUsername === currentUser.username);
  const visibleCards = canSeeAll
    ? cards  // admin + ordensmagt see everything
    : isHacker
      ? cards.filter(c => c.forgedBy && (c.forgedBy === (currentUser.alterEgo||currentUser.username) || c.registeredBy === currentUser.username))
      : myLinkedCard ? [myLinkedCard] : []; // everyone else: only their own linked card

  const q = (window._identSearch || '').toLowerCase().trim();
  const filtered = q
    ? visibleCards.filter(c =>
        (c.name||'').toLowerCase().includes(q) ||
        (c.planet||'').toLowerCase().includes(q) ||
        (c.job||'').toLowerCase().includes(q) ||
        (c.citizenId||'').toLowerCase().includes(q) ||
        (c.notes||'').toLowerCase().includes(q)
      )
    : visibleCards;

  if(countEl) countEl.textContent = q
    ? `${filtered.length} / ${visibleCards.length} RESULTS`
    : `${visibleCards.length} REGISTREREDE`;

  if(filtered.length === 0) {
    list.innerHTML = `<div style="color:var(--text-dim);font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:30px 0;text-align:center;">
      ${q ? `// INGEN RESULTATER FOR "${escHtml(q)}"` : canSeeAll ? '// INGEN REGISTREREDE IDENT-KORT' : isHacker ? '// DU HAR IKKE FORGED NOGEN IDENTS ENDNU' : '// INTET IDENT-KORT KNYTTET TIL DIN PROFIL'}
    </div>`;
    return;
  }

  list.innerHTML = [...filtered].reverse().map(c => {
    const isForged = !!c.forgedBy;
    const linkedUser = c.linkedUsername
      ? state.users.find(u=>u.username===c.linkedUsername)
      : null;

    // Highlight matching text
    const hl = (str) => {
      if(!q || !str) return escHtml(str||'—');
      const idx = str.toLowerCase().indexOf(q);
      if(idx < 0) return escHtml(str);
      return escHtml(str.slice(0,idx)) +
        `<mark style="background:rgba(79,195,247,0.3);color:var(--text-bright);padding:0 1px;">${escHtml(str.slice(idx,idx+q.length))}</mark>` +
        escHtml(str.slice(idx+q.length));
    };

    const nonAdminUsers = state.users.filter(u => !u.isAdmin);
    const linkWidget = canSeeAll ? (linkedUser
      ? `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border);margin-top:6px;">
          <span style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">KARAKTER:</span>
          <span style="font-size:12px;color:var(--cortex-accent);letter-spacing:1px;">👤 ${escHtml(linkedUser.username)}</span>
          <span style="font-size:10px;color:var(--text-dim);">(${escHtml(linkedUser.role||'')})</span>
          <button onclick="identUnlinkCardFromRegistry('${tabId}','${escAttr(c.id)}')"
            style="margin-left:auto;padding:2px 8px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:transparent;border:1px solid var(--border);color:var(--text-dim);text-transform:uppercase;">✕ FJERN</button>
        </div>`
      : `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border);margin-top:6px;flex-wrap:wrap;">
          <span style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;white-space:nowrap;">KNYT TIL:</span>
          <select id="link-select-${escAttr(c.id)}"
            style="flex:1;min-width:120px;background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:3px 8px;font-family:'Share Tech Mono',monospace;font-size:11px;outline:none;cursor:pointer;">
            <option value="">— vælg karakter —</option>
            ${nonAdminUsers.map(u => {
              const alreadyLinked = !!state.tabs.find(t=>t.isIdent)?.cards?.find(cc=>cc.linkedUsername===u.username && cc.id!==c.id);
              return `<option value="${escAttr(u.username)}" ${alreadyLinked?'style="color:var(--text-dim);"':''}>
                ${escHtml(u.username)} — ${escHtml(u.role||'')}${alreadyLinked?' (allerede knyttet)':''}
              </option>`;
            }).join('')}
          </select>
          <button onclick="identLinkCardFromRegistry('${tabId}','${escAttr(c.id)}')"
            style="padding:3px 12px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;cursor:pointer;background:rgba(79,195,247,0.08);border:1px solid var(--cortex-accent);color:var(--cortex-accent);text-transform:uppercase;white-space:nowrap;">🆔 KNYT</button>
        </div>`) : '';

    return `<div class="ident-card ${c.status||'pending'}" style="${isForged&&isAdmin?'border-color:var(--hacker);':''}" >
      <div class="ident-photo">${c.photo ? `<img src="${escHtml(c.photo)}"/>` : '👤'}</div>
      <div class="ident-body" style="position:relative;">
        ${isForged && isAdmin ? `<span style="position:absolute;top:6px;right:36px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;padding:2px 8px;border:1px solid var(--hacker);color:var(--hacker);background:rgba(255,0,255,0.05);text-transform:uppercase;">⚡ FORGED BY ${escHtml(c.forgedBy)}</span>` : ''}
        <span class="ident-status ${c.status||'pending'}" style="${isForged&&isAdmin?'right:110px;':''}">${c.status==='validated'?'✓ VALIDATED':c.status==='flagged'?'⚠ FLAGGED':'⏳ PENDING'}</span>
        <div class="ident-name">${hl(c.name||'UKENDT')}</div>
        <div class="ident-field">FØDESTED: <span>${hl(c.planet||'—')}</span></div>
        <div class="ident-field">OCCUPATION: <span>${hl(c.job||'—')}</span></div>
        ${c.notes?`<div style="font-size:12px;color:var(--text-dim);margin-top:6px;line-height:1.6;white-space:pre-wrap;">${hl(c.notes)}</div>`:''}
        <div class="ident-id-num">CITIZEN ID: ${hl(c.citizenId||'—')}${c.registeredBy?` · REG: ${escHtml(c.registeredBy)}`:''}${c.date?` · ${escHtml(c.date)}`:''}</div>
        ${linkWidget}
        ${canManage?`<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
          <button onclick="identSetStatus('${tabId}','${c.id}','validated')" style="padding:3px 10px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:rgba(0,255,0,0.08);border:1px solid var(--green);color:var(--green);text-transform:uppercase;">✓ VALIDÉR</button>
          <button onclick="identSetStatus('${tabId}','${c.id}','flagged')"   style="padding:3px 10px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:rgba(255,0,0,0.08);border:1px solid var(--red);color:var(--red);text-transform:uppercase;">⚠ FLAG</button>
          <button onclick="identSetStatus('${tabId}','${c.id}','pending')"   style="padding:3px 10px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:rgba(255,200,0,0.08);border:1px solid var(--amber);color:var(--amber);text-transform:uppercase;">⏳ PENDING</button>
          <button class="delete-btn" style="margin-left:auto;" onclick="identDeleteCard('${tabId}','${c.id}')">✕ SLET</button>
        </div>`:''}
      </div>
    </div>`;
  }).join('');
}

function identAddCard(tabId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const name = (document.getElementById('ident-name')||{}).value.trim();
  if(!name){ showMsg('ident-msg','// NAVN KRÆVES'); return; }
  if(!tab.cards) tab.cards = [];
  const now = new Date();
  const pad = n=>String(n).padStart(2,'0');
  const isHacker = currentUser.isHacker && !currentUser.isAdmin;
  const citizenId = (document.getElementById('ident-id')||{}).value.trim()
    || `AC-${now.getFullYear()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  const card = {
    id: 'ident_'+Date.now(),
    name,
    planet: (document.getElementById('ident-planet')||{}).value.trim(),
    job:    (document.getElementById('ident-job')||{}).value.trim(),
    citizenId,
    status: (document.getElementById('ident-status')||{}).value || 'pending',
    notes:  (document.getElementById('ident-notes')||{}).value.trim(),
    registeredBy: currentUser.username,
    date: `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()}`
  };
  if(isHacker) card.forgedBy = currentUser.alterEgo || currentUser.username;
  tab.cards.push(card);
  saveState();
  ['ident-name','ident-planet','ident-job','ident-id','ident-notes'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  showMsg('ident-msg', isHacker ? '// ⚡ FORGED IDENT INJECTED.' : '// IDENT REGISTRERET.');
  refreshIdentPanel(tab);
}

function identSetStatus(tabId, cardId, status) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const card = tab.cards.find(c=>c.id===cardId); if(!card) return;
  card.status = status;
  saveState(); _identRenderCards(tabId);
}

function identDeleteCard(tabId, cardId) {
  if(!confirm('Slet dette ident-kort?')) return;
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  tab.cards = tab.cards.filter(c=>c.id!==cardId);
  saveState(); _identRenderCards(tabId);
}

// =====================================================================
// WANTED PANELS (Alliance + Criminal)
// =====================================================================
let _wantedFilterType = {};

function buildWantedPanel(tab) {
  return `<div id="wanted-panel-inner-${escHtml(tab.id)}"></div>`;
}

function refreshWantedPanel(tab) {
  const el = document.getElementById('wanted-panel-inner-' + tab.id); if(!el) return;
  const isAdmin = currentUser && currentUser.isAdmin;
  const isAlliance = tab.wantedType === 'alliance';
  const listings = tab.listings || [];
  const accentColor = isAlliance ? 'var(--cortex-gold)' : 'var(--red)';
  const accentDim   = isAlliance ? 'rgba(255,220,0,0.3)' : 'rgba(255,60,60,0.3)';
  const wantedClass = isAlliance ? 'alliance' : 'criminal';
  const icon = isAlliance ? '⚠' : '💀';

  // Criminal posters can be posted by anyone using alter ego
  const canPost = isAdmin || (!isAlliance && currentUser);

  let formHtml = '';
  if(canPost) {
    const postAs = (!isAlliance && currentUser && (currentUser.alterEgo || currentUser.username));
    formHtml = `<div class="market-new-form" style="border-color:${accentDim};">
      <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);color:${accentColor};font-size:10px;letter-spacing:3px;padding:0 8px;">// ${isAlliance?'UDSTED WANTED-OPSLAG':'POST DUSØR — VIA SORT MARKED'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div><label class="field-label" style="color:${accentColor};">NAVN / ALIAS</label><input class="retro-input" id="wanted-name-${tab.id}" placeholder="Malcolm Reynolds" style="border-color:${accentDim};"/></div>
        <div><label class="field-label" style="color:${accentColor};">DUSØR / BELØNNING</label><input class="retro-input" id="wanted-bounty-${tab.id}" placeholder="5.000 credits — levende" style="border-color:${accentDim};"/></div>
      </div>
      <label class="field-label" style="color:${accentColor};">FORBRYDELSE / ÅRSAG</label>
      <textarea class="retro-textarea" id="wanted-desc-${tab.id}" placeholder="${isAlliance?'Anklaget for...':'Søges for...'}" style="min-height:70px;border-color:${accentDim};"></textarea>
      ${!isAlliance?`<div style="margin-top:8px;font-size:11px;color:var(--text-dim);letter-spacing:1px;">// OPSLAG POSTES ANONYMT VIA DIT ALTER EGO: <span style="color:${accentColor};">${escHtml(postAs)}</span></div>`:''}
      <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="save-btn" style="border-color:${accentColor};color:${accentColor};" onclick="wantedAddListing('${tab.id}')">${icon} UDSTED OPSLAG</button>
        <span class="success-msg" id="wanted-msg-${tab.id}"></span>
      </div>
    </div>`;
  }

  const listingsHtml = listings.length === 0
    ? `<div style="color:var(--text-dim);font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:30px 0;text-align:center;">// INGEN AKTIVE OPSLAG</div>`
    : [...listings].reverse().map(lst => {
        const canDelete = isAdmin || lst.postedById === currentUser.username;
        return `<div class="wanted-card ${wantedClass}">
          <div class="wanted-photo">${lst.photo?`<img src="${escHtml(lst.photo)}" />`:'🎯'}</div>
          <div class="wanted-body">
            <div class="wanted-name">${escHtml(lst.name||'UKENDT')}</div>
            <div class="wanted-bounty">💰 ${escHtml(lst.bounty||'—')}</div>
            <div class="wanted-desc">${escHtml(lst.desc||'')}</div>
            <div class="wanted-posted">
              ${isAlliance?'UDSTEDT AF ALLIANCEN':'VIA SORT MARKED'}
              · ${escHtml(lst.postedBy||'?')} · ${escHtml(lst.date||'—')}
              ${canDelete?`<button class="delete-btn" style="margin-left:12px;font-size:10px;" onclick="wantedDeleteListing('${tab.id}','${lst.id}')">✕ FJERN</button>`:''}
            </div>
          </div>
        </div>`;
      }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:${accentColor};">${icon} ${escHtml(tab.name)}</div>
      <div class="page-desc" style="color:${isAlliance?'rgba(255,220,0,0.5)':'rgba(255,60,60,0.5)'};">// ${isAlliance?'ALLIANCE CORTEX — AKTIVE EFTERLYSNINGER':'SORT MARKED — ANONYME DUSØRER'}</div>
    </div>
    ${buildDefacementBanner(tab.id)}
    ${formHtml}
    ${listingsHtml}`;
}

function wantedAddListing(tabId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const name = (document.getElementById('wanted-name-'+tabId)||{}).value.trim();
  if(!name){ showMsg('wanted-msg-'+tabId,'// NAVN KRÆVES'); return; }
  if(!tab.listings) tab.listings = [];
  const now = new Date();
  const pad = n=>String(n).padStart(2,'0');
  const isAlliance = tab.wantedType === 'alliance';
  tab.listings.push({
    id: 'wanted_'+Date.now(),
    name,
    bounty: (document.getElementById('wanted-bounty-'+tabId)||{}).value.trim(),
    desc:   (document.getElementById('wanted-desc-'+tabId)||{}).value.trim(),
    postedBy: isAlliance ? 'Alliance Central' : (currentUser.alterEgo || currentUser.username),
    postedById: currentUser.username,
    date: `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()}`
  });
  saveState('volatile');
  ['wanted-name-'+tabId,'wanted-bounty-'+tabId,'wanted-desc-'+tabId].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  showMsg('wanted-msg-'+tabId, '// OPSLAG UDSTEDT.');
  refreshWantedPanel(tab);
}

function wantedDeleteListing(tabId, listingId) {
  if(!confirm('Fjern dette opslag?')) return;
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  tab.listings = tab.listings.filter(l=>l.id!==listingId);
  saveState(); refreshWantedPanel(tab);
}

// =====================================================================
// CREDITS SYSTEM — with player-to-player transfers
// =====================================================================
function getCredits(username) {
  if(!username) return 0;
  if(state.credits && state.credits[username] !== undefined) return state.credits[username];
  const user = state.users.find(u=>u.username===username);
  return user ? (user.credits || 0) : 0;
}

function addCredits(username, amount, reason, fromUsername) {
  if(!state.credits) state.credits = {};
  const current = getCredits(username);
  state.credits[username] = current + amount;
  if(!state.creditLog) state.creditLog = [];
  state.creditLog.unshift({
    id: 'tx_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    username, amount, reason: reason||'',
    from: fromUsername||null,
    ts: Date.now(),
    balance: state.credits[username]
  });
  if(state.creditLog.length > 500) state.creditLog.length = 500;
  saveState('volatile');
}

function playerTransferCredits() {
  const toUsername = (document.getElementById('tx-to')||{}).value.trim();
  const amount     = parseInt((document.getElementById('tx-amount')||{}).value||'0');
  const note       = (document.getElementById('tx-note')||{}).value.trim();
  if(!toUsername)              { showMsg('tx-msg','// VÆLG MODTAGER'); return; }
  if(toUsername === currentUser.username) { showMsg('tx-msg','// KAN IKKE SENDE TIL DIG SELV'); return; }
  if(isNaN(amount) || amount <= 0) { showMsg('tx-msg','// UGYLDIGT BELØB'); return; }
  const myBalance = getCredits(currentUser.username);
  if(amount > myBalance)       { showMsg('tx-msg',`// INSUFFICIENT CREDITS (du har ₡${myBalance})`); return; }
  const toUser = state.users.find(u=>u.username===toUsername);
  if(!toUser)                  { showMsg('tx-msg','// UKENDT BRUGER'); return; }

  // Deduct from sender
  addCredits(currentUser.username, -amount, note ? `Overført til ${toUsername}: ${note}` : `Overført til ${toUsername}`, currentUser.username);
  // Add to receiver
  addCredits(toUsername, amount, note ? `Modtaget fra ${currentUser.username}: ${note}` : `Modtaget fra ${currentUser.username}`, currentUser.username);

  // Clear form
  ['tx-to','tx-amount','tx-note'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  showMsg('tx-msg', `// ₡${amount} SENDT TIL ${toUsername.toUpperCase()}`);
  refreshProfilePanel();
}

function adminTransferCredits() {
  const username = (document.getElementById('cr-user')||{}).value;
  const amount   = parseInt((document.getElementById('cr-amount')||{}).value||'0');
  const reason   = (document.getElementById('cr-reason')||{}).value.trim();
  if(!username || isNaN(amount) || amount===0){ showMsg('cr-msg','// UGYLDIGT BELØB'); return; }
  addCredits(username, amount, reason||'Admin-overførsel', 'ADMIN');
  showMsg('cr-msg', `// ₡${amount>0?'+':''}${amount} → ${username}`);
  renderCreditsAdminPanel();
}

function renderCreditsWidget(username) {
  const balance  = getCredits(username);
  const myLog    = (state.creditLog||[]).filter(e=>e.username===username).slice(0,15);
  const otherUsers = state.users.filter(u=>!u.isAdmin && u.username!==username);
  const isSelf   = username === currentUser.username;

  const txForm = isSelf && otherUsers.length > 0 ? `
    <div style="border:1px solid rgba(0,255,136,0.2);padding:14px 16px;margin-bottom:14px;position:relative;">
      <div style="position:absolute;top:-9px;left:12px;background:var(--bg2);padding:0 8px;font-size:10px;letter-spacing:3px;color:var(--market-sell);text-transform:uppercase;">// OVERFØR CREDITS</div>
      <div style="display:grid;grid-template-columns:1fr 100px 1fr;gap:8px;margin-bottom:8px;align-items:end;">
        <div>
          <label class="field-label">TIL</label>
          <select class="retro-input" id="tx-to" style="cursor:pointer;border-color:rgba(0,255,136,0.3);">
            <option value="">— vælg modtager —</option>
            ${otherUsers.map(u=>`<option value="${escAttr(u.username)}">${escHtml(u.username)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label">BELØB</label>
          <input class="retro-input" id="tx-amount" type="number" min="1" max="${balance}" placeholder="0" style="border-color:rgba(0,255,136,0.3);"/>
        </div>
        <div>
          <label class="field-label">NOTE <span style="font-size:9px;color:var(--text-dim);">(valgfri)</span></label>
          <input class="retro-input" id="tx-note" placeholder="Betaling for..." style="border-color:rgba(0,255,136,0.3);"/>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button onclick="playerTransferCredits()" style="padding:6px 18px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;text-transform:uppercase;background:rgba(0,255,136,0.08);border:1px solid var(--market-sell);color:var(--market-sell);transition:all 0.15s;" onmouseover="this.style.background='rgba(0,255,136,0.18)'" onmouseout="this.style.background='rgba(0,255,136,0.08)'">₡ SEND</button>
        <span class="success-msg" id="tx-msg"></span>
      </div>
    </div>` : '';

  const logHtml = myLog.length === 0
    ? `<div style="font-size:11px;color:var(--border-bright);letter-spacing:2px;text-transform:uppercase;padding:10px 0;">// INGEN TRANSAKTIONER ENDNU</div>`
    : myLog.map(tx => {
        const isPos = tx.amount >= 0;
        const fromLabel = tx.from && tx.from !== username ? `fra ${escHtml(tx.from)}` : tx.from === 'ADMIN' ? 'ADMIN' : '';
        return `<div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);">
          <div>
            <div style="font-size:12px;color:var(--text-bright);letter-spacing:0.5px;">${escHtml(tx.reason||'Overførsel')}</div>
            <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-top:1px;">
              ${new Date(tx.ts).toLocaleString('da-DK',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
              ${fromLabel ? ` · ${fromLabel}` : ''}
              · balance: ₡${tx.balance.toLocaleString()}
            </div>
          </div>
          <div style="font-family:'VT323',monospace;font-size:22px;color:${isPos?'var(--market-sell)':'var(--red)'};text-align:right;white-space:nowrap;">
            ${isPos?'+':''}${tx.amount.toLocaleString()} ₡
          </div>
        </div>`;
      }).join('');

  return `
    <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:16px;">
      <div>
        <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">CORTEX CREDITS BALANCE</div>
        <div class="credits-balance">₡ ${balance.toLocaleString()}</div>
      </div>
    </div>
    ${txForm}
    <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;border-bottom:1px solid var(--border-bright);padding-bottom:6px;margin-bottom:2px;">TRANSAKTIONSLOG</div>
    ${logHtml}`;
}

// =====================================================================
// IDENT — link a card to a username (admin/hacker only)
// =====================================================================
function getLinkedIdentCard(username) {
  const identTab = state.tabs.find(t=>t.isIdent);
  if(!identTab || !identTab.cards) return null;
  return identTab.cards.find(c=>c.linkedUsername === username) || null;
}

function renderLinkedIdentCard(username) {
  const card = getLinkedIdentCard(username);
  const isSelf    = username === currentUser.username;
  const canLink   = currentUser.isAdmin || currentUser.isHacker;
  const identTab  = state.tabs.find(t=>t.isIdent);
  const allCards  = identTab ? (identTab.cards||[]) : [];

  if(!card) {
    if(!canLink) return '';
    // Admin/hacker can assign one
    return `<div style="border:1px dashed var(--border-bright);padding:14px 16px;margin-bottom:4px;position:relative;">
      <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px;">// INGEN IDENT KNYTTET TIL DENNE BRUGER</div>
      ${allCards.length > 0 ? `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select class="retro-input" id="ident-link-select-${escAttr(username)}" style="flex:1;cursor:pointer;border-color:rgba(79,195,247,0.3);">
          <option value="">— vælg ident-kort —</option>
          ${allCards.map(c=>`<option value="${escAttr(c.id)}">${escHtml(c.name)} (${escHtml(c.citizenId||'—')})</option>`).join('')}
        </select>
        <button onclick="identLinkCard('${escAttr(username)}')" style="padding:6px 14px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;background:rgba(79,195,247,0.08);border:1px solid var(--cortex-accent);color:var(--cortex-accent);text-transform:uppercase;white-space:nowrap;">🆔 KNYT</button>
      </div>` : `<div style="font-size:11px;color:var(--text-dim);">Ingen ident-kort oprettet endnu — opret dem i Ident Registry-tabben.</div>`}
    </div>`;
  }

  // Render the linked card inline
  const statusColor = card.status==='validated'?'var(--green)':card.status==='flagged'?'var(--red)':'var(--amber)';
  const statusLabel = card.status==='validated'?'✓ VALIDATED':card.status==='flagged'?'⚠ FLAGGED':'⏳ PENDING';

  return `<div style="border:1px solid ${statusColor};background:var(--bg2);position:relative;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(to right,transparent,${statusColor},transparent);"></div>
    <div style="display:grid;grid-template-columns:100px 1fr;">
      <div style="background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:36px;border-right:1px solid var(--border-bright);min-height:100px;">${card.photo?`<img src="${escHtml(card.photo)}" style="width:100%;height:100%;object-fit:cover;"/>` : '👤'}</div>
      <div style="padding:12px 14px;position:relative;">
        <span style="position:absolute;top:8px;right:10px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;padding:2px 8px;border:1px solid ${statusColor};color:${statusColor};background:rgba(0,0,0,0.3);">${statusLabel}</span>
        <div style="font-family:'VT323',monospace;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:var(--text-bright);line-height:1.1;margin-bottom:4px;padding-right:90px;">${escHtml(card.name||'—')}</div>
        <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:1px;">FØDESTED: <span style="color:var(--text-bright);">${escHtml(card.planet||'—')}</span></div>
        <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">OCCUPATION: <span style="color:var(--text-bright);">${escHtml(card.job||'—')}</span></div>
        ${card.notes ? `<div style="font-size:11px;color:var(--text-dim);line-height:1.6;margin-bottom:6px;border-top:1px solid var(--border);padding-top:6px;">${escHtml(card.notes)}</div>` : ''}
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:1px;border-top:1px solid var(--border);padding-top:6px;">CITIZEN ID: ${escHtml(card.citizenId||'—')}</div>
      </div>
    </div>
    ${canLink ? `<div style="padding:6px 10px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;">
      <button onclick="identUnlinkCard('${escAttr(username)}')" style="padding:3px 10px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:transparent;border:1px solid var(--border);color:var(--text-dim);text-transform:uppercase;">✕ FJERN TILKNYTNING</button>
    </div>` : ''}
  </div>`;
}

function identLinkCard(username) {
  const sel = document.getElementById('ident-link-select-'+username);
  if(!sel || !sel.value) return;
  const identTab = state.tabs.find(t=>t.isIdent); if(!identTab) return;
  identTab.cards.forEach(c=>{ if(c.linkedUsername===username) delete c.linkedUsername; });
  const card = identTab.cards.find(c=>c.id===sel.value); if(!card) return;
  card.linkedUsername = username;
  saveState();
  refreshProfilePanel();
  const identPanel = document.getElementById('ident-panel-inner');
  if(identPanel) refreshIdentPanel(identTab);
}

function identLinkCardFromRegistry(tabId, cardId) {
  const sel = document.getElementById('link-select-'+cardId);
  if(!sel || !sel.value) return;
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const username = sel.value;
  // Remove any existing link for this user
  tab.cards.forEach(c=>{ if(c.linkedUsername===username) delete c.linkedUsername; });
  const card = tab.cards.find(c=>c.id===cardId); if(!card) return;
  card.linkedUsername = username;
  saveState();
  _identRenderCards(tabId);
}

function identUnlinkCardFromRegistry(tabId, cardId) {
  const tab = state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const card = tab.cards.find(c=>c.id===cardId); if(!card) return;
  delete card.linkedUsername;
  saveState();
  _identRenderCards(tabId);
}

function identUnlinkCard(username) {
  const identTab = state.tabs.find(t=>t.isIdent); if(!identTab) return;
  identTab.cards.forEach(c=>{ if(c.linkedUsername===username) delete c.linkedUsername; });
  saveState();
  refreshProfilePanel();
}

function adminCreditsPanel() {
  const isAdmin = currentUser && currentUser.isAdmin; if(!isAdmin) return '';
  const users = state.users.filter(u=>!u.isAdmin);
  return `<div class="panel" style="margin-top:20px;">
    <div class="panel-title" style="color:var(--market-sell);">₡ CREDITS MANAGER</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;align-items:end;">
      <div>
        <label class="field-label">BRUGER</label>
        <select class="retro-input" id="cr-user" style="cursor:pointer;">
          ${users.map(u=>`<option value="${escAttr(u.username)}">${escHtml(u.username)} (₡${getCredits(u.username)})</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">BELØB (negativt = træk fra)</label>
        <input class="retro-input" id="cr-amount" type="number" placeholder="500" style="border-color:var(--market-sell);"/>
      </div>
      <div>
        <label class="field-label">ÅRSAG</label>
        <input class="retro-input" id="cr-reason" placeholder="Mission reward" style="border-color:var(--market-sell);"/>
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <button class="save-btn" style="border-color:var(--market-sell);color:var(--market-sell);" onclick="adminTransferCredits()">₡ OVERFØR</button>
      <span class="success-msg" id="cr-msg"></span>
    </div>
    <div style="margin-top:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">
      ${users.map(u=>`<div style="border:1px solid var(--border-bright);padding:10px 12px;background:var(--bg2);">
        <div style="font-size:11px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">${escHtml(u.username)}</div>
        <div style="font-family:'VT323',monospace;font-size:26px;color:var(--market-sell);">₡ ${getCredits(u.username).toLocaleString()}</div>
      </div>`).join('')}
    </div>
  </div>`;
}


// =====================================================================
// BROADCAST SYSTEM
// =====================================================================
function broadcastSend(priority) {
  const title = (document.getElementById('bc-title')||{}).value.trim();
  const body  = (document.getElementById('bc-body')||{}).value.trim();
  if(!title || !body){ showMsg('bc-msg','// TITEL OG BESKED KRÆVES'); return; }
  if(!state.broadcasts) state.broadcasts = [];
  const now = new Date();
  const pad = n=>String(n).padStart(2,'0');
  const bc = {
    id: 'bc_'+Date.now(),
    title, body, priority: priority||'normal',
    by: currentUser.username,
    date: `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    ts: Date.now()
  };
  state.broadcasts.unshift(bc);
  if(state.broadcasts.length > 50) state.broadcasts.length = 50;
  saveState('volatile');
  // Show broadcast overlay to all users via state (will be caught on next sync)
  state._pendingBroadcast = bc.id;
  saveState();
  document.getElementById('bc-title').value='';
  document.getElementById('bc-body').value='';
  showMsg('bc-msg', '// BROADCAST SENDT');
  renderBroadcastAdminPanel();
}

function broadcastDelete(id) {
  if(!state.broadcasts) return;
  state.broadcasts = state.broadcasts.filter(b=>b.id!==id);
  saveState(); renderBroadcastAdminPanel();
}

function renderBroadcastAdminPanel() {
  const el = document.getElementById('broadcast-admin-inner'); if(!el) return;
  const broadcasts = state.broadcasts || [];
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div><label class="field-label" style="color:var(--cortex-gold);">TITEL</label><input class="retro-input" id="bc-title" placeholder="ALLIANCE MANDATE 7-ALPHA" style="border-color:rgba(255,220,0,0.4);"/></div>
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <button onclick="broadcastSend('normal')" class="save-btn" style="border-color:var(--cortex-gold);color:var(--cortex-gold);">📡 SEND</button>
        <button onclick="broadcastSend('high')" class="save-btn" style="border-color:var(--amber);color:var(--amber);">⚠ HIGH PRIORITY</button>
        <button onclick="broadcastSend('urgent')" class="save-btn" style="border-color:var(--red);color:var(--red);">🚨 URGENT</button>
        <span class="success-msg" id="bc-msg"></span>
      </div>
    </div>
    <label class="field-label" style="color:var(--cortex-gold);">BROADCAST BESKED</label>
    <textarea class="retro-textarea" id="bc-body" placeholder="Alliance-meddelelse til alle tilsluttede Cortex-terminaler..." style="min-height:80px;border-color:rgba(255,220,0,0.4);margin-bottom:14px;"></textarea>
    <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;border-bottom:1px solid var(--border-bright);padding-bottom:6px;margin-bottom:10px;">SENDTE BROADCASTS</div>
    ${broadcasts.length===0
      ? `<div style="font-size:12px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;">// INGEN BROADCASTS ENDNU</div>`
      : broadcasts.map(bc=>`<div style="border:1px solid ${bc.priority==='urgent'?'var(--red)':bc.priority==='high'?'var(--amber)':'rgba(255,220,0,0.3)'};padding:10px 14px;margin-bottom:8px;background:var(--bg2);display:flex;align-items:flex-start;gap:12px;">
          <div style="flex:1;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${bc.priority==='urgent'?'var(--red)':bc.priority==='high'?'var(--amber)':'var(--cortex-gold)'};margin-bottom:3px;">${escHtml(bc.title)}</div>
            <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;">${escHtml(bc.date)} · ${escHtml(bc.by)} · <span style="color:${bc.priority==='urgent'?'var(--red)':bc.priority==='high'?'var(--amber)':'var(--cortex-gold)'};">${bc.priority.toUpperCase()}</span></div>
          </div>
          <button class="delete-btn" onclick="broadcastDelete('${bc.id}')">✕</button>
        </div>`).join('')}`;
}

// Broadcast overlay shown to all users when a new broadcast fires
function showBroadcastOverlay(bc) {
  if(!bc) return;
  const prioColor = bc.priority==='urgent'?'var(--red)':bc.priority==='high'?'var(--amber)':'var(--cortex-gold)';
  const ov = document.createElement('div');
  ov.className = 'broadcast-overlay';
  ov.id = 'broadcast-overlay-'+bc.id;
  ov.innerHTML = `<div class="broadcast-box">
    <div class="broadcast-box" style="border-color:${prioColor};max-width:600px;width:90%;">
      <div style="height:3px;background:linear-gradient(to right,transparent,${prioColor},transparent);"></div>
      <div class="broadcast-header">
        <span style="font-family:'VT323',monospace;font-size:20px;letter-spacing:3px;color:${prioColor};">📡 CORTEX BROADCAST</span>
        <span style="font-size:11px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;margin-left:auto;">${escHtml(bc.date||'')}</span>
      </div>
      <div style="padding:6px 20px 2px;font-family:'VT323',monospace;font-size:28px;letter-spacing:2px;color:${prioColor};text-transform:uppercase;">${escHtml(bc.title)}</div>
      <div class="broadcast-body">${escHtml(bc.body)}</div>
      <div class="broadcast-footer">
        <button onclick="document.getElementById('broadcast-overlay-${bc.id}').remove()" class="save-btn" style="border-color:${prioColor};color:${prioColor};">[ ACKNOWLEDGED ]</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(ov);
}

// Check on every state sync if there's a pending broadcast for this user
let _lastSeenBroadcast = null;
function checkPendingBroadcast() {
  if(!state._pendingBroadcast || state._pendingBroadcast === _lastSeenBroadcast) return;
  if(currentUser && currentUser.isAdmin) { _lastSeenBroadcast = state._pendingBroadcast; return; } // admins don't see popup
  _lastSeenBroadcast = state._pendingBroadcast;
  const bc = (state.broadcasts||[]).find(b=>b.id===state._pendingBroadcast);
  if(bc) showBroadcastOverlay(bc);
}

function renderCreditsAdminPanel() {
  const el = document.getElementById('credits-admin-inner'); if(!el) return;
  const users = state.users.filter(u=>!u.isAdmin);
  el.innerHTML = `
    <div style="margin-bottom:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">
      ${users.map(u=>`<div style="border:1px solid var(--border-bright);padding:10px 12px;background:var(--bg2);">
        <div style="font-size:11px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">${escHtml(u.username)}</div>
        <div style="font-family:'VT323',monospace;font-size:26px;color:var(--market-sell);">₡ ${getCredits(u.username).toLocaleString()}</div>
      </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;align-items:end;">
      <div><label class="field-label">BRUGER</label>
        <select class="retro-input" id="cr-user" style="cursor:pointer;">
          ${users.map(u=>`<option value="${escAttr(u.username)}">${escHtml(u.username)} (₡${getCredits(u.username)})</option>`).join('')}
        </select>
      </div>
      <div><label class="field-label">BELØB (neg. = træk fra)</label><input class="retro-input" id="cr-amount" type="number" placeholder="500" style="border-color:var(--market-sell);"/></div>
      <div><label class="field-label">ÅRSAG</label><input class="retro-input" id="cr-reason" placeholder="Mission reward"/></div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <button class="save-btn" style="border-color:var(--market-sell);color:var(--market-sell);" onclick="adminTransferCredits()">₡ OVERFØR</button>
      <span class="success-msg" id="cr-msg"></span>
    </div>`;
}


// =====================================================================
// HUB PANELS — combined multi-tab panels
// =====================================================================

const HUB_CONFIGS = {
  cortex: {
    color: 'var(--cortex-accent)',
    tabs: [
      { id:'newspaper',  label:'📰 Avisen'         },
      { id:'sysnews',    label:'📡 System Nyheder'  },
      { id:'search',     label:'🔍 Cortex Søgning'  },
      { id:'broadcasts', label:'📡 Broadcasts'      },
    ]
  },
  legal: {
    color: 'var(--amber)',
    tabs: [
      { id:'ident',           label:'🆔 Ident-Reg'      },
      { id:'wanted_alliance', label:'⚠ Alliance Wanted' },
      { id:'wanted_criminal', label:'💀 Black Market'   },
    ]
  },
  ship: {
    color: 'var(--cortex-accent)',
    tabs: [
      { id:'manifest', label:'🛸 Manifest'   },
      { id:'cargo',    label:'📦 Cargo'       },
      { id:'missions', label:'📋 Missioner'   },
    ]
  },
  crew: {
    color: 'var(--market)',
    tabs: [
      { id:'market',  label:'🏪 Marked'      },
      { id:'rumors',  label:'🕵 Rumors'      },
      { id:'dice',    label:'🎲 Dice'         },
      { id:'polls',   label:'📊 Polls'        },
      { id:'dm',      label:'✉ DM'            },
    ]
  }
};

function buildHubPanel(tab) {
  return `<div id="hub-panel-${tab.id}"></div>`;
}

function refreshHubPanel(tab) {
  const el = document.getElementById('hub-panel-' + tab.id); if(!el) return;
  const cfg = HUB_CONFIGS[tab.hubType]; if(!cfg) return;
  const activeSubId = tab.activeTab || cfg.tabs[0].id;
  const accentColor = cfg.color;

  const tabBar = `<div class="hub-sub-tabs">
    ${cfg.tabs.map(t => `<button class="hub-sub-btn${activeSubId===t.id?' active '+tab.hubType:''}"
      onclick="hubSwitchTab('${tab.id}','${t.id}')">${t.label}</button>`).join('')}
  </div>`;

  el.innerHTML = tabBar + `<div id="hub-content-${tab.id}"></div>`;
  _hubRenderContent(tab, activeSubId);
}

function _hubRenderContent(tab, subId) {
  const cfg = HUB_CONFIGS[tab.hubType]; if(!cfg) return;
  const contentEl = document.getElementById('hub-content-' + tab.id); if(!contentEl) return;

  const containerMap = {
    search:'cortex-search-inner', broadcasts:'broadcast-view-inner',
    manifest:'manifest-inner', cargo:'cargo-inner', missions:'missions-inner',
    dice:'dice-inner', polls:'polls-inner', dm:'dm-inner',
    'market':'market-panel-inner', rumors:'rumors-hub-inner',
    ident:'ident-panel-inner',
    wanted_alliance:'wanted-panel-inner-wanted_alliance',
    wanted_criminal:'wanted-panel-inner-wanted_criminal',
    newspaper:'newspaper-hub-inner', sysnews:'sysnews-hub-inner'
  };

  const cid = containerMap[subId] || subId+'-inner';
  contentEl.innerHTML = `<div id="${cid}"></div>`;

  const subTab = tab[subId] || _syntheticSubTab(subId);

  if(subId==='newspaper')      contentEl.innerHTML = buildNewspaperPanel(subTab);
  else if(subId==='sysnews')   contentEl.innerHTML = buildSysNewsPanel(subTab);
  else if(subId==='ident')     { contentEl.innerHTML=`<div id="ident-panel-inner"></div>`; refreshIdentPanel(subTab); }
  else if(subId==='wanted_alliance'||subId==='wanted_criminal') { contentEl.innerHTML=buildWantedPanel(subTab); refreshWantedPanel(subTab); }
  else if(subId==='search')    refreshCortexSearchPanel();
  else if(subId==='broadcasts'){ contentEl.innerHTML=`<div id="broadcast-view-inner"></div>`; _renderBroadcastView(); }
  else if(subId==='manifest')  refreshManifestPanel();
  else if(subId==='cargo')     refreshCargoPanel();
  else if(subId==='missions')  refreshMissionsPanel();
  else if(subId==='dice')      refreshDicePanel();
  else if(subId==='polls')     refreshPollsPanel();
  else if(subId==='dm')        refreshDmPanel();
  else if(subId==='market')    { const mt=_getOrCreateMarketTab(); contentEl.innerHTML=buildMarketPanel(mt); refreshMarketPanel(mt); }
  else if(subId==='rumors')    { const rt=_getOrCreateRumorsTab(); contentEl.innerHTML=buildRumorsPanel(rt); }
}

function _syntheticSubTab(id) {
  const defaults = {
    market:{id:'market',isMarket:true,listings:[]},
    rumors:{id:'rumors',isRumors:true,rumors:[]},
    ident:{id:'ident',isIdent:true,cards:[]},
    wanted_alliance:{id:'wanted_alliance',isWanted:true,wantedType:'alliance',listings:[]},
    wanted_criminal:{id:'wanted_criminal',isWanted:true,wantedType:'criminal',listings:[]},
    newspaper:{id:'newspaper',isNewspaper:true,articles:[]},
    sysnews:{id:'sysnews',isSysNews:true,entries:[]}
  };
  return defaults[id] || {id};
}

function _getOrCreateMarketTab() {
  for(const t of state.tabs){ if(t.isMarket)return t; if(t.isHub&&t.market)return t.market; }
  const ch=state.tabs.find(t=>t.hubType==='crew'); if(ch){if(!ch.market)ch.market={id:'market',isMarket:true,listings:[]};return ch.market;}
  return {id:'market',isMarket:true,listings:[]};
}

function _getOrCreateRumorsTab() {
  for(const t of state.tabs){ if(t.isRumors)return t; if(t.isHub&&t.rumors)return t.rumors; }
  const ch=state.tabs.find(t=>t.hubType==='crew'); if(ch){if(!ch.rumors)ch.rumors={id:'rumors',isRumors:true,rumors:[]};return ch.rumors;}
  return {id:'rumors',isRumors:true,rumors:[]};
}

function hubSwitchTab(hubId, subId) {
  const tab = state.tabs.find(t=>t.id===hubId); if(!tab) return;
  tab.activeTab = subId;
  const panel = document.getElementById('hub-panel-'+hubId);
  if(panel) panel.querySelectorAll('.hub-sub-btn').forEach((btn,i)=>{
    const cfg=HUB_CONFIGS[tab.hubType]; if(!cfg)return;
    const isActive = cfg.tabs[i] && cfg.tabs[i].id===subId;
    btn.className='hub-sub-btn'+(isActive?' active '+tab.hubType:'');
  });
  _hubRenderContent(tab, subId);
}

function _renderBroadcastView() {
  const el=document.getElementById('broadcast-view-inner'); if(!el)return;
  const isAdmin=currentUser.isAdmin;
  if(isAdmin){el.innerHTML='<div id="broadcast-admin-inner"></div>';renderBroadcastAdminPanel();return;}
  const broadcasts=state.broadcasts||[];
  el.innerHTML=broadcasts.length===0
    ?`<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:24px 0;text-align:center;">// INGEN BROADCASTS</div>`
    :broadcasts.map(bc=>{const c=bc.priority==='urgent'?'var(--red)':bc.priority==='high'?'var(--amber)':'var(--cortex-gold)';
      return `<div style="border:1px solid ${c};padding:14px 16px;margin-bottom:10px;background:var(--bg2);">
        <div style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${c};margin-bottom:6px;">${escHtml(bc.title)}</div>
        <div style="font-size:13px;color:var(--text-bright);line-height:1.7;white-space:pre-wrap;">${escHtml(bc.body)}</div>
        <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-top:8px;">${escHtml(bc.date||'')} · ${escHtml(bc.by||'')}</div>
      </div>`;}).join('');
}

function buildFrontPagePanel() {
  return `<div id="frontpage-inner"></div>`;
}

// =====================================================================
// SHIP MANIFEST
// =====================================================================
function buildManifestPanel() { return `<div id="manifest-inner"></div>`; }
function refreshManifestPanel() {
  const el = document.getElementById('manifest-inner'); if(!el) return;
  const isAdmin = currentUser.isAdmin;
  const manifest = state.manifest || [];
  const statusOpts = ['active','missing','deceased','unknown'];
  const statusLabel = { active:'ACTIVE', missing:'MISSING', deceased:'DECEASED', unknown:'UNKNOWN' };

  const formHtml = isAdmin ? `<div class="market-new-form" style="border-color:rgba(79,195,247,0.3);margin-bottom:16px;">
    <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);color:var(--cortex-accent);font-size:10px;letter-spacing:3px;padding:0 8px;">// TILFØJ TIL MANIFEST</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 120px;gap:10px;margin-bottom:8px;">
      <div><label class="field-label">NAVN</label><input class="retro-input" id="mf-name" placeholder="Malcolm Reynolds"/></div>
      <div><label class="field-label">ROLLE / STILLING</label><input class="retro-input" id="mf-role" placeholder="Captain"/></div>
      <div><label class="field-label">STATUS</label>
        <select class="retro-input" id="mf-status" style="cursor:pointer;">
          ${statusOpts.map(s=>`<option value="${s}">${statusLabel[s]}</option>`).join('')}
        </select>
      </div>
    </div>
    <div><label class="field-label">NOTE</label><input class="retro-input" id="mf-note" placeholder="Valgfri note..."/></div>
    <div style="margin-top:10px;display:flex;gap:10px;align-items:center;">
      <button class="save-btn" style="border-color:var(--cortex-accent);color:var(--cortex-accent);" onclick="manifestAdd()">🚀 TILFØJ</button>
      <span class="success-msg" id="mf-msg"></span>
    </div>
  </div>` : '';

  const rowsHtml = manifest.length === 0
    ? `<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:24px 0;text-align:center;">// MANIFEST TOMT</div>`
    : `<div style="border:1px solid var(--border-bright);overflow:hidden;">
        <div style="display:grid;grid-template-columns:1fr 120px 120px auto;gap:10px;padding:8px 14px;background:rgba(0,0,0,0.4);border-bottom:1px solid var(--border-bright);">
          <span style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">NAVN</span>
          <span style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">ROLLE</span>
          <span style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">STATUS</span>
          ${isAdmin?`<span></span>`:''}
        </div>
        ${manifest.map(m=>`<div class="manifest-row">
          <div>
            <div style="font-size:14px;color:var(--text-bright);letter-spacing:1px;">${escHtml(m.name||'—')}</div>
            ${m.note?`<div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;">${escHtml(m.note)}</div>`:''}
          </div>
          <div style="font-size:12px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;">${escHtml(m.role||'—')}</div>
          ${isAdmin
            ? `<select onchange="manifestSetStatus('${m.id}',this.value)" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:4px 6px;font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer;outline:none;">
                ${statusOpts.map(s=>`<option value="${s}" ${m.status===s?'selected':''}>${statusLabel[s]}</option>`).join('')}
              </select>`
            : `<span class="manifest-status ${m.status||'unknown'}">${statusLabel[m.status]||'UNKNOWN'}</span>`}
          ${isAdmin?`<button class="delete-btn" style="font-size:10px;" onclick="manifestDelete('${m.id}')">✕</button>`:''}
        </div>`).join('')}
      </div>`;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:var(--cortex-accent);">🛸 SKIBSMANIFEST</div>
      <div class="page-desc">// CREW & PASSENGER MANIFEST — CURRENT VOYAGE</div>
    </div>
    ${buildDefacementBanner('manifest')}
    ${formHtml}${rowsHtml}`;
}
function manifestAdd() {
  const name = (document.getElementById('mf-name')||{}).value.trim();
  if(!name){ showMsg('mf-msg','// NAVN KRÆVES'); return; }
  if(!state.manifest) state.manifest=[];
  state.manifest.push({ id:'mf_'+Date.now(), name, role:(document.getElementById('mf-role')||{}).value.trim(), status:(document.getElementById('mf-status')||{}).value||'active', note:(document.getElementById('mf-note')||{}).value.trim(), addedBy:currentUser.username, ts:Date.now() });
  saveState('volatile'); ['mf-name','mf-role','mf-note'].forEach(i=>{const e=document.getElementById(i);if(e)e.value='';});
  showMsg('mf-msg','// TILFØJET.'); refreshManifestPanel();
}
function manifestSetStatus(id,status) {
  const m = (state.manifest||[]).find(x=>x.id===id); if(!m) return;
  m.status=status; saveState(); refreshManifestPanel();
}
function manifestDelete(id) {
  if(!confirm('Fjern fra manifest?')) return;
  state.manifest=(state.manifest||[]).filter(x=>x.id!==id); saveState(); refreshManifestPanel();
}

// =====================================================================
// CARGO MANIFEST
// =====================================================================
function buildCargoPanel() { return `<div id="cargo-inner"></div>`; }
function refreshCargoPanel() {
  const el = document.getElementById('cargo-inner'); if(!el) return;
  const isAdmin = currentUser.isAdmin;
  const cargo = state.cargo || [];

  const formHtml = `<div class="market-new-form" style="border-color:rgba(255,204,0,0.3);margin-bottom:16px;">
    <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);color:var(--cortex-gold);font-size:10px;letter-spacing:3px;padding:0 8px;">// LOG CARGO</div>
    <div style="display:grid;grid-template-columns:1fr 80px 100px;gap:10px;margin-bottom:8px;">
      <div><label class="field-label" style="color:var(--cortex-gold);">VARE / GODS</label><input class="retro-input" id="cg-name" placeholder="Processed Foodstuffs" style="border-color:rgba(255,204,0,0.3);"/></div>
      <div><label class="field-label" style="color:var(--cortex-gold);">ANTAL</label><input class="retro-input" id="cg-qty" type="number" placeholder="12" style="border-color:rgba(255,204,0,0.3);"/></div>
      <div><label class="field-label" style="color:var(--cortex-gold);">ENHED</label><input class="retro-input" id="cg-unit" placeholder="crates" style="border-color:rgba(255,204,0,0.3);"/></div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <button class="save-btn" style="border-color:var(--cortex-gold);color:var(--cortex-gold);" onclick="cargoAdd()">📦 LOG GODS</button>
      <span class="success-msg" id="cg-msg"></span>
    </div>
  </div>`;

  const rowsHtml = cargo.length === 0
    ? `<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:24px 0;text-align:center;">// LASTKAMMER TOMT</div>`
    : `<div style="border:1px solid var(--border-bright);overflow:hidden;">
        <div style="display:grid;grid-template-columns:1fr 80px 100px 120px auto;gap:10px;padding:8px 14px;background:rgba(0,0,0,0.4);border-bottom:1px solid var(--border-bright);">
          ${['VARE','ANTAL','ENHED','LOGGET AF',''].map(h=>`<span style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">${h}</span>`).join('')}
        </div>
        ${cargo.map(c=>`<div class="cargo-row">
          <div style="font-size:13px;color:var(--text-bright);">${escHtml(c.name||'—')}</div>
          <div style="font-family:'VT323',monospace;font-size:22px;color:var(--cortex-gold);">${escHtml(String(c.qty||'—'))}</div>
          <div style="font-size:12px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;">${escHtml(c.unit||'—')}</div>
          <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;">${escHtml(c.addedBy||'—')}</div>
          <button class="delete-btn" style="font-size:10px;" onclick="cargoDelete('${c.id}')">✕</button>
        </div>`).join('')}
      </div>`;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:var(--cortex-gold);">📦 CARGO MANIFEST</div>
      <div class="page-desc">// LASTKAMMER — REGISTRERET GODS OMBORD</div>
    </div>
    ${buildDefacementBanner('cargo')}
    ${formHtml}${rowsHtml}`;
}
function cargoAdd() {
  const name=(document.getElementById('cg-name')||{}).value.trim();
  if(!name){showMsg('cg-msg','// NAVN KRÆVES');return;}
  if(!state.cargo)state.cargo=[];
  state.cargo.push({id:'cg_'+Date.now(),name,qty:parseInt((document.getElementById('cg-qty')||{}).value)||1,unit:(document.getElementById('cg-unit')||{}).value.trim()||'stk',addedBy:currentUser.username,ts:Date.now()});
  saveState('volatile');['cg-name','cg-qty','cg-unit'].forEach(i=>{const e=document.getElementById(i);if(e)e.value='';});
  showMsg('cg-msg','// LOGGET.');refreshCargoPanel();
}
function cargoDelete(id){
  if(!confirm('Fjern fra cargo?'))return;
  state.cargo=(state.cargo||[]).filter(x=>x.id!==id);saveState();refreshCargoPanel();
}

// =====================================================================
// CORTEX SEARCH
// =====================================================================
function buildCortexSearchPanel() { return `<div id="cortex-search-inner"></div>`; }
function refreshCortexSearchPanel() {
  const el = document.getElementById('cortex-search-inner'); if(!el) return;
  const isAdmin = currentUser.isAdmin;
  const db = state.cortexSearch || {};

  const adminPanel = isAdmin ? `<div class="market-new-form" style="border-color:rgba(0,170,255,0.3);margin-bottom:20px;">
    <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);color:var(--cortex-accent);font-size:10px;letter-spacing:3px;padding:0 8px;">// TILFØJ CORTEX-OPSLAG</div>
    <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:8px;">
      <div><label class="field-label" style="color:var(--cortex-accent);">SØGEORD / NØGLEORD</label><input class="retro-input" id="cs-key" placeholder="Blue Sun Corporation" style="border-color:rgba(0,170,255,0.3);"/></div>
    </div>
    <label class="field-label" style="color:var(--cortex-accent);">CORTEX-SVAR</label>
    <textarea class="retro-textarea" id="cs-result" placeholder="Hvad returnerer Cortex når nogen søger på dette nøgleord..." style="min-height:80px;border-color:rgba(0,170,255,0.3);"></textarea>
    <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <button class="save-btn" style="border-color:var(--cortex-accent);color:var(--cortex-accent);" onclick="cortexAddEntry()">🔍 GEM OPSLAG</button>
      <span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">// Hackeren kan plante falske resultater — admins ser hvem der satte det op</span>
      <span class="success-msg" id="cs-msg"></span>
    </div>
  </div>` : '';

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:var(--cortex-accent);">🔍 CORTEX SØGNING</div>
      <div class="page-desc">// ALLIANCE CORTEX INFORMATION NETWORK</div>
    </div>
    ${buildDefacementBanner('cortexsearch')}
    ${adminPanel}
    <div style="position:relative;margin-bottom:20px;">
      <div style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--text-dim);">🔍</div>
      <input id="cortex-query" class="retro-input" placeholder="Søg i Cortex..."
        style="padding-left:40px;font-size:16px;border-color:var(--cortex-accent);"
        onkeydown="if(event.key==='Enter')cortexSearch()"/>
      <button onclick="cortexSearch()" style="position:absolute;right:0;top:0;bottom:0;padding:0 20px;font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;cursor:pointer;background:rgba(79,195,247,0.1);border:1px solid var(--cortex-accent);border-left:none;color:var(--cortex-accent);text-transform:uppercase;">SØG</button>
    </div>
    <div id="cortex-result"></div>
    ${isAdmin && Object.keys(db).length > 0 ? `<div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">
      <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px;">// DATABASE (${Object.keys(db).length} OPSLAG)</div>
      ${Object.entries(db).map(([k,v])=>`<div style="border:1px solid var(--border-bright);padding:10px 14px;margin-bottom:8px;background:var(--bg2);display:flex;align-items:flex-start;gap:10px;">
        <div style="flex:1;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;color:var(--cortex-accent);text-transform:uppercase;margin-bottom:4px;">${escHtml(k)}</div>
          <div style="font-size:12px;color:var(--text-dim);line-height:1.5;">${escHtml((v.result||'').slice(0,120))}${(v.result||'').length>120?'…':''}</div>
          ${v.forgedBy?`<div style="font-size:10px;color:var(--hacker);letter-spacing:1px;margin-top:3px;">⚡ PLANTET AF ${escHtml(v.forgedBy)}</div>`:`<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-top:3px;">Oprettet af ${escHtml(v.addedBy||'?')}</div>`}
        </div>
        <button class="delete-btn" style="font-size:10px;flex-shrink:0;" onclick="cortexDeleteEntry('${escAttr(k)}')">✕</button>
      </div>`).join('')}
    </div>` : ''}`;
}
function cortexSearch() {
  const q = (document.getElementById('cortex-query')||{}).value.trim().toLowerCase();
  const res = document.getElementById('cortex-result'); if(!res) return;
  if(!q){ res.innerHTML=''; return; }
  const db = state.cortexSearch || {};
  const match = Object.entries(db).find(([k])=>k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
  if(match) {
    const [k,v] = match;
    const isForged = !!v.forgedBy;
    res.innerHTML = `<div style="border:1px solid ${isForged&&currentUser.isAdmin?'var(--hacker)':'var(--cortex-accent)'};padding:20px;background:var(--bg2);position:relative;">
      <div style="height:2px;background:linear-gradient(to right,transparent,${isForged&&currentUser.isAdmin?'var(--hacker)':'var(--cortex-accent)'},transparent);position:absolute;top:0;left:0;right:0;"></div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;color:var(--cortex-accent);text-transform:uppercase;margin-bottom:4px;">// CORTEX RESULT: ${escHtml(k.toUpperCase())}</div>
      ${isForged&&currentUser.isAdmin?`<div style="font-size:10px;color:var(--hacker);letter-spacing:2px;margin-bottom:8px;">⚡ PLANTET DATA — FORGED BY ${escHtml(v.forgedBy)}</div>`:''}
      <div style="font-size:14px;color:var(--text-bright);line-height:1.8;white-space:pre-wrap;">${escHtml(v.result||'')}</div>
    </div>`;
  } else {
    res.innerHTML = `<div style="border:1px solid var(--border-bright);padding:20px;background:var(--bg2);color:var(--text-dim);font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
      // INGEN CORTEX-DATA FUNDET FOR: "${escHtml(q)}"<br/>
      <span style="font-size:11px;opacity:0.6;">— Prøv et andet søgeord, eller kontakt din lokale informant</span>
    </div>`;
  }
}
function cortexAddEntry() {
  const key = (document.getElementById('cs-key')||{}).value.trim();
  const result = (document.getElementById('cs-result')||{}).value.trim();
  if(!key||!result){showMsg('cs-msg','// SØGEORD OG SVAR KRÆVES');return;}
  if(!state.cortexSearch)state.cortexSearch={};
  const isHacker = currentUser.isHacker && !currentUser.isAdmin;
  state.cortexSearch[key.toLowerCase()] = { result, addedBy:currentUser.username, ts:Date.now(), forgedBy:isHacker?(currentUser.alterEgo||currentUser.username):null };
  saveState();
  document.getElementById('cs-key').value='';document.getElementById('cs-result').value='';
  showMsg('cs-msg',isHacker?'// ⚡ PLANTET.':'// GEMT.');refreshCortexSearchPanel();
}
function cortexDeleteEntry(key){
  if(!confirm('Slet opslag?'))return;
  delete state.cortexSearch[key];saveState();refreshCortexSearchPanel();
}

// =====================================================================
// MISSIONS
// =====================================================================
function buildMissionsPanel() { return `<div id="missions-inner"></div>`; }
function refreshMissionsPanel() {
  const el = document.getElementById('missions-inner'); if(!el) return;
  const isAdmin = currentUser.isAdmin;
  const missions = state.missions || [];
  const allUsers = state.users.filter(u=>!u.isAdmin);

  const formHtml = isAdmin ? `<div class="market-new-form" style="border-color:rgba(0,255,136,0.3);margin-bottom:16px;">
    <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);color:var(--market-sell);font-size:10px;letter-spacing:3px;padding:0 8px;">// OPRET MISSION</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
      <div><label class="field-label" style="color:var(--market-sell);">MISSIONSNAVN</label><input class="retro-input" id="ms-title" placeholder="Operation Dustfall" style="border-color:rgba(0,255,136,0.3);"/></div>
      <div><label class="field-label" style="color:var(--market-sell);">BELØNNING (credits)</label><input class="retro-input" id="ms-reward" type="number" placeholder="250" style="border-color:rgba(0,255,136,0.3);"/></div>
    </div>
    <label class="field-label" style="color:var(--market-sell);">BRIEFING</label>
    <textarea class="retro-textarea" id="ms-desc" placeholder="Missionens formål og detaljer..." style="min-height:70px;border-color:rgba(0,255,136,0.3);margin-bottom:8px;"></textarea>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
      <div><label class="field-label" style="color:var(--market-sell);">TILDEL TIL (tags/roller)</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;border:1px solid rgba(0,255,136,0.3);padding:8px;" id="ms-assign-boxes">
          ${getAllTags().map(t=>`<label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;color:var(--text-bright);">
            <input type="checkbox" value="${escAttr(t)}" style="accent-color:var(--market-sell);"/> ${escHtml(t)}
          </label>`).join('')}
        </div>
      </div>
      <div><label class="field-label" style="color:var(--market-sell);">DEADLINE <span style="font-size:9px;color:var(--text-dim);">(valgfri)</span></label>
        <input class="retro-input" id="ms-deadline" placeholder="Dag 2 — solnedgang" style="border-color:rgba(0,255,136,0.3);"/>
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <button class="save-btn" style="border-color:var(--market-sell);color:var(--market-sell);" onclick="missionCreate()">📋 UDSTED MISSION</button>
      <span class="success-msg" id="ms-msg"></span>
    </div>
  </div>` : '';

  // Filter missions for current user
  const myTags = (currentUser.tags||[currentUser.role]);
  const visibleMissions = isAdmin ? missions : missions.filter(m => !m.assignedTo || !m.assignedTo.length || m.assignedTo.some(t=>myTags.includes(t)));

  const statusOrder = {active:0,complete:1,failed:2};
  const sorted = [...visibleMissions].sort((a,b)=>(statusOrder[a.status]||0)-(statusOrder[b.status]||0));

  const listHtml = sorted.length === 0
    ? `<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:24px 0;text-align:center;">// INGEN AKTIVE MISSIONER</div>`
    : sorted.map(m=>{
        const sc = {active:'var(--green)',complete:'var(--cortex-accent)',failed:'var(--red)'}[m.status]||'var(--text-dim)';
        return `<div class="mission-card ${m.status||'active'}">
          <div class="mission-header">
            <div style="flex:1;">
              <div class="mission-title">${escHtml(m.title||'UNTITLED')}</div>
              ${m.assignedTo&&m.assignedTo.length?`<div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;margin-top:3px;">FOR: ${escHtml(m.assignedTo.join(', '))}</div>`:''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
              <span class="mission-status ${m.status||'active'}">${(m.status||'active').toUpperCase()}</span>
              ${m.reward?`<span style="font-family:'VT323',monospace;font-size:20px;color:var(--market-sell);">₡ ${Number(m.reward).toLocaleString()}</span>`:''}
            </div>
          </div>
          <div class="mission-body">
            ${m.desc?`<div style="font-size:13px;color:var(--text-bright);line-height:1.7;white-space:pre-wrap;margin-bottom:8px;">${escHtml(m.desc)}</div>`:''}
            ${m.deadline?`<div style="font-size:11px;color:var(--amber);letter-spacing:2px;text-transform:uppercase;">⏱ DEADLINE: ${escHtml(m.deadline)}</div>`:''}
            ${isAdmin?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;border-top:1px solid var(--border);padding-top:8px;">
              <button onclick="missionSetStatus('${m.id}','active')"   style="padding:3px 10px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:rgba(0,255,0,0.08);border:1px solid var(--green);color:var(--green);text-transform:uppercase;">AKTIV</button>
              <button onclick="missionSetStatus('${m.id}','complete')" style="padding:3px 10px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:rgba(79,195,247,0.08);border:1px solid var(--cortex-accent);color:var(--cortex-accent);text-transform:uppercase;">FULDFØRT</button>
              <button onclick="missionSetStatus('${m.id}','failed')"   style="padding:3px 10px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:rgba(255,0,0,0.08);border:1px solid var(--red);color:var(--red);text-transform:uppercase;">FEJLET</button>
              <button class="delete-btn" style="margin-left:auto;" onclick="missionDelete('${m.id}')">✕ SLET</button>
              ${m.status==='complete'&&m.reward?`<button onclick="missionPayOut('${m.id}')" style="padding:3px 12px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;background:rgba(0,255,136,0.12);border:1px solid var(--market-sell);color:var(--market-sell);text-transform:uppercase;">₡ UDBETAL BELØNNING</button>`:''}
            </div>`:''}
          </div>
        </div>`;
      }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:var(--market-sell);">📋 MISSIONER</div>
      <div class="page-desc">// AKTIVE OPERATIONER — BRIEFINGS & BELØNNINGER</div>
    </div>
    ${buildDefacementBanner('missions')}
    ${formHtml}${listHtml}`;
}
function missionCreate() {
  const title=(document.getElementById('ms-title')||{}).value.trim();
  if(!title){showMsg('ms-msg','// TITEL KRÆVES');return;}
  const boxes=document.querySelectorAll('#ms-assign-boxes input:checked');
  const assignedTo=Array.from(boxes).map(b=>b.value);
  if(!state.missions)state.missions=[];
  state.missions.push({id:'ms_'+Date.now(),title,desc:(document.getElementById('ms-desc')||{}).value.trim(),reward:parseInt((document.getElementById('ms-reward')||{}).value)||0,deadline:(document.getElementById('ms-deadline')||{}).value.trim(),assignedTo,status:'active',createdBy:currentUser.username,ts:Date.now()});
  saveState('volatile');
  document.querySelectorAll('#ms-assign-boxes input').forEach(b=>b.checked=false);
  ['ms-title','ms-desc','ms-reward','ms-deadline'].forEach(i=>{const e=document.getElementById(i);if(e)e.value='';});
  showMsg('ms-msg','// MISSION UDSTEDT.');refreshMissionsPanel();
}
function missionSetStatus(id,status){
  const m=(state.missions||[]).find(x=>x.id===id);if(!m)return;
  m.status=status;saveState();refreshMissionsPanel();
}
function missionPayOut(id){
  const m=(state.missions||[]).find(x=>x.id===id);if(!m||!m.reward)return;
  if(!m.assignedTo||!m.assignedTo.length){showMsg('ms-msg','// INGEN TILDELTE BRUGERE');return;}
  // Pay all users whose tags match assignedTo
  const recipients=state.users.filter(u=>(u.tags||[]).some(t=>m.assignedTo.includes(t)));
  recipients.forEach(u=>addCredits(u.username,m.reward,`Mission belønning: ${m.title}`,'ADMIN'));
  m.paidOut=true;saveState();
  alert(`₡${m.reward} udbetalt til: ${recipients.map(u=>u.username).join(', ')}`);
  refreshMissionsPanel();
}
function missionDelete(id){
  if(!confirm('Slet mission?'))return;
  state.missions=(state.missions||[]).filter(x=>x.id!==id);saveState();refreshMissionsPanel();
}

// =====================================================================
// DICE ROLLER
// =====================================================================
function buildDicePanel() { return `<div id="dice-inner"></div>`; }
function refreshDicePanel() {
  const el = document.getElementById('dice-inner'); if(!el) return;
  const log = state.diceLog || [];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:var(--cortex-gold);">🎲 DICE ROLLER</div>
      <div class="page-desc">// TILFÆLDIGHEDSGENERATOR — ALLE KAST LOGGES OG DELES</div>
    </div>
    <div style="border:1px solid rgba(255,220,0,0.3);padding:20px;margin-bottom:20px;background:rgba(255,220,0,0.02);">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;">
        ${[['1d4','1d4'],['1d6','1d6'],['1d8','1d8'],['1d10','1d10'],['1d12','1d12'],['1d20','1d20'],['1d100','1d100']].map(([label,val])=>`
          <button onclick="diceQuickRoll('${val}')" style="padding:8px 14px;font-family:'VT323',monospace;font-size:20px;cursor:pointer;background:rgba(255,220,0,0.08);border:1px solid rgba(255,220,0,0.4);color:var(--cortex-gold);letter-spacing:1px;transition:all 0.15s;" onmouseover="this.style.background='rgba(255,220,0,0.2)'" onmouseout="this.style.background='rgba(255,220,0,0.08)'">${label}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input id="dice-custom" class="retro-input" placeholder="2d6+3 / 4d8 / 3d6+2d4" style="flex:1;border-color:rgba(255,220,0,0.4);font-size:15px;" onkeydown="if(event.key==='Enter')diceRoll()"/>
        <button onclick="diceRoll()" style="padding:10px 20px;font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;cursor:pointer;background:rgba(255,220,0,0.1);border:1px solid var(--cortex-gold);color:var(--cortex-gold);text-transform:uppercase;transition:all 0.15s;" onmouseover="this.style.background='rgba(255,220,0,0.25)'" onmouseout="this.style.background='rgba(255,220,0,0.1)'">🎲 KAS</button>
      </div>
      <div id="dice-result-live" style="margin-top:14px;min-height:60px;"></div>
    </div>
    <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;border-bottom:1px solid var(--border-bright);padding-bottom:6px;margin-bottom:10px;">// KASLOG (seneste ${Math.min(log.length,30)})</div>
    <div id="dice-log-list">
      ${log.length===0?`<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:16px 0;text-align:center;">// INGEN KAST ENDNU</div>`
        :log.slice(0,30).map(e=>`<div class="dice-result">
          <div class="dice-total">${e.total}</div>
          <div>
            <div class="dice-notation">${escHtml(e.username)} — ${escHtml(e.notation)}</div>
            <div class="dice-breakdown">[${e.rolls.join(', ')}]${e.modifier?` + ${e.modifier}`:''}</div>
            <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-top:2px;">${new Date(e.ts).toLocaleTimeString('da-DK',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
          </div>
          <div style="font-size:10px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;">${e.rolls.length>1?`${e.rolls.length} DICE`:''}</div>
        </div>`).join('')}
    </div>`;
}
function _parseDiceNotation(notation) {
  // Supports: 2d6+3, 4d8, 1d20, 3d6+2d4, d20
  notation = notation.trim().toLowerCase();
  let total = 0; let allRolls = []; let modifier = 0;
  const parts = notation.split(/(?=[+-])/);
  for(let part of parts) {
    part = part.trim();
    const mod = part.match(/^([+-]?\d+)$/);
    if(mod){ modifier += parseInt(mod[1]); total += parseInt(mod[1]); continue; }
    const dice = part.match(/^([+-]?)(\d*)d(\d+)$/);
    if(!dice) continue;
    const sign = dice[1]==='-'?-1:1;
    const count = parseInt(dice[2])||1;
    const sides = parseInt(dice[3]);
    for(let i=0;i<Math.min(count,100);i++){
      const roll = Math.floor(Math.random()*sides)+1;
      allRolls.push(roll*sign);
      total += roll*sign;
    }
  }
  return { total, rolls:allRolls, modifier, notation };
}
function diceRoll() {
  const input = document.getElementById('dice-custom');
  if(!input||!input.value.trim()) return;
  _diceExecute(input.value.trim());
}
function diceQuickRoll(notation) { _diceExecute(notation); }
function _diceExecute(notation) {
  let result;
  try { result = _parseDiceNotation(notation); } catch(e) { return; }
  if(!result.rolls.length && !result.modifier) return;
  const liveEl = document.getElementById('dice-result-live');
  if(liveEl) {
    liveEl.innerHTML = `<div style="display:flex;align-items:center;gap:16px;padding:10px 0;">
      <div style="font-family:'VT323',monospace;font-size:72px;color:var(--cortex-gold);line-height:1;text-shadow:0 0 20px rgba(255,220,0,0.4);">${result.total}</div>
      <div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--cortex-accent);letter-spacing:2px;text-transform:uppercase;">${escHtml(notation.toUpperCase())}</div>
        <div style="font-size:12px;color:var(--text-dim);letter-spacing:1px;margin-top:4px;">[${result.rolls.join(', ')}]${result.modifier?` + ${result.modifier}`:''}</div>
      </div>
    </div>`;
  }
  // Log it
  if(!state.diceLog) state.diceLog=[];
  state.diceLog.unshift({id:'d_'+Date.now(),username:currentUser.username,notation:notation.toUpperCase(),...result,ts:Date.now()});
  if(state.diceLog.length>100)state.diceLog.length=100;
  saveState('activity');
  // Only refresh the log list, not the entire panel
  const logList = document.getElementById('dice-log-list');
  if(logList) {
    const log = state.diceLog;
    logList.innerHTML = log.slice(0,30).map(e=>`<div class="dice-result">
      <div class="dice-total">${e.total}</div>
      <div>
        <div class="dice-notation">${escHtml(e.username)} — ${escHtml(e.notation)}</div>
        <div class="dice-breakdown">[${e.rolls.join(', ')}]${e.modifier?` + ${e.modifier}`:''}</div>
        <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-top:2px;">${new Date(e.ts).toLocaleTimeString('da-DK',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
      </div>
      <div style="font-size:10px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;">${e.rolls.length>1?`${e.rolls.length} DICE`:''}</div>
    </div>`).join('');
  }
}

// =====================================================================
// POLLS
// =====================================================================
function buildPollsPanel() { return `<div id="polls-inner"></div>`; }
function refreshPollsPanel() {
  const el = document.getElementById('polls-inner'); if(!el) return;
  const isAdmin = currentUser.isAdmin;
  const polls = state.polls || [];

  const formHtml = isAdmin ? `<div class="market-new-form" style="border-color:rgba(79,195,247,0.3);margin-bottom:20px;">
    <div style="position:absolute;top:-10px;left:14px;background:var(--bg2);color:var(--cortex-accent);font-size:10px;letter-spacing:3px;padding:0 8px;">// OPRET AFSTEMNING</div>
    <div style="margin-bottom:8px;"><label class="field-label" style="color:var(--cortex-accent);">SPØRGSMÅL</label>
      <input class="retro-input" id="pl-question" placeholder="Hvem er morderens medskyldige?" style="border-color:rgba(79,195,247,0.3);"/>
    </div>
    <label class="field-label" style="color:var(--cortex-accent);">SVARMULIGHEDER <span style="font-size:9px;color:var(--text-dim);">(én per linje)</span></label>
    <textarea class="retro-textarea" id="pl-options" placeholder="Malcolm Reynolds\nZoe Washburne\nJayne Cobb\nVed ikke" style="min-height:80px;border-color:rgba(79,195,247,0.3);"></textarea>
    <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <button class="save-btn" style="border-color:var(--cortex-accent);color:var(--cortex-accent);" onclick="pollCreate()">📊 OPRET</button>
      <span class="success-msg" id="pl-msg"></span>
    </div>
  </div>` : '';

  const pollsHtml = polls.length===0
    ? `<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:24px 0;text-align:center;">// INGEN AKTIVE AFSTEMNINGER</div>`
    : [...polls].reverse().map(p => {
        const totalVotes = p.options.reduce((sum,o)=>sum+(o.votes||[]).length,0);
        const myVote = p.options.find(o=>(o.votes||[]).includes(currentUser.username));
        return `<div class="poll-card">
          <div style="padding:14px 16px 10px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div style="font-family:'VT323',monospace;font-size:26px;letter-spacing:2px;color:var(--text-bright);text-transform:uppercase;">${escHtml(p.question||'?')}</div>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
              <span style="font-size:10px;color:${p.open?'var(--green)':'var(--text-dim)'};letter-spacing:2px;text-transform:uppercase;border:1px solid ${p.open?'var(--green)':'var(--border)'};padding:2px 8px;">${p.open?'ÅBEN':'LUKKET'}</span>
              <span style="font-size:11px;color:var(--text-dim);letter-spacing:1px;">${totalVotes} stemme${totalVotes!==1?'r':''}</span>
              ${isAdmin?`<button onclick="pollToggle('${p.id}')" style="padding:2px 8px;font-family:'Share Tech Mono',monospace;font-size:10px;cursor:pointer;background:transparent;border:1px solid var(--border);color:var(--text-dim);text-transform:uppercase;">${p.open?'LUK':'ÅBEN'}</button>
              <button class="delete-btn" style="font-size:10px;" onclick="pollDelete('${p.id}')">✕</button>`:''}
            </div>
          </div>
          <div style="padding:12px 16px;">
            ${p.options.map(o=>{
              const votes=(o.votes||[]).length;
              const pct=totalVotes>0?Math.round(votes/totalVotes*100):0;
              const isMyVote=myVote&&myVote.id===o.id;
              return `<div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    ${p.open&&!myVote?`<button onclick="pollVote('${p.id}','${o.id}')" style="padding:3px 10px;font-family:'Share Tech Mono',monospace;font-size:10px;cursor:pointer;background:rgba(79,195,247,0.08);border:1px solid var(--cortex-accent);color:var(--cortex-accent);text-transform:uppercase;letter-spacing:1px;">STEM</button>`
                      :isMyVote?`<span style="font-size:11px;color:var(--market-sell);letter-spacing:1px;">✓ DIN STEMME</span>`
                      :`<span style="width:68px;"></span>`}
                    <span style="font-size:13px;color:var(--text-bright);">${escHtml(o.label||'')}</span>
                  </div>
                  <span style="font-family:'Share Tech Mono',monospace;font-size:12px;color:${isMyVote?'var(--market-sell)':'var(--text-dim)'};">${pct}% (${votes})</span>
                </div>
                <div class="poll-bar-wrap"><div class="poll-bar" style="width:${pct}%;background:${isMyVote?'var(--market-sell)':'var(--cortex-accent)'};"></div></div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:var(--cortex-accent);">📊 AFSTEMNINGER</div>
      <div class="page-desc">// ANONYM AFSTEMNING — RESULTATER DELES LIVE</div>
    </div>
    ${formHtml}${pollsHtml}`;
}
function pollCreate(){
  const q=(document.getElementById('pl-question')||{}).value.trim();
  const opts=(document.getElementById('pl-options')||{}).value.trim().split('\n').map(s=>s.trim()).filter(Boolean);
  if(!q||opts.length<2){showMsg('pl-msg','// SPØRGSMÅL OG MINDST 2 MULIGHEDER');return;}
  if(!state.polls)state.polls=[];
  state.polls.push({id:'pl_'+Date.now(),question:q,options:opts.map((l,i)=>({id:'o'+i,label:l,votes:[]})),open:true,createdBy:currentUser.username,ts:Date.now()});
  saveState('volatile');document.getElementById('pl-question').value='';document.getElementById('pl-options').value='';
  showMsg('pl-msg','// OPRETTET.');refreshPollsPanel();
}
function pollVote(pollId,optId){
  const p=(state.polls||[]).find(x=>x.id===pollId);if(!p||!p.open)return;
  p.options.forEach(o=>{o.votes=(o.votes||[]).filter(v=>v!==currentUser.username);}); // remove existing vote
  const opt=p.options.find(o=>o.id===optId);if(!opt)return;
  if(!opt.votes)opt.votes=[];
  opt.votes.push(currentUser.username);
  saveState('volatile');refreshPollsPanel();
}
function pollToggle(id){const p=(state.polls||[]).find(x=>x.id===id);if(!p)return;p.open=!p.open;saveState();refreshPollsPanel();}
function pollDelete(id){if(!confirm('Slet afstemning?'))return;state.polls=(state.polls||[]).filter(x=>x.id!==id);saveState();refreshPollsPanel();}

// =====================================================================
// DIRECT MESSAGES
// =====================================================================
const _activeDmUsers = {}; // username -> their currently selected DM recipient
function _getActiveDm() { return currentUser ? (_activeDmUsers[currentUser.username] || null) : null; }
function _setActiveDm(target) { if(currentUser) _activeDmUsers[currentUser.username] = target; }

function buildDmPanel() { return `<div id="dm-inner"></div>`; }
function refreshDmPanel() {
  const el = document.getElementById('dm-inner'); if(!el) return;
  const isAdmin = currentUser.isAdmin;
  const dmMessages = state.dmMessages || {};

  // Build user list for sidebar
  // Non-admin: show all other non-admin users you can DM
  // Admin: show only conversations that have messages
  let allDmUsers;
  if(isAdmin) {
    const usersWithConvos = [...new Set(
      Object.keys(dmMessages).flatMap(k => k.split('__'))
    )].filter(u => u && u !== currentUser.username)
      .map(u => state.users.find(x => x.username === u)).filter(Boolean);
    allDmUsers = usersWithConvos.length > 0 ? usersWithConvos
      : state.users.filter(u => !u.isAdmin && u.username !== currentUser.username);
  } else {
    allDmUsers = state.users.filter(u => !u.isAdmin && u.username !== currentUser.username);
  }

  // Auto-select first user if none selected or selected user no longer exists
  if(!_getActiveDm() || !allDmUsers.find(u => u.username === _getActiveDm())) {
    _setActiveDm(allDmUsers.length > 0 ? allDmUsers[0].username : null);
  }

  const dmKey = (a, b) => [a, b].sort().join('__');
  const getMessages = (user) => dmMessages[dmKey(currentUser.username, user)] || [];

  // Sidebar
  const sidebar = allDmUsers.length === 0
    ? `<div style="width:160px;flex-shrink:0;border-right:1px solid var(--border-bright);padding:14px;color:var(--text-dim);font-size:11px;letter-spacing:1px;text-transform:uppercase;">// INGEN BRUGERE</div>`
    : `<div style="width:160px;flex-shrink:0;border-right:1px solid var(--border-bright);overflow-y:auto;">
        ${allDmUsers.map(u => {
          const msgs = getMessages(u.username);
          const unread = msgs.filter(m => m.from !== currentUser.username && !m.read).length;
          const isActive = _getActiveDm() === u.username;
          return `<div onclick="_setActiveDm('${escAttr(u.username)}');_dmRefreshOnly();"
            style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);background:${isActive?'rgba(79,195,247,0.1)':'transparent'};position:relative;transition:background 0.15s;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:1px;color:${isActive?'var(--cortex-accent)':'var(--text-bright)'};text-transform:uppercase;">${escHtml(u.username)}</div>
            <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">${escHtml(u.role||'')}</div>
            ${msgs.length > 0 ? `<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml((msgs[msgs.length-1].body||'').slice(0,24))}${msgs[msgs.length-1].body.length>24?'…':''}</div>` : ''}
            ${unread > 0 ? `<span style="position:absolute;top:8px;right:8px;background:var(--red);color:var(--bg);font-size:9px;padding:1px 6px;font-family:'Share Tech Mono',monospace;">${unread}</span>` : ''}
          </div>`;
        }).join('')}
      </div>`;

  // Chat area
  let chatHtml = '';
  if(_getActiveDm()) {
    const msgs = getMessages(_getActiveDm());
    const activeUser = state.users.find(u => u.username === _getActiveDm());
    // Mark incoming as read
    msgs.filter(m => m.from !== currentUser.username && !m.read).forEach(m => m.read = true);

    chatHtml = `
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:var(--cortex-accent);text-transform:uppercase;padding:10px 14px;border-bottom:1px solid var(--border);flex-shrink:0;">
        // ${escHtml((_getActiveDm()||'').toUpperCase())}${activeUser?` — ${escHtml(activeUser.role||'')}`: ''}
      </div>
      <div id="dm-messages-area" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:6px;min-height:280px;max-height:420px;">
        ${msgs.length === 0
          ? `<div style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:auto;text-align:center;">// INGEN BESKEDER ENDNU<br/><span style="font-size:10px;opacity:0.6;">Send den første besked</span></div>`
          : msgs.map(m => {
              const isMine = m.from === currentUser.username;
              return `<div style="display:flex;flex-direction:column;align-items:${isMine?'flex-end':'flex-start'};gap:1px;">
                <div class="dm-name">${escHtml(m.from)}</div>
                <div class="dm-bubble ${isMine?'mine':'theirs'}">${escHtml(m.body)}</div>
                <div style="font-size:9px;color:var(--border-bright);letter-spacing:1px;">${new Date(m.ts).toLocaleTimeString('da-DK',{hour:'2-digit',minute:'2-digit'})}</div>
              </div>`;
            }).join('')}
      </div>
      <div style="padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0;">
        <input id="dm-input" class="retro-input" placeholder="Besked til ${escHtml(_getActiveDm()||'')}..."
          style="flex:1;border-color:rgba(79,195,247,0.3);"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();dmSend();}"/>
        <button onclick="dmSend()" style="padding:8px 18px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;background:rgba(79,195,247,0.12);border:1px solid var(--cortex-accent);color:var(--cortex-accent);text-transform:uppercase;white-space:nowrap;">SEND ↵</button>
      </div>`;
  } else {
    chatHtml = `<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;">// VÆLG EN MODTAGER</div>`;
  }

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title" style="color:var(--cortex-accent);">✉ PRIVAT COMMS</div>
      <div class="page-desc">// KRYPTERET DIREKTE KANAL — SYNLIG FOR ADMIN</div>
    </div>
    <div style="display:flex;border:1px solid var(--border-bright);background:var(--bg2);" id="dm-layout">
      ${sidebar}
      <div style="flex:1;display:flex;flex-direction:column;min-height:420px;">
        ${chatHtml}
      </div>
    </div>`;

  setTimeout(() => { const a = document.getElementById('dm-messages-area'); if(a) a.scrollTop = a.scrollHeight; }, 30);
}

// Lightweight refresh — only updates message area and input, keeps sidebar intact
function _dmRefreshOnly() {
  refreshDmPanel(); // full rebuild is fine here since user just clicked
}

function dmSend() {
  const input = document.getElementById('dm-input');
  const body = (input||{}).value.trim();
  if(!body || !_getActiveDm()) return;
  if(!state.dmMessages) state.dmMessages = {};
  const key = [currentUser.username, _getActiveDm()].sort().join('__');
  if(!state.dmMessages[key]) state.dmMessages[key] = [];
  state.dmMessages[key].push({ id:'dm_'+Date.now(), from:currentUser.username, body, ts:Date.now(), read:false });
  if(state.dmMessages[key].length > 200) state.dmMessages[key] = state.dmMessages[key].slice(-200);
  if(input) input.value = '';
  saveState('chat');
  // Update only the messages area — don't rebuild everything
  const msgsArea = document.getElementById('dm-messages-area');
  if(msgsArea) {
    const msgs = state.dmMessages[key];
    const m = msgs[msgs.length-1];
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:1px;';
    div.innerHTML = `<div class="dm-name">${escHtml(m.from)}</div>
      <div class="dm-bubble mine">${escHtml(m.body)}</div>
      <div style="font-size:9px;color:var(--border-bright);letter-spacing:1px;">${new Date(m.ts).toLocaleTimeString('da-DK',{hour:'2-digit',minute:'2-digit'})}</div>`;
    // Remove empty state message if present
    const empty = msgsArea.querySelector('div[style*="margin:auto"]');
    if(empty) empty.remove();
    msgsArea.appendChild(div);
    msgsArea.scrollTop = msgsArea.scrollHeight;
  } else {
    refreshDmPanel();
  }
}
function refreshFrontPagePanel() {
  const el = document.getElementById('frontpage-inner');
  if(!el) return;
  const fp = state.frontpage || {};
  const isAdmin = currentUser && currentUser.isAdmin;
  const sections = (fp.sections||[]).map((sec,si) => {
    if(isAdmin) {
      return `<div class="frontpage-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <input class="retro-input" id="fp-title-${si}" value="${escAttr(sec.title)}" style="font-family:'VT323',monospace;font-size:22px;letter-spacing:3px;border-color:var(--border-bright);width:70%;" placeholder="Section title..."/>
          <div style="display:flex;gap:8px;">
            <button class="save-btn" style="padding:3px 12px;font-size:11px;" onclick="saveFrontPageSection(${si})">SAVE</button>
            <button class="delete-btn" style="padding:3px 10px;font-size:11px;" onclick="deleteFrontPageSection(${si})">✕</button>
          </div>
        </div>
        <textarea class="frontpage-edit-area" id="fp-body-${si}" rows="5">${escHtml(sec.content)}</textarea>
      </div>`;
    }
    return `<div class="frontpage-section">
      <div class="frontpage-section-title">${escHtml(sec.title)}</div>
      <div class="frontpage-content">${escHtml(sec.content)}</div>
    </div>`;
  }).join('');

  const adminBar = isAdmin ? `
    <div style="max-width:820px;margin:0 auto;padding:0 24px 8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <span style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">// ADMIN: EDITING FRONT PAGE</span>
      <button class="add-btn" style="padding:4px 14px;font-size:12px;" onclick="addFrontPageSection()">+ ADD SECTION</button>
    </div>` : '';

  el.innerHTML = `
    <div class="frontpage-hero">
      <svg class="frontpage-moon-deco" width="72" height="72" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="56" fill="var(--green-dim)" opacity="0.7"/>
        <circle cx="78" cy="60" r="46" fill="var(--bg)"/>
      </svg>
      <div class="frontpage-title">${escHtml(fp.heroTitle||'THE CHRONICLE')}</div>
      <div class="frontpage-subtitle">${escHtml(fp.heroSub||'// SECURE NODE')}</div>
      ${isAdmin ? `<div style="margin-top:14px;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
        <input class="retro-input" id="fp-hero-title" value="${escAttr(fp.heroTitle||'THE CHRONICLE')}" style="font-family:'VT323',monospace;font-size:18px;letter-spacing:3px;width:280px;text-align:center;" placeholder="Hero title..."/>
        <input class="retro-input" id="fp-hero-sub" value="${escAttr(fp.heroSub||'')}" style="font-size:12px;letter-spacing:2px;width:320px;text-align:center;" placeholder="Subtitle..."/>
        <button class="save-btn" style="padding:4px 14px;font-size:12px;" onclick="saveFrontPageHero()">SAVE HEADER</button>
      </div>` : ''}
    </div>
    ${adminBar}
    <div class="frontpage-body">${sections}</div>`;
}
function saveFrontPageHero() {
  const t = document.getElementById('fp-hero-title'); const s = document.getElementById('fp-hero-sub');
  if(!state.frontpage) state.frontpage = {};
  state.frontpage.heroTitle = t ? t.value.trim() : '';
  state.frontpage.heroSub = s ? s.value.trim() : '';
  saveState(); refreshFrontPagePanel();
}
function saveFrontPageSection(si) {
  const t = document.getElementById('fp-title-'+si); const b = document.getElementById('fp-body-'+si);
  if(!state.frontpage||!state.frontpage.sections) return;
  state.frontpage.sections[si].title = t ? t.value.trim() : '';
  state.frontpage.sections[si].content = b ? b.value : '';
  saveState(); refreshFrontPagePanel();
}
function deleteFrontPageSection(si) {
  if(!state.frontpage||!state.frontpage.sections) return;
  state.frontpage.sections.splice(si,1);
  saveState(); refreshFrontPagePanel();
}
function addFrontPageSection() {
  if(!state.frontpage) state.frontpage = {};
  if(!state.frontpage.sections) state.frontpage.sections = [];
  state.frontpage.sections.push({ id:'fp_'+Date.now(), title:'NEW SECTION', content:'Edit this section content...' });
  saveState(); refreshFrontPagePanel();
}

// =====================================================================
// LORE HUB PANEL
// =====================================================================
function buildLoreHubPanel() {
  return `<div id="lorehub-inner"></div>`;
}
function refreshLoreHubPanel() {
  const el = document.getElementById('lorehub-inner');
  if(!el) return;
  showLoreHubGrid();
}

function showLoreHubGrid() {
  const el = document.getElementById('lorehub-inner');
  if(!el) return;
  const tabs = state.tabs.filter(t =>
    !t.isAdmin && !t.isHacker && !t.isProfile && !t.isChat && !t.isFrontPage && !t.isLoreHub
    && !t.isNewspaper && !t.isSysNews && !t.isRumors && !t.isCamera && !t.isMarket
    && !t.isIdent && !t.isWanted
    && currentUser.tabs.includes(t.id)
  );
  const cards = tabs.map(tab => {
    const folderCount = tab.folders ? tab.folders.length : 0;
    const entryCount = tab.folders ? tab.folders.reduce((a,f)=>a+(f.entries||[]).length,0) : 0;
    const desc = folderCount
      ? `${folderCount} folder${folderCount!==1?'s':''} · ${entryCount} entr${entryCount!==1?'ies':'y'}`
      : (tab.content ? tab.content.substring(0,60)+'…' : 'No entries yet');
    const defaced = state.defacements && state.defacements[tab.id];
    return `<div class="lorehub-card${defaced?' defaced-card':''}" onclick="openArchiveTab('${escAttr(tab.id)}')" title="Open ${escHtml(tab.name)}">
      <span class="lorehub-card-icon">${escHtml(tab.icon||'📄')}</span>
      <div class="lorehub-card-name">${escHtml(tab.name)}${defaced?` <span style="color:var(--hacker);font-size:14px;">⚠</span>`:''}</div>
      <div class="lorehub-card-desc">${escHtml(desc)}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="lorehub-header">
      <div class="lorehub-page-title">📚 THE ARCHIVE</div>
      <div class="lorehub-page-sub">// SELECT A DATABASE NODE TO ACCESS</div>
    </div>
    <div class="lorehub-grid">${cards || '<div style="color:var(--text-dim);font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:24px;">// NO ACCESSIBLE NODES FOUND</div>'}</div>`;
}

function openArchiveTab(tabId) {
  const tab = state.tabs.find(t=>t.id===tabId);
  if(!tab) return;
  const el = document.getElementById('lorehub-inner');
  if(!el) return;
  // Build content inline inside the archive panel
  let html = buildContentPanel(tab);
  el.innerHTML = `
    <div style="padding:14px 20px 0;">
      <button class="hdr-btn" onclick="showLoreHubGrid()" style="margin-bottom:14px;font-size:12px;">← BACK TO ARCHIVE</button>
    </div>
    <div>${html}</div>`;
  // Refresh dynamic panels if needed
  const inner = el.querySelector('#admin-inner, #hacker-panel-inner, #chat-inner, #profile-inner');
}
// CONTENT PANEL
// =====================================================================
function buildContentPanel(tab) {
  if(tab.folders) return buildFolderPanel(tab);
  return `
    <div class="page-header">
      <div class="page-title">${tab.icon} ${tab.name}</div>
      <div class="page-desc">// CLASSIFIED RECORD — AUTHORISED EYES ONLY</div>
    </div>
    ${buildDefacementBanner(tab.id)}
    <div class="panel">
      <div class="panel-title">// Chronicle Entry</div>
      <div class="entry-body">${escHtml(tab.content||'')}</div>
      ${buildImagesDisplay(tab.images||[],'tab',tab.id,null,null)}
    </div>
    ${currentUser.isAdmin ? buildTabImageUpload(tab.id) : ''}`;
}

function buildDefacementBanner(tabId) {
  const d = state.defacements[tabId];
  if(!d) return '';
  const lvl = d.hackLevel || 1;
  return `<div class="defaced-banner">
    <div class="defaced-banner-title">⚠ THIS PAGE HAS BEEN COMPROMISED ⚠</div>
    <div style="color:var(--hacker);font-size:18px;font-family:'VT323',monospace;margin:8px 0;letter-spacing:2px;">${escHtml(d.text)}</div>
    <div class="defaced-banner-by">// DEFACED BY: ${escHtml(d.by)} // ${new Date(d.timestamp).toLocaleString()} // HACK LEVEL: ${lvl} — REQUIRES ${lvl} CREDIT(S) TO REMOVE</div>
  </div>`;
}

function buildImagesDisplay(images, ctx, tabId, folderId, entryId) {
  if(!images||!images.length) return '';
  return `<div class="entry-images">${images.map((img,i)=>`
    <img class="entry-image" src="${img}" alt="img${i}" onclick="openLightbox('${escAttr(img)}')" title="Click to enlarge"/>
    ${currentUser.isAdmin ? `<button class="delete-btn" style="display:block;margin-top:4px;" onclick="removeImage('${ctx}','${tabId}','${folderId}','${entryId}',${i})">✕ IMG</button>` : ''}
  `).join('')}</div>`;
}

function buildTabImageUpload(tabId) {
  return `<div style="margin-top:12px">
    <label class="upload-zone" for="img-upload-tab-${tabId}">📷 DROP IMAGE OR CLICK TO UPLOAD (PNG/JPG/GIF)</label>
    <input type="file" id="img-upload-tab-${tabId}" accept="image/*" multiple style="display:none" onchange="handleImageUpload(event,'tab','${tabId}',null,null)"/>
  </div>`;
}

function buildFolderPanel(tab) {
  const defaceBanner = buildDefacementBanner(tab.id);
  const now_fp = Date.now();
  const folderCards = tab.folders.map(f=>{
    const flKey = 'folderlock.'+tab.id+'.'+f.id;
    const flData = hackerCooldowns[flKey];
    const flLocked = !!flData;
    const flLevel = flData ? (flData.hackLevel || 1) : 0;
    if(flLocked) {
      return `<div class="folder-card hacker-locked" title="HACKED — ACCESS DENIED">
        <div class="folder-icon">🔒</div>
        <div class="folder-name" style="color:var(--hacker);">${escHtml(f.name)}</div>
        <div class="folder-count" style="color:var(--hacker);font-size:9px;animation:blink 1s step-end infinite;">⚡ LOCKED — LVL ${flLevel} HACK</div>
      </div>`;
    }
    return `<div class="folder-card" onclick="openFolder('${tab.id}','${f.id}')">
      <div class="folder-icon">${f.icon}</div>
      <div class="folder-name">${escHtml(f.name)}</div>
      <div class="folder-count">${f.entries.length} record${f.entries.length!==1?'s':''}</div>
    </div>`;
  }).join('');

  return `
    <div class="page-header">
      <div class="page-title">${tab.icon} ${escHtml(tab.name)}</div>
      <div class="page-desc">// SELECT A FOLDER TO VIEW RECORDS</div>
    </div>
    ${defaceBanner}
    <div id="folders-home-${tab.id}">
      <div class="folder-grid">${folderCards}</div>
    </div>
    ${tab.folders.map(f=>`
      <div class="folder-view" id="folderview-${tab.id}-${f.id}">
        <div class="breadcrumb">
          <span class="breadcrumb-link" onclick="closeFolder('${tab.id}')">${escHtml(tab.name)}</span>
          <span class="breadcrumb-sep">&gt;</span>
          <span class="breadcrumb-current">${escHtml(f.name)}</span>
        </div>
        <div id="entries-home-${tab.id}-${f.id}">
          <div class="entries-list">
            ${f.entries.length===0
              ?`<div style="color:var(--text-dim);font-size:13px;letter-spacing:2px;padding:20px 0;text-transform:uppercase;">// NO RECORDS FILED</div>`
              :f.entries.map(e=>`
              <div class="entry-card" onclick="openEntry('${tab.id}','${f.id}','${e.id}')">
                <div class="entry-title">&gt; ${escHtml(e.title)}</div>
                <div class="entry-preview">${escHtml(e.body)}</div>
              </div>`).join('')}
          </div>
        </div>
        ${f.entries.map(e=>`
          <div class="entry-detail" id="entrydetail-${tab.id}-${f.id}-${e.id}">
            <div class="breadcrumb">
              <span class="breadcrumb-link" onclick="closeFolder('${tab.id}')">${escHtml(tab.name)}</span>
              <span class="breadcrumb-sep">&gt;</span>
              <span class="breadcrumb-link" onclick="closeEntry('${tab.id}','${f.id}')">${escHtml(f.name)}</span>
              <span class="breadcrumb-sep">&gt;</span>
              <span class="breadcrumb-current">${escHtml(e.title)}</span>
              ${e.protected ? `<span style="color:var(--amber);font-size:10px;letter-spacing:2px;margin-left:8px;">🔒 PROTECTED</span>` : ''}
              ${(e.hackerEdited && currentUser.isAdmin) ? `<span style="color:var(--hacker);font-size:10px;letter-spacing:2px;margin-left:8px;">⚡ HACKER-MODIFIED — LVL ${e.hackLevel||1} — RESTORE COSTS ${e.hackLevel||1} CREDIT${(e.hackLevel||1)!==1?'S':''}</span>` : ''}
            </div>
            <div class="panel" style="${(e.hackerEdited&&currentUser.isAdmin)?'border-color:var(--hacker);box-shadow:0 0 12px rgba(255,0,255,0.15);':''}">
              ${e.protected ? `<div style="position:absolute;top:8px;right:12px;color:var(--amber);font-size:11px;letter-spacing:2px;">🔒 ADMIN-PROTECTED</div>` : ''}
              ${(e.hackerEdited && currentUser.isAdmin) ? `<div style="position:absolute;top:8px;right:12px;color:var(--hacker);font-size:11px;letter-spacing:2px;">⚡ MODIFIED BY ${escHtml(e.hackerEditedBy||'?')}</div>` : ''}
              <div class="panel-title">&gt; ${escHtml(e.title)}</div>
              ${currentUser.isAdmin ? `
                <div style="margin-bottom:6px;">
                  <div style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:4px;">// CANONICAL TEXT (Admin)</div>
                  <div class="entry-body" style="background:var(--bg3);padding:10px;border:1px solid var(--border);">${escHtml(e.adminBody||e.body||'')}</div>
                </div>
                ${e.hackerEdited ? `
                  <div style="margin-bottom:6px;">
                    <div style="font-size:10px;letter-spacing:2px;color:var(--hacker);text-transform:uppercase;margin-bottom:4px;">// HACKER OVERLAY (What players see)</div>
                    <div class="entry-body" style="background:rgba(255,0,255,0.05);padding:10px;border:1px solid var(--hacker-dim);">${escHtml(e.hackerBody||'')}</div>
                  </div>` : ''}
              ` : `<div class="entry-body">${escHtml(e.hackerEdited ? (e.hackerBody||e.body) : (e.adminBody||e.body||''))}</div>`}
              ${buildImagesDisplay(e.images||[],'entry',tab.id,f.id,e.id)}
            </div>
            ${currentUser.isAdmin ? `
            <div style="margin-top:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <label class="upload-zone" style="flex:1;min-width:200px;" for="img-upload-${tab.id}-${f.id}-${e.id}">📷 UPLOAD IMAGE TO THIS ENTRY</label>
              <input type="file" id="img-upload-${tab.id}-${f.id}-${e.id}" accept="image/*" multiple style="display:none" onchange="handleImageUpload(event,'entry','${tab.id}','${f.id}','${e.id}')"/>
              <button class="${e.protected?'save-btn':'delete-btn'}" style="border-color:var(--amber);color:var(--amber);" onclick="toggleProtect('${tab.id}','${f.id}','${e.id}')">
                ${e.protected ? '🔒 UNPROTECT ENTRY' : '🔒 PROTECT ENTRY'}
              </button>
              ${e.hackerEdited ? `<button class="delete-btn" onclick="adminRestoreEntry('${tab.id}','${f.id}','${e.id}')">↩ RESET HACKER TEXT</button>` : ''}
              <button class="save-btn" style="border-color:var(--cyan);color:var(--cyan);" onclick="openAdminEntryEdit('${tab.id}','${f.id}','${e.id}')">✏ EDIT ENTRY TEXT</button>
            </div>
            <div id="admin-entry-edit-${tab.id}-${f.id}-${e.id}" style="display:none;margin-top:14px;">
              ${buildAdminEntryEditForm(tab.id, f.id, e.id)}
            </div>` : ''}
            ${((currentUser.isHacker || currentUser.isAdmin) && !e.protected) ? buildHackerEntryEditBtn(tab.id, f.id, e.id) : ''}
            ${((currentUser.isHacker || currentUser.isAdmin) && e.protected) ? `<div style="color:var(--amber);font-size:12px;letter-spacing:2px;margin-top:10px;text-transform:uppercase;">🔒 THIS ENTRY IS PROTECTED — CANNOT MODIFY</div>` : ''}
            ${isOrdensmagt() ? `
            <div class="criminal-section" style="margin:12px 0 0;">
              <div class="criminal-section-header">
                <div class="criminal-section-title">ORDENSMAGT — FORTROLIG SAGSAKT</div>
                <button class="criminal-save-btn" style="padding:4px 12px;font-size:9px;" onclick="toggleCriminalEntryEdit('${tab.id}','${f.id}','${e.id}')">✏ REDIGER</button>
              </div>
              <div id="criminal-entry-body-${e.id}">
                ${e.criminalNotes && e.criminalNotes.trim()
                  ? `<div class="criminal-body">${escHtml(e.criminalNotes)}</div>`
                  : `<div style="padding:12px 16px;color:var(--red-dim);font-size:11px;letter-spacing:2px;text-transform:uppercase;">// INGEN SAGER TILKNYTTET ENDNU</div>`}
              </div>
              <div id="criminal-entry-edit-${e.id}" style="display:none;" class="criminal-edit-form">
                <label class="field-label" style="color:var(--red);">SAGSNOTER (kun synlige for ordensmagt):</label>
                <textarea id="criminal-entry-textarea-${e.id}">${escHtml(e.criminalNotes||'')}</textarea>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button class="criminal-save-btn" onclick="saveCriminalEntryNotes('${tab.id}','${f.id}','${e.id}')">[ GEM SAGSNOTER ]</button>
                  <button class="criminal-save-btn" style="border-color:var(--border-bright);color:var(--text-dim);" onclick="toggleCriminalEntryEdit('${tab.id}','${f.id}','${e.id}')">[ ANNULLER ]</button>
                </div>
                <span class="success-msg" id="criminal-entry-msg-${e.id}" style="display:block;margin-top:6px;"></span>
              </div>
            </div>` : ''}
          </div>`).join('')}
      </div>`).join('')}`;
}

function isFolderHackerLocked(tabId, folderId) {
  const flKey = 'folderlock.'+tabId+'.'+folderId;
  return !!hackerCooldowns[flKey];
}

function openFolder(tabId, folderId) {
  if(isFolderHackerLocked(tabId, folderId) && !currentUser.isAdmin) return; // silently block
  document.getElementById('folders-home-'+tabId).style.display='none';
  document.querySelectorAll('[id^="folderview-'+tabId+'-"]').forEach(el=>el.classList.remove('active'));
  const fv = document.getElementById('folderview-'+tabId+'-'+folderId);
  if(fv){ fv.classList.add('active'); fv.querySelector('[id^="entries-home-"]').style.display='block'; }
  // Log folder view
  const tab = state.tabs.find(t=>t.id===tabId);
  const folder = tab && tab.folders ? tab.folders.find(f=>f.id===folderId) : null;
  if(tab && folder) logActivity('FOLDER', tab.name + ' › ' + folder.name);
}
function closeFolder(tabId) {
  document.getElementById('folders-home-'+tabId).style.display='';
  document.querySelectorAll('[id^="folderview-'+tabId+'-"]').forEach(el=>el.classList.remove('active'));
}
function openEntry(tabId, folderId, entryId) {
  document.getElementById('entries-home-'+tabId+'-'+folderId).style.display='none';
  document.querySelectorAll('[id^="entrydetail-'+tabId+'-'+folderId+'-"]').forEach(el=>el.classList.remove('active'));
  const ed = document.getElementById('entrydetail-'+tabId+'-'+folderId+'-'+entryId);
  if(ed) ed.classList.add('active');
  // Log entry view
  const tab = state.tabs.find(t=>t.id===tabId);
  const folder = tab && tab.folders ? tab.folders.find(f=>f.id===folderId) : null;
  const entry = folder ? folder.entries.find(e=>e.id===entryId) : null;
  if(tab && folder && entry) logActivity('ENTRY', tab.name + ' › ' + folder.name + ' › ' + entry.title);
}
function closeEntry(tabId, folderId) {
  document.getElementById('entries-home-'+tabId+'-'+folderId).style.display='';
  document.querySelectorAll('[id^="entrydetail-'+tabId+'-'+folderId+'-"]').forEach(el=>el.classList.remove('active'));
}

