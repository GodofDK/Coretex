// =====================================================================
// ADMIN FOLDER TOGGLE
// =====================================================================
function toggleAdminFolder(id) {
  const el = document.getElementById(id);
  const arrow = document.getElementById(id+'-arrow');
  if(!el) return;
  const collapsed = el.style.display === 'none';
  el.style.display = collapsed ? 'block' : 'none';
  if(arrow) arrow.textContent = collapsed ? '[ — COLLAPSE ]' : '[ + EXPAND ]';
  // Refresh relevant sub-lists when opened
  if(collapsed) {
    if(id === 'deface-folder') renderDefaceList();
    if(id === 'surveillance-folder') renderSurveillanceLog();
    if(id === 'chars-folder') renderProfilesFolder();
    if(id === 'broadcast-folder') renderBroadcastAdminPanel();
    if(id === 'credits-folder') renderCreditsAdminPanel();
  }
}

// =====================================================================
// ADMIN PANEL
// =====================================================================
function buildAdminPanel() {
  return `<div class="page-header"><div class="page-title" style="color:var(--amber)">⚙ GAME MASTER PANEL</div><div class="page-desc">// MANAGE CHARACTERS, ACCESS, TABS, FOLDERS, ENTRIES</div></div><div id="admin-inner"></div>`;
}

function refreshAdminPanel() {
  const inner = document.getElementById('admin-inner');
  if(!inner) return;
  inner.innerHTML = `
    <!-- SYSTEM CONTROL -->
    <div class="admin-section" style="border-color:var(--red);background:rgba(255,34,34,0.03);">
      <div class="admin-title" style="color:var(--red)">⚡ SYSTEM CONTROL</div>
      <p style="color:var(--text-dim);font-size:12px;letter-spacing:1px;margin-bottom:18px;text-transform:uppercase;">// BLOCK ALL NON-ADMIN USERS WITH A FULL-SCREEN OVERLAY — ACTIVATE TO PAUSE THE GAME</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:stretch;">
        <div style="flex:1;min-width:220px;border:1px solid var(--red-dim);background:rgba(255,34,34,0.06);padding:18px 20px;position:relative;">
          <div style="font-family:'VT323',monospace;font-size:22px;color:var(--red);letter-spacing:3px;margin-bottom:6px;">📡 SERVER OFFLINE</div>
          <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;line-height:1.8;margin-bottom:14px;text-transform:uppercase;">Blocks the screen with a red "Connection Lost" error. Players see a looping reconnect animation.</div>
          <button onclick="adminSetOverlay('offline')" id="btn-overlay-offline"
            style="width:100%;padding:10px 14px;font-family:'VT323',monospace;font-size:20px;letter-spacing:3px;cursor:pointer;text-transform:uppercase;transition:all 0.2s;
                   background:${state.siteOverlay&&state.siteOverlay.type==='offline'?'rgba(255,34,34,0.2)':'transparent'};
                   border:2px solid var(--red);color:var(--red);">
            ${state.siteOverlay&&state.siteOverlay.type==='offline' ? '[ ✕ DEACTIVATE ]' : '[ ACTIVATE ]'}
          </button>
          ${state.siteOverlay&&state.siteOverlay.type==='offline'?`<div style="font-size:10px;color:var(--red);letter-spacing:2px;text-transform:uppercase;margin-top:8px;animation:blink 1s step-end infinite;">⚡ ACTIVE — SET BY ${escHtml(state.siteOverlay.by||'—')}</div>`:''}
        </div>
        <div style="flex:1;min-width:220px;border:1px solid rgba(255,176,0,0.4);background:rgba(255,176,0,0.04);padding:18px 20px;position:relative;">
          <div style="font-family:'VT323',monospace;font-size:22px;color:var(--amber);letter-spacing:3px;margin-bottom:6px;">🔧 MAINTENANCE</div>
          <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;line-height:1.8;margin-bottom:14px;text-transform:uppercase;">Blocks the screen with a polite maintenance notice. Use during setup or between scenes.</div>
          <button onclick="adminSetOverlay('maintenance')" id="btn-overlay-maintenance"
            style="width:100%;padding:10px 14px;font-family:'VT323',monospace;font-size:20px;letter-spacing:3px;cursor:pointer;text-transform:uppercase;transition:all 0.2s;
                   background:${state.siteOverlay&&state.siteOverlay.type==='maintenance'?'rgba(255,176,0,0.15)':'transparent'};
                   border:2px solid var(--amber);color:var(--amber);">
            ${state.siteOverlay&&state.siteOverlay.type==='maintenance' ? '[ ✕ DEACTIVATE ]' : '[ ACTIVATE ]'}
          </button>
          ${state.siteOverlay&&state.siteOverlay.type==='maintenance'?`<div style="font-size:10px;color:var(--amber);letter-spacing:2px;text-transform:uppercase;margin-top:8px;animation:blink 1s step-end infinite;">⚡ ACTIVE — SET BY ${escHtml(state.siteOverlay.by||'—')}</div>`:''}
        </div>
        <div style="flex:1;min-width:220px;border:2px solid var(--red);background:rgba(255,34,34,0.04);padding:18px 20px;position:relative;">
          <div style="font-family:'VT323',monospace;font-size:22px;color:var(--red);letter-spacing:3px;margin-bottom:6px;">💀 HACKER SHUTDOWN</div>
          <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;line-height:1.8;margin-bottom:14px;text-transform:uppercase;">A Level 3 hacker has shut down the system for all non-admin users. Use this to restore access.</div>
          ${state.systemShutdown
            ? `<div style="font-size:11px;color:var(--red);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;animation:blink 1s step-end infinite;">⚡ ACTIVE — BY: ${escHtml(state.systemShutdown.by||'—')}</div>
               <button onclick="adminRestoreSystem()" style="width:100%;padding:10px 14px;font-family:'VT323',monospace;font-size:20px;letter-spacing:3px;cursor:pointer;text-transform:uppercase;background:rgba(0,255,65,0.1);border:2px solid var(--green);color:var(--green);">[ RESTORE SYSTEM ]</button>`
            : `<div style="font-size:11px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;">// NO ACTIVE SHUTDOWN</div>`}
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;margin-top:12px;">// NOTE: ADMINS ARE NEVER BLOCKED — OVERLAY ONLY AFFECTS OTHER USERS</div>
    </div>

    <!-- LOGIN CREDENTIALS FOLDER (collapsible) -->
    <div class="admin-section" style="padding:0;overflow:hidden;border:1px solid var(--border-bright);border-top:2px solid var(--amber);">
      <div onclick="toggleAdminFolder('creds-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,176,0,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,176,0,0.06)'" onmouseout="this.style.background='rgba(255,176,0,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">🔐</span>
          <div>
            <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;">LOGIN CREDENTIALS</div>
            <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">// ADD, EDIT &amp; REMOVE CHARACTER ACCOUNTS</div>
          </div>
        </div>
        <span id="creds-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--amber);letter-spacing:2px;white-space:nowrap;">[ — COLLAPSE ]</span>
      </div>
      <div id="creds-folder" style="padding:20px 24px;">
        <!-- ADD NEW CHARACTER -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px;">// ADD NEW CHARACTER</div>
          <div class="add-user-form" style="margin-bottom:12px;">
            <div class="form-field"><label>Handle</label><input id="new-username" type="text" placeholder="username" autocomplete="off"/></div>
            <div class="form-field"><label>Passphrase</label><input id="new-password" type="text" placeholder="password" autocomplete="off"/></div>
            <button class="add-btn" onclick="addUser()">+ ADD</button>
          </div>
          <div style="display:flex;gap:12px;margin-bottom:0;flex-wrap:wrap;">
            <div class="form-field" style="flex:0 0 200px"><label>Role / Title</label><input id="new-role" type="text" placeholder="e.g. Knight, Spy..." style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:100%;"/></div>
            <div class="form-field" style="flex:0 0 160px"><label>Account Type</label>
              <select id="new-type" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:100%;">
                <option value="standard">Standard</option>
                <option value="moderator">Moderator</option>
                <option value="offworlder">Offworlder</option>
                <option value="hacker">Hacker</option>
                <option value="criminal">Criminal</option>
              </select>
            </div>
          </div>
        </div>
        <!-- MANAGE TABLE — grouped by role type, each collapsible -->
        <div>
          <div style="font-size:11px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px;padding-top:16px;border-top:1px solid var(--border);">// MANAGE CHARACTERS</div>
          <div style="margin-bottom:10px;display:flex;align-items:center;gap:10px;">
            <span style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;white-space:nowrap;">// SEARCH:</span>
            <input id="user-search" type="text" placeholder="filter by handle, role or type..." oninput="renderUserTable()"
              style="flex:1;background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:8px 12px;font-family:'Share Tech Mono',monospace;font-size:13px;outline:none;caret-color:var(--green);" />
          </div>

          <!-- ★ ADMINS -->
          <div class="creds-group" id="creds-group-admin" style="margin-bottom:10px;border:1px solid var(--admin-color);overflow:hidden;">
            <div onclick="toggleCredsGroup('admin')" style="cursor:pointer;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,204,0,0.07);border-bottom:1px solid rgba(255,204,0,0.2);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,204,0,0.14)'" onmouseout="this.style.background='rgba(255,204,0,0.07)'">
              <span style="font-family:'VT323',monospace;font-size:20px;color:var(--admin-color);letter-spacing:4px;text-shadow:0 0 12px rgba(255,204,0,0.7);">★ ADMINS</span>
              <span id="creds-group-admin-arrow" style="font-family:'VT323',monospace;font-size:18px;color:var(--admin-color);letter-spacing:2px;">[ — COLLAPSE ]</span>
            </div>
            <div id="creds-group-admin-body" style="padding:0;">
              <table class="user-table"><thead><tr><th>Handle</th><th>Role</th><th>Type</th><th>Pass</th><th></th><th>Status</th><th>Alter Ego</th><th>Tab Access</th><th>Actions</th></tr></thead><tbody id="user-tbody-admin"></tbody></table>
            </div>
          </div>

          <!-- 🛡 MODERATORER -->
          <div class="creds-group" id="creds-group-moderator" style="margin-bottom:10px;border:1px solid var(--mod);overflow:hidden;">
            <div onclick="toggleCredsGroup('moderator')" style="cursor:pointer;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,255,204,0.07);border-bottom:1px solid rgba(0,255,204,0.25);transition:background 0.2s;" onmouseover="this.style.background='rgba(0,255,204,0.14)'" onmouseout="this.style.background='rgba(0,255,204,0.07)'">
              <span style="font-family:'VT323',monospace;font-size:20px;color:var(--mod);letter-spacing:4px;text-shadow:0 0 12px rgba(0,255,204,0.7);">🛡 MODERATORER</span>
              <span id="creds-group-moderator-arrow" style="font-family:'VT323',monospace;font-size:18px;color:var(--mod);letter-spacing:2px;">[ + EXPAND ]</span>
            </div>
            <div id="creds-group-moderator-body" style="padding:0;display:none;">
              <div style="padding:8px 16px;font-size:10px;color:var(--mod);letter-spacing:2px;background:rgba(0,255,204,0.04);border-bottom:1px solid rgba(0,255,204,0.15);">// KAN: Skrive i Rumor Has It · Avis · System Nyheder · LAVE (ikke redigere) logins — KAN IKKE: Bruge kamera</div>
              <table class="user-table"><thead><tr><th>Handle</th><th>Role</th><th>Type</th><th>Pass</th><th></th><th>Status</th><th>Alter Ego</th><th>Tab Access</th><th>Actions</th></tr></thead><tbody id="user-tbody-moderator"></tbody></table>
            </div>
          </div>

          <!-- 🌌 OFFWORLDERS -->
          <div class="creds-group" id="creds-group-offworlder" style="margin-bottom:10px;border:1px solid var(--offworlder);overflow:hidden;">
            <div onclick="toggleCredsGroup('offworlder')" style="cursor:pointer;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,102,0,0.07);border-bottom:1px solid rgba(255,102,0,0.25);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,102,0,0.14)'" onmouseout="this.style.background='rgba(255,102,0,0.07)'">
              <span style="font-family:'VT323',monospace;font-size:20px;color:var(--offworlder);letter-spacing:4px;text-shadow:0 0 12px rgba(255,102,0,0.7);">🌌 OFFWORLDERS</span>
              <span id="creds-group-offworlder-arrow" style="font-family:'VT323',monospace;font-size:18px;color:var(--offworlder);letter-spacing:2px;">[ + EXPAND ]</span>
            </div>
            <div id="creds-group-offworlder-body" style="padding:0;display:none;">
              <div style="padding:8px 16px;font-size:10px;color:var(--offworlder);letter-spacing:2px;background:rgba(255,102,0,0.04);border-bottom:1px solid rgba(255,102,0,0.15);">// Normal karakter — KAN IKKE: Bruge kamera</div>
              <table class="user-table"><thead><tr><th>Handle</th><th>Role</th><th>Type</th><th>Pass</th><th></th><th>Status</th><th>Alter Ego</th><th>Tab Access</th><th>Actions</th></tr></thead><tbody id="user-tbody-offworlder"></tbody></table>
            </div>
          </div>

          <!-- ⚡ HACKERE -->
          <div class="creds-group" id="creds-group-hacker" style="margin-bottom:10px;border:1px solid var(--hk);overflow:hidden;">
            <div onclick="toggleCredsGroup('hacker')" style="cursor:pointer;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;background:rgba(221,0,255,0.07);border-bottom:1px solid rgba(221,0,255,0.25);transition:background 0.2s;" onmouseover="this.style.background='rgba(221,0,255,0.14)'" onmouseout="this.style.background='rgba(221,0,255,0.07)'">
              <span style="font-family:'VT323',monospace;font-size:20px;color:var(--hk);letter-spacing:4px;text-shadow:0 0 14px rgba(221,0,255,0.9);">⚡ HACKERE</span>
              <span id="creds-group-hacker-arrow" style="font-family:'VT323',monospace;font-size:18px;color:var(--hk);letter-spacing:2px;">[ + EXPAND ]</span>
            </div>
            <div id="creds-group-hacker-body" style="padding:0;display:none;">
              <table class="user-table"><thead><tr><th>Handle</th><th>Role</th><th>Type</th><th>Pass</th><th></th><th>Status</th><th>Alter Ego</th><th>Tab Access</th><th>Actions</th></tr></thead><tbody id="user-tbody-hacker"></tbody></table>
            </div>
          </div>

          <!-- ☠ KRIMINELLE -->
          <div class="creds-group" id="creds-group-criminal" style="margin-bottom:10px;border:1px solid var(--criminal);overflow:hidden;">
            <div onclick="toggleCredsGroup('criminal')" style="cursor:pointer;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,26,26,0.07);border-bottom:1px solid rgba(255,26,26,0.25);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,26,26,0.14)'" onmouseout="this.style.background='rgba(255,26,26,0.07)'">
              <span style="font-family:'VT323',monospace;font-size:20px;color:var(--criminal);letter-spacing:4px;text-shadow:0 0 12px rgba(255,26,26,0.8);">☠ KRIMINELLE</span>
              <span id="creds-group-criminal-arrow" style="font-family:'VT323',monospace;font-size:18px;color:var(--criminal);letter-spacing:2px;">[ + EXPAND ]</span>
            </div>
            <div id="creds-group-criminal-body" style="padding:0;display:none;">
              <table class="user-table"><thead><tr><th>Handle</th><th>Role</th><th>Type</th><th>Pass</th><th></th><th>Status</th><th>Alter Ego</th><th>Tab Access</th><th>Actions</th></tr></thead><tbody id="user-tbody-criminal"></tbody></table>
            </div>
          </div>

          <!-- ● STANDARD / BORGERE / ØVRIGE -->
          <div class="creds-group" id="creds-group-standard" style="margin-bottom:10px;border:1px solid var(--border-bright);overflow:hidden;">
            <div onclick="toggleCredsGroup('standard')" style="cursor:pointer;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,170,255,0.05);border-bottom:1px solid var(--border-bright);transition:background 0.2s;" onmouseover="this.style.background='rgba(0,170,255,0.10)'" onmouseout="this.style.background='rgba(0,170,255,0.05)'">
              <span style="font-family:'VT323',monospace;font-size:20px;color:var(--cortex-accent);letter-spacing:4px;">● BORGERE &amp; ØVRIGE</span>
              <span id="creds-group-standard-arrow" style="font-family:'VT323',monospace;font-size:18px;color:var(--cortex-accent);letter-spacing:2px;">[ + EXPAND ]</span>
            </div>
            <div id="creds-group-standard-body" style="padding:0;display:none;">
              <table class="user-table"><thead><tr><th>Handle</th><th>Role</th><th>Type</th><th>Pass</th><th></th><th>Status</th><th>Alter Ego</th><th>Tab Access</th><th>Actions</th></tr></thead><tbody id="user-tbody-standard"></tbody></table>
            </div>
          </div>

          <div class="success-msg" id="user-msg"></div>
        </div>
      </div>
    </div>

    <!-- CHARACTER OVERVIEW FOLDER (collapsible) -->
    <div class="admin-section" style="padding:0;overflow:hidden;border:1px solid var(--border-bright);border-top:2px solid var(--green);">
      <div onclick="toggleAdminFolder('chars-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,255,65,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(0,255,65,0.06)'" onmouseout="this.style.background='rgba(0,255,65,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">👤</span>
          <div>
            <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;">CHARACTER OVERVIEW</div>
            <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">// QUICK OVERVIEW, STATUS &amp; HACKER CREDIT MANAGEMENT</div>
          </div>
        </div>
        <span id="chars-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--green);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="chars-folder" style="display:none;padding:20px 24px;">
        <!-- PLAYER PROFILES OVERVIEW -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <span style="color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;white-space:nowrap;">// SEARCH:</span>
          <input id="profiles-search" type="text" placeholder="filter by handle, role or type..." oninput="renderProfilesFolder()"
            style="flex:1;background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:8px 12px;font-family:'Share Tech Mono',monospace;font-size:13px;outline:none;caret-color:var(--green);" />
        </div>
        <div id="profiles-folder"></div>
      </div>
    </div>
    <!-- ROLLE MANAGER FOLDER (collapsible) -->
    <div class="admin-section" style="padding:0;overflow:hidden;border:1px solid var(--border-bright);border-top:2px solid var(--cyan);">
      <div onclick="toggleAdminFolder('roles-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,255,255,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(0,255,255,0.06)'" onmouseout="this.style.background='rgba(0,255,255,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">🏷</span>
          <div>
            <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;color:var(--cyan);">ROLLE MANAGER</div>
            <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">// ADMINISTRER TILGÆNGELIGE ROLLER — KANAL-ADGANG OG BRUGER-TILDELING</div>
          </div>
        </div>
        <span id="roles-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--cyan);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="roles-folder" style="display:none;padding:20px 24px;">
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;" id="roles-list-admin"></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <input id="new-role-name" type="text" placeholder="Ny rolle..." style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:220px;" onkeydown="if(event.key==='Enter')addRole()"/>
          <button class="add-btn" onclick="addRole()">+ TILFØJ ROLLE</button>
        </div>
        <span class="success-msg" id="roles-msg" style="display:block;margin-top:8px;"></span>
      </div>
    </div>

    <!-- TABS & FOLDERS (collapsible) -->
    <div class="admin-section" style="padding:0;overflow:hidden;border:1px solid var(--border-bright);border-top:2px solid var(--green);">
      <div onclick="toggleAdminFolder('tabs-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,255,65,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(0,255,65,0.06)'" onmouseout="this.style.background='rgba(0,255,65,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">📜</span>
          <div>
            <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;">TABS, FOLDERS &amp; ENTRIES</div>
            <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">// MANAGE PAGE CONTENT, FOLDER STRUCTURE &amp; ENTRIES</div>
          </div>
        </div>
        <span id="tabs-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--green);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="tabs-folder" style="display:none;padding:20px 24px;">
        <div id="tab-folder-editor"></div>
        <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <input id="new-tab-name" type="text" placeholder="New tab name..." style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:200px;"/>
          <label style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="new-tab-folders"/> USE FOLDERS
          </label>
          <button class="add-btn" onclick="addTab()">+ ADD TAB</button>
        </div>
        <div class="success-msg" id="tab-msg"></div>
      </div>
    </div>

    <!-- DEFACEMENT MANAGER (collapsible) -->
    <div class="admin-section" style="padding:0;overflow:hidden;border:1px solid var(--border-bright);border-top:2px solid var(--hacker);">
      <div onclick="toggleAdminFolder('deface-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,0,255,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,0,255,0.06)'" onmouseout="this.style.background='rgba(255,0,255,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">💀</span>
          <div>
            <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;color:var(--hacker);">DEFACEMENT MANAGER</div>
            <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">// REVIEW &amp; RESTORE HACKER-DEFACED TABS</div>
          </div>
        </div>
        <span id="deface-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--hacker);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="deface-folder" style="display:none;padding:20px 24px;">
        <div id="deface-list"></div>
      </div>
    </div>

    <!-- CHAT CHANNEL MANAGER (collapsible) -->
    <div class="admin-section" style="padding:0;overflow:hidden;border:1px solid var(--border-bright);border-top:2px solid var(--cyan);">
      <div onclick="toggleAdminFolder('chat-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,255,255,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(0,255,255,0.06)'" onmouseout="this.style.background='rgba(0,255,255,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">💬</span>
          <div>
            <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;color:var(--cyan);">CHAT CHANNEL MANAGER</div>
            <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">// CREATE, EDIT &amp; REMOVE CHAT CHANNELS</div>
          </div>
        </div>
        <span id="chat-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--cyan);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="chat-folder" style="display:none;padding:20px 24px;">
        <div id="chat-channel-list"></div>
        <div style="margin-top:14px;padding:14px;border:1px solid var(--border-bright);background:var(--bg2);">
          <div style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px;">// ADD NEW CHANNEL</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;">
            <div class="form-field" style="flex:0 0 180px"><label>Channel Name</label><input id="new-ch-name" type="text" placeholder="e.g. Tavern Gossip" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:100%;"/></div>
            <div class="form-field" style="flex:0 0 80px"><label>Icon</label><input id="new-ch-icon" type="text" placeholder="💬" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:100%;text-align:center;"/></div>
            <div class="form-field" style="flex:0 0 200px"><label>Access</label>
              <select id="new-ch-access" onchange="onChAccessChange()" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:100%;">
                <option value="all">Everyone</option>
                <option value="exclusive">🔒 Exclusive (specifikke tags — usynlig for andre)</option>
                <option value="roles">Specific Tags...</option>
                <option value="shadow">Shadow Tab Access</option>
                <option value="hacker">Hackers Only</option>
              </select>
            </div>
            <div class="form-field" style="flex:0 0 200px"><label>Mode</label>
              <select id="new-ch-mode" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:9px 12px;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;width:100%;">
                <option value="normal">Normal (cyan)</option>
                <option value="shadow">Shadow Mode (purple, alter ego)</option>
              </select>
            </div>
            <button class="add-btn" onclick="adminAddChannel()">+ ADD CHANNEL</button>
          </div>
          <div id="new-ch-roles-picker" style="display:none;margin-top:12px;padding:12px;border:1px solid var(--amber);background:var(--bg);">
            <div style="font-size:10px;letter-spacing:2px;color:var(--amber);text-transform:uppercase;margin-bottom:8px;">// SELECT WHICH TAGS CAN SEE THIS CHANNEL — ADMINS ALWAYS SEE ALL</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;" id="new-ch-roles-checkboxes">
              ${getAllTags().map(r=>`
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;border:1px solid var(--border-bright);padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--text-bright);letter-spacing:1px;">
                  <input type="checkbox" value="${escAttr(r)}" style="accent-color:var(--amber);width:14px;height:14px;"/>
                  ${escHtml(r)}
                </label>`).join('')}
            </div>
          </div>
          <span class="success-msg" id="ch-msg" style="display:block;margin-top:8px;"></span>
        </div>
      </div>
    </div>

    <!-- BETWEEN-GAME RESET (collapsible) -->
    <div class="admin-section" style="padding:0;overflow:hidden;border:1px solid var(--red-dim);border-top:2px solid var(--red);">
      <div onclick="toggleAdminFolder('reset-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,34,34,0.03);border-bottom:1px solid var(--red-dim);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,34,34,0.07)'" onmouseout="this.style.background='rgba(255,34,34,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">🔄</span>
          <div>
            <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;color:var(--red);">BETWEEN-GAME RESET</div>
            <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">// CLEAR HACKS, LOCKOUTS &amp; DEFACEMENTS — DESTRUCTIVE ACTIONS</div>
          </div>
        </div>
        <span id="reset-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--red);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="reset-folder" style="display:none;padding:20px 24px;">
        <p style="color:var(--text-dim);font-size:12px;letter-spacing:1px;margin-bottom:14px;text-transform:uppercase;">// RESTORE ALL ENTRIES TO THEIR CANONICAL ADMIN TEXT. CLEARS ALL HACKER OVERLAYS AND HACKER LOCKOUTS.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="save-btn" style="border-color:var(--cyan);color:var(--cyan);" onclick="resetAllHackerEdits()">↩ RESET ALL HACKER EDITS</button>
          <button class="save-btn" style="border-color:var(--amber);color:var(--amber);" onclick="resetAllLockouts()">🔓 CLEAR ALL LOCKOUTS</button>
          <button class="delete-btn" style="border-color:var(--red);color:var(--red);" onclick="fullGameReset()">⚠ FULL GAME RESET (all hacks + defacements + lockouts)</button>
        </div>
        <span class="success-msg" id="reset-msg" style="display:block;margin-top:10px;"></span>
      </div>
    </div>

    <!-- SURVEILLANCE LOG (collapsible) -->
    <div class="admin-section" style="padding:0;overflow:hidden;border:1px solid rgba(79,195,247,0.3);border-top:2px solid var(--cortex-accent);">
      <div onclick="toggleAdminFolder('surveillance-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(79,195,247,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(79,195,247,0.07)'" onmouseout="this.style.background='rgba(79,195,247,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">👁</span>
          <div>
            <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;color:var(--cortex-accent);">SURVEILLANCE LOG</div>
            <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">// TRACK WHAT PROFILES ARE VIEWING &amp; TOUCHING</div>
          </div>
        </div>
        <span id="surveillance-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--cortex-accent);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="surveillance-folder" style="display:none;padding:20px 24px;">
        <div id="surveillance-inner"></div>
      </div>
    </div>

    <!-- BROADCAST -->
    <div style="border:1px solid rgba(255,220,0,0.3);margin-bottom:16px;background:rgba(255,220,0,0.02);">
      <div onclick="toggleAdminFolder('broadcast-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,220,0,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,220,0,0.07)'" onmouseout="this.style.background='rgba(255,220,0,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">📡</span>
          <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;color:var(--cortex-gold);">CORTEX BROADCASTS</div>
        </div>
        <span id="broadcast-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--cortex-gold);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="broadcast-folder" style="display:none;padding:20px 24px;">
        <div id="broadcast-admin-inner"></div>
      </div>
    </div>

    <!-- CREDITS -->
    <div style="border:1px solid rgba(0,255,136,0.3);margin-bottom:16px;background:rgba(0,255,136,0.02);">
      <div onclick="toggleAdminFolder('credits-folder')" style="cursor:pointer;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,255,136,0.03);border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(0,255,136,0.07)'" onmouseout="this.style.background='rgba(0,255,136,0.03)'">
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;">₡</span>
          <div class="admin-title" style="margin:0;border:none;padding:0;font-size:20px;color:var(--market-sell);">CREDITS MANAGER</div>
        </div>
        <span id="credits-folder-arrow" style="font-family:'VT323',monospace;font-size:20px;color:var(--market-sell);letter-spacing:2px;white-space:nowrap;">[ + EXPAND ]</span>
      </div>
      <div id="credits-folder" style="display:none;padding:20px 24px;">
        <div id="credits-admin-inner"></div>
      </div>
    </div>`;

  renderUserTable();
  renderProfilesFolder();
  renderRolesList();
  renderTabFolderEditor();
  renderDefaceList();
  renderChannelList();
  renderSurveillanceLog();
  renderBroadcastAdminPanel();
  renderCreditsAdminPanel();
}

// =====================================================================
// SURVEILLANCE LOG RENDER
// =====================================================================
function renderSurveillanceLog() {
  const el = document.getElementById('surveillance-inner');
  if(!el) return;

  const log = state.activityLog || [];
  const users = state.users.filter(u => !u.isAdmin);
  const terminalLogins = state.terminalLogins || {};

  // ── TERMINAL OVERVIEW ────────────────────────────────────────────────
  // Collect all known terminals from log + login records
  const terminalMap = {}; // id → { name, users: Set, lastSeen, lastUser, logins: [] }

  // From login records
  Object.entries(terminalLogins).forEach(([tid, logins]) => {
    if(!terminalMap[tid]) terminalMap[tid] = { id:tid, users:new Set(), lastTs:0, lastUser:'', logins:[] };
    terminalMap[tid].logins = logins;
    logins.forEach(l => {
      terminalMap[tid].users.add(l.username);
      if(l.ts > terminalMap[tid].lastTs) { terminalMap[tid].lastTs = l.ts; terminalMap[tid].lastUser = l.username; }
    });
  });
  // From activity log (for terminals that predate the login-record system)
  log.forEach(e => {
    if(!e.terminalId) return;
    if(!terminalMap[e.terminalId]) terminalMap[e.terminalId] = { id:e.terminalId, users:new Set(), lastTs:0, lastUser:'', logins:[] };
    terminalMap[e.terminalId].users.add(e.user);
    if(e.ts > terminalMap[e.terminalId].lastTs) { terminalMap[e.terminalId].lastTs = e.ts; terminalMap[e.terminalId].lastUser = e.user; }
  });

  const terminals = Object.values(terminalMap).sort((a,b) => b.lastTs - a.lastTs);

  let terminalHtml = '';
  if(terminals.length === 0) {
    terminalHtml = `<div style="font-size:12px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;padding:12px 0;">// INGEN TERMINALER REGISTRERET ENDNU — TERMINALER VISES NÅR SPILLERE LOGGER IND</div>`;
  } else {
    terminalHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:6px;">
      ${terminals.map(t => {
        const displayName = getTerminalDisplayName(t.id);
        const autoName = t.logins[0] ? t.logins[0].terminalName : t.id;
        const userList = [...t.users].join(', ');
        const multiUser = t.users.size > 1;
        const lastLogin = t.logins[0];
        return `<div style="border:1px solid ${multiUser?'var(--amber)':'var(--border-bright)'};background:var(--bg2);padding:14px 16px;position:relative;">
          ${multiUser ? `<div style="position:absolute;top:0;right:0;background:var(--amber);color:var(--bg);font-size:9px;letter-spacing:1px;padding:2px 8px;text-transform:uppercase;">DELT TERMINAL</div>` : ''}
          <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--cortex-accent);letter-spacing:1px;margin-bottom:4px;text-transform:uppercase;padding-right:${multiUser?'80px':'0'};">${escHtml(displayName)}</div>
          <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">${escHtml(autoName !== displayName ? autoName : t.id)}</div>
          <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">
            <span style="color:var(--text-dim);">BRUGERE: </span>
            <span style="color:${multiUser?'var(--amber)':'var(--text-bright)'};">${escHtml(userList)}</span>
          </div>
          ${lastLogin ? `<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
            SIDST SET: <span style="color:var(--text-bright);">${escHtml(lastLogin.d)} ${escHtml(lastLogin.t)}</span>
            · <span style="color:var(--text-bright);">${escHtml(lastLogin.username)}</span>
          </div>` : ''}
          ${t.logins.length > 1 ? `<details style="margin-bottom:10px;">
            <summary style="font-size:10px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;cursor:pointer;outline:none;">LOGIN HISTORIK (${t.logins.length})</summary>
            <div style="margin-top:6px;border:1px solid var(--border);padding:6px;">
              ${t.logins.map(l=>`<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;padding:2px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;">
                <span style="color:var(--text-bright);min-width:80px;">${escHtml(l.username)}</span>
                <span>${escHtml(l.d)} ${escHtml(l.t)}</span>
              </div>`).join('')}
            </div>
          </details>` : ''}
          <button onclick="adminRenameTerminal('${escAttr(t.id)}')" style="padding:4px 12px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;cursor:pointer;text-transform:uppercase;background:transparent;border:1px solid var(--border-bright);color:var(--text-dim);transition:all 0.15s;" onmouseover="this.style.borderColor='var(--cortex-accent)';this.style.color='var(--cortex-accent)'" onmouseout="this.style.borderColor='var(--border-bright)';this.style.color='var(--text-dim)'">✏ OMDØB</button>
        </div>`;
      }).join('')}
    </div>`;
  }

  // ── ACTIVITY LOG SECTION ─────────────────────────────────────────────
  const allUsers = [...new Set(log.map(e=>e.user))].sort();
  const allTerminals = [...new Set(log.filter(e=>e.terminalId).map(e=>e.terminalId))];
  const filterUser     = window._survFilterUser     || '';
  const filterType     = window._survFilterType     || '';
  const filterTerminal = window._survFilterTerminal || '';

  let filtered = log;
  if(filterUser)     filtered = filtered.filter(e => e.user === filterUser);
  if(filterType)     filtered = filtered.filter(e => e.type === filterType);
  if(filterTerminal) filtered = filtered.filter(e => e.terminalId === filterTerminal);

  const typeIcon  = { TAB:'📂', FOLDER:'🗂', ENTRY:'📄', LOGIN:'🔑' };
  const typeColor = { TAB:'var(--cortex-accent)', FOLDER:'var(--amber)', ENTRY:'var(--green)', LOGIN:'var(--market)' };

  // Per-user summary
  const userSummary = {};
  log.forEach(e => {
    if(!userSummary[e.user]) userSummary[e.user] = { total:0, last:'', lastTs:0, entries:0 };
    userSummary[e.user].total++;
    if(e.ts > userSummary[e.user].lastTs) { userSummary[e.user].lastTs = e.ts; userSummary[e.user].last = e.d+' '+e.t; }
    if(e.type==='ENTRY') userSummary[e.user].entries++;
  });

  let html = `
  <!-- Terminal Overview -->
  <div style="margin-bottom:24px;">
    <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--cortex-accent);border-bottom:1px solid var(--border-bright);padding-bottom:6px;margin-bottom:12px;">
      🖥 KENDTE TERMINALER (${terminals.length})
      <span style="font-size:9px;color:var(--text-dim);letter-spacing:2px;margin-left:12px;">— EN TERMINAL = ÉN BROWSER / ENHED</span>
    </div>
    ${terminalHtml}
  </div>

  <!-- User summary cards -->
  <div style="margin-bottom:24px;">
    <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--cortex-accent);border-bottom:1px solid var(--border-bright);padding-bottom:6px;margin-bottom:12px;">👤 KARAKTER AKTIVITET</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
      ${users.map(u => {
        const s = userSummary[u.username] || {total:0,last:'—',entries:0};
        const tc = u.isAdmin ? 'var(--admin-color)' : u.isHacker ? 'var(--hk)' : u.isModerator ? 'var(--mod)' : u.isOffworlder ? 'var(--offworlder)' : u.isCriminal ? 'var(--criminal)' : 'var(--cortex-accent)';
        return `<div style="border:1px solid ${s.total>0?tc:'var(--border)'};background:var(--bg2);padding:12px 14px;position:relative;cursor:pointer;transition:all 0.15s;"
          onclick="window._survFilterUser=window._survFilterUser==='${escAttr(u.username)}'?'':'${escAttr(u.username)}';renderSurveillanceLog();"
          onmouseover="this.style.boxShadow='0 0 10px rgba(79,195,247,0.2)'" onmouseout="this.style.boxShadow=''">
          ${window._survFilterUser===u.username?`<div style="position:absolute;top:0;right:0;background:var(--cortex-accent);color:var(--bg);font-size:9px;letter-spacing:1px;padding:2px 6px;text-transform:uppercase;">FILTERED</div>`:''}
          <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:${tc};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">${escHtml(u.username)}</div>
          <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">${escHtml(u.role||'')}</div>
          <div style="display:flex;gap:10px;margin-top:8px;">
            <span style="font-family:'VT323',monospace;font-size:22px;color:${s.total>0?tc:'var(--border)'};line-height:1;">${s.total}</span>
            <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;line-height:1.6;text-transform:uppercase;">ACTIONS<br>${s.entries} ENTRIES</div>
          </div>
          ${s.total>0?`<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-top:6px;text-transform:uppercase;">LAST: ${escHtml(s.last)}</div>`:'<div style="font-size:10px;color:var(--border-bright);margin-top:6px;letter-spacing:1px;text-transform:uppercase;">// INGEN AKTIVITET</div>'}
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- Filter bar -->
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;padding:10px 14px;border:1px solid var(--border-bright);background:var(--bg2);">
    <div style="font-size:10px;letter-spacing:3px;color:var(--text-dim);text-transform:uppercase;">// FILTER:</div>
    <select onchange="window._survFilterUser=this.value;renderSurveillanceLog()" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:12px;outline:none;">
      <option value="">ALLE BRUGERE</option>
      ${allUsers.map(u=>`<option value="${escAttr(u)}" ${filterUser===u?'selected':''}>${escHtml(u)}</option>`).join('')}
    </select>
    <select onchange="window._survFilterType=this.value;renderSurveillanceLog()" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:12px;outline:none;">
      <option value="">ALLE TYPER</option>
      <option value="TAB"    ${filterType==='TAB'   ?'selected':''}>📂 TAB VIEWS</option>
      <option value="FOLDER" ${filterType==='FOLDER'?'selected':''}>🗂 FOLDER OPENS</option>
      <option value="ENTRY"  ${filterType==='ENTRY' ?'selected':''}>📄 ENTRY READS</option>
    </select>
    <select onchange="window._survFilterTerminal=this.value;renderSurveillanceLog()" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:12px;outline:none;">
      <option value="">ALLE TERMINALER</option>
      ${allTerminals.map(tid=>`<option value="${escAttr(tid)}" ${filterTerminal===tid?'selected':''}>${escHtml(getTerminalDisplayName(tid))}</option>`).join('')}
    </select>
    <div style="flex:1;font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;">${filtered.length} / ${log.length} LOG ENTRIES</div>
    ${log.length>0?`<button class="delete-btn" style="padding:4px 12px;font-size:11px;" onclick="if(confirm('Ryd hele aktivitetsloggen?')){state.activityLog=[];saveState();renderSurveillanceLog();}">🗑 CLEAR LOG</button>`:''}
  </div>

  <!-- Log table -->
  <div style="border:1px solid var(--border);overflow:hidden;">
    <div style="display:grid;grid-template-columns:55px 55px 110px 70px 1fr 160px;background:rgba(0,0,0,0.4);border-bottom:1px solid var(--border-bright);padding:6px 12px;font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;font-family:'Share Tech Mono',monospace;">
      <span>DATO</span><span>TID</span><span>BRUGER</span><span>TYPE</span><span>INDHOLD</span><span>TERMINAL</span>
    </div>
    ${filtered.length===0
      ? `<div style="padding:20px;color:var(--text-dim);font-size:12px;letter-spacing:2px;text-transform:uppercase;text-align:center;">// INGEN AKTIVITET LOGGET ENDNU</div>`
      : filtered.slice(0,200).map((e,i) => `
    <div style="display:grid;grid-template-columns:55px 55px 110px 70px 1fr 160px;padding:7px 12px;border-bottom:1px solid ${i%2===0?'var(--border)':'transparent'};font-size:12px;align-items:center;transition:background 0.1s;" onmouseover="this.style.background='rgba(79,195,247,0.05)'" onmouseout="this.style.background=''">
      <span style="color:var(--text-dim);font-family:'Share Tech Mono',monospace;font-size:10px;">${escHtml(e.d||'')}</span>
      <span style="color:var(--text-dim);font-family:'Share Tech Mono',monospace;font-size:11px;">${escHtml(e.t||'')}</span>
      <span style="color:var(--cortex-accent);font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:1px;text-transform:uppercase;">${escHtml(e.user)}</span>
      <span style="color:${typeColor[e.type]||'var(--text-dim)'};font-size:11px;letter-spacing:1px;text-transform:uppercase;">${typeIcon[e.type]||'?'} ${escHtml(e.type)}</span>
      <span style="color:var(--text-bright);font-size:12px;">${escHtml(e.details)}</span>
      <span style="color:var(--text-dim);font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(e.terminalId||'')}">${escHtml(e.terminalId ? getTerminalDisplayName(e.terminalId) : '—')}</span>
    </div>`).join('')}
    ${filtered.length>200?`<div style="padding:10px 12px;color:var(--text-dim);font-size:11px;letter-spacing:2px;text-transform:uppercase;">// VISER 200 AF ${filtered.length}</div>`:''}
  </div>`;

  el.innerHTML = html;
}

function renderDefaceList() {
  const el = document.getElementById('deface-list');
  if(!el) return;

  const hk = 'color:var(--hacker)';
  const dim = 'color:var(--text-dim)';
  const cyan = 'color:var(--cyan)';
  const amber = 'color:var(--amber)';
  const red = 'color:var(--red)';

  // ── 1. TAB DEFACEMENTS ──────────────────────────────────────────────
  const defaced = Object.keys(state.defacements||{});
  let tabDefHtml = '';
  if(defaced.length) {
    tabDefHtml = defaced.map(tabId=>{
      const tab = state.tabs.find(t=>t.id===tabId);
      const d = state.defacements[tabId];
      const ts = d.timestamp ? new Date(d.timestamp).toLocaleString('da-DK') : '—';
      return `<div style="border:1px solid var(--hacker-dim);background:rgba(255,0,255,0.04);padding:14px 16px;margin-bottom:8px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div>
            <div style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;${hk};margin-bottom:4px;">
              ⚡ ${escHtml(tab?tab.name:tabId)}
            </div>
            <div style="font-size:12px;${dim};letter-spacing:1px;margin-bottom:6px;">
              Af: <span style="color:var(--text-bright);">${escHtml(d.by||'?')}</span>
              &nbsp;·&nbsp; ${escHtml(ts)}
              &nbsp;·&nbsp; LVL ${d.hackLevel||1}
            </div>
            <div style="font-size:13px;color:var(--hacker);font-family:'Share Tech Mono',monospace;padding:8px 12px;border:1px solid var(--hacker-dim);background:rgba(0,0,0,0.3);white-space:pre-wrap;">"${escHtml(d.text||'')}"</div>
          </div>
          <button class="delete-btn" style="flex-shrink:0;" onclick="adminRemoveDeface('${tabId}')">↩ RESTORE</button>
        </div>
      </div>`;
    }).join('');
  } else {
    tabDefHtml = `<div style="font-size:12px;${dim};letter-spacing:2px;text-transform:uppercase;padding:8px 0;">// INGEN AKTIVE TAB-DEFACEMENTS</div>`;
  }

  // ── 2. HACKER-REDIGEREDE ENTRIES ────────────────────────────────────
  const hackedEntries = [];
  state.tabs.forEach(t=>{
    if(!t.folders) return;
    t.folders.forEach(f=>{
      f.entries.forEach(e=>{
        if(e.hackerEdited) hackedEntries.push({tab:t, folder:f, entry:e});
      });
    });
  });

  let entryHtml = '';
  if(hackedEntries.length) {
    entryHtml = hackedEntries.map(({tab,folder,entry:e})=>{
      const ts = e.hackerEditedAt ? new Date(e.hackerEditedAt).toLocaleString('da-DK') : '—';
      return `<div style="border:1px solid var(--hacker-dim);background:rgba(255,0,255,0.04);padding:14px 16px;margin-bottom:8px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="flex:1;min-width:0;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;${hk};margin-bottom:2px;">
              ⚡ ${escHtml(tab.name)} › ${escHtml(folder.name)} › ${escHtml(e.title)}
            </div>
            <div style="font-size:12px;${dim};letter-spacing:1px;margin-bottom:10px;">
              Af: <span style="color:var(--text-bright);">${escHtml(e.hackerEditedBy||'?')}</span>
              &nbsp;·&nbsp; ${escHtml(ts)}
              &nbsp;·&nbsp; LVL ${e.hackLevel||1}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <div style="font-size:10px;letter-spacing:3px;${cyan};text-transform:uppercase;margin-bottom:4px;">// ORIGINAL (admin):</div>
                <div style="font-size:12px;color:var(--text-bright);padding:8px 10px;border:1px solid var(--border-bright);background:var(--bg3);white-space:pre-wrap;max-height:120px;overflow-y:auto;">${escHtml(e.adminBody||'(tom)')}</div>
              </div>
              <div>
                <div style="font-size:10px;letter-spacing:3px;${hk};text-transform:uppercase;margin-bottom:4px;">// HACKET OVERLAY (hvad spillere ser):</div>
                <div style="font-size:12px;color:var(--hacker);padding:8px 10px;border:1px solid var(--hacker-dim);background:rgba(255,0,255,0.04);white-space:pre-wrap;max-height:120px;overflow-y:auto;">${escHtml(e.hackerBody||'(tom)')}</div>
              </div>
            </div>
          </div>
          <button class="delete-btn" style="flex-shrink:0;" onclick="adminRestoreEntryFromPanel('${tab.id}','${folder.id}','${e.id}')">↩ RESTORE</button>
        </div>
      </div>`;
    }).join('');
  } else {
    entryHtml = `<div style="font-size:12px;${dim};letter-spacing:2px;text-transform:uppercase;padding:8px 0;">// INGEN HACKEDE ENTRIES</div>`;
  }

  // ── 3. FOLDER LOCKOUTS ──────────────────────────────────────────────
  const lockedFolders = Object.keys(hackerCooldowns).filter(k=>k.startsWith('folderlock.'));
  let folderHtml = '';
  if(lockedFolders.length) {
    folderHtml = lockedFolders.map(key=>{
      const parts = key.split('.');
      const tabId = parts[1]; const folderId = parts[2];
      const tab = state.tabs.find(t=>t.id===tabId);
      const folder = tab && tab.folders ? tab.folders.find(f=>f.id===folderId) : null;
      const d = hackerCooldowns[key];
      const ts = d.timestamp ? new Date(d.timestamp).toLocaleString('da-DK') : '—';
      return `<div style="border:1px solid var(--red-dim);background:rgba(255,34,34,0.04);padding:12px 16px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;${red};margin-bottom:3px;">
            🔒 ${escHtml(tab?tab.name:tabId)} › ${escHtml(folder?folder.name:folderId)}
          </div>
          <div style="font-size:12px;${dim};letter-spacing:1px;">${escHtml(ts)} · LVL ${d.hackLevel||1}</div>
        </div>
        <button class="delete-btn" style="flex-shrink:0;border-color:var(--green);color:var(--green);" onclick="adminUnlockFolder('${tabId}','${folderId}')">🔓 UNLOCK</button>
      </div>`;
    }).join('');
  } else {
    folderHtml = `<div style="font-size:12px;${dim};letter-spacing:2px;text-transform:uppercase;padding:8px 0;">// INGEN LÅSTE MAPPER</div>`;
  }

  // ── 4. USER LOCKOUTS ────────────────────────────────────────────────
  const lockedUsers = Object.keys(hackerCooldowns).filter(k=>k.startsWith('lock.'));
  let userLockHtml = '';
  if(lockedUsers.length) {
    userLockHtml = lockedUsers.map(key=>{
      const username = key.slice(5);
      const d = hackerCooldowns[key];
      const ts = d.timestamp ? new Date(d.timestamp).toLocaleString('da-DK') : '—';
      return `<div style="border:1px solid var(--red-dim);background:rgba(255,34,34,0.04);padding:12px 16px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;${red};margin-bottom:3px;">
            👤 ${escHtml(username)} — LOCKED OUT
          </div>
          <div style="font-size:12px;${dim};letter-spacing:1px;">${escHtml(ts)} · LVL ${d.hackLevel||1}</div>
        </div>
        <button class="delete-btn" style="flex-shrink:0;border-color:var(--green);color:var(--green);" onclick="adminUnlockUser('${escAttr(username)}')">🔓 UNLOCK</button>
      </div>`;
    }).join('');
  } else {
    userLockHtml = `<div style="font-size:12px;${dim};letter-spacing:2px;text-transform:uppercase;padding:8px 0;">// INGEN LÅSTE BRUGERE</div>`;
  }

  // ── SUMMARY BAR ─────────────────────────────────────────────────────
  const totalHacks = defaced.length + hackedEntries.length + lockedFolders.length + lockedUsers.length;
  const summaryColor = totalHacks > 0 ? 'var(--hacker)' : 'var(--green)';

  el.innerHTML = `
    <!-- Summary -->
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;padding:12px 16px;border:1px solid ${totalHacks>0?'var(--hacker-dim)':'var(--border-bright)'};background:rgba(0,0,0,0.3);">
      <div style="font-family:'VT323',monospace;font-size:38px;color:${summaryColor};line-height:1;">${totalHacks}</div>
      <div style="display:flex;flex-direction:column;justify-content:center;gap:4px;">
        <div style="font-size:11px;letter-spacing:3px;color:${summaryColor};text-transform:uppercase;">${totalHacks===0?'// ALT KLART — INGEN AKTIVE HACKS':'// AKTIVE HACKS REGISTRERET'}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <span style="font-size:11px;${defaced.length?hk:dim};letter-spacing:1px;text-transform:uppercase;">${defaced.length} TAB-DEFACE</span>
          <span style="font-size:11px;${hackedEntries.length?hk:dim};letter-spacing:1px;text-transform:uppercase;">${hackedEntries.length} ENTRY EDIT</span>
          <span style="font-size:11px;${lockedFolders.length?red:dim};letter-spacing:1px;text-transform:uppercase;">${lockedFolders.length} MAPPE LOCK</span>
          <span style="font-size:11px;${lockedUsers.length?red:dim};letter-spacing:1px;text-transform:uppercase;">${lockedUsers.length} USER LOCK</span>
        </div>
      </div>
      ${totalHacks>0?`<button class="delete-btn" style="margin-left:auto;border-color:var(--green);color:var(--green);align-self:center;" onclick="adminRestoreAll()">↩ RESTORE ALT</button>`:''}
    </div>

    <!-- Tab Defacements -->
    <div style="margin-bottom:20px;">
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;${hk};border-bottom:1px solid var(--hacker-dim);padding-bottom:6px;margin-bottom:10px;">
        ⚡ TAB DEFACEMENTS (${defaced.length})
      </div>
      ${tabDefHtml}
    </div>

    <!-- Hacked Entries -->
    <div style="margin-bottom:20px;">
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;${hk};border-bottom:1px solid var(--hacker-dim);padding-bottom:6px;margin-bottom:10px;">
        ✏ HACKEDE ENTRIES (${hackedEntries.length})
      </div>
      ${entryHtml}
    </div>

    <!-- Folder Lockouts -->
    <div style="margin-bottom:20px;">
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;${red};border-bottom:1px solid var(--red-dim);padding-bottom:6px;margin-bottom:10px;">
        🔒 LÅSTE MAPPER (${lockedFolders.length})
      </div>
      ${folderHtml}
    </div>

    <!-- User Lockouts -->
    <div style="margin-bottom:20px;">
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;${red};border-bottom:1px solid var(--red-dim);padding-bottom:6px;margin-bottom:10px;">
        👤 LÅSTE BRUGERE (${lockedUsers.length})
      </div>
      ${userLockHtml}
    </div>`;
}

// Called from the defacement panel — restores a single entry back to canonical text
function adminRestoreEntryFromPanel(tabId, folderId, entryId) {
  adminRestoreEntry(tabId, folderId, entryId);
  setTimeout(()=>{ renderDefaceList(); }, 200);
}

// Admin unlock folder (without spending credits)
function adminUnlockFolder(tabId, folderId) {
  const flKey = 'folderlock.'+tabId+'.'+folderId;
  delete hackerCooldowns[flKey];
  saveCooldowns();
  renderDefaceList();
  renderTabs(); if(activeTab) switchTab(activeTab);
}

// Admin unlock user (without spending credits)
function adminUnlockUser(username) {
  const cdKey = 'lock.'+username;
  delete hackerCooldowns[cdKey];
  saveCooldowns();
  renderDefaceList();
  renderUserTable();
}

// Restore everything in one click
function adminRestoreAll() {
  if(!confirm('Restore alle hacks, defacements, entry-edits og lockouts?')) return;
  // Clear defacements
  state.defacements = {};
  // Restore all hacked entries
  state.tabs.forEach(t=>{
    if(!t.folders) return;
    t.folders.forEach(f=>{
      f.entries.forEach(e=>{
        if(e.hackerEdited) {
          e.body = e.adminBody || e.body;
          e.hackerBody = '';
          delete e.hackerEdited; delete e.hackerEditedBy; delete e.hackerEditedAt;
          delete e.hackerInjectedImg; delete e.originalBody; delete e.originalImages;
          delete e.hackLevel;
        }
      });
    });
  });
  // Clear all folder locks and user lockouts
  Object.keys(hackerCooldowns).forEach(k=>{
    if(k.startsWith('folderlock.') || k.startsWith('lock.')) delete hackerCooldowns[k];
  });
  saveCooldowns();
  saveState();
  renderDefaceList();
  renderTabs(); if(activeTab) switchTab(activeTab);
  renderUserTable();
}


function renderProfilesFolder() {
  const el = document.getElementById('profiles-folder');
  if(!el) return;

  const searchEl = document.getElementById('profiles-search');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';

  const groups = [
    { key:'admin',      label:'★ ADMINS',       color:'var(--admin-color)',  borderColor:'rgba(255,204,0,0.3)',    users:[] },
    { key:'hacker',     label:'⚡ HACKERS',      color:'var(--hk)',           borderColor:'rgba(221,0,255,0.2)',    users:[] },
    { key:'moderator',  label:'🛡 MODERATORER',  color:'var(--mod)',          borderColor:'rgba(0,255,204,0.2)',    users:[] },
    { key:'offworlder', label:'🌌 OFFWORLDERS',  color:'var(--offworlder)',   borderColor:'rgba(255,102,0,0.2)',    users:[] },
    { key:'criminal',   label:'☠ KRIMINELLE',   color:'var(--criminal)',     borderColor:'rgba(255,26,26,0.2)',    users:[] },
    { key:'standard',   label:'● STANDARD',     color:'var(--cortex-accent)', borderColor:'rgba(0,170,255,0.1)', users:[] }
  ];

  state.users.forEach((user, ui) => {
    if(q) {
      const typeStr = user.isAdmin?'admin':user.isHacker?'hacker':user.isModerator?'moderator':user.isOffworlder?'offworlder':user.isCriminal?'criminal':'standard';
      const match = user.username.toLowerCase().includes(q)
        || (user.role||'').toLowerCase().includes(q)
        || (user.tags||[]).some(t=>t.toLowerCase().includes(q))
        || typeStr.includes(q);
      if(!match) return;
    }
    const g = user.isAdmin ? groups[0] : user.isHacker ? groups[1] : user.isModerator ? groups[2] : user.isOffworlder ? groups[3] : user.isCriminal ? groups[4] : groups[5];
    g.users.push({ user, ui });
  });

  const totalVisible = groups.reduce((s,g)=>s+g.users.length,0);
  if(!totalVisible) {
    el.innerHTML = `<div style="color:var(--text-dim);font-size:12px;letter-spacing:1px;text-transform:uppercase;">// NO CHARACTERS MATCH</div>`;
    return;
  }

  let html = '';
  groups.forEach(group => {
    if(!group.users.length) return;

    html += `<div style="margin-bottom:20px;">
      <div style="border-top:1px solid ${group.color};border-bottom:1px solid ${group.color};padding:5px 10px;background:rgba(0,0,0,0.25);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-family:'VT323',monospace;font-size:20px;letter-spacing:4px;color:${group.color};text-transform:uppercase;">// ${group.label}</span>
        <span style="font-size:11px;color:${group.color};opacity:0.6;letter-spacing:2px;">[${group.users.length} CHARACTER${group.users.length!==1?'S':''}]</span>
      </div>`;

    group.users.forEach(({ user, ui }) => {
      const typeColor = user.isAdmin ? 'var(--admin-color)' : user.isHacker ? 'var(--hk)' : user.isModerator ? 'var(--mod)' : user.isOffworlder ? 'var(--offworlder)' : user.isCriminal ? 'var(--criminal)' : 'var(--cortex-accent)';
      const typeLabel = user.isAdmin ? '★ ADMIN' : user.isHacker ? '⚡ HACKER' : user.isModerator ? '🛡 MOD' : user.isOffworlder ? '🌌 OFFWORLD' : user.isCriminal ? '☠ KRIMINEL' : '● BORGER';
      const statusColor = user.locked ? 'var(--red)' : 'var(--green)';
      const statusLabel = user.locked ? '🔒 LOCKED' : '● ACTIVE';

      let creditBar = '';
      if(user.isHacker && !user.isAdmin) {
        const lvl = getHackerLevel(user);
        const credits = typeof user.hackerCredits === 'number' ? user.hackerCredits : lvl;
        const squares = Array.from({length: Math.max(6, credits+1)}, (_,i) =>
          `<div style="width:14px;height:14px;background:${i<credits?'var(--hacker)':'transparent'};border:1px solid ${i<credits?'var(--hacker)':'var(--hacker-dim)'};">&nbsp;</div>`
        ).join('');
        creditBar = `
          <div style="margin-top:8px;">
            <div style="font-size:10px;letter-spacing:2px;color:var(--hacker-dim);text-transform:uppercase;margin-bottom:4px;">HACK CREDITS — LVL ${lvl} HACKER — ${credits} CREDIT${credits!==1?'S':''} AVAILABLE</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px;">${squares}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="save-btn" style="border-color:var(--hacker);color:var(--hacker);padding:3px 10px;font-size:11px;" onclick="adminGiveCredits('${escAttr(user.username)}',1)">+1 CREDIT</button>
              <button class="save-btn" style="border-color:var(--hacker);color:var(--hacker);padding:3px 10px;font-size:11px;" onclick="adminGiveCredits('${escAttr(user.username)}',3)">+3 CREDITS</button>
              <button class="hdr-btn" style="padding:3px 10px;font-size:11px;" onclick="adminResetCredits('${escAttr(user.username)}')">RESET TO LVL DEFAULT</button>
            </div>
          </div>`;
      }

      const alterEgo = user.alterEgo ? `<span style="color:var(--text-dim);font-size:11px;"> — "${escHtml(user.alterEgo)}"</span>` : '';

      html += `<div style="border:1px solid ${group.borderColor};background:var(--bg2);padding:14px 18px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;">
        <div style="flex:1;min-width:160px;">
          <div style="font-family:'VT323',monospace;font-size:22px;color:var(--text-bright);letter-spacing:2px;">${escHtml(user.username)}${alterEgo}</div>
          <div style="font-size:12px;letter-spacing:1px;color:var(--text-dim);margin-top:2px;text-transform:uppercase;">${(user.tags||[user.role]).map((t,i)=>`<span style="border:1px solid ${i===0?'var(--cyan)':'var(--border)'};padding:1px 5px;font-size:10px;color:${i===0?'var(--cyan)':'var(--text-dim)'};margin-right:3px;">${escHtml(t)}</span>`).join('')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;min-width:100px;">
          <span style="font-size:11px;letter-spacing:2px;color:${typeColor};text-transform:uppercase;">${typeLabel}</span>
          <span style="font-size:11px;letter-spacing:1px;color:${statusColor};">${statusLabel}</span>
        </div>
        <div style="flex:2;min-width:200px;">
          <div style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:4px;">TAB ACCESS</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">${user.tabs.map(t=>`<span style="font-size:10px;letter-spacing:1px;border:1px solid var(--border-bright);padding:2px 7px;color:var(--text-bright);">${t}</span>`).join('')}</div>
          ${creditBar}
        </div>
      </div>`;
    });

    html += `</div>`;
  });

  el.innerHTML = html;
}
function adminRemoveDeface(tabId) {
  delete state.defacements[tabId];
  saveState();
  refreshAdminPanel();
  renderTabs(); switchTab('admin');
}

function toggleCredsGroup(key) {
  const body = document.getElementById('creds-group-'+key+'-body');
  const arrow = document.getElementById('creds-group-'+key+'-arrow');
  if(!body) return;
  const collapsed = body.style.display === 'none';
  body.style.display = collapsed ? 'block' : 'none';
  if(arrow) arrow.textContent = collapsed ? '[ — COLLAPSE ]' : '[ + EXPAND ]';
}

function renderUserTable() {
  // Map group keys to tbody ids
  const groupMap = {
    admin:      document.getElementById('user-tbody-admin'),
    hacker:     document.getElementById('user-tbody-hacker'),
    moderator:  document.getElementById('user-tbody-moderator'),
    offworlder: document.getElementById('user-tbody-offworlder'),
    criminal:   document.getElementById('user-tbody-criminal'),
    standard:   document.getElementById('user-tbody-standard'),
  };
  // Fallback: if new multi-section bodies don't exist, skip
  if(!groupMap.admin) return;

  // Clear all
  Object.values(groupMap).forEach(tb => { if(tb) tb.innerHTML = ''; });

  const nonAdminTabs = state.tabs.filter(t=>!t.isAdmin&&!t.isHacker&&!t.isProfile&&!t.isChat);

  // Search filter
  const searchEl = document.getElementById('user-search');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';

  // Color/label config per group
  const groupCfg = {
    admin:      { color:'var(--admin-color)', glow:'rgba(255,204,0,0.6)' },
    hacker:     { color:'var(--hk)',          glow:'rgba(221,0,255,0.6)' },
    moderator:  { color:'var(--mod)',         glow:'rgba(0,255,204,0.6)' },
    offworlder: { color:'var(--offworlder)',  glow:'rgba(255,102,0,0.6)' },
    criminal:   { color:'var(--criminal)',    glow:'rgba(255,26,26,0.6)'  },
    standard:   { color:'var(--cortex-accent)', glow:'rgba(0,170,255,0.4)' },
  };

  state.users.forEach((user, ui) => {
    if(q) {
      const typeStr = user.isAdmin?'admin':user.isHacker?'hacker':user.isModerator?'moderator':user.isOffworlder?'offworlder':user.isCriminal?'criminal':'standard';
      const match = user.username.toLowerCase().includes(q)
        || (user.role||'').toLowerCase().includes(q)
        || (user.tags||[]).some(t=>t.toLowerCase().includes(q))
        || typeStr.includes(q);
      if(!match) return;
    }

    const groupKey = user.isAdmin ? 'admin' : user.isHacker ? 'hacker' : user.isModerator ? 'moderator' : user.isOffworlder ? 'offworlder' : user.isCriminal ? 'criminal' : 'standard';
    const tbody = groupMap[groupKey];
    if(!tbody) return;
    const cfg = groupCfg[groupKey];

    const tr = document.createElement('tr');
    const adminTag = user.isAdmin ? `<span class="tag active" style="border-color:var(--amber);color:var(--amber);cursor:default;" title="Admin access cannot be toggled">Admin</span>` : '';
    const tags = adminTag + nonAdminTabs.map(t=>{
      const on = user.tabs.includes(t.id);
      return `<span class="tag ${on?'active':''}" onclick="toggleAccess(${ui},'${t.id}')">${t.name}</span>`;
    }).join('');
    const typeLabel = user.isAdmin
      ? `<span style="color:var(--admin-color);font-weight:bold;letter-spacing:1px;text-shadow:0 0 10px ${cfg.glow};">★ ADMIN</span>`
      : user.isHacker
      ? `<span style="color:var(--hk);text-shadow:0 0 10px ${cfg.glow};">⚡ HACKER</span>`
      : user.isModerator
      ? `<span style="color:var(--mod);text-shadow:0 0 10px ${cfg.glow};">🛡 MOD</span>`
      : user.isOffworlder
      ? `<span style="color:var(--offworlder);text-shadow:0 0 10px ${cfg.glow};">🌌 OFFWORLD</span>`
      : user.isCriminal
      ? `<span style="color:var(--criminal);text-shadow:0 0 10px ${cfg.glow};">☠ KRIMINEL</span>`
      : `<span style="color:var(--cortex-accent);">● BORGER</span>`;
    const lockedLabel = user.locked ? `<span style="color:var(--red);font-size:10px;letter-spacing:1px;">🔒 LOCKED</span>` : `<span style="color:var(--green);font-size:10px;letter-spacing:1px;">● ACTIVE</span>`;
    const alterEgoCell = !user.isAdmin
      ? `<input class="retro-input" value="${escAttr(user.alterEgo||'')}" id="uego-${ui}" placeholder="alias..." style="width:100px;padding:4px 8px;font-size:12px;${user.isHacker?'border-color:var(--hk-dim);color:var(--hk);':user.isCriminal?'border-color:var(--criminal-dim);color:var(--criminal);':''}" onchange="saveUserAlterEgo(${ui})"/>`
      : `<span style="color:var(--text-dim);font-size:11px;">—</span>`;
    const isPrimaryAdmin = user.isAdmin && ui === state.users.findIndex(u=>u.isAdmin);
    tr.style.borderLeft = `3px solid ${cfg.color}`;
    tr.innerHTML=`
      <td style="color:var(--text-bright);font-size:13px;">
        <input class="retro-input" value="${escAttr(user.username)}" id="uname-${ui}" style="width:110px;padding:4px 8px;font-size:12px;border-color:${cfg.color};color:${cfg.color};" />
      </td>
      <td>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <select id="urole-${ui}" onchange="saveUserRole(${ui})" style="background:var(--bg);border:1px solid ${cfg.color};color:${cfg.color};padding:6px 8px;font-family:'Share Tech Mono',monospace;font-size:12px;outline:none;width:140px;cursor:pointer;">
            ${(state.roles||[]).map(r=>`<option value="${escAttr(r)}" ${user.role===r?'selected':''}>${escHtml(r)}</option>`).join('')}
            ${!(state.roles||[]).includes(user.role) ? `<option value="${escAttr(user.role)}" selected>${escHtml(user.role)}</option>` : ''}
          </select>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:2px;">
            ${(user.tags||[user.role]).map((tag,ti)=>`
              <span style="display:inline-flex;align-items:center;gap:0;border:1px solid ${ti===0?cfg.color:'var(--border-bright)'};background:${ti===0?'rgba(77,184,255,0.08)':'var(--bg)'};font-size:10px;letter-spacing:1px;color:${ti===0?cfg.color:'var(--text-dim)'};">
                <span style="padding:2px 6px;">${escHtml(tag)}${ti===0?' ★':''}</span>
                ${ti>0?`<button onclick="removeUserTag(${ui},${ti})" style="padding:2px 5px;background:rgba(255,34,34,0.08);border:none;border-left:1px solid var(--border-bright);color:var(--red);font-size:10px;cursor:pointer;" title="Remove tag">✕</button>`:''}
              </span>`).join('')}
          </div>
          <div style="display:flex;gap:4px;margin-top:2px;">
            <input id="newtag-${ui}" type="text" placeholder="+ add tag..." style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:3px 7px;font-family:'Share Tech Mono',monospace;font-size:11px;outline:none;width:90px;" onkeydown="if(event.key==='Enter')addUserTag(${ui})"/>
            <button onclick="addUserTag(${ui})" style="padding:3px 7px;background:rgba(0,255,65,0.06);border:1px solid var(--border-bright);color:var(--green);font-family:'Share Tech Mono',monospace;font-size:10px;cursor:pointer;" title="Add tag">+TAG</button>
          </div>
        </div>
      </td>
      <td>${typeLabel}</td>
      <td>
        <input class="retro-input" value="${escAttr(user.password)}" id="upass-${ui}" style="width:110px;padding:4px 8px;font-size:12px;${user.isAdmin?'border-color:rgba(255,204,0,0.4);':''}" />
      </td>
      <td><button class="save-btn" style="padding:4px 10px;font-size:11px;" onclick="saveUserCredentials(${ui})">SAVE</button></td>
      <td>${lockedLabel}</td>
      <td>${alterEgoCell}</td>
      <td><div class="tab-permissions">${tags}</div></td>
      <td style="white-space:nowrap;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${!user.isAdmin
            ? `<button class="save-btn" style="border-color:var(--amber);color:var(--amber);padding:4px 10px;font-size:11px;" onclick="adminMakeAdmin(${ui})">★ ADMIN</button>`
            : !isPrimaryAdmin
            ? `<button class="delete-btn" style="border-color:var(--amber);color:var(--amber);padding:4px 10px;font-size:11px;" onclick="adminRemoveAdmin(${ui})">✕ ADMIN</button>`
            : `<span style="color:var(--amber);font-size:10px;letter-spacing:1px;">PRIMARY</span>`
          }
          ${!user.isAdmin ? `
          <button class="${user.locked?'save-btn':'delete-btn'}" style="${user.locked?'border-color:var(--green);color:var(--green);':'border-color:var(--red);color:var(--red);'};padding:4px 10px;font-size:11px;" onclick="adminToggleLock(${ui})">${user.locked?'UNLOCK':'LOCK'}</button>
          <button class="${user.isCriminal?'save-btn':'tag'}" style="${user.isCriminal?'border-color:var(--criminal);color:var(--criminal);background:rgba(255,26,26,0.14);':'border-color:var(--criminal-dim);color:var(--criminal);'};padding:4px 10px;font-size:11px;" onclick="adminToggleCriminal(${ui})">${user.isCriminal?'☠ KRIMINEL':'☠ MÆRK'}</button>
          <button class="${user.isModerator?'save-btn':'tag'}" style="${user.isModerator?'border-color:var(--mod);color:var(--mod);background:rgba(0,255,204,0.12);':'border-color:var(--mod-dim);color:var(--mod);'};padding:4px 10px;font-size:11px;" onclick="adminToggleModerator(${ui})">${user.isModerator?'🛡 MODERATOR':'🛡 GIV MOD'}</button>
          <button class="${user.isOffworlder?'save-btn':'tag'}" style="${user.isOffworlder?'border-color:var(--offworlder);color:var(--offworlder);background:rgba(255,102,0,0.12);':'border-color:var(--offworlder-dim);color:var(--offworlder);'};padding:4px 10px;font-size:11px;" onclick="adminToggleOffworlder(${ui})">${user.isOffworlder?'🌌 OFFWORLDER':'🌌 GIV OW'}</button>
          <button class="delete-btn" onclick="deleteUser(${ui})" style="padding:4px 10px;font-size:11px;">FJERN</button>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;align-items:center;">
            <span style="font-size:10px;letter-spacing:1px;color:#ff9900;text-transform:uppercase;">🕵 RUMOR LVL:</span>
            <select onchange="adminSetRumorLevel(${ui},this.value)" style="background:var(--bg);border:1px solid #663300;color:#ff9900;padding:3px 6px;font-family:'Share Tech Mono',monospace;font-size:11px;outline:none;">
              <option value="0" ${(user.rumorLevel||0)===0?'selected':''}>0 — No Access</option>
              <option value="1" ${(user.rumorLevel||0)===1?'selected':''}>1</option>
              <option value="2" ${(user.rumorLevel||0)===2?'selected':''}>2</option>
              <option value="3" ${(user.rumorLevel||0)===3?'selected':''}>3</option>
            </select>
          </div>
          ${user.isHacker ? `
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
            <select id="hlvl-${ui}" style="background:var(--bg);border:1px solid var(--hk-dim);color:var(--hk);padding:3px 6px;font-family:'Share Tech Mono',monospace;font-size:11px;outline:none;" onchange="adminSetHackerLevel('${escAttr(user.username)}',this.value)">
              <option value="1" ${(user.hackerLevel||1)===1?'selected':''}>LVL 1</option>
              <option value="2" ${(user.hackerLevel||1)===2?'selected':''}>LVL 2</option>
              <option value="3" ${(user.hackerLevel||1)===3?'selected':''}>LVL 3</option>
            </select>
            <span style="font-size:11px;color:var(--hk);padding:3px 6px;border:1px solid var(--hk-dim);">${typeof user.hackerCredits==='number'?user.hackerCredits:(user.hackerLevel||1)}⚡</span>
            <button class="save-btn" style="border-color:var(--hk);color:var(--hk);padding:3px 8px;font-size:11px;" onclick="adminGiveCredits('${escAttr(user.username)}',1)" title="Give 1 credit">+1</button>
            <button class="save-btn" style="border-color:var(--hk);color:var(--hk);padding:3px 8px;font-size:11px;" onclick="adminGiveCredits('${escAttr(user.username)}',3)" title="Give 3 credits">+3</button>
            <button class="delete-btn" style="border-color:var(--hk-dim);color:var(--hk-dim);padding:3px 8px;font-size:11px;" onclick="adminTakeCredits('${escAttr(user.username)}',1)" title="Remove 1 credit">-1</button>
            <button class="delete-btn" style="border-color:var(--hk-dim);color:var(--hk-dim);padding:3px 8px;font-size:11px;" onclick="adminTakeCredits('${escAttr(user.username)}',3)" title="Remove 3 credits">-3</button>
            <button class="hdr-btn" style="border-color:var(--hk-dim);color:var(--hk-dim);padding:3px 8px;font-size:11px;" onclick="adminResetCredits('${escAttr(user.username)}')" title="Reset to level default">RST</button>
          </div>` : ''}` : ''}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  // Auto-expand groups that have members (hide empty ones)
  ['admin','hacker','moderator','offworlder','criminal','standard'].forEach(key => {
    const tbody = groupMap[key];
    const group = document.getElementById('creds-group-'+key);
    if(!group) return;
    const count = tbody ? tbody.childElementCount : 0;
    if(count === 0) {
      group.style.opacity = '0.4';
    } else {
      group.style.opacity = '1';
      // Auto-expand admins
      if(key === 'admin') {
        const body = document.getElementById('creds-group-admin-body');
        const arrow = document.getElementById('creds-group-admin-arrow');
        if(body) body.style.display = 'block';
        if(arrow) arrow.textContent = '[ — COLLAPSE ]';
      }
    }
  });
}

function saveUserCredentials(ui) {
  const user = state.users[ui]; if(!user) return;
  const nameEl = document.getElementById('uname-'+ui);
  const passEl = document.getElementById('upass-'+ui);
  const newName = nameEl ? nameEl.value.trim() : '';
  const newPass = passEl ? passEl.value.trim() : '';
  if(!newName){ showMsg('user-msg','// HANDLE CANNOT BE EMPTY'); return; }
  const conflict = state.users.find((u,i)=>u.username.toLowerCase()===newName.toLowerCase() && i!==ui);
  if(conflict){ showMsg('user-msg','// HANDLE ALREADY TAKEN'); return; }
  if(!newPass){ showMsg('user-msg','// PASSPHRASE CANNOT BE EMPTY'); return; }
  user.username = newName;
  user.password = newPass;
  saveState(); renderUserTable(); showMsg('user-msg',`// CREDENTIALS UPDATED FOR ${newName}.`);
}

function saveUserRole(ui) {
  const user = state.users[ui]; if(!user) return;
  const el = document.getElementById('urole-'+ui);
  if(!el) return;
  const newRole = el.value.trim();
  if(!newRole){ showMsg('user-msg','// ROLLE CANNOT BE EMPTY'); return; }
  user.role = newRole;
  // Keep primary tag in sync with role dropdown
  if(!user.tags) user.tags = [newRole];
  else if(!user.tags.includes(newRole)) {
    // Replace first tag (primary) with new role value
    user.tags[0] = newRole;
  }
  saveState(); renderUserTable(); showMsg('user-msg', `// ROLLE OPDATERET FOR ${user.username}.`);
}

function addUserTag(ui) {
  const user = state.users[ui]; if(!user) return;
  const inp = document.getElementById('newtag-'+ui);
  if(!inp) return;
  const tag = inp.value.trim();
  if(!tag){ showMsg('user-msg','// TAG CANNOT BE EMPTY'); return; }
  if(!user.tags) user.tags = [];
  if(user.tags.includes(tag)){ showMsg('user-msg','// TAG ALREADY EXISTS'); return; }
  user.tags.push(tag);
  saveState(); renderUserTable(); showMsg('user-msg', `// TAG "${tag}" ADDED TO ${user.username}.`);
}

function removeUserTag(ui, tagIdx) {
  const user = state.users[ui]; if(!user) return;
  if(!user.tags || tagIdx < 0 || tagIdx >= user.tags.length) return;
  if(tagIdx === 0 && user.tags.length === 1){ showMsg('user-msg','// CANNOT REMOVE LAST TAG'); return; }
  const removed = user.tags[tagIdx];
  user.tags.splice(tagIdx, 1);
  // Sync role to first remaining tag
  if(tagIdx === 0) user.role = user.tags[0] || user.role;
  saveState(); renderUserTable(); showMsg('user-msg', `// TAG "${removed}" REMOVED FROM ${user.username}.`);
}

function adminMakeAdmin(ui) {
  const user = state.users[ui]; if(!user || user.isAdmin) return;
  if(!confirm(`Grant admin privileges to "${user.username}"? They will have full Game Master access.`)) return;
  user.isAdmin = true;
  // Give them all required admin tabs
  ['admin','hacker','chat','profile','lore','factions','quests','secrets','council','shadow'].forEach(t=>{
    if(!user.tabs.includes(t)) user.tabs.push(t);
  });
  saveState(); renderUserTable(); showMsg('user-msg', `// ADMIN GRANTED TO ${user.username}.`);
}

function adminRemoveAdmin(ui) {
  const user = state.users[ui]; if(!user || !user.isAdmin) return;
  // Prevent removing the very first (primary) admin
  const primaryIdx = state.users.findIndex(u=>u.isAdmin);
  if(primaryIdx === ui){ showMsg('user-msg','// CANNOT REMOVE PRIMARY ADMIN.'); return; }
  if(!confirm(`Remove admin privileges from "${user.username}"?`)) return;
  user.isAdmin = false;
  // Remove admin tab access
  user.tabs = user.tabs.filter(t=>t!=='admin');
  saveState(); renderUserTable(); showMsg('user-msg', `// ADMIN REMOVED FROM ${user.username}.`);
}

function adminToggleLock(ui) {
  const user = state.users[ui]; if(!user || user.isAdmin) return;
  user.locked = !user.locked;
  saveState(); renderUserTable();
  showMsg('user-msg', user.locked ? `// ACCOUNT LOCKED: ${user.username}` : `// ACCOUNT UNLOCKED: ${user.username}`);
}

function adminToggleCriminal(ui) {
  const user = state.users[ui]; if(!user || user.isAdmin) return;
  user.isCriminal = !user.isCriminal;
  saveState(); renderUserTable();
  showMsg('user-msg', user.isCriminal ? `// KRIMINEL TAG: ${user.username}` : `// KRIMINEL TAG FJERNET: ${user.username}`);
}

function adminToggleModerator(ui) {
  const user = state.users[ui]; if(!user || user.isAdmin) return;
  user.isModerator = !user.isModerator;
  if(user.isModerator) {
    // Give access to rumors, newspaper, sysnews tabs + can create logins
    ['rumors','newspaper','sysnews'].forEach(t=>{ if(!user.tabs.includes(t)) user.tabs.push(t); });
    user.canCreateLogins = true;
    // Remove offworlder flag if set
    user.isOffworlder = false;
  } else {
    user.canCreateLogins = false;
  }
  saveState(); renderUserTable();
  showMsg('user-msg', user.isModerator ? `// MODERATOR TILDELT: ${user.username}` : `// MODERATOR FJERNET: ${user.username}`);
}

function adminToggleOffworlder(ui) {
  const user = state.users[ui]; if(!user || user.isAdmin) return;
  user.isOffworlder = !user.isOffworlder;
  if(user.isOffworlder) {
    // Remove moderator flag if set
    user.isModerator = false;
    user.canCreateLogins = false;
  }
  saveState(); renderUserTable();
  showMsg('user-msg', user.isOffworlder ? `// OFFWORLDER TILDELT: ${user.username}` : `// OFFWORLDER FJERNET: ${user.username}`);
}

function adminSetRumorLevel(ui, level) {
  const user = state.users[ui]; if(!user || user.isAdmin) return;
  user.rumorLevel = parseInt(level) || 0;
  // Keep currentUser in sync if it's themselves (shouldn't happen for non-admin but just in case)
  if(currentUser && currentUser.username === user.username) currentUser.rumorLevel = user.rumorLevel;
  saveState();
  showMsg('user-msg', `// RUMOR LEVEL SET TO ${user.rumorLevel} FOR ${user.username}.`);
}


function saveUserAlterEgo(ui) {
  const user = state.users[ui]; if(!user || user.isAdmin) return;
  const el = document.getElementById('uego-'+ui);
  if(!el) return;
  user.alterEgo = el.value.trim();
  saveState(); showMsg('user-msg','// ALTER EGO SAVED FOR '+user.username+'.');
}

function renderRolesList() {
  const el = document.getElementById('roles-list-admin');
  if(!el) return;
  const roles = state.roles || [];
  if(!roles.length) {
    el.innerHTML = `<div style="color:var(--text-dim);font-size:12px;letter-spacing:1px;text-transform:uppercase;">// INGEN ROLLER DEFINERET</div>`;
    return;
  }
  el.innerHTML = roles.map((r, i) => {
    const isBuiltin = r === 'Game Master';
    return `<div style="display:inline-flex;align-items:center;gap:0;border:1px solid var(--border-bright);background:var(--bg);">
      <span style="padding:6px 12px;font-family:'Share Tech Mono',monospace;font-size:12px;color:${r.toLowerCase()==='ordensmagt'?'var(--red)':'var(--text-bright)'};letter-spacing:1px;">${escHtml(r)}</span>
      ${!isBuiltin ? `<button onclick="deleteRole(${i})" style="padding:6px 10px;background:rgba(255,34,34,0.08);border:none;border-left:1px solid var(--border-bright);color:var(--red);font-family:'Share Tech Mono',monospace;font-size:12px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,34,34,0.2)'" onmouseout="this.style.background='rgba(255,34,34,0.08)'">✕</button>` : `<span style="padding:6px 8px;font-size:10px;color:var(--text-dim);">★</span>`}
    </div>`;
  }).join('');
}

function addRole() {
  const input = document.getElementById('new-role-name');
  if(!input) return;
  const name = input.value.trim();
  if(!name) { showMsg('roles-msg', '// ROLLENAVN KRÆVES.'); return; }
  if(!state.roles) state.roles = [];
  if(state.roles.some(r => r.toLowerCase() === name.toLowerCase())) {
    showMsg('roles-msg', '// ROLLE EKSISTERER ALLEREDE.');
    return;
  }
  state.roles.push(name);
  saveState();
  input.value = '';
  renderRolesList();
  renderUserTable(); // refresh datalist
  showMsg('roles-msg', `// ROLLE "${name}" TILFØJET.`);
}

function deleteRole(idx) {
  const role = (state.roles||[])[idx];
  if(!role) return;
  const usersWithRole = state.users.filter(u => u.role === role).map(u => u.username);
  if(usersWithRole.length && !confirm(`Rollen "${role}" bruges af: ${usersWithRole.join(', ')}. Slet alligevel?`)) return;
  else if(!usersWithRole.length && !confirm(`Slet rollen "${role}"?`)) return;
  state.roles.splice(idx, 1);
  // Remove role from any role-gated channels
  Object.values(state.chats||{}).forEach(ch => {
    if(ch.roles) ch.roles = ch.roles.filter(r => r !== role);
  });
  saveState();
  renderRolesList();
  renderUserTable();
  renderChannelList();
  showMsg('roles-msg', `// ROLLE "${role}" SLETTET.`);
}

function renderTabFolderEditor() {
  const el = document.getElementById('tab-folder-editor');
  if(!el) return;
  let html='';
  state.tabs.filter(t=>!t.isAdmin&&!t.isHacker&&!t.isProfile&&!t.isChat).forEach(tab=>{
    html+=`<div style="border:1px solid var(--border);margin-bottom:12px;background:var(--bg2);">`;
    html+=`<div class="folder-editor-row" style="background:var(--bg3);">
      <span>${tab.icon}</span>
      <input class="fe-name" value="${escAttr(tab.name)}" id="tname-${tab.id}" placeholder="Tab name"/>
      <select id="ttype-${tab.id}" onchange="changeTabType('${tab.id}')" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-dim);padding:6px 9px;font-family:'Share Tech Mono',monospace;font-size:11px;outline:none;">
        <option value="content" ${!tab.folders?'selected':''}>Plain text</option>
        <option value="folders" ${tab.folders?'selected':''}>Folders</option>
      </select>
      <button class="save-btn" onclick="saveTabMeta('${tab.id}')">SAVE NAME</button>
      <button class="delete-btn" onclick="deleteTab('${tab.id}')">✕ TAB</button>
    </div>`;
    if(!tab.folders) {
      html+=`<div style="padding:10px 12px;">
        <textarea id="tcontent-${tab.id}" style="width:100%;background:var(--bg);border:1px solid var(--border-bright);color:var(--text);padding:9px 11px;font-family:'Share Tech Mono',monospace;font-size:13px;outline:none;resize:vertical;min-height:80px;line-height:1.7;">${escHtml(tab.content||'')}</textarea>
        <button class="save-btn" style="margin-top:6px;" onclick="saveTabContent('${tab.id}')">SAVE CONTENT</button>
      </div>`;
    } else {
      tab.folders.forEach(folder=>{
        html+=`<div class="entry-editor">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <input class="fe-name" value="${escAttr(folder.name)}" id="fname-${tab.id}-${folder.id}" style="flex:0 0 150px"/>
            <input type="text" value="${escAttr(folder.icon)}" id="ficon-${tab.id}-${folder.id}" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:6px 9px;font-size:15px;outline:none;width:52px;text-align:center;font-family:'Share Tech Mono',monospace;"/>
            <button class="save-btn" onclick="saveFolder('${tab.id}','${folder.id}')">SAVE</button>
            <button class="delete-btn" onclick="deleteFolder('${tab.id}','${folder.id}')">✕ FOLDER</button>
          </div>`;
        folder.entries.forEach(entry=>{
          html+=`<div class="entry-editor-row">
            <input class="ee-title" value="${escAttr(entry.title)}" id="etitle-${tab.id}-${folder.id}-${entry.id}"/>
            <textarea class="ee-body" id="ebody-${tab.id}-${folder.id}-${entry.id}">${escHtml(entry.body)}</textarea>
            <button class="save-btn" onclick="saveEntry('${tab.id}','${folder.id}','${entry.id}')">SAVE</button>
            <button class="delete-btn" onclick="deleteEntry('${tab.id}','${folder.id}','${entry.id}')">✕</button>
          </div>`;
        });
        html+=`<div class="add-entry-row">
          <input class="ee-title" id="newtitle-${tab.id}-${folder.id}" placeholder="New entry title..."/>
          <textarea class="ee-body" id="newbody-${tab.id}-${folder.id}" placeholder="Entry content..."></textarea>
          <button class="add-btn" onclick="addEntry('${tab.id}','${folder.id}')">+ ENTRY</button>
        </div>`;
        html+=`</div>`;
      });
      html+=`<div style="padding:8px 12px;display:flex;gap:8px;align-items:center;">
        <input type="text" id="nfname-${tab.id}" placeholder="New folder name..." style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:7px 10px;font-family:'Share Tech Mono',monospace;font-size:13px;outline:none;width:180px;"/>
        <input type="text" id="nficon-${tab.id}" placeholder="📁" style="background:var(--bg);border:1px solid var(--border-bright);color:var(--text-bright);padding:7px 9px;font-family:'Share Tech Mono',monospace;font-size:15px;outline:none;width:54px;text-align:center;"/>
        <button class="add-btn" onclick="addFolder('${tab.id}')">+ FOLDER</button>
      </div>`;
    }
    html+=`</div>`;
  });
  el.innerHTML=html;
}

// =====================================================================
// CHAT CHANNEL MANAGEMENT
// =====================================================================

// Returns every unique tag in use across all users + master roles list.
function getAllTags() {
  const set = new Set(state.roles || []);
  state.users.forEach(u => {
    (u.tags || (u.role ? [u.role] : [])).forEach(t => { if(t) set.add(t); });
  });
  return [...set].sort((a, b) => a.localeCompare(b));
}

function renderChannelList() {
  const el = document.getElementById('chat-channel-list');
  if(!el) return;
  const channels = Object.values(state.chats||{});
  if(!channels.length){ el.innerHTML=`<div style="color:var(--text-dim);font-size:12px;letter-spacing:1px;text-transform:uppercase;">// NO CHANNELS DEFINED</div>`; return; }
  const accessLabel = {all:'Everyone', shadow:'Shadow Access', hacker:'Hackers Only', roles:'By Tag', exclusive:'🔒 Exclusive'};
  el.innerHTML = `<div class="chat-channel-list">` + channels.map(ch=>{
    const locked = ch.id==='open_comms'||ch.id==='shadow_network'||ch.id==='hacker_underground';
    const isExclusive = ch.access === 'exclusive';
    const roleBadges = (ch.access==='roles' || isExclusive) && (ch.roles||[]).length
      ? (ch.roles).map(r=>`<span style="font-size:10px;letter-spacing:1px;color:${isExclusive?'var(--cortex-accent)':'var(--amber)'};border:1px solid ${isExclusive?'rgba(79,195,247,0.4)':'rgba(255,176,0,0.4)'};padding:2px 6px;background:${isExclusive?'rgba(79,195,247,0.06)':'rgba(255,176,0,0.06)'};">${escHtml(r)}</span>`).join('')
      : '';
    const roleEditBtn = (ch.access==='roles' || isExclusive) && !locked
      ? `<button class="save-btn" style="padding:3px 8px;font-size:10px;border-color:${isExclusive?'var(--cortex-accent)':'var(--amber)'};color:${isExclusive?'var(--cortex-accent)':'var(--amber)'};" onclick="openEditChannelRoles('${ch.id}')">EDIT TAGS</button>`
      : '';
    return `<div style="border-bottom:1px solid var(--border);padding:10px 0;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:18px;">${ch.icon}</span>
        <span style="color:${ch.shadowMode?'var(--hacker)':'var(--cyan)'};font-size:13px;letter-spacing:2px;flex:1;min-width:100px;">${escHtml(ch.name)}</span>
        <span style="font-size:10px;letter-spacing:1px;color:${ch.access==='roles'?'var(--amber)':'var(--text-dim)'};border:1px solid ${ch.access==='roles'?'rgba(255,176,0,0.4)':'var(--border)'};padding:2px 7px;text-transform:uppercase;">${accessLabel[ch.access]||ch.access}</span>
        ${ch.shadowMode ? `<span style="font-size:10px;letter-spacing:1px;color:var(--hacker);border:1px solid var(--hacker-dim);padding:2px 7px;">SHADOW MODE</span>` : ''}
        <span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">${(ch.messages||[]).length} msgs</span>
        ${roleEditBtn}
        <button class="delete-btn" onclick="adminClearChannel('${ch.id}')">CLEAR MSGS</button>
        ${!locked ? `<button class="delete-btn" onclick="adminDeleteChannel('${ch.id}')">✕ DELETE</button>` : `<span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">[CORE]</span>`}
      </div>
      ${roleBadges ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;padding-left:30px;">${roleBadges}</div>` : ''}
      <div id="edit-ch-roles-${ch.id}" style="display:none;margin-top:10px;padding:10px;border:1px solid var(--amber);background:var(--bg);">
        <div style="font-size:10px;letter-spacing:2px;color:var(--amber);text-transform:uppercase;margin-bottom:8px;">// EDIT TAG ACCESS FOR: ${escHtml(ch.name)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;" class="ch-roles-checkboxes">
          ${getAllTags().map(r=>`
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;border:1px solid var(--border-bright);padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--text-bright);letter-spacing:1px;">
              <input type="checkbox" value="${escAttr(r)}" ${(ch.roles||[]).includes(r)?'checked':''} id="chredit-${ch.id}-${escAttr(r)}" style="accent-color:var(--amber);width:14px;height:14px;"/>
              ${escHtml(r)}
            </label>`).join('')}
        </div>
        <button class="save-btn" style="border-color:var(--amber);color:var(--amber);" onclick="saveChannelRoles('${ch.id}')">[ SAVE TAGS ]</button>
        <button class="hdr-btn" style="margin-left:8px;" onclick="document.getElementById('edit-ch-roles-${ch.id}').style.display='none'">[ CLOSE ]</button>
      </div>
    </div>`;
  }).join('') + `</div>`;
}

function onChAccessChange() {
  const val = document.getElementById('new-ch-access').value;
  const picker = document.getElementById('new-ch-roles-picker');
  if(!picker) return;
  if(val === 'roles' || val === 'exclusive') {
    // Rebuild checkboxes from all tags in use (master list + user tags)
    const checkboxContainer = document.getElementById('new-ch-roles-checkboxes');
    if(checkboxContainer) {
      checkboxContainer.innerHTML = getAllTags().map(r=>`
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;border:1px solid var(--border-bright);padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--text-bright);letter-spacing:1px;">
          <input type="checkbox" value="${escAttr(r)}" style="accent-color:var(--amber);width:14px;height:14px;"/>
          ${escHtml(r)}
        </label>`).join('');
    }
    picker.style.display = 'block';
  } else {
    picker.style.display = 'none';
  }
}

function adminAddChannel() {
  const name = document.getElementById('new-ch-name').value.trim();
  if(!name){ showMsg('ch-msg','// CHANNEL NAME REQUIRED'); return; }
  const icon = document.getElementById('new-ch-icon').value.trim() || '💬';
  const access = document.getElementById('new-ch-access').value;
  const mode = document.getElementById('new-ch-mode').value;
  // Collect selected roles if access === 'roles' or 'exclusive'
  let selectedRoles = [];
  if(access === 'roles' || access === 'exclusive') {
    const boxes = document.querySelectorAll('#new-ch-roles-checkboxes input[type=checkbox]:checked');
    selectedRoles = Array.from(boxes).map(b=>b.value);
    if(!selectedRoles.length){ showMsg('ch-msg','// SELECT AT LEAST ONE TAG'); return; }
  }
  const id = 'ch_' + Date.now();
  state.chats[id] = { id, name, icon, access, roles: selectedRoles, shadowMode: mode==='shadow', messages:[] };
  saveState();
  document.getElementById('new-ch-name').value = '';
  document.getElementById('new-ch-icon').value = '';
  // Reset role checkboxes
  document.querySelectorAll('#new-ch-roles-checkboxes input[type=checkbox]').forEach(b=>b.checked=false);
  document.getElementById('new-ch-access').value = 'all';
  onChAccessChange();
  renderChannelList();
  showMsg('ch-msg', `// CHANNEL "${name}" CREATED.`);
}

function openEditChannelRoles(chId) {
  // Close any others first
  document.querySelectorAll('[id^="edit-ch-roles-"]').forEach(el=>{
    if(el.id !== 'edit-ch-roles-'+chId) el.style.display='none';
  });
  const el = document.getElementById('edit-ch-roles-'+chId);
  if(!el) return;
  const ch = state.chats[chId];
  // Rebuild checkboxes from all tags in use (master list + user tags)
  const checkboxDiv = el.querySelector('.ch-roles-checkboxes');
  if(checkboxDiv && ch) {
    checkboxDiv.innerHTML = getAllTags().map(r=>`
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;border:1px solid var(--border-bright);padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--text-bright);letter-spacing:1px;">
        <input type="checkbox" value="${escAttr(r)}" ${(ch.roles||[]).includes(r)?'checked':''} id="chredit-${chId}-${escAttr(r)}" style="accent-color:var(--amber);width:14px;height:14px;"/>
        ${escHtml(r)}
      </label>`).join('');
  }
  el.style.display = el.style.display==='none' ? 'block' : 'none';
}

function saveChannelRoles(chId) {
  const ch = state.chats[chId]; if(!ch) return;
  const boxes = document.querySelectorAll(`#edit-ch-roles-${chId} input[type=checkbox]:checked`);
  ch.roles = Array.from(boxes).map(b=>b.value);
  saveState();
  renderChannelList();
  showMsg('ch-msg', `// TAGS UPDATED FOR "${ch.name}".`);
}

function adminDeleteChannel(id) {
  if(!confirm(`Delete channel "${state.chats[id]?.name}"? This removes all messages permanently.`)) return;
  delete state.chats[id];
  if(activeChatChannel === id) activeChatChannel = null;
  saveState();
  renderChannelList();
  showMsg('ch-msg', '// CHANNEL DELETED.');
}

function adminClearChannel(id) {
  if(!confirm(`Clear all messages in "${state.chats[id]?.name}"?`)) return;
  if(state.chats[id]) state.chats[id].messages = [];
  saveState();
  renderChannelList();
  showMsg('ch-msg', '// MESSAGES CLEARED.');
}

// =====================================================================
// ADMIN ACTIONS
// =====================================================================
function toggleAccess(ui,tabId) {
  const user=state.users[ui]; const idx=user.tabs.indexOf(tabId);
  if(idx>=0) user.tabs.splice(idx,1); else user.tabs.push(tabId);
  saveState(); renderUserTable(); showMsg('user-msg','// ACCESS UPDATED.');
}

function addUser() {
  const u=document.getElementById('new-username').value.trim();
  const p=document.getElementById('new-password').value.trim();
  const r=document.getElementById('new-role').value.trim()||'Adventurer';
  const type=document.getElementById('new-type').value;
  if(!u||!p){showMsg('user-msg','// HANDLE AND PASSPHRASE REQUIRED.');return;}
  if(state.users.find(x=>x.username.toLowerCase()===u.toLowerCase())){showMsg('user-msg','// HANDLE ALREADY TAKEN.');return;}
  const newUser={username:u,password:p,role:r,tags:[r],tabs:["frontpage","lorehub","lore","profile","chat"]};
  if(type==='hacker'){newUser.isHacker=true;newUser.hackerLevel=1;newUser.hackerCredits=3;newUser.tabs.push('hacker');}
  if(type==='criminal'){newUser.isCriminal=true;}
  if(type==='moderator'){newUser.isModerator=true;newUser.tabs.push('rumors','newspaper','sysnews');}
  if(type==='offworlder'){newUser.isOffworlder=true;}
  state.users.push(newUser);
  saveState();
  document.getElementById('new-username').value='';document.getElementById('new-password').value='';document.getElementById('new-role').value='';
  renderUserTable(); showMsg('user-msg',`// CHARACTER "${u}" ADDED.`);
}

function deleteUser(ui) {
  if(state.users[ui].isAdmin) return;
  if(!confirm(`Remove character "${state.users[ui].username}"?`)) return;
  state.users.splice(ui,1); saveState(); renderUserTable(); showMsg('user-msg','// REMOVED.');
}

function saveTabMeta(tabId) {
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab) return;
  tab.name=document.getElementById('tname-'+tabId).value.trim()||tab.name;
  saveState(); showMsg('tab-msg','// SAVED.'); renderTabs(); switchTab('admin');
}

function saveTabContent(tabId) {
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab) return;
  tab.content=document.getElementById('tcontent-'+tabId).value;
  saveState(); showMsg('tab-msg','// CONTENT SAVED.'); renderTabs(); switchTab('admin');
}

function changeTabType(tabId) {
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const val=document.getElementById('ttype-'+tabId).value;
  if(val==='folders'&&!tab.folders){tab.folders=[];delete tab.content;}
  else if(val==='content'&&tab.folders){delete tab.folders;tab.content='';}
  saveState(); refreshAdminPanel();
}

function addTab() {
  const name=document.getElementById('new-tab-name').value.trim(); if(!name) return;
  const useFolders=document.getElementById('new-tab-folders').checked;
  const id='tab_'+Date.now();
  const t={id,name,icon:'📄'};
  if(useFolders) t.folders=[]; else t.content='New tab content.';
  state.tabs.splice(state.tabs.length-4,0,t); // before admin/hacker/chat/profile
  saveState(); document.getElementById('new-tab-name').value='';
  renderTabs(); switchTab('admin'); showMsg('tab-msg',`// TAB "${name}" CREATED.`);
}

function deleteTab(tabId) {
  if(!confirm('Remove this tab?')) return;
  state.tabs=state.tabs.filter(t=>t.id!==tabId);
  state.users.forEach(u=>{u.tabs=u.tabs.filter(t=>t!==tabId)});
  saveState(); renderTabs(); switchTab('admin');
}

function addFolder(tabId) {
  const name=document.getElementById('nfname-'+tabId).value.trim(); if(!name) return;
  const icon=document.getElementById('nficon-'+tabId).value.trim()||'📁';
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab||!tab.folders) return;
  tab.folders.push({id:'f_'+Date.now(),name,icon,entries:[]});
  saveState(); renderTabs(); switchTab('admin'); showMsg('tab-msg','// FOLDER ADDED.');
}

function saveFolder(tabId,folderId) {
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const folder=tab.folders.find(f=>f.id===folderId); if(!folder) return;
  folder.name=document.getElementById('fname-'+tabId+'-'+folderId).value.trim()||folder.name;
  folder.icon=document.getElementById('ficon-'+tabId+'-'+folderId).value.trim()||folder.icon;
  saveState(); renderTabs(); switchTab('admin'); showMsg('tab-msg','// FOLDER SAVED.');
}

function deleteFolder(tabId,folderId) {
  if(!confirm('Remove this folder and all its entries?')) return;
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab) return;
  tab.folders=tab.folders.filter(f=>f.id!==folderId);
  saveState(); renderTabs(); switchTab('admin');
}

function addEntry(tabId,folderId) {
  const title=document.getElementById('newtitle-'+tabId+'-'+folderId).value.trim(); if(!title) return;
  const body=document.getElementById('newbody-'+tabId+'-'+folderId).value.trim();
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const folder=tab.folders.find(f=>f.id===folderId); if(!folder) return;
  folder.entries.push({id:'e_'+Date.now(),title,body,adminBody:body,hackerBody:'',images:[],protected:false});
  saveState(); renderTabs(); switchTab('admin'); showMsg('tab-msg','// ENTRY ADDED.');
}

function saveEntry(tabId,folderId,entryId) {
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const folder=tab.folders.find(f=>f.id===folderId); if(!folder) return;
  const entry=folder.entries.find(e=>e.id===entryId); if(!entry) return;
  const newTitle=document.getElementById('etitle-'+tabId+'-'+folderId+'-'+entryId).value.trim()||entry.title;
  const newBody=document.getElementById('ebody-'+tabId+'-'+folderId+'-'+entryId).value;
  entry.title=newTitle;
  entry.adminBody=newBody;
  // Only update visible body if no hacker overlay
  if(!entry.hackerEdited) entry.body=newBody;
  saveState(); renderTabs(); switchTab('admin'); showMsg('tab-msg','// ENTRY SAVED.');
}

function deleteEntry(tabId,folderId,entryId) {
  if(!confirm('Remove this entry?')) return;
  const tab=state.tabs.find(t=>t.id===tabId); if(!tab) return;
  const folder=tab.folders.find(f=>f.id===folderId); if(!folder) return;
  folder.entries=folder.entries.filter(e=>e.id!==entryId);
  saveState(); renderTabs(); switchTab('admin');
}

// =====================================================================
// BETWEEN-GAME RESET
// =====================================================================
function resetAllHackerEdits() {
  if(!confirm('Reset ALL hacker text overlays? Canonical admin text will be restored everywhere.')) return;
  state.tabs.forEach(t=>{
    if(t.folders) t.folders.forEach(f=>{
      f.entries.forEach(e=>{
        if(e.hackerEdited) {
          e.body = e.adminBody || e.body;
          e.hackerBody = '';
          delete e.hackerEdited; delete e.hackerEditedBy;
          delete e.hackerInjectedImg; delete e.originalBody; delete e.originalImages;
        }
      });
    });
  });
  saveState(); refreshAdminPanel(); renderTabs(); switchTab('admin');
  showMsg('reset-msg','// ALL HACKER EDITS CLEARED. CANONICAL TEXT RESTORED.');
}

function resetAllLockouts() {
  if(!confirm('Clear all hacker lockouts? All users can log in again.')) return;
  // Remove all lock.* from hackerCooldowns
  Object.keys(hackerCooldowns).filter(k=>k.startsWith('lock.')).forEach(k=>delete hackerCooldowns[k]);
  // Clear admin-locked flags
  state.users.forEach(u=>{ if(!u.isAdmin) u.locked=false; });
  saveCooldowns(); saveState(); refreshAdminPanel();
  showMsg('reset-msg','// ALL LOCKOUTS CLEARED.');
}

function fullGameReset() {
  if(!confirm('FULL GAME RESET: clears all hacker edits, defacements, and lockouts. Cannot be undone.')) return;
  resetAllHackerEdits();
  state.defacements = {};
  state.systemShutdown = null;
  Object.keys(hackerCooldowns).forEach(k=>delete hackerCooldowns[k]);
  // Reset each hacker's credits to their level default
  state.users.forEach(u=>{ if(!u.isAdmin) u.locked=false; if(u.isHacker) u.hackerCredits = 2 + getHackerLevel(u); });
  if(currentUser && currentUser.isHacker) currentUser.hackerCredits = 2 + getHackerLevel(currentUser);
  saveCooldowns(); saveState(); refreshAdminPanel(); renderTabs(); switchTab('admin');
  showMsg('reset-msg','// FULL GAME RESET COMPLETE.');
}

// =====================================================================
// SITE OVERLAY (offline / maintenance)
// =====================================================================
function applySiteOverlay() {
  const overlay = document.getElementById('site-overlay');
  const offPane  = document.getElementById('overlay-offline');
  const maintPane = document.getElementById('overlay-maintenance');
  // Check system shutdown first (hacker ability)
  if(state.systemShutdown && !(currentUser && currentUser.isAdmin)) {
    overlay.style.display = 'flex';
    offPane.style.display = 'none';
    maintPane.style.display = 'none';
    // Show shutdown overlay
    let sdPane = document.getElementById('overlay-shutdown');
    if(!sdPane) {
      sdPane = document.createElement('div');
      sdPane.id = 'overlay-shutdown';
      overlay.appendChild(sdPane);
    }
    const sd = state.systemShutdown;
    sdPane.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0;text-align:center;animation:flicker 8s infinite;';
    sdPane.innerHTML = `
      <div style="font-family:'VT323',monospace;font-size:72px;color:var(--red);text-shadow:0 0 30px var(--red),0 0 60px rgba(255,34,34,0.4);letter-spacing:6px;line-height:1;animation:glitch 2s infinite;">SYSTEM SHUTDOWN</div>
      <div style="font-size:13px;color:var(--red-dim);letter-spacing:4px;text-transform:uppercase;margin-top:10px;margin-bottom:36px;">// FORCED OFFLINE — HOSTILE INTRUSION DETECTED</div>
      <div style="border:2px solid var(--red);padding:28px 48px;background:rgba(255,34,34,0.04);position:relative;max-width:520px;">
        <div style="position:absolute;top:-11px;left:20px;background:#0a0f0a;padding:0 10px;font-size:11px;color:var(--red);letter-spacing:3px;text-transform:uppercase;">// EMERGENCY BROADCAST</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:14px;color:var(--text-bright);line-height:2;letter-spacing:1px;">The system has been forcibly shut down<br>by an unknown operator.<br><br>All sessions have been terminated.<br>Contact your Game Master immediately.</div>
      </div>
      <div style="margin-top:36px;display:flex;align-items:center;gap:12px;">
        <div style="width:8px;height:8px;background:var(--red);border-radius:50%;animation:blink 0.5s step-end infinite;box-shadow:0 0 8px var(--red);"></div>
        <span style="font-size:12px;color:var(--red-dim);letter-spacing:3px;text-transform:uppercase;">SYSTEM OFFLINE — SHUTDOWN BY: ${escHtml(sd.by||'UNKNOWN')}</span>
      </div>
      <button onclick="doLogout()" style="margin-top:30px;background:transparent;border:1px solid var(--red-dim);color:#663333;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:6px 16px;cursor:pointer;">[ DISCONNECT ]</button>`;
    return;
  }
  // Hide shutdown pane if no longer active
  const sdPane = document.getElementById('overlay-shutdown');
  if(sdPane) sdPane.style.display = 'none';

  const o = state.siteOverlay;
  if(!o || (currentUser && currentUser.isAdmin)) {
    overlay.style.display = 'none';
    offPane.style.display  = 'none';
    maintPane.style.display = 'none';
    return;
  }
  overlay.style.display = 'flex';
  if(o.type === 'offline') {
    offPane.style.display  = 'flex';
    maintPane.style.display = 'none';
    // Cycling reconnect messages
    const msgs = ['PINGING NODE...','NO RESPONSE...','RETRYING...','PACKET LOSS: 100%','RECONNECTING...','SIGNAL NOT FOUND...'];
    let mi = 0;
    clearInterval(window._offlineMsgTimer);
    document.getElementById('overlay-offline-msg').textContent = msgs[0];
    window._offlineMsgTimer = setInterval(()=>{
      mi = (mi+1)%msgs.length;
      const el = document.getElementById('overlay-offline-msg');
      if(el) el.textContent = msgs[mi];
    }, 1800);
  } else {
    maintPane.style.display = 'flex';
    offPane.style.display   = 'none';
    clearInterval(window._offlineMsgTimer);
  }
}

function adminSetOverlay(type) {
  if(!currentUser || !currentUser.isAdmin) return;
  if(state.siteOverlay && state.siteOverlay.type === type) {
    // Toggle off if already active
    state.siteOverlay = null;
  } else {
    state.siteOverlay = { type, by: currentUser.username, timestamp: Date.now() };
  }
  saveState();
  refreshAdminPanel();
  applySiteOverlay();
}

