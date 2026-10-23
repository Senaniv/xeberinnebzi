// Günün Nəbzi - Article Page Logic

let currentArticle = null;
let currentFontSize = 18; // default font size in px
let isSpeaking = false;
let speechUtterance = null;

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLiveClockAndDate();
  loadSettings();
  loadArticle();
  setupReadingTools();
  setupCommentForm();
  loadPoll();
  loadMostRead();
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
const azMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const azDays = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];

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

    if (dateEl) dateEl.textContent = `${day} ${monthName} ${year}, ${dayName}`;
    if (clockEl) clockEl.textContent = `${hours}:${minutes}:${seconds}`;
  }

  update();
  setInterval(update, 1000);
}

// Format Date
function formatAzFullDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const day = d.getDate();
  const month = azMonths[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

// Load Settings
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const { success, data } = await res.json();
    if (success && data) {
      const usdEl = document.getElementById('rate-usd');
      const eurEl = document.getElementById('rate-eur');
      const rubEl = document.getElementById('rate-rub');
      const brentEl = document.getElementById('rate-brent');
      const weatherEl = document.getElementById('weather-temp');

      if (usdEl) usdEl.textContent = data.usd_rate || '1.7000';
      if (eurEl) eurEl.textContent = data.eur_rate || '1.8480';
      if (rubEl) rubEl.textContent = data.rub_rate || '0.0182';
      if (brentEl) brentEl.textContent = `$${data.brent_rate || '84.40'}`;
      if (weatherEl) weatherEl.textContent = data.weather_baku || '21°C';
    }
  } catch (err) {
    console.error('Settings error:', err);
  }
}

// Load Article Details
async function loadArticle() {
  // Extract id or slug from URL query (?id=...) or path (/article/:id)
  const params = new URLSearchParams(window.location.search);
  let id = params.get('id');
  if (!id) {
    const parts = window.location.pathname.split('/');
    id = parts[parts.length - 1];
  }

  if (!id) {
    window.location.href = '/';
    return;
  }

  try {
    const res = await fetch(`/api/news/${id}`);
    const { success, data, message } = await res.json();

    if (!success || !data) {
      document.getElementById('article-main-container').innerHTML = `
        <div class="py-20 text-center">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Xəbər tapılmadı</h2>
          <p class="text-sm text-slate-500 mt-2">${message || 'Axtardığınız məqalə mövcud deyil və ya silinib.'}</p>
          <a href="/" class="mt-4 inline-block px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-sm">
            Baş Səhifəyə Qayıt
          </a>
        </div>
      `;
      return;
    }

    currentArticle = data;
    renderArticle(data);
    renderRelatedNews(data.related || []);
    renderComments(data.comments || []);
    renderReactions(data.reactions || []);
    updateShareLinks(data);
  } catch (err) {
    console.error('Article load error:', err);
  }
}

// Render Article into DOM
function renderArticle(art) {
  document.title = `${art.title} - Günün Nəbzi`;

  // Breadcrumbs
  const bcCat = document.getElementById('bc-category');
  const bcTitle = document.getElementById('bc-title');
  if (bcCat) {
    bcCat.textContent = art.category_name || 'Xəbərlər';
    bcCat.href = `/?category=${art.category_slug}`;
  }
  if (bcTitle) bcTitle.textContent = art.title;

  // Header meta
  document.getElementById('article-category-badge').textContent = art.category_name || 'Gündəm';
  document.getElementById('article-date').textContent = formatAzFullDate(art.created_at);
  document.getElementById('article-views').textContent = `${art.views.toLocaleString()} baxış`;
  document.getElementById('article-read-time').textContent = `${art.read_time || 3} dəqiqə oxuma`;
  document.getElementById('article-title').textContent = art.title;
  document.getElementById('article-author').textContent = art.author || 'Redaksiya';

  // Image
  const imgEl = document.getElementById('article-image');
  if (imgEl) {
    imgEl.src = art.image_url;
    imgEl.alt = art.title;
  }

  // Summary Lead Box
  const summaryEl = document.getElementById('article-summary');
  if (summaryEl) {
    if (art.summary) {
      summaryEl.textContent = art.summary;
      summaryEl.classList.remove('hidden');
    } else {
      summaryEl.classList.add('hidden');
    }
  }

  // Content Paragraphs
  const contentEl = document.getElementById('article-content-body');
  if (contentEl) {
    // Format double newlines into paragraphs
    const paragraphs = art.content.split('\n\n').filter(p => p.trim());
    let formattedHtml = '';
    paragraphs.forEach((p, idx) => {
      if (idx === 0) {
        // Drop cap for first paragraph
        formattedHtml += `<p class="first-letter:text-5xl first-letter:font-extrabold first-letter:text-rose-600 first-letter:float-left first-letter:mr-3 first-letter:leading-none mb-6">${p}</p>`;
      } else {
        formattedHtml += `<p class="mb-6 leading-relaxed">${p}</p>`;
      }
    });
    contentEl.innerHTML = formattedHtml;
  }

  // Tags
  const tagsContainer = document.getElementById('article-tags');
  if (tagsContainer && art.tags) {
    const tags = art.tags.split(',').map(t => t.trim()).filter(Boolean);
    let tagsHtml = '';
    tags.forEach(t => {
      tagsHtml += `
        <span class="inline-flex items-center text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 transition-colors">
          #${t}
        </span>
      `;
    });
    tagsContainer.innerHTML = tagsHtml;
  }
}

// Reading Tools (Font Size, Audio Reader, Print, Copy)
function setupReadingTools() {
  const contentEl = document.getElementById('article-content-body');

  // Font Size Decrement
  document.getElementById('btn-font-dec')?.addEventListener('click', () => {
    if (currentFontSize > 14) {
      currentFontSize -= 2;
      contentEl.style.fontSize = `${currentFontSize}px`;
    }
  });

  // Font Size Reset
  document.getElementById('btn-font-reset')?.addEventListener('click', () => {
    currentFontSize = 18;
    contentEl.style.fontSize = `${currentFontSize}px`;
  });

  // Font Size Increment
  document.getElementById('btn-font-inc')?.addEventListener('click', () => {
    if (currentFontSize < 26) {
      currentFontSize += 2;
      contentEl.style.fontSize = `${currentFontSize}px`;
    }
  });

  // Print button
  document.getElementById('btn-print')?.addEventListener('click', () => {
    window.print();
  });

  // Copy Link
  document.getElementById('btn-copy-link')?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const toast = document.getElementById('copy-toast');
      if (toast) {
        toast.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => toast.classList.add('opacity-0', 'pointer-events-none'), 2500);
      }
    });
  });

  // Text-To-Speech (Xəbəri Dinlə)
  const ttsBtn = document.getElementById('btn-tts-listen');
  if (ttsBtn && 'speechSynthesis' in window) {
    ttsBtn.addEventListener('click', () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        ttsBtn.innerHTML = '<i class="fas fa-volume-up text-rose-500"></i><span>Xəbəri Dinlə</span>';
        ttsBtn.classList.remove('bg-rose-100', 'dark:bg-rose-950');
      } else {
        if (!currentArticle) return;
        const textToRead = `${currentArticle.title}. ${currentArticle.summary || ''}. ${currentArticle.content}`;
        speechUtterance = new SpeechSynthesisUtterance(textToRead);
        speechUtterance.lang = 'az-AZ';
        speechUtterance.rate = 1.0;

        speechUtterance.onend = () => {
          isSpeaking = false;
          ttsBtn.innerHTML = '<i class="fas fa-volume-up text-rose-500"></i><span>Xəbəri Dinlə</span>';
          ttsBtn.classList.remove('bg-rose-100', 'dark:bg-rose-950');
        };

        speechUtterance.onerror = () => {
          isSpeaking = false;
          ttsBtn.innerHTML = '<i class="fas fa-volume-up text-rose-500"></i><span>Xəbəri Dinlə</span>';
        };

        window.speechSynthesis.speak(speechUtterance);
        isSpeaking = true;
        ttsBtn.innerHTML = '<i class="fas fa-pause text-rose-600 animate-pulse"></i><span>Durdur</span>';
        ttsBtn.classList.add('bg-rose-100', 'dark:bg-rose-950');
      }
    });
  } else if (ttsBtn) {
    ttsBtn.classList.add('hidden');
  }
}

// Social Share links
function updateShareLinks(art) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(art.title);

  document.getElementById('share-whatsapp')?.setAttribute('href', `https://api.whatsapp.com/send?text=${text}%20${url}`);
  document.getElementById('share-telegram')?.setAttribute('href', `https://t.me/share/url?url=${url}&text=${text}`);
  document.getElementById('share-facebook')?.setAttribute('href', `https://www.facebook.com/sharer/sharer.php?u=${url}`);
  document.getElementById('share-twitter')?.setAttribute('href', `https://twitter.com/intent/tweet?url=${url}&text=${text}`);
}

// Reactions Bar
function renderReactions(reactions) {
  const counts = {
    like: 0,
    heart: 0,
    wow: 0,
    sad: 0,
    angry: 0
  };

  reactions.forEach(r => {
    counts[r.reaction_type] = r.count;
  });

  document.getElementById('reaction-count-like').textContent = counts.like;
  document.getElementById('reaction-count-heart').textContent = counts.heart;
  document.getElementById('reaction-count-wow').textContent = counts.wow;
  document.getElementById('reaction-count-sad').textContent = counts.sad;
  document.getElementById('reaction-count-angry').textContent = counts.angry;
}

// Submit Reaction
async function sendReaction(type) {
  if (!currentArticle) return;
  const votedKey = `reaction_${currentArticle.id}_${type}`;
  if (localStorage.getItem(votedKey)) {
    alert('Bu reaksiyanı artıq bildirmisiniz!');
    return;
  }

  try {
    const res = await fetch(`/api/news/${currentArticle.id}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction_type: type })
    });
    const { success, reactions } = await res.json();
    if (success) {
      localStorage.setItem(votedKey, '1');
      renderReactions(reactions);
    }
  } catch (err) {
    console.error('Reaction error:', err);
  }
}

// Comments Management
function renderComments(comments) {
  const container = document.getElementById('comments-list');
  const countEl = document.getElementById('comments-count');
  if (countEl) countEl.textContent = `(${comments.length})`;

  if (!container) return;

  if (comments.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-slate-400 text-xs">
        <i class="far fa-comments text-2xl mb-1"></i>
        <p>Hələ heç bir rəy bildirilməyib. İlk rəyi siz yazın!</p>
      </div>
    `;
    return;
  }

  let html = '';
  comments.forEach(c => {
    html += `
      <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-rose-600/10 text-rose-600 flex items-center justify-center font-bold text-xs uppercase">
              ${c.author_name.charAt(0)}
            </div>
            <span class="font-bold text-xs text-slate-800 dark:text-slate-200">${c.author_name}</span>
          </div>
          <span class="text-[11px] text-slate-400">${formatAzFullDate(c.created_at)}</span>
        </div>
        <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-9">
          ${c.content}
        </p>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Setup Comment Form Submission
function setupCommentForm() {
  const form = document.getElementById('comment-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentArticle) return;

    const authorInput = document.getElementById('comment-author');
    const contentInput = document.getElementById('comment-content');

    const author_name = authorInput.value.trim();
    const content = contentInput.value.trim();

    if (!author_name || !content) {
      alert('Zəhmət olmasa adınızı və rəyinizi daxil edin.');
      return;
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: currentArticle.id,
          author_name,
          content
        })
      });

      const { success, data, message } = await res.json();
      if (success) {
        authorInput.value = '';
        contentInput.value = '';
        
        // Append comment dynamically
        if (!currentArticle.comments) currentArticle.comments = [];
        currentArticle.comments.unshift(data);
        renderComments(currentArticle.comments);

        const alertEl = document.getElementById('comment-success-alert');
        if (alertEl) {
          alertEl.classList.remove('hidden');
          setTimeout(() => alertEl.classList.add('hidden'), 4000);
        }
      } else {
        alert(message || 'Şərh göndərilərkən xəta baş verdi');
      }
    } catch (err) {
      console.error('Comment submit error:', err);
    }
  });
}

// Related News Grid
function renderRelatedNews(related) {
  const container = document.getElementById('related-news-grid');
  if (!container || related.length === 0) return;

  let html = '';
  related.forEach(art => {
    html += `
      <a href="/article.html?id=${art.id}" class="group block rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
        <div class="h-36 overflow-hidden relative">
          <img src="${art.image_url}" alt="${art.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur">
            ${art.category_name}
          </span>
        </div>
        <div class="p-3.5">
          <div class="text-[10px] text-slate-400 mb-1 flex items-center gap-1.5">
            <i class="far fa-clock"></i> ${formatAzFullDate(art.created_at)}
          </div>
          <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
            ${art.title}
          </h4>
        </div>
      </a>
    `;
  });

  container.innerHTML = html;
}

// Load Most Read for sidebar
async function loadMostRead() {
  try {
    const res = await fetch('/api/news?sort=views&limit=5');
    const { success, data } = await res.json();
    const container = document.getElementById('sidebar-most-read');
    if (!container || !success || !data) return;

    let html = '';
    data.forEach((art, index) => {
      const rank = index + 1;
      html += `
        <li class="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0">
          <span class="text-xl font-black font-mono text-rose-600 dark:text-rose-400 w-5 flex-shrink-0 leading-none">
            ${rank}
          </span>
          <div>
            <div class="text-[10px] text-slate-400 mb-0.5">${art.category_name}</div>
            <a href="/article.html?id=${art.id}" class="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-rose-600 transition-colors line-clamp-2">
              ${art.title}
            </a>
          </div>
        </li>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error('Sidebar most read error:', err);
  }
}

// Load Poll for article sidebar
async function loadPoll() {
  try {
    const res = await fetch('/api/poll');
    const { success, data } = await res.json();
    const container = document.getElementById('sidebar-poll-container');
    if (!container || !success || !data) return;

    let optionsHtml = '';
    data.options.forEach(opt => {
      optionsHtml += `
        <div class="mb-2">
          <div class="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
            <span>${opt.option_text}</span>
            <span class="text-rose-600 font-bold">${opt.percentage}%</span>
          </div>
          <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-rose-600 rounded-full" style="width: ${opt.percentage}%"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-2">
          <i class="fas fa-poll-h mr-1"></i> Günün Sorğusu
        </span>
        <h5 class="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">${data.question}</h5>
        ${optionsHtml}
      </div>
    `;
  } catch (err) {
    console.error('Article poll error:', err);
  }
}

// Global expose
window.sendReaction = sendReaction;
