/**
 * DFCCIL 3D HTML5 Flipbook Engine - Full-Scale Viewport Edition
 * Powered by StPageFlip & PDF.js
 * Instant First-Page Progressive Rendering with Single Front Cover & 2-3 Paired Spreads
 * DFCCIL IMSD SMUN Unit
 */

const BOOKS = [
  {
    id: 'dfc_rrm_final',
    title: 'DFC Railroad Manual (Final Official)',
    category: 'Core',
    badge: 'Railroad',
    url: '/manuals/DFC_RAILROAD_MANUAL_Final.pdf'
  },
  {
    id: 'dfc_track_manual_2025',
    title: 'DFC Track Manual 2025 (Final)',
    category: 'Track',
    badge: 'Track 2025',
    url: '/manuals/DFC_Track_manual_2025_Final.pdf'
  },
  {
    id: 'lt_wdfc_manual',
    title: 'L&T Track Manual Applicable for WDFC',
    category: 'Track',
    badge: 'L&T WDFC',
    url: '/manuals/LT_Track_Manual_Applicable_for_WDFC.pdf'
  },
  {
    id: 'edfcc_installation_manual',
    title: 'Installation Manual EDFCC APL-01 (R03)',
    category: 'Installation',
    badge: 'EDFCC APL-01',
    url: '/manuals/Installation_Manual_EDFCC_APL_01.pdf'
  }
];

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

class FlipBookApp {
  constructor() {
    this.currentBook = BOOKS[0];
    this.pdfDoc = null;
    this.pageFlip = null;
    this.totalPages = 0;
    this.currentPage = 1;
    this.renderedPages = new Set();
    this.renderingPages = new Set();
    this.soundEnabled = true;
    this.zoomLevel = 1;
    this.thumbnailsOpen = false;
    this.searchOpen = false;

    this.initElements();
    this.initBookSelector();
    this.bindEvents();

    // Check URL query param for initial book
    const urlParams = new URLSearchParams(window.location.search);
    const bookParam = urlParams.get('book');
    const initialBook = BOOKS.find(b => b.id === bookParam) || BOOKS[0];
    this.loadBook(initialBook);
  }

  initElements() {
    this.bookContainer = document.getElementById('book');
    this.bookWrapper = document.getElementById('bookWrapper');
    this.stage = document.getElementById('stage');
    this.bookSelect = document.getElementById('bookSelect');
    this.manualChips = document.querySelectorAll('.manual-chip');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.loadingText = document.getElementById('loadingText');
    this.loadingBar = document.getElementById('loadingBar');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.pageInput = document.getElementById('pageInput');
    this.pageSlider = document.getElementById('pageSlider');
    this.thumbnailsDrawer = document.getElementById('thumbnailsDrawer');
    this.searchModal = document.getElementById('searchModal');
    this.searchInput = document.getElementById('searchInput');
    this.searchResults = document.getElementById('searchResults');
  }

  initBookSelector() {
    if (!this.bookSelect) return;
    this.bookSelect.innerHTML = '';
    const groups = {};
    BOOKS.forEach(b => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });

    for (const [category, items] of Object.entries(groups)) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = `${category} Manuals`;
      items.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.title;
        if (b.id === this.currentBook.id) opt.selected = true;
        optgroup.appendChild(opt);
      });
      this.bookSelect.appendChild(optgroup);
    }
  }

  calculateDimensions() {
    const isMobile = window.innerWidth < 820;
    const headerH = document.querySelector('.flipbook-header')?.offsetHeight || 56;
    const toolbarH = document.querySelector('.flipbook-toolbar')?.offsetHeight || 52;
    const availableH = window.innerHeight - headerH - toolbarH - 24;
    const availableW = window.innerWidth - (isMobile ? 24 : 100);

    const aspect = 0.707; // A4 aspect ratio (width / height)
    let pageH = Math.max(450, Math.floor(availableH));
    let pageW = Math.round(pageH * aspect);

    if (!isMobile) {
      if ((pageW * 2) > availableW) {
        pageW = Math.floor(availableW / 2);
        pageH = Math.round(pageW / aspect);
      }
    } else {
      if (pageW > availableW) {
        pageW = availableW;
        pageH = Math.round(pageW / aspect);
      }
    }

    return { width: pageW, height: pageH, isMobile };
  }

  bindEvents() {
    this.bookSelect?.addEventListener('change', (e) => {
      const book = BOOKS.find(b => b.id === e.target.value);
      if (book) this.loadBook(book);
    });

    this.manualChips?.forEach(chip => {
      chip.addEventListener('click', () => {
        const bookId = chip.dataset.book;
        const book = BOOKS.find(b => b.id === bookId);
        if (book) this.loadBook(book);
      });
    });

    this.prevBtn?.addEventListener('click', () => this.pageFlip?.flipPrev());
    this.nextBtn?.addEventListener('click', () => this.pageFlip?.flipNext());

    document.getElementById('prevBtnBottom')?.addEventListener('click', () => this.pageFlip?.flipPrev());
    document.getElementById('nextBtnBottom')?.addEventListener('click', () => this.pageFlip?.flipNext());

    this.pageInput?.addEventListener('change', (e) => {
      let page = parseInt(e.target.value, 10);
      if (isNaN(page)) return;
      page = Math.max(1, Math.min(this.totalPages, page));
      this.pageFlip?.flip(page - 1);
    });

    this.pageSlider?.addEventListener('input', (e) => {
      const page = parseInt(e.target.value, 10);
      this.pageFlip?.flip(page - 1);
    });

    // Sound toggle
    document.getElementById('soundBtn')?.addEventListener('click', (e) => {
      this.soundEnabled = !this.soundEnabled;
      const btn = e.currentTarget;
      btn?.classList.toggle('active', this.soundEnabled);
      if (btn) btn.title = this.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
    });

    // Zoom controls
    document.getElementById('zoomInBtn')?.addEventListener('click', () => this.setZoom(this.zoomLevel + 0.15));
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => this.setZoom(this.zoomLevel - 0.15));
    document.getElementById('zoomResetBtn')?.addEventListener('click', () => this.setZoom(1));

    // Fullscreen
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());

    // Thumbnails toggle
    document.getElementById('thumbBtn')?.addEventListener('click', () => {
      this.thumbnailsOpen = !this.thumbnailsOpen;
      this.thumbnailsDrawer?.classList.toggle('open', this.thumbnailsOpen);
      if (this.thumbnailsOpen) this.renderThumbnails();
    });

    // Search toggle
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      this.searchOpen = !this.searchOpen;
      this.searchModal?.classList.toggle('open', this.searchOpen);
      if (this.searchOpen) this.searchInput?.focus();
    });

    document.getElementById('searchCloseBtn')?.addEventListener('click', () => {
      this.searchOpen = false;
      this.searchModal?.classList.remove('open');
    });

    this.searchInput?.addEventListener('input', (e) => this.debounceSearch(e.target.value));

    // ACS Slips Modal toggle
    const acsModal = document.getElementById('acsDownloadModal');
    document.getElementById('acsModalBtn')?.addEventListener('click', () => {
      acsModal?.classList.toggle('open');
    });

    document.getElementById('acsModalCloseBtn')?.addEventListener('click', () => {
      acsModal?.classList.remove('open');
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.pageFlip?.flipPrev();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        this.pageFlip?.flipNext();
      } else if (e.key === 'f' || e.key === 'F') {
        this.toggleFullscreen();
      } else if (e.key === 'Escape') {
        this.thumbnailsDrawer?.classList.remove('open');
        this.searchModal?.classList.remove('open');
        acsModal?.classList.remove('open');
        this.thumbnailsOpen = false;
        this.searchOpen = false;
      }
    });

    // Re-adapt on window resize / fullscreen
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.pdfDoc) {
          const currentPageNum = this.currentPage || 1;
          this.rebuildFlipbook(currentPageNum);
        }
      }, 200);
    });

    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
      document.addEventListener(evt, () => {
        setTimeout(() => {
          if (this.pdfDoc) {
            const currentPageNum = this.currentPage || 1;
            this.rebuildFlipbook(currentPageNum);
          }
        }, 150);
      });
    });
  }

  updateManualChips() {
    this.manualChips?.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.book === this.currentBook.id);
    });
    if (this.bookSelect) this.bookSelect.value = this.currentBook.id;
  }

  showLoading(text = 'Loading Document...', progress = 0) {
    if (!this.loadingOverlay) return;
    this.loadingOverlay.style.display = 'flex';
    this.loadingOverlay.style.opacity = '1';
    if (this.loadingText) this.loadingText.textContent = text;
    if (this.loadingBar) this.loadingBar.style.width = `${progress}%`;
  }

  hideLoading() {
    if (!this.loadingOverlay) return;
    this.loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      if (this.loadingOverlay) this.loadingOverlay.style.display = 'none';
    }, 200);
  }

  async loadBook(book) {
    this.currentBook = book;
    this.updateManualChips();
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) headerTitle.textContent = book.title;

    this.showLoading(`Loading ${book.title}...`, 25);

    try {
      if (this.pageFlip) {
        try {
          this.pageFlip.destroy();
        } catch (e) {}
        this.pageFlip = null;
      }

      if (this.bookWrapper) {
        this.bookWrapper.innerHTML = '<div id="book" class="st-page-flip"></div>';
        this.bookContainer = document.getElementById('book');
      }

      this.renderedPages.clear();
      this.renderingPages.clear();

      const loadingTask = window.pdfjsLib.getDocument({
        url: book.url,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        disableAutoFetch: false,
        disableStream: false
      });

      loadingTask.onProgress = (progress) => {
        if (progress.total > 0) {
          const percent = Math.min(80, Math.round((progress.loaded / progress.total) * 80));
          this.showLoading(`Loading Pages (${percent}%)...`, percent);
        }
      };

      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;

      if (this.pageSlider) {
        this.pageSlider.max = this.totalPages;
        this.pageSlider.value = 1;
      }
      if (this.pageInput) {
        this.pageInput.max = this.totalPages;
        this.pageInput.value = 1;
      }
      this.updatePageCounter(1);

      this.showLoading('Rendering Initial Pages...', 90);

      this.rebuildFlipbook(1);

      // Render front pages immediately so reading begins instantly
      await Promise.all([
        this.renderPage(1),
        this.renderPage(2),
        this.renderPage(3),
        this.renderPage(4)
      ]);

      this.hideLoading();

    } catch (err) {
      console.error('Error loading PDF manual:', err);
      this.showLoading(`Error loading manual: ${err.message}`, 100);
    }
  }

  rebuildFlipbook(initialPage = 1) {
    if (this.pageFlip) {
      try {
        this.pageFlip.destroy();
      } catch (e) {}
      this.pageFlip = null;
    }

    if (this.bookWrapper) {
      this.bookWrapper.innerHTML = '<div id="book" class="st-page-flip"></div>';
      this.bookContainer = document.getElementById('book');
    }

    if (!this.bookContainer) return;

    const dims = this.calculateDimensions();

    const containerWidth = dims.isMobile ? dims.width : (dims.width * 2);
    this.bookWrapper.style.width = `${containerWidth}px`;
    this.bookWrapper.style.height = `${dims.height}px`;
    this.bookContainer.style.width = `${containerWidth}px`;
    this.bookContainer.style.height = `${dims.height}px`;

    // Create page DOM nodes
    // Page 1 is Single Front Cover (hard density), then Pages 2-3, 4-5 are paired spreads!
    for (let i = 1; i <= this.totalPages; i++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.dataset.pageNumber = i;
      
      if (i === 1 || i === this.totalPages) {
        pageDiv.setAttribute('data-density', 'hard');
      } else {
        pageDiv.setAttribute('data-density', 'soft');
      }

      pageDiv.style.width = `${dims.width}px`;
      pageDiv.style.height = `${dims.height}px`;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'page-content';

      const canvas = document.createElement('canvas');
      canvas.className = 'page-canvas';
      canvas.id = `canvas-page-${i}`;
      canvas.width = dims.width * 2;
      canvas.height = dims.height * 2;

      // Draw clean initial placeholder
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const footer = document.createElement('div');
      footer.className = 'page-number-footer';
      footer.textContent = `- ${i} -`;

      contentDiv.appendChild(canvas);
      contentDiv.appendChild(footer);
      pageDiv.appendChild(contentDiv);
      this.bookContainer.appendChild(pageDiv);
    }

    const pageElements = this.bookContainer.querySelectorAll('.page');
    if (pageElements.length === 0) return;

    // showCover: true ensures Page 1 is Single Cover, then Page 2 & 3 open as side-by-side facing spread!
    this.pageFlip = new St.PageFlip(this.bookContainer, {
      width: dims.width,
      height: dims.height,
      size: 'stretch',
      minWidth: 260,
      maxWidth: 2400,
      minHeight: 380,
      maxHeight: 2800,
      maxShadowOpacity: 0.55,
      showCover: true,
      mobileScrollSupport: true,
      useMouseEvents: true,
      usePortrait: dims.isMobile,
      startPage: initialPage > 0 ? initialPage - 1 : 0
    });

    this.pageFlip.loadFromHTML(pageElements);

    if (initialPage > 1) {
      this.pageFlip.flip(initialPage - 1);
    }

    this.pageFlip.on('flip', (e) => {
      const targetPage = e.data + 1;
      this.currentPage = targetPage;
      this.updatePageCounter(targetPage);
      this.playPageSound();
      this.renderSurroundingPages(targetPage);
    });

    this.pageFlip.on('changeState', (e) => {
      if (e.data === 'flipping') {
        this.playPageSound();
      }
    });

    this.renderSurroundingPages(initialPage);
  }

  async renderPage(pageNum) {
    if (
      pageNum < 1 ||
      pageNum > this.totalPages ||
      this.renderedPages.has(pageNum) ||
      this.renderingPages.has(pageNum) ||
      !this.pdfDoc
    ) {
      return;
    }

    try {
      this.renderingPages.add(pageNum);
      const page = await this.pdfDoc.getPage(pageNum);
      const canvas = document.getElementById(`canvas-page-${pageNum}`);
      if (!canvas) {
        this.renderingPages.delete(pageNum);
        return;
      }

      const viewport = page.getViewport({ scale: 2.0 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const ctx = canvas.getContext('2d');
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      this.renderedPages.add(pageNum);
      this.renderingPages.delete(pageNum);
    } catch (err) {
      console.warn(`Failed to render page ${pageNum}:`, err);
      this.renderingPages.delete(pageNum);
    }
  }

  renderSurroundingPages(centerPage) {
    const pagesToRender = [
      centerPage,
      centerPage + 1,
      centerPage - 1,
      centerPage + 2,
      centerPage + 3,
      centerPage - 2,
      centerPage + 4,
      centerPage + 5
    ];

    pagesToRender.forEach(p => {
      if (p >= 1 && p <= this.totalPages) {
        this.renderPage(p);
      }
    });
  }

  updatePageCounter(pageNum) {
    this.currentPage = pageNum;
    if (this.pageInput) this.pageInput.value = pageNum;
    if (this.pageSlider) this.pageSlider.value = pageNum;
    
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
      if (pageNum === 1) {
        pageInfo.textContent = `Front Cover (Page 1 of ${this.totalPages})`;
      } else if (pageNum >= this.totalPages) {
        pageInfo.textContent = `Back Cover (Page ${this.totalPages} of ${this.totalPages})`;
      } else {
        const isOdd = pageNum % 2 !== 0;
        const leftP = isOdd ? pageNum - 1 : pageNum;
        const rightP = Math.min(this.totalPages, leftP + 1);
        pageInfo.textContent = `Pages ${leftP}-${rightP} of ${this.totalPages}`;
      }
    }
    
    const curEl = document.getElementById('currentPageText');
    if (curEl) curEl.textContent = pageNum;
    const totEl = document.getElementById('totalPagesText');
    if (totEl) totEl.textContent = this.totalPages;
  }

  playPageSound() {
    if (!this.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      noise.connect(filter);
      filter.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }

  setZoom(level) {
    this.zoomLevel = Math.max(0.7, Math.min(2.2, level));
    if (this.bookWrapper) {
      this.bookWrapper.style.transform = `scale(${this.zoomLevel})`;
    }
    const zoomText = document.getElementById('zoomLevelText');
    if (zoomText) {
      zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
  }

  toggleFullscreen() {
    try {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
      if (!isFs) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
    }
  }

  async renderThumbnails() {
    if (!this.thumbnailsDrawer || this.thumbnailsDrawer.children.length > 0) return;

    for (let i = 1; i <= Math.min(this.totalPages, 60); i++) {
      const item = document.createElement('div');
      item.className = 'thumb-item';
      item.dataset.page = i;

      const canvas = document.createElement('canvas');
      const label = document.createElement('div');
      label.className = 'thumb-label';
      label.textContent = `Page ${i}`;

      item.appendChild(canvas);
      item.appendChild(label);
      this.thumbnailsDrawer.appendChild(item);

      item.addEventListener('click', () => {
        this.pageFlip?.flip(i - 1);
        this.thumbnailsDrawer?.classList.remove('open');
        this.thumbnailsOpen = false;
      });

      this.pdfDoc.getPage(i).then(page => {
        const viewport = page.getViewport({ scale: 0.25 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        page.render({
          canvasContext: canvas.getContext('2d'),
          viewport: viewport
        });
      });
    }
  }

  debounceSearch(query) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.performSearch(query), 300);
  }

  async performSearch(query) {
    if (!this.searchResults) return;

    if (!query || query.trim().length < 2) {
      this.searchResults.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:10px;">Type at least 2 characters to search...</div>';
      return;
    }

    const q = query.toLowerCase().trim();
    this.searchResults.innerHTML = '<div style="color:#d4af37; font-size:12px; text-align:center; padding:10px;">Searching in manual...</div>';

    const matches = [];
    const maxSearchPages = Math.min(this.totalPages, 150);

    for (let i = 1; i <= maxSearchPages; i++) {
      try {
        const page = await this.pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const fullText = textContent.items.map(item => item.str).join(' ');

        if (fullText.toLowerCase().includes(q)) {
          const idx = fullText.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 40);
          const end = Math.min(fullText.length, idx + q.length + 40);
          const snippet = fullText.substring(start, end);

          matches.push({
            page: i,
            snippet: snippet.replace(new RegExp(q, 'gi'), match => `<mark style="background:#f59e0b; color:#000; border-radius:2px; padding:0 2px;">${match}</mark>`)
          });
        }
      } catch (err) {}
    }

    if (matches.length === 0) {
      this.searchResults.innerHTML = `<div style="color:#ef4444; font-size:12px; text-align:center; padding:10px;">No matches found for "${query}".</div>`;
      return;
    }

    this.searchResults.innerHTML = '';
    matches.forEach(m => {
      const card = document.createElement('div');
      card.className = 'search-result-item';
      card.innerHTML = `
        <div class="search-result-page">Page ${m.page}</div>
        <div class="search-result-text">...${m.snippet}...</div>
      `;
      card.addEventListener('click', () => {
        this.pageFlip?.flip(m.page - 1);
        this.searchModal?.classList.remove('open');
        this.searchOpen = false;
      });
      this.searchResults.appendChild(card);
    });
  }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.flipBookApp = new FlipBookApp();
});
