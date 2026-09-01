/**
 * DFCCIL 3D HTML5 Flipbook Engine - Full-Scale Viewport Edition
 * Powered by StPageFlip & PDF.js
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
    id: 'vossloh_manual',
    title: 'Vossloh Turnout Maintenance Manual',
    category: 'Turnout',
    badge: 'Vossloh',
    url: '/manuals/Vossloh_TO_Maintenance_Manual.pdf'
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
  },
  {
    id: 'mm_steel_reconditioning',
    title: 'Manual for Reconditioning MM Steel Points & Crossings',
    category: 'Maintenance',
    badge: 'P&C Reconditioning',
    url: '/manuals/Manual_for_Reconditioning_of_MM_Steel_Points_and_Crossings.pdf'
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
    this.currentPage = 0;
    this.renderedPages = new Map();
    this.soundEnabled = true;
    this.zoomLevel = 1;
    this.thumbnailsOpen = false;
    this.searchOpen = false;

    this.initElements();
    this.initBookSelector();
    this.bindEvents();

    const urlParams = new URLSearchParams(window.location.search);
    const bookParam = urlParams.get('book');
    if (bookParam) {
      const found = BOOKS.find(b => b.id === bookParam);
      if (found) this.currentBook = found;
    }

    this.loadBook(this.currentBook);
  }

  initElements() {
    this.bookSelect = document.getElementById('bookSelect');
    this.manualChips = document.querySelectorAll('.manual-chip');
    this.bookContainer = document.getElementById('book');
    this.bookWrapper = document.getElementById('bookWrapper');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.loadingText = document.getElementById('loadingText');
    this.loadingBar = document.getElementById('loadingBar');
    this.pageInfo = document.getElementById('pageInfo');
    this.pageInput = document.getElementById('pageInput');
    this.pageSlider = document.getElementById('pageSlider');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.thumbnailsDrawer = document.getElementById('thumbnailsDrawer');
    this.searchModal = document.getElementById('searchModal');
    this.searchInput = document.getElementById('searchInput');
    this.searchResults = document.getElementById('searchResults');
  }

  initBookSelector() {
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
    const availableW = window.innerWidth - (isMobile ? 24 : 120);

    // High readability aspect ratio (~0.707 standard A4)
    const aspect = 0.707;
    let pageH = Math.max(450, Math.floor(availableH));
    let pageW = Math.round(pageH * aspect);

    if (!isMobile) {
      // For two-page desktop spread
      if ((pageW * 2) > availableW) {
        pageW = Math.floor(availableW / 2);
        pageH = Math.round(pageW / aspect);
      }
    } else {
      // Single page portrait on mobile
      if (pageW > availableW) {
        pageW = availableW;
        pageH = Math.round(pageW / aspect);
      }
    }

    return { width: pageW, height: pageH, isMobile };
  }

  bindEvents() {
    this.bookSelect.addEventListener('change', (e) => {
      const book = BOOKS.find(b => b.id === e.target.value);
      if (book) this.loadBook(book);
    });

    this.manualChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const bookId = chip.dataset.book;
        const book = BOOKS.find(b => b.id === bookId);
        if (book) this.loadBook(book);
      });
    });

    this.prevBtn.addEventListener('click', () => this.pageFlip?.flipPrev());
    this.nextBtn.addEventListener('click', () => this.pageFlip?.flipNext());

    document.getElementById('prevBtnBottom')?.addEventListener('click', () => this.pageFlip?.flipPrev());
    document.getElementById('nextBtnBottom')?.addEventListener('click', () => this.pageFlip?.flipNext());

    this.pageInput.addEventListener('change', (e) => {
      let page = parseInt(e.target.value, 10);
      if (isNaN(page)) return;
      page = Math.max(1, Math.min(this.totalPages, page));
      this.pageFlip?.flip(page - 1);
    });

    this.pageSlider.addEventListener('input', (e) => {
      const page = parseInt(e.target.value, 10);
      this.pageFlip?.flip(page - 1);
    });

    // Sound toggle
    document.getElementById('soundBtn')?.addEventListener('click', (e) => {
      this.soundEnabled = !this.soundEnabled;
      const btn = e.currentTarget;
      btn.classList.toggle('active', this.soundEnabled);
      btn.title = this.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
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
      this.thumbnailsDrawer.classList.toggle('open', this.thumbnailsOpen);
      if (this.thumbnailsOpen) this.renderThumbnails();
    });

    // Search toggle
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      this.searchOpen = !this.searchOpen;
      this.searchModal.classList.toggle('open', this.searchOpen);
      if (this.searchOpen) this.searchInput.focus();
    });

    document.getElementById('searchCloseBtn')?.addEventListener('click', () => {
      this.searchOpen = false;
      this.searchModal.classList.remove('open');
    });

    this.searchInput?.addEventListener('input', (e) => this.debounceSearch(e.target.value));

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
        this.thumbnailsDrawer.classList.remove('open');
        this.searchModal.classList.remove('open');
        this.thumbnailsOpen = false;
        this.searchOpen = false;
      }
    });

    // Re-adapt on window resize / fullscreen
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.pageFlip && this.pdfDoc) {
          const currentPageNum = this.currentPage || 1;
          this.rebuildFlipbook(currentPageNum);
        }
      }, 250);
    });

    document.addEventListener('fullscreenchange', () => {
      setTimeout(() => {
        if (this.pageFlip && this.pdfDoc) {
          const currentPageNum = this.currentPage || 1;
          this.rebuildFlipbook(currentPageNum);
        }
      }, 150);
    });
  }

  updateManualChips() {
    this.manualChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.book === this.currentBook.id);
    });
    this.bookSelect.value = this.currentBook.id;
  }

  showLoading(text = 'Loading Document...', progress = 0) {
    this.loadingOverlay.style.display = 'flex';
    this.loadingOverlay.style.opacity = '1';
    this.loadingText.textContent = text;
    this.loadingBar.style.width = `${progress}%`;
  }

  hideLoading() {
    this.loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      this.loadingOverlay.style.display = 'none';
    }, 300);
  }

  async loadBook(book) {
    this.currentBook = book;
    this.updateManualChips();
    document.getElementById('headerTitle').textContent = book.title;

    this.showLoading(`Loading ${book.title}...`, 15);

    try {
      if (this.pageFlip) {
        this.pageFlip.destroy();
        this.pageFlip = null;
      }

      this.bookContainer.innerHTML = '';
      this.renderedPages.clear();

      const loadingTask = window.pdfjsLib.getDocument({
        url: book.url,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      });

      loadingTask.onProgress = (progress) => {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 60);
          this.showLoading(`Downloading Manual (${percent}%)...`, percent);
        }
      };

      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;

      this.pageSlider.max = this.totalPages;
      this.pageSlider.value = 1;
      this.pageInput.max = this.totalPages;
      this.pageInput.value = 1;
      this.updatePageCounter(1);

      this.showLoading('Setting up High-Res 3D Viewport...', 80);

      this.rebuildFlipbook(1);

      this.showLoading('Ready!', 100);
      setTimeout(() => this.hideLoading(), 250);

    } catch (err) {
      console.error('Error loading PDF manual:', err);
      this.showLoading(`Error loading manual: ${err.message}`, 100);
    }
  }

  rebuildFlipbook(initialPage = 1) {
    if (this.pageFlip) {
      this.pageFlip.destroy();
      this.pageFlip = null;
    }

    this.bookContainer.innerHTML = '';
    this.renderedPages.clear();

    const dims = this.calculateDimensions();

    // Create page DOM nodes with explicit aspect ratio sizing
    for (let i = 1; i <= this.totalPages; i++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.dataset.pageNumber = i;
      pageDiv.style.width = `${dims.width}px`;
      pageDiv.style.height = `${dims.height}px`;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'page-content';

      const canvas = document.createElement('canvas');
      canvas.className = 'page-canvas';
      canvas.id = `canvas-page-${i}`;

      const footer = document.createElement('div');
      footer.className = 'page-number-footer';
      footer.textContent = `- ${i} -`;

      contentDiv.appendChild(canvas);
      contentDiv.appendChild(footer);
      pageDiv.appendChild(contentDiv);
      this.bookContainer.appendChild(pageDiv);
    }

    this.pageFlip = new St.PageFlip(this.bookContainer, {
      width: dims.width,
      height: dims.height,
      size: 'fixed',
      minWidth: 280,
      maxWidth: 1800,
      minHeight: 400,
      maxHeight: 2400,
      maxShadowOpacity: 0.65,
      showCover: true,
      mobileScrollSupport: false,
      useMouseEvents: true,
      usePortrait: dims.isMobile,
      autoSize: false
    });

    this.pageFlip.loadFromHTML(document.querySelectorAll('.page'));

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
    if (pageNum < 1 || pageNum > this.totalPages || this.renderedPages.has(pageNum)) {
      return;
    }

    try {
      this.renderedPages.set(pageNum, true);
      const page = await this.pdfDoc.getPage(pageNum);
      const canvas = document.getElementById(`canvas-page-${pageNum}`);
      if (!canvas) return;

      // 2.5x retina scaling for razor-sharp engineering text & diagrams
      const viewport = page.getViewport({ scale: 2.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.warn(`Failed to render page ${pageNum}:`, err);
      this.renderedPages.delete(pageNum);
    }
  }

  async renderSurroundingPages(currentPage) {
    const pagesToRender = [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
      currentPage + 3
    ].filter(p => p >= 1 && p <= this.totalPages);

    for (const p of pagesToRender) {
      this.renderPage(p);
    }
  }

  updatePageCounter(page) {
    this.pageInfo.textContent = `Page ${page} of ${this.totalPages}`;
    this.pageInput.value = page;
    this.pageSlider.value = page;
    this.prevBtn.disabled = page <= 1;
    this.nextBtn.disabled = page >= this.totalPages;
  }

  playPageSound() {
    if (!this.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const bufferSize = ctx.sampleRate * 0.09;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.22));
        data[i] = (Math.random() * 2 - 1) * decay * 0.35;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      noise.connect(filter);
      filter.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }

  setZoom(level) {
    this.zoomLevel = Math.max(0.7, Math.min(2.2, level));
    this.bookWrapper.style.transform = `scale(${this.zoomLevel})`;
    document.getElementById('zoomLevelText').textContent = `${Math.round(this.zoomLevel * 100)}%`;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  async renderThumbnails() {
    if (this.thumbnailsDrawer.children.length > 0) return;

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
        this.thumbnailsDrawer.classList.remove('open');
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
        const text = textContent.items.map(item => item.str).join(' ');

        const index = text.toLowerCase().indexOf(q);
        if (index !== -1) {
          const snippetStart = Math.max(0, index - 30);
          const snippetEnd = Math.min(text.length, index + q.length + 40);
          const snippet = text.substring(snippetStart, snippetEnd);

          matches.push({ page: i, snippet: snippet });
          if (matches.length >= 25) break;
        }
      } catch (e) {}
    }

    if (matches.length === 0) {
      this.searchResults.innerHTML = '<div style="color:#ef4444; font-size:12px; text-align:center; padding:10px;">No occurrences found.</div>';
      return;
    }

    this.searchResults.innerHTML = '';
    matches.forEach(m => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `<span class="search-page-badge">Page ${m.page}:</span> ...${m.snippet}...`;
      item.addEventListener('click', () => {
        this.pageFlip?.flip(m.page - 1);
        this.searchModal.classList.remove('open');
        this.searchOpen = false;
      });
      this.searchResults.appendChild(item);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.flipbookApp = new FlipBookApp();
});
