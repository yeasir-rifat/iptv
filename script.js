/**
 * IPTV Pro — by rifatplex
 * Vanilla JS | HLS.js | M3U Parser
 * Auto-loads built-in playlist on startup
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   1. BUILT-IN PLAYLIST URL (auto-loads on startup)
══════════════════════════════════════════════════════════ */
const BUILTIN_PLAYLIST_URL = 'https://raw.githubusercontent.com/imShakil/tvlink/refs/heads/main/iptv.m3u8';

/* ══════════════════════════════════════════════════════════
   2. CATEGORY ICON MAP
══════════════════════════════════════════════════════════ */
const CAT_ICONS = {
  news:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h7M7 16h5"/></svg>`,
  science:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L5 19h14L14 9V3"/><circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  documentary:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3V10z"/></svg>`,
  business:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 014 0v2M3 11h18"/></svg>`,
  sports:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c0 4-3 7-3 9s3 5 3 9M3 9h18M3 15h18"/></svg>`,
  movies:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M2 14h5M17 9h5M17 14h5"/></svg>`,
  music:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  kids:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 018 0v2M18 20v-2a2 2 0 10-4 0"/></svg>`,
  international: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2c-2.5 3-4 6-4 10s1.5 7 4 10M12 2c2.5 3 4 6 4 10s-1.5 7-4 10"/></svg>`,
  entertainment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/></svg>`,
  lifestyle:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12M12 12C12 7 7 3 3 5c0 4 3 7 9 7zM12 12c0-5 5-9 9-7c0 4-3 7-9 7"/></svg>`,
  tech:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  general:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="3" width="18" height="15" rx="2"/><path d="M7 21h10M12 18v3"/><path d="M9 10l2 2 4-4" stroke-linejoin="round"/></svg>`,
  default:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2" y="3" width="20" height="15" rx="2"/><path d="M7 21h10M12 18v3"/></svg>`,
};

/* ══════════════════════════════════════════════════════════
   3. STATE
══════════════════════════════════════════════════════════ */
const state = {
  channels: [],
  filtered: [],
  currentChannel: null,
  currentCategory: 'all',
  searchQuery: '',
  sortMode: 'default',
  viewMode: 'grid',
  favorites: new Set(),
  recentlyWatched: [],
  hls: null,
  isMuted: false,
  controlsTimer: null,
  retryCount: 0,
  MAX_RETRY: 3,
  theme: 'dark',
};

/* ══════════════════════════════════════════════════════════
   4. DOM REFERENCES
══════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const DOM = {
  sidebar:           $('sidebar'),
  sidebarToggle:     $('sidebarToggle'),
  menuBtn:           $('menuBtn'),
  hamburgerMenu:     $('hamburgerMenu'),
  hamburgerSidebar:  $('hamburgerSidebar'),
  searchInput:       $('searchInput'),
  searchClear:       $('searchClear'),
  categoryStrip:     $('categoryStrip'),
  channelList:       $('channelList'),
  channelCount:      $('channelCount'),
  emptyState:        $('emptyState'),
  channelGrid:       $('channelGrid'),
  gridEmpty:         $('gridEmpty'),
  gridTitle:         $('gridTitle'),
  playerWrap:        $('playerWrap'),
  playerIdle:        $('playerIdle'),
  playerLoading:     $('playerLoading'),
  playerError:       $('playerError'),
  errorMsg:          $('errorMsg'),
  retryBtn:          $('retryBtn'),
  videoPlayer:       $('videoPlayer'),
  controlsOverlay:   $('controlsOverlay'),
  playPauseBtn:      $('playPauseBtn'),
  playIcon:          $('playIcon'),
  pauseIcon:         $('pauseIcon'),
  muteBtn:           $('muteBtn'),
  volumeSlider:      $('volumeSlider'),
  volIcon:           $('volIcon'),
  pipBtn:            $('pipBtn'),
  fsBtn:             $('fsBtn'),
  channelInfoBar:    $('channelInfoBar'),
  liveBadge:         $('liveBadge'),
  infoStrip:         $('infoStrip'),
  infoLogo:          $('infoLogo'),
  infoTitle:         $('infoTitle'),
  infoCat:           $('infoCat'),
  stripFavBtn:       $('stripFavBtn'),
  stripShareBtn:     $('stripShareBtn'),
  recentBtn:         $('recentBtn'),
  fullscreenBtn:     $('fullscreenBtn'),
  recentPanel:       $('recentPanel'),
  recentList:        $('recentList'),
  recentClose:       $('recentClose'),
  settingsPanel:     $('settingsPanel'),
  settingsClose:     $('settingsClose'),
  themeToggle:       $('themeToggle'),
  themeToggleTopbar: $('themeToggleTopbar'),
  themeLabel:        $('themeLabel'),
  m3uUrl:            $('m3uUrl'),
  loadUrlBtn:        $('loadUrlBtn'),
  m3uFile:           $('m3uFile'),
  fileDrop:          $('fileDrop'),
  toast:             $('toast'),
  mainContent:       $('mainContent'),
};

/* ══════════════════════════════════════════════════════════
   5. M3U PARSER
══════════════════════════════════════════════════════════ */
const Parser = {
  parse(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const channels = [];
    let meta = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#EXTINF')) {
        meta = this._parseMeta(line);
      } else if (meta && !line.startsWith('#')) {
        channels.push({
          id: `ch_${i}_${Math.random().toString(36).slice(2, 7)}`,
          name: meta.name,
          url: line,
          logo: meta.logo,
          group: meta.group || 'General',
          tvgId: meta.tvgId,
        });
        meta = null;
      }
    }
    return channels;
  },

  _parseMeta(line) {
    const nameMatch   = line.match(/,(.+)$/);
    const logoMatch   = line.match(/tvg-logo="([^"]*)"/);
    const groupMatch  = line.match(/group-title="([^"]*)"/);
    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
    const tvgIdMatch  = line.match(/tvg-id="([^"]*)"/);
    return {
      name:  (tvgNameMatch?.[1] || nameMatch?.[1] || 'Unknown Channel').trim(),
      logo:  logoMatch?.[1]?.trim() || '',
      group: groupMatch?.[1]?.trim() || 'General',
      tvgId: tvgIdMatch?.[1]?.trim() || '',
    };
  },

  async fetchFromUrl(url) {
    // Try direct
    try {
      const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
      if (res.ok) return await res.text();
    } catch (_) { /* CORS blocked — try proxy */ }

    // Fallback proxy
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  },
};

/* ══════════════════════════════════════════════════════════
   6. STORAGE
══════════════════════════════════════════════════════════ */
const Storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(`iptv_${key}`);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(`iptv_${key}`, JSON.stringify(val)); } catch {}
  },
  loadFavorites()  { state.favorites = new Set(Storage.get('favorites', [])); },
  saveFavorites()  { Storage.set('favorites', [...state.favorites]); },
  loadRecent()     { state.recentlyWatched = Storage.get('recent', []); },
  saveRecent()     { Storage.set('recent', state.recentlyWatched); },
  loadTheme()      { return Storage.get('theme', 'dark'); },
  saveTheme(t)     { Storage.set('theme', t); },
};

/* ══════════════════════════════════════════════════════════
   7. THEME
══════════════════════════════════════════════════════════ */
const Theme = {
  apply(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    Storage.saveTheme(theme);

    // Update toggle label
    if (DOM.themeLabel) DOM.themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';

    // Update topbar icon (moon ↔ sun)
    const moon = DOM.themeToggleTopbar?.querySelector('.icon-moon');
    const sun  = DOM.themeToggleTopbar?.querySelector('.icon-sun');
    if (moon && sun) {
      moon.style.display = theme === 'dark' ? 'block' : 'none';
      sun.style.display  = theme === 'light' ? 'block' : 'none';
    }
  },

  toggle() {
    Theme.apply(state.theme === 'dark' ? 'light' : 'dark');
  },
};

/* ══════════════════════════════════════════════════════════
   8. CHANNEL UTILITIES
══════════════════════════════════════════════════════════ */
const Channels = {
  getCategories() {
    return [...new Set(state.channels.map(c => c.group.toLowerCase()))].sort();
  },

  applyFilters() {
    let list = [...state.channels];

    if (state.currentCategory !== 'all') {
      list = list.filter(c => c.group.toLowerCase() === state.currentCategory);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q)
      );
    }

    if (state.sortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.sortMode === 'fav') {
      list = list.filter(c => state.favorites.has(c.id));
    }

    state.filtered = list;
  },

  getIcon(group) {
    const key = (group || '').toLowerCase();
    for (const [k, v] of Object.entries(CAT_ICONS)) {
      if (key.includes(k)) return v;
    }
    return CAT_ICONS.default;
  },

  getById(id) {
    return state.channels.find(c => c.id === id) || null;
  },

  addRecent(channel) {
    state.recentlyWatched = [
      channel.id,
      ...state.recentlyWatched.filter(id => id !== channel.id),
    ].slice(0, 20);
    Storage.saveRecent();
  },
};

/* ══════════════════════════════════════════════════════════
   9. PLAYER
══════════════════════════════════════════════════════════ */
const Player = {
  play(channel) {
    state.currentChannel = channel;
    state.retryCount = 0;
    this._startStream(channel.url);
    Channels.addRecent(channel);
    UI.updateNowPlaying(channel);
    UI.updateActiveHighlight(channel.id);
  },

  retry() {
    if (!state.currentChannel) return;
    state.retryCount++;
    if (state.retryCount > state.MAX_RETRY) {
      UI.showError('Maximum retry attempts reached. The stream may be offline.');
      return;
    }
    showToast(`Retrying… (${state.retryCount}/${state.MAX_RETRY})`, 'info');
    this._startStream(state.currentChannel.url);
  },

  _startStream(url) {
    this._destroyHls();
    const video = DOM.videoPlayer;
    UI.showLoading();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 20,
        maxMaxBufferLength: 30,
        startLevel: -1,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        UI.showPlayer();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (state.retryCount < state.MAX_RETRY) {
                setTimeout(() => hls.startLoad(), 1500);
                state.retryCount++;
              } else {
                UI.showError('Network error. Please check the stream URL.');
                this._destroyHls();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              UI.showError('Stream error. The channel may be temporarily unavailable.');
              this._destroyHls();
          }
        }
      });

      state.hls = hls;

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        UI.showPlayer();
      }, { once: true });
      video.addEventListener('error', () => {
        UI.showError('Unable to load this stream on your browser.');
      }, { once: true });
    } else {
      UI.showError('HLS playback is not supported in this browser.');
    }
  },

  _destroyHls() {
    if (state.hls) { state.hls.destroy(); state.hls = null; }
    DOM.videoPlayer.src = '';
  },

  togglePlayPause() {
    const v = DOM.videoPlayer;
    v.paused ? v.play().catch(() => {}) : v.pause();
  },

  setVolume(val) {
    DOM.videoPlayer.volume = val;
    state.isMuted = val === 0;
    DOM.videoPlayer.muted = state.isMuted;
    UI.updateVolIcon();
  },

  toggleMute() {
    state.isMuted = !state.isMuted;
    DOM.videoPlayer.muted = state.isMuted;
    DOM.volumeSlider.value = state.isMuted ? 0 : DOM.videoPlayer.volume;
    UI.updateVolIcon();
  },

  async togglePiP() {
    if (!document.pictureInPictureEnabled) {
      showToast('Picture-in-Picture is not supported', 'error');
      return;
    }
    try {
      document.pictureInPictureElement
        ? await document.exitPictureInPicture()
        : await DOM.videoPlayer.requestPictureInPicture();
    } catch {
      showToast('PiP not available for this stream', 'error');
    }
  },

  toggleFullscreen() {
    const el = DOM.playerWrap;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
  },
};

/* ══════════════════════════════════════════════════════════
   10. UI RENDERERS
══════════════════════════════════════════════════════════ */
const UI = {

  /* ── Player states ── */
  showLoading() {
    DOM.playerIdle.style.display    = 'none';
    DOM.playerError.style.display   = 'none';
    DOM.playerLoading.style.display = 'flex';
  },

  showPlayer() {
    DOM.playerLoading.style.display = 'none';
    DOM.playerError.style.display   = 'none';
    DOM.playerIdle.style.display    = 'none';
    DOM.liveBadge.style.display     = 'inline-flex';
  },

  showError(msg = '') {
    DOM.playerLoading.style.display = 'none';
    DOM.playerIdle.style.display    = 'none';
    DOM.playerError.style.display   = 'flex';
    DOM.errorMsg.textContent        = msg || 'Unable to connect to this channel\'s stream.';
    DOM.liveBadge.style.display     = 'none';
  },

  showIdle() {
    DOM.playerError.style.display   = 'none';
    DOM.playerLoading.style.display = 'none';
    DOM.playerIdle.style.display    = 'flex';
    DOM.liveBadge.style.display     = 'none';
  },

  /* ── Now Playing ── */
  updateNowPlaying(channel) {
    DOM.channelInfoBar.textContent = channel.name;
    DOM.infoTitle.textContent      = channel.name;
    DOM.infoCat.textContent        = channel.group;
    DOM.infoStrip.style.display    = 'flex';

    // Logo — object-fit: cover set in CSS
    DOM.infoLogo.innerHTML = channel.logo
      ? `<img src="${escHtml(channel.logo)}" alt="${escHtml(channel.name)}" loading="lazy" onerror="this.style.display='none';this.parentNode.innerHTML='<span class=\\"info-logo-icon\\">${Channels.getIcon(channel.group).replace(/"/g, "'")}</span>'">`
      : `<span class="info-logo-icon">${Channels.getIcon(channel.group)}</span>`;

    this.updateFavBtn();
  },

  updateFavBtn() {
    if (!state.currentChannel) return;
    const isFav = state.favorites.has(state.currentChannel.id);
    const filled = `<svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" style="margin-right:5px;vertical-align:-2px"><path d="M7.5 12.5s-6-3.7-6-7.5A3.8 3.8 0 017.5 1.5a3.8 3.8 0 016 3C13.5 8.8 7.5 12.5 7.5 12.5z"/></svg>`;
    const empty  = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right:5px;vertical-align:-2px"><path d="M7.5 12.5s-6-3.7-6-7.5A3.8 3.8 0 017.5 1.5a3.8 3.8 0 016 3C13.5 8.8 7.5 12.5 7.5 12.5z" stroke-linejoin="round"/></svg>`;
    DOM.stripFavBtn.innerHTML = isFav ? `${filled}Favorited` : `${empty}Favorite`;
    DOM.stripFavBtn.classList.toggle('active', isFav);
  },

  updateVolIcon() {
    const muted = state.isMuted || DOM.videoPlayer.volume === 0;
    DOM.volIcon.innerHTML = muted
      ? `<path d="M3 6.5H6L10 3v12l-4-3.5H3v-5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M13 8l3 3m0-3l-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`
      : `<path d="M3 6.5H6L10 3v12l-4-3.5H3v-5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M13 6c1.1.9 1.7 2.4 1.7 3s-.6 2.1-1.7 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`;
  },

  /* ── Active highlight ── */
  updateActiveHighlight(id) {
    $$('.channel-item.active').forEach(el => el.classList.remove('active'));
    $$('.grid-card.active').forEach(el => el.classList.remove('active'));

    const sidebarItem = DOM.channelList.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const gridCard    = DOM.channelGrid.querySelector(`[data-id="${CSS.escape(id)}"]`);

    if (sidebarItem) {
      sidebarItem.classList.add('active');
      sidebarItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    if (gridCard) gridCard.classList.add('active');
  },

  /* ── Categories ── */
  renderCategories() {
    const cats = Channels.getCategories();
    DOM.categoryStrip.innerHTML = '';

    const allChip = createEl('button', {
      class: `cat-chip${state.currentCategory === 'all' ? ' active' : ''}`,
      role: 'tab',
      'aria-selected': state.currentCategory === 'all',
      'data-cat': 'all',
    }, `<span class="cat-chip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>All`);
    allChip.addEventListener('click', () => setCategory('all'));
    DOM.categoryStrip.appendChild(allChip);

    cats.forEach(cat => {
      const chip = createEl('button', {
        class: `cat-chip${state.currentCategory === cat ? ' active' : ''}`,
        role: 'tab',
        'aria-selected': state.currentCategory === cat,
        'data-cat': cat,
      }, `<span class="cat-chip-icon">${Channels.getIcon(cat)}</span>${capitalize(cat)}`);
      chip.addEventListener('click', () => setCategory(cat));
      DOM.categoryStrip.appendChild(chip);
    });
  },

  /* ── Sidebar list ── */
  renderSidebarList() {
    const list = state.filtered;
    DOM.channelCount.textContent = `${list.length} Channel${list.length !== 1 ? 's' : ''}`;
    DOM.channelList.innerHTML = '';

    if (list.length === 0) {
      DOM.channelList.appendChild(createEl('div', { class: 'empty-state' },
        `<div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="10" r="7"/><path d="M16 16l5 5"/><path d="M7 8l6 6M13 8L7 14"/></svg></div><p>No channels found</p><small>Try a different search or category</small>`
      ));
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach((ch, idx) => frag.appendChild(this._createSidebarItem(ch, idx)));
    DOM.channelList.appendChild(frag);

    if (state.currentChannel) this.updateActiveHighlight(state.currentChannel.id);
  },

  _createSidebarItem(ch, idx) {
    const isFav   = state.favorites.has(ch.id);
    const iconSvg = Channels.getIcon(ch.group);

    const item = createEl('div', {
      class: 'channel-item',
      role: 'listitem',
      'data-id': ch.id,
      tabindex: '0',
      'aria-label': `${ch.name}, ${ch.group}`,
      style: `animation-delay: ${Math.min(idx * 16, 300)}ms`,
    });

    // Logo with cover fill
    const logoEl = createEl('div', { class: 'ch-logo' });
    if (ch.logo) {
      const img = createEl('img', { src: ch.logo, alt: ch.name, loading: 'lazy' });
      img.addEventListener('error', () => { logoEl.innerHTML = `<span class="ch-logo-icon">${iconSvg}</span>`; });
      logoEl.appendChild(img);
    } else {
      logoEl.innerHTML = `<span class="ch-logo-icon">${iconSvg}</span>`;
    }

    const info = createEl('div', { class: 'ch-info' },
      `<div class="ch-name">${escHtml(ch.name)}</div>
       <div class="ch-cat">${escHtml(ch.group)}</div>`
    );

    const favBtn = createEl('button', {
      class: `ch-fav-btn${isFav ? ' fav-active' : ''}`,
      'aria-label': isFav ? 'Remove from favorites' : 'Add to favorites',
    });
    favBtn.innerHTML = isFav ? heartFilled16() : heartEmpty16();

    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(ch.id);
      const active = state.favorites.has(ch.id);
      favBtn.innerHTML = active ? heartFilled16() : heartEmpty16();
      favBtn.classList.toggle('fav-active', active);
    });

    item.append(logoEl, info, favBtn);
    item.addEventListener('click', () => { Player.play(ch); if (window.innerWidth <= 768) closeSidebar(); });
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Player.play(ch); } });
    return item;
  },

  /* ── Grid ── */
  renderGrid() {
    DOM.channelGrid.innerHTML = '';
    const list = state.filtered;

    if (list.length === 0) { DOM.gridEmpty.style.display = 'block'; return; }
    DOM.gridEmpty.style.display = 'none';

    const frag = document.createDocumentFragment();
    list.forEach((ch, idx) => frag.appendChild(this._createGridCard(ch, idx)));
    DOM.channelGrid.appendChild(frag);

    if (state.currentChannel) this.updateActiveHighlight(state.currentChannel.id);
  },

  _createGridCard(ch, idx) {
    const isFav   = state.favorites.has(ch.id);
    const iconSvg = Channels.getIcon(ch.group);

    const card = createEl('div', {
      class: 'grid-card',
      role: 'listitem',
      'data-id': ch.id,
      tabindex: '0',
      'aria-label': `Play ${ch.name}`,
      style: `animation-delay: ${Math.min(idx * 22, 400)}ms`,
    });

    const thumb = createEl('div', { class: 'grid-card-thumb' });

    if (ch.logo) {
      const img = createEl('img', { src: ch.logo, alt: '', loading: 'lazy' });
      img.addEventListener('error', () => {
        img.remove();
        const iconWrap = createEl('span', { class: 'thumb-icon' });
        iconWrap.innerHTML = iconSvg;
        thumb.insertBefore(iconWrap, thumb.firstChild);
      });
      thumb.appendChild(img);
    } else {
      const iconWrap = createEl('span', { class: 'thumb-icon' });
      iconWrap.innerHTML = iconSvg;
      thumb.appendChild(iconWrap);
    }

    thumb.appendChild(createEl('span', { class: 'live-tag' }, 'LIVE'));
    thumb.insertAdjacentHTML('beforeend',
      `<div class="grid-card-play" aria-hidden="true"><div class="play-circle"><svg width="15" height="15" viewBox="0 0 16 16" fill="white"><path d="M4 2l10 6-10 6V2z"/></svg></div></div>`
    );

    const favBtn = createEl('button', {
      class: `grid-fav-btn${isFav ? ' fav-active' : ''}`,
      'aria-label': isFav ? 'Remove from favorites' : 'Add to favorites',
    });
    favBtn.innerHTML = isFav ? heartFilled15() : heartEmpty15();

    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(ch.id);
      const active = state.favorites.has(ch.id);
      favBtn.innerHTML = active ? heartFilled15() : heartEmpty15();
      favBtn.classList.toggle('fav-active', active);
    });

    const body = createEl('div', { class: 'grid-card-body' },
      `<div class="grid-card-name">${escHtml(ch.name)}</div>
       <div class="grid-card-meta"><span class="grid-card-cat">${escHtml(ch.group)}</span></div>`
    );
    body.querySelector('.grid-card-meta').appendChild(favBtn);

    card.append(thumb, body);
    card.addEventListener('click', () => Player.play(ch));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Player.play(ch); } });
    return card;
  },

  /* ── Recently watched ── */
  renderRecentPanel() {
    DOM.recentList.innerHTML = '';
    const list = state.recentlyWatched.map(id => Channels.getById(id)).filter(Boolean).slice(0, 20);

    if (list.length === 0) {
      DOM.recentList.innerHTML = '<p style="color:var(--text-muted);font-size:0.82rem;padding:8px 0;">No recently watched channels yet.</p>';
      return;
    }

    list.forEach(ch => {
      const card = createEl('div', { class: 'recent-card', tabindex: '0', 'aria-label': `Play ${ch.name}` });
      const logoWrap = createEl('div', { class: 'recent-card-logo' });

      if (ch.logo) {
        const img = createEl('img', { src: ch.logo, alt: '', loading: 'lazy' });
        img.addEventListener('error', () => { logoWrap.innerHTML = `<span class="recent-icon">${Channels.getIcon(ch.group)}</span>`; });
        logoWrap.appendChild(img);
      } else {
        logoWrap.innerHTML = `<span class="recent-icon">${Channels.getIcon(ch.group)}</span>`;
      }

      card.append(logoWrap, createEl('span', { class: 'recent-card-name' }, escHtml(ch.name)));
      card.addEventListener('click', () => { Player.play(ch); DOM.recentPanel.style.display = 'none'; DOM.recentBtn.classList.remove('active'); });
      card.addEventListener('keydown', e => { if (e.key === 'Enter') { Player.play(ch); DOM.recentPanel.style.display = 'none'; } });
      DOM.recentList.appendChild(card);
    });
  },

  /* ── Skeletons ── */
  showSkeletons(count = 10) {
    DOM.channelList.innerHTML = '';
    for (let i = 0; i < count; i++) {
      DOM.channelList.appendChild(createEl('div', { class: 'skeleton-item', 'aria-hidden': 'true' },
        `<div class="skeleton skeleton-logo"></div>
         <div class="skeleton-lines">
           <div class="skeleton skeleton-line" style="width:${60 + Math.random() * 30}%"></div>
           <div class="skeleton skeleton-line short"></div>
         </div>`
      ));
    }
  },

  updateGridTitle() {
    const cat = state.currentCategory === 'all' ? 'All Channels' : `${capitalize(state.currentCategory)} Channels`;
    const q   = state.searchQuery ? ` — "${state.searchQuery}"` : '';
    DOM.gridTitle.textContent = `${cat}${q}`;
  },
};

/* ══════════════════════════════════════════════════════════
   11. SVG HELPERS
══════════════════════════════════════════════════════════ */
const heartFilled16 = () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 13.5s-6.5-4-6.5-8A4 4 0 018 2a4 4 0 016.5 3.5C14.5 9.5 8 13.5 8 13.5z"/></svg>`;
const heartEmpty16  = () => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 13.5s-6.5-4-6.5-8A4 4 0 018 2a4 4 0 016.5 3.5C14.5 9.5 8 13.5 8 13.5z" stroke-linejoin="round"/></svg>`;
const heartFilled15 = () => `<svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 12.5s-6-3.7-6-7.5A3.8 3.8 0 017.5 1.5a3.8 3.8 0 016 3C13.5 8.8 7.5 12.5 7.5 12.5z"/></svg>`;
const heartEmpty15  = () => `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7.5 12.5s-6-3.7-6-7.5A3.8 3.8 0 017.5 1.5a3.8 3.8 0 016 3C13.5 8.8 7.5 12.5 7.5 12.5z" stroke-linejoin="round"/></svg>`;

/* ══════════════════════════════════════════════════════════
   12. ACTIONS
══════════════════════════════════════════════════════════ */
function setCategory(cat) {
  state.currentCategory = cat;
  $$('.cat-chip').forEach(el => {
    const active = el.dataset.cat === cat;
    el.classList.toggle('active', active);
    el.setAttribute('aria-selected', active);
  });
  renderAll();
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast('Removed from favorites', 'info');
  } else {
    state.favorites.add(id);
    showToast('Added to favorites ♥', 'success');
  }
  Storage.saveFavorites();
  UI.updateFavBtn();
}

function renderAll() {
  Channels.applyFilters();
  UI.renderSidebarList();
  UI.renderGrid();
  UI.updateGridTitle();
}

function loadChannels(channels) {
  state.channels = channels;
  state.filtered = [...channels];
  state.currentCategory = 'all';
  state.searchQuery = '';
  DOM.searchInput.value = '';
  UI.renderCategories();
  renderAll();
  showToast(`✓ Loaded ${channels.length} channels`, 'success');
}

/* ── Sidebar ── */
function openSidebar() {
  DOM.sidebar.classList.remove('collapsed');
  DOM.sidebar.classList.add('mobile-open');
  showBackdrop();
  DOM.menuBtn.setAttribute('aria-expanded', 'true');
  DOM.sidebarToggle.setAttribute('aria-expanded', 'true');
  // Animate hamburger → X
  DOM.hamburgerMenu?.classList.add('is-open');
  DOM.hamburgerSidebar?.classList.add('is-open');
}

function closeSidebar() {
  DOM.sidebar.classList.add('collapsed');
  DOM.sidebar.classList.remove('mobile-open');
  hideBackdrop();
  DOM.menuBtn.setAttribute('aria-expanded', 'false');
  DOM.sidebarToggle.setAttribute('aria-expanded', 'false');
  // Animate X → hamburger
  DOM.hamburgerMenu?.classList.remove('is-open');
  DOM.hamburgerSidebar?.classList.remove('is-open');
}

function toggleSidebar() {
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    DOM.sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
  } else {
    const isCollapsed = DOM.sidebar.classList.toggle('collapsed');
    // Toggle hamburger animation
    if (isCollapsed) {
      DOM.hamburgerMenu?.classList.add('is-open');
      DOM.hamburgerSidebar?.classList.add('is-open');
    } else {
      DOM.hamburgerMenu?.classList.remove('is-open');
      DOM.hamburgerSidebar?.classList.remove('is-open');
    }
    DOM.menuBtn.setAttribute('aria-expanded', !isCollapsed);
  }
}

/* ── Backdrop ── */
let backdropEl = null;
function showBackdrop() {
  if (!backdropEl) {
    backdropEl = createEl('div', { class: 'sidebar-backdrop' });
    backdropEl.addEventListener('click', closeSidebar);
    document.body.appendChild(backdropEl);
  }
  backdropEl.classList.add('visible');
}
function hideBackdrop() { backdropEl?.classList.remove('visible'); }

/* ── Toast ── */
let toastTimer = null;
function showToast(msg, type = 'info') {
  clearTimeout(toastTimer);
  DOM.toast.textContent = msg;
  DOM.toast.className = `toast toast-${type} show`;
  toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), 3000);
}

/* ── Helpers ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function createEl(tag, attrs = {}, html = '') {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (html) el.innerHTML = html;
  return el;
}

function showControls() {
  DOM.playerWrap.classList.add('controls-visible');
  clearTimeout(state.controlsTimer);
  state.controlsTimer = setTimeout(() => {
    if (!DOM.videoPlayer.paused) DOM.playerWrap.classList.remove('controls-visible');
  }, 3000);
}

function navigateChannel(dir) {
  if (state.filtered.length === 0) return;
  const idx  = state.filtered.findIndex(c => c.id === state.currentChannel?.id);
  const next = (idx + dir + state.filtered.length) % state.filtered.length;
  Player.play(state.filtered[next]);
}

function debounce(fn, wait) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
}

/* ══════════════════════════════════════════════════════════
   13. AUTO-LOAD BUILT-IN PLAYLIST
══════════════════════════════════════════════════════════ */
async function autoLoadBuiltinPlaylist() {
  UI.showSkeletons(12);
  try {
    const text = await Parser.fetchFromUrl(BUILTIN_PLAYLIST_URL);
    const channels = Parser.parse(text);
    if (channels.length === 0) throw new Error('No channels found');
    loadChannels(channels);
  } catch (e) {
    console.warn('Auto-load failed:', e.message);
    // Show empty state with manual load option still available
    DOM.channelList.innerHTML = '';
    DOM.emptyState.style.display = '';
    showToast('Auto-load failed — paste a URL manually', 'error');
  }
}

/* ══════════════════════════════════════════════════════════
   14. EVENT BINDINGS
══════════════════════════════════════════════════════════ */
function bindEvents() {

  /* ─ Sidebar toggle ─ */
  DOM.menuBtn.addEventListener('click', toggleSidebar);
  DOM.sidebarToggle.addEventListener('click', toggleSidebar);

  /* ─ Loader tab switch ─ */
  $$('.loader-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.loader-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.querySelector('.tab-url').style.display  = tabName === 'url'  ? 'flex' : 'none';
      document.querySelector('.tab-file').style.display = tabName === 'file' ? 'flex' : 'none';
    });
  });

  /* ─ Load from URL ─ */
  DOM.loadUrlBtn.addEventListener('click', async () => {
    const url = DOM.m3uUrl.value.trim();
    if (!url) { showToast('Please enter a playlist URL', 'error'); return; }

    DOM.loadUrlBtn.textContent = 'Loading…';
    DOM.loadUrlBtn.disabled = true;
    UI.showSkeletons();

    try {
      const text     = await Parser.fetchFromUrl(url);
      const channels = Parser.parse(text);
      if (channels.length === 0) throw new Error('No channels found in playlist');
      loadChannels(channels);
    } catch (e) {
      showToast(`Error: ${e.message}`, 'error');
      DOM.channelList.innerHTML = '';
      DOM.emptyState.style.display = 'flex';
    } finally {
      DOM.loadUrlBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 11h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Load`;
      DOM.loadUrlBtn.disabled = false;
    }
  });

  /* ─ File upload ─ */
  DOM.fileDrop.addEventListener('click', () => DOM.m3uFile.click());
  DOM.fileDrop.addEventListener('keydown', e => { if (e.key === 'Enter') DOM.m3uFile.click(); });

  DOM.m3uFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      UI.showSkeletons();
      const channels = Parser.parse(ev.target.result);
      if (channels.length === 0) { showToast('No channels found in file', 'error'); return; }
      loadChannels(channels);
    };
    reader.readAsText(file);
  });

  DOM.fileDrop.addEventListener('dragover',  e => { e.preventDefault(); DOM.fileDrop.classList.add('drag-over'); });
  DOM.fileDrop.addEventListener('dragleave', () => DOM.fileDrop.classList.remove('drag-over'));
  DOM.fileDrop.addEventListener('drop', e => {
    e.preventDefault();
    DOM.fileDrop.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file?.name.match(/\.m3u8?$/i)) { showToast('Please drop an .m3u or .m3u8 file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => { const channels = Parser.parse(ev.target.result); loadChannels(channels); };
    reader.readAsText(file);
  });

  /* ─ Search ─ */
  DOM.searchInput.addEventListener('input', () => {
    state.searchQuery = DOM.searchInput.value.trim();
    DOM.searchClear.style.display = state.searchQuery ? 'flex' : 'none';
    renderAll();
  });

  DOM.searchClear.addEventListener('click', () => {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    DOM.searchClear.style.display = 'none';
    DOM.searchInput.focus();
    renderAll();
  });

  /* ─ Sort ─ */
  $$('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.sortMode = btn.dataset.sort;
      renderAll();
    });
  });

  /* ─ Video events ─ */
  const video = DOM.videoPlayer;
  video.addEventListener('play',  () => { DOM.playIcon.style.display = 'none';  DOM.pauseIcon.style.display = 'block'; });
  video.addEventListener('pause', () => { DOM.playIcon.style.display = 'block'; DOM.pauseIcon.style.display = 'none'; DOM.playerWrap.classList.add('controls-visible'); });
  video.addEventListener('volumechange', () => { DOM.volumeSlider.value = video.muted ? 0 : video.volume; UI.updateVolIcon(); });

  DOM.playerWrap.addEventListener('mousemove', showControls);
  DOM.playerWrap.addEventListener('touchstart', showControls, { passive: true });
  DOM.playerWrap.addEventListener('click', e => { if (e.target === video || e.target === DOM.playerWrap) Player.togglePlayPause(); });

  DOM.playPauseBtn.addEventListener('click', Player.togglePlayPause.bind(Player));
  DOM.muteBtn.addEventListener('click', Player.toggleMute.bind(Player));
  DOM.volumeSlider.addEventListener('input', e => Player.setVolume(parseFloat(e.target.value)));
  DOM.pipBtn.addEventListener('click', Player.togglePiP.bind(Player));
  DOM.fsBtn.addEventListener('click', Player.toggleFullscreen.bind(Player));
  DOM.fullscreenBtn.addEventListener('click', Player.toggleFullscreen.bind(Player));
  DOM.retryBtn.addEventListener('click', () => Player.retry());

  document.addEventListener('fullscreenchange', () => {
    DOM.fsBtn.title = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  });

  /* ─ Info strip actions ─ */
  DOM.stripFavBtn.addEventListener('click', () => {
    if (!state.currentChannel) return;
    toggleFavorite(state.currentChannel.id);
  });

  DOM.stripShareBtn.addEventListener('click', () => {
    if (!state.currentChannel) return;
    if (navigator.share) {
      navigator.share({ title: state.currentChannel.name, text: `Watch ${state.currentChannel.name} live!` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(state.currentChannel.url)
        .then(() => showToast('Stream URL copied!', 'success'))
        .catch(() => showToast('Could not copy URL', 'error'));
    }
  });

  /* ─ History button ─ */
  DOM.recentBtn.addEventListener('click', () => {
    const isOpen = DOM.recentPanel.style.display !== 'none';
    if (isOpen) {
      DOM.recentPanel.style.display = 'none';
    } else {
      UI.renderRecentPanel();
      DOM.recentPanel.style.display = 'block';
    }
    DOM.recentBtn.classList.toggle('active', !isOpen);
  });

  DOM.recentClose.addEventListener('click', () => {
    DOM.recentPanel.style.display = 'none';
    DOM.recentBtn.classList.remove('active');
  });

  /* ─ Theme toggles ─ */
  DOM.themeToggle?.addEventListener('click', Theme.toggle.bind(Theme));
  DOM.themeToggleTopbar?.addEventListener('click', Theme.toggle.bind(Theme));

  /* ─ Settings panel ─ */
  DOM.settingsClose?.addEventListener('click', () => {
    DOM.settingsPanel.style.display = 'none';
    $$('.mobile-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === 'home'));
  });

  /* ─ View toggle ─ */
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.view-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state.viewMode = btn.dataset.view;
      DOM.channelGrid.classList.toggle('list-view', state.viewMode === 'list');
    });
  });

  /* ─ Mobile bottom nav ─ */
  $$('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const panel = btn.dataset.panel;

      // Close any open panels first
      DOM.recentPanel.style.display   = 'none';
      DOM.settingsPanel.style.display = 'none';

      if (panel === 'channels') {
        openSidebar();
      } else if (panel === 'favorites') {
        state.sortMode = 'fav';
        $$('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort === 'fav'));
        renderAll();
      } else if (panel === 'home') {
        state.sortMode = 'default';
        state.currentCategory = 'all';
        $$('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort === 'default'));
        renderAll();
      } else if (panel === 'settings') {
        DOM.settingsPanel.style.display = 'block';
      }
    });
  });

  /* ─ Keyboard shortcuts ─ */
  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    switch (e.key) {
      case ' ': case 'k': e.preventDefault(); Player.togglePlayPause(); break;
      case 'f': case 'F': Player.toggleFullscreen(); break;
      case 'm': case 'M': Player.toggleMute(); break;
      case 'ArrowLeft':  navigateChannel(-1); break;
      case 'ArrowRight': case 'ArrowDown': navigateChannel(1); break;
      case 'Escape':
        closeSidebar();
        DOM.recentPanel.style.display   = 'none';
        DOM.settingsPanel.style.display = 'none';
        if (document.fullscreenElement) document.exitFullscreen();
        break;
      case '/': e.preventDefault(); DOM.searchInput.focus(); break;
    }
  });

  /* ─ Resize ─ */
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth > 768) {
      DOM.sidebar.classList.remove('mobile-open');
      hideBackdrop();
      DOM.hamburgerMenu?.classList.remove('is-open');
      DOM.hamburgerSidebar?.classList.remove('is-open');
    }
  }, 200));
}

/* ══════════════════════════════════════════════════════════
   15. INIT
══════════════════════════════════════════════════════════ */
function init() {
  // Load persisted state
  Storage.loadFavorites();
  Storage.loadRecent();

  // Apply saved theme
  Theme.apply(Storage.loadTheme());

  // UI initial state
  UI.showIdle();
  bindEvents();

  // Auto-load the built-in playlist
  autoLoadBuiltinPlaylist();

  console.log('%c▶ IPTV Pro — by rifatplex', 'font-weight:700; color:#ff0000; font-size:13px;');
  console.log('Keyboard: Space/K = Play/Pause | F = Fullscreen | M = Mute | ← → = Prev/Next | / = Search | Esc = Close');
}

document.addEventListener('DOMContentLoaded', init);
