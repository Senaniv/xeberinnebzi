// Günün Nəbzi - Frontend App Logic

// State management
const state = {
  categories: [],
  settings: {},
  activeCategory: null,
  page: 1,
  hasMore: true,
  searchQuery: ''
};

// Azerbaijani Months & Days
const azMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const azDays = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLiveClockAndDate();
  loadSettings();
  loadCategories();
  loadBreakingNews();
  loadHeroManshet();
  loadLatestNews(true);
  loadMostRead();
  loadPoll();
  loadAnalyticsSection();
  setupEventListeners();
  setupCurrencyCalculator();
});

// Theme Management
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
}

// Live Clock and Azerbaijani Date
function initLiveClockAndDate() {
  const dateEl = document.getElementById('current-az-date');
  const clockEl = document.getElementById('current-clock');
  
  function update() {
    const now = new Date();
    const dayName = azDays[now.getDay()];
    const day = now.getDate();
    const monthName = azMonths[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (dateEl) {
      dateEl.textContent = `${day} ${monthName} ${year}, ${dayName}`;
    }
    if (clockEl) {
      clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
  }

  update();
  setInterval(update, 1000);
}

// Helper to format ISO date to Azerbaijani relative/absolute time
function formatAzTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

  if (diffMins < 1) return 'İndicə';
  if (diffMins < 60) return `${diffMins} dəqiqə əvvəl`;
  if (diffHours < 24) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `Bu gün, ${h}:${m}`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = azMonths[date.getMonth()];
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month}, ${h}:${m}`;
}

// Load Settings (Exchange rates, weather, contacts)
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const { success, data } = await res.json();
    if (success && data) {
      state.settings = data;
      
      // Update Rates Ticker
      const usdEl = document.getElementById('rate-usd');
      const eurEl = document.getElementById('rate-eur');
      const rubEl = document.getElementById('rate-rub');
      const brentEl = document.getElementById('rate-brent');
      const weatherEl = document.getElementById('weather-temp');
      const weatherDescEl = document.getElementById('weather-desc');

      if (usdEl) usdEl.textContent = data.usd_rate || '1.7000';
      if (eurEl) eurEl.textContent = data.eur_rate || '1.8480';
      if (rubEl) rubEl.textContent = data.rub_rate || '0.0182';
      if (brentEl) brentEl.textContent = `$${data.brent_rate || '84.40'}`;
      if (weatherEl) weatherEl.textContent = data.weather_baku || '21°C';
      if (weatherDescEl) weatherDescEl.textContent = data.weather_desc || 'Bakı, Günəşli';
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

// Load Categories & Render Menus
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const { success, data } = await res.json();
    if (success && data) {
      state.categories = data;
      renderNavCategories(data);
      renderMobileCategories(data);
    }
  } catch (err) {
    console.error('Categories load error:', err);
  }
}

function renderNavCategories(categories) {
  const container = document.getElementById('nav-categories-list');
  if (!container) return;

  let html = `
    <li>
      <a href="javascript:void(0)" onclick="filterByCategory(null)" 
         class="cat-nav-link px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 transition-colors border-b-2 ${!state.activeCategory ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent'}">
        Baş Səhifə
      </a>
    </li>
  `;

  categories.forEach(cat => {
    const isActive = state.activeCategory === cat.slug;
    html += `
      <li>
        <a href="javascript:void(0)" onclick="filterByCategory('${cat.slug}')" 
           class="cat-nav-link whitespace-nowrap px-3 py-2 text-sm font-semibold transition-colors border-b-2 ${isActive ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'}">
          ${cat.name}
        </a>
      </li>
    `;
  });

  container.innerHTML = html;
}

function renderMobileCategories(categories) {
  const container = document.getElementById('mobile-categories-list');
  if (!container) return;

  let html = `
    <li>
      <button onclick="filterByCategory(null); toggleMobileMenu();" class="w-full text-left py-2.5 px-4 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">
        Baş Səhifə
      </button>
    </li>
  `;

  categories.forEach(cat => {
    html += `
      <li>
        <button onclick="filterByCategory('${cat.slug}'); toggleMobileMenu();" class="w-full text-left py-2.5 px-4 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>${cat.name}</span>
          <span class="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">${cat.article_count || 0}</span>
        </button>
      </li>
    `;
  });

  container.innerHTML = html;
}

// Load Breaking News Ticker (Oxu.az style)
async function loadBreakingNews() {
  try {
    const res = await fetch('/api/breaking');
    const { success, data } = await res.json();
    const track = document.getElementById('ticker-content');
    if (!track) return;

    if (success && data && data.length > 0) {
      let itemsHtml = '';
      data.forEach(item => {
        const link = item.url || (item.article_id ? `/article.html?id=${item.article_id}` : '#');
        itemsHtml += `
          <a href="${link}" class="inline-flex items-center text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mx-6">
            <span class="w-2 h-2 rounded-full bg-rose-500 mr-2.5 inline-block animate-ping"></span>
            ${item.title}
          </a>
        `;
      });

      // Repeat items to ensure seamless infinite loop
      track.innerHTML = itemsHtml + itemsHtml;
    } else {
      document.getElementById('breaking-news-bar')?.classList.add('hidden');
    }
  } catch (err) {
    console.error('Breaking news error:', err);
  }
}

// Load Hero Manşet Section (Oxu.az 1 dominant + 4 sub-hero cards)
async function loadHeroManshet() {
  try {
    const res = await fetch('/api/news?limit=5');
    const { success, data } = await res.json();
    if (!success || !data || data.length === 0) return;

    // First article as Big Hero
    const mainHero = data[0];
    const subHeroes = data.slice(1, 5);

    const mainContainer = document.getElementById('main-hero-card');
    if (mainContainer && mainHero) {
      mainContainer.innerHTML = `
        <a href="/article.html?id=${mainHero.id}" class="group relative block w-full h-[420px] md:h-[480px] rounded-2xl overflow-hidden shadow-lg zoom-card">
          <img src="${mainHero.image_url}" alt="${mainHero.title}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700">
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          
          <div class="absolute top-4 left-4 z-10 flex gap-2">
            <span class="category-pill bg-rose-600 text-white font-bold tracking-wider shadow">
              ${mainHero.category_name || 'Gündəm'}
            </span>
            ${mainHero.is_breaking ? '<span class="category-pill bg-amber-500 text-black font-bold animate-pulse">TƏCİLİ</span>' : ''}
          </div>

          <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10 text-white">
            <div class="flex items-center gap-3 text-xs text-slate-300 mb-2">
              <span><i class="far fa-clock mr-1"></i>${formatAzTime(mainHero.created_at)}</span>
              <span>•</span>
              <span><i class="far fa-eye mr-1"></i>${mainHero.views.toLocaleString()} baxış</span>
              <span>•</span>
              <span><i class="far fa-user mr-1"></i>${mainHero.author}</span>
            </div>
            <h2 class="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight mb-3 group-hover:text-rose-400 transition-colors">
              ${mainHero.title}
            </h2>
            <p class="text-sm md:text-base text-slate-200 line-clamp-2 md:line-clamp-3 mb-4 font-normal">
              ${mainHero.summary || ''}
            </p>
            <div class="inline-flex items-center text-xs font-bold uppercase tracking-wider text-rose-400 group-hover:translate-x-1 transition-transform">
              Ətraflı oxu <i class="fas fa-arrow-right ml-2"></i>
            </div>
          </div>
        </a>
      `;
    }

    // 4 Sub Heroes in 2x2 grid
    const subContainer = document.getElementById('sub-heroes-grid');
    if (subContainer) {
      let subHtml = '';
      subHeroes.forEach(art => {
        subHtml += `
          <a href="/article.html?id=${art.id}" class="group relative block h-[200px] md:h-[230px] rounded-xl overflow-hidden shadow zoom-card">
            <img src="${art.image_url}" alt="${art.title}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            <div class="absolute top-3 left-3 z-10">
              <span class="category-pill bg-slate-900/80 backdrop-blur text-white text-[10px]">
                ${art.category_name || 'Xəbər'}
              </span>
            </div>

            <div class="absolute bottom-0 left-0 right-0 p-4 z-10 text-white">
              <div class="text-[11px] text-slate-300 mb-1 flex items-center gap-2">
                <span>${formatAzTime(art.created_at)}</span>
                <span>•</span>
                <span><i class="far fa-eye mr-1"></i>${art.views}</span>
              </div>
              <h3 class="text-sm md:text-base font-bold leading-snug line-clamp-2 group-hover:text-rose-300 transition-colors">
                ${art.title}
              </h3>
            </div>
          </a>
        `;
      });
      subContainer.innerHTML = subHtml;
    }
  } catch (err) {
    console.error('Hero Manshet error:', err);
  }
}

// Load Latest News Feed
async function loadLatestNews(reset = false) {
  if (reset) {
    state.page = 1;
    state.hasMore = true;
  }

  const container = document.getElementById('latest-news-stream');
  if (!container) return;

  if (reset) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i class="fas fa-circle-notch fa-spin text-2xl text-rose-600"></i>
        <p class="mt-2 text-sm">Xəbərlər yüklənir...</p>
      </div>
    `;
  }

  try {
    let url = `/api/news?limit=10&page=${state.page}`;
    if (state.activeCategory) {
      url += `&category=${state.activeCategory}`;
    }
    if (state.searchQuery) {
      url += `&search=${encodeURIComponent(state.searchQuery)}`;
    }

    const res = await fetch(url);
    const { success, data, pagination } = await res.json();

    if (reset || state.page === 1) container.innerHTML = '';

    if (success && data && data.length > 0) {
      data.forEach(art => {
        const item = document.createElement('article');
        item.className = 'group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:shadow-md transition-all duration-300';
        item.innerHTML = `
          <a href="/article.html?id=${art.id}" class="sm:w-48 sm:h-32 flex-shrink-0 h-48 rounded-lg overflow-hidden relative block">
            <img src="${art.image_url}" alt="${art.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <span class="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur">
              ${art.category_name}
            </span>
          </a>
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span class="font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <i class="far fa-clock"></i> ${formatAzTime(art.created_at)}
                </span>
                <span>•</span>
                <span><i class="far fa-eye mr-1"></i>${art.views}</span>
                <span>•</span>
                <span><i class="far fa-comment mr-1"></i>${art.comment_count || 0} şərh</span>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                <a href="/article.html?id=${art.id}">${art.title}</a>
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1.5">
                ${art.summary || ''}
              </p>
            </div>
            <div class="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span class="flex items-center gap-1"><i class="fas fa-feather-alt text-[10px]"></i> ${art.author}</span>
              <a href="/article.html?id=${art.id}" class="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 group-hover:underline">
                Oxu <i class="fas fa-chevron-right text-[10px]"></i>
              </a>
            </div>
          </div>
        `;
        container.appendChild(item);
      });

      const loadMoreBtn = document.getElementById('load-more-btn');
      if (loadMoreBtn) {
        if (pagination && state.page < pagination.pages) {
          loadMoreBtn.classList.remove('hidden');
        } else {
          loadMoreBtn.classList.add('hidden');
        }
      }
    } else {
      if (reset) {
        container.innerHTML = `
          <div class="py-12 text-center text-slate-500">
            <i class="far fa-newspaper text-3xl mb-2"></i>
            <p>Bu bölmədə hələ ki xəbər tapılmadı.</p>
          </div>
        `;
      }
      document.getElementById('load-more-btn')?.classList.add('hidden');
    }
  } catch (err) {
    console.error('Latest news error:', err);
  }
}

// Load Most Read (Top 5 / 10 ranking with big bold numbers - Oxu.az style)
async function loadMostRead() {
  try {
    const res = await fetch('/api/news?sort=views&limit=7');
    const { success, data } = await res.json();
    const container = document.getElementById('most-read-list');
    if (!container || !success || !data) return;

    let html = '';
    data.forEach((art, index) => {
      const rank = index + 1;
      const rankColor = rank <= 3 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-600';
      
      html += `
        <li class="group flex items-start gap-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0">
          <span class="text-2xl font-black font-mono ${rankColor} w-6 flex-shrink-0 leading-none">
            ${rank}
          </span>
          <div class="flex-1">
            <div class="text-[11px] text-slate-400 mb-1 flex items-center gap-2">
              <span class="font-semibold text-rose-500">${art.category_name}</span>
              <span>•</span>
              <span><i class="far fa-eye mr-1"></i>${art.views.toLocaleString()}</span>
            </div>
            <a href="/article.html?id=${art.id}" class="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
              ${art.title}
            </a>
          </div>
        </li>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error('Most read error:', err);
  }
}

// Load Daily Poll (Modern.az style)
async function loadPoll() {
  try {
    const res = await fetch('/api/poll');
    const { success, data } = await res.json();
    const container = document.getElementById('poll-widget-container');
    if (!container) return;

    if (!success || !data) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Aktiv sorğu yoxdur</p>';
      return;
    }

    const hasVoted = localStorage.getItem(`voted_poll_${data.id}`);

    let optionsHtml = '';
    data.options.forEach(opt => {
      if (hasVoted) {
        optionsHtml += `
          <div class="mb-3">
            <div class="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>${opt.option_text}</span>
              <span class="text-rose-600 font-bold">${opt.percentage}%</span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-rose-600 rounded-full transition-all duration-700" style="width: ${opt.percentage}%"></div>
            </div>
            <div class="text-[10px] text-slate-400 text-right mt-0.5">${opt.votes} səs</div>
          </div>
        `;
      } else {
        optionsHtml += `
          <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors mb-2 text-xs font-medium text-slate-800 dark:text-slate-200">
            <input type="radio" name="poll_option" value="${opt.id}" class="text-rose-600 focus:ring-rose-500">
            <span>${opt.option_text}</span>
          </label>
        `;
      }
    });

    container.innerHTML = `
      <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span class="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fas fa-poll-h"></i> Günün Sorğusu
          </span>
          <span class="text-[11px] text-slate-400">${data.total_votes} səs</span>
        </div>
        <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 leading-snug">
          ${data.question}
        </h4>
        <div id="poll-options-list">
          ${optionsHtml}
        </div>
        ${!hasVoted ? `
          <button id="submit-vote-btn" onclick="submitPollVote(${data.id})" class="mt-2 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors shadow">
            Səs ver
          </button>
        ` : `
          <div class="mt-2 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
            <i class="fas fa-check-circle"></i> Səsiniz qeydə alınıb
          </div>
        `}
      </div>
    `;
  } catch (err) {
    console.error('Poll load error:', err);
  }
}

// Submit Poll Vote
async function submitPollVote(pollId) {
  const selected = document.querySelector('input[name="poll_option"]:checked');
  if (!selected) {
    alert('Zəhmət olmasa bir cavab variantı seçin!');
    return;
  }

  try {
    const res = await fetch(`/api/poll/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option_id: parseInt(selected.value) })
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem(`voted_poll_${pollId}`, '1');
      loadPoll();
    }
  } catch (err) {
    console.error('Vote submit error:', err);
  }
}

// Load Modern.az style Analytics & Interviews Section
async function loadAnalyticsSection() {
  try {
    const res = await fetch('/api/news?category=analitika&limit=3');
    const { success, data } = await res.json();
    const container = document.getElementById('analytics-section-grid');
    if (!container || !success || !data || data.length === 0) return;

    let html = '';
    data.forEach(art => {
      html += `
        <div class="group relative bg-slate-900 text-white rounded-2xl overflow-hidden p-6 flex flex-col justify-between border border-slate-800 shadow-lg">
          <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-rose-600/10 rounded-full blur-xl"></div>
          <div>
            <div class="flex items-center gap-2 text-xs text-rose-400 font-bold uppercase tracking-wider mb-3">
              <i class="fas fa-feather"></i> Xüsusi Təhlil
            </div>
            <h4 class="text-lg font-bold leading-tight group-hover:text-rose-400 transition-colors mb-3">
              <a href="/article.html?id=${art.id}">${art.title}</a>
            </h4>
            <p class="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed font-serif">
              ${art.summary}
            </p>
          </div>
          <div class="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span class="font-medium text-slate-200">${art.author}</span>
            <a href="/article.html?id=${art.id}" class="text-rose-400 font-bold hover:underline">
              Oxu <i class="fas fa-arrow-right ml-1 text-[10px]"></i>
            </a>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error('Analytics section error:', err);
  }
}

// Currency Converter Logic
function setupCurrencyCalculator() {
  const amountInput = document.getElementById('calc-amount');
  const currencySelect = document.getElementById('calc-currency');
  const resultEl = document.getElementById('calc-result');

  if (!amountInput || !currencySelect || !resultEl) return;

  function calculate() {
    const val = parseFloat(amountInput.value) || 0;
    const curr = currencySelect.value;
    const rates = {
      USD: parseFloat(state.settings.usd_rate) || 1.7000,
      EUR: parseFloat(state.settings.eur_rate) || 1.8480,
      RUB: parseFloat(state.settings.rub_rate) || 0.0182
    };

    const rate = rates[curr] || 1;
    const aznResult = (val * rate).toFixed(2);
    resultEl.textContent = `${aznResult} AZN`;
  }

  amountInput.addEventListener('input', calculate);
  currencySelect.addEventListener('change', calculate);
}

// Category filter trigger
function filterByCategory(slug) {
  state.activeCategory = slug;
  state.page = 1;
  state.searchQuery = '';
  const searchInput = document.getElementById('main-search-input');
  if (searchInput) searchInput.value = '';

  // Update active pill in category bar
  renderNavCategories(state.categories);

  const headingEl = document.getElementById('feed-section-title');
  if (headingEl) {
    if (slug) {
      const found = state.categories.find(c => c.slug === slug);
      headingEl.textContent = found ? `${found.name} Xəbərləri` : 'Xəbərlər';
    } else {
      headingEl.textContent = 'Son Xəbərlər';
    }
  }

  loadLatestNews(true);
}

// Setup Event Listeners (Search, Load more, Mobile Drawer)
function setupEventListeners() {
  // Load More Button
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      state.page += 1;
      loadLatestNews(false);
    });
  }

  // Live Search Input with debounce
  const searchInput = document.getElementById('main-search-input');
  let searchTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        state.page = 1;
        loadLatestNews(true);
      }, 400);
    });
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleMobileMenu);
  }
}

function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-overlay');
  if (!drawer || !overlay) return;

  const isClosed = drawer.classList.contains('-translate-x-full');
  if (isClosed) {
    drawer.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  } else {
    drawer.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

// Global expose
window.filterByCategory = filterByCategory;
window.submitPollVote = submitPollVote;
window.toggleMobileMenu = toggleMobileMenu;
