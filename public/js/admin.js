// Günün Nəbzi - Dedicated Admin Panel Logic

const adminState = {
  currentTab: 'dashboard',
  categories: [],
  articlesPage: 1,
  articlesLimit: 10,
  articlesTotal: 0,
  editingArticleId: null
};

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadAdminCategories();
  loadDashboardData();
  setupNewsForm();
  setupSettingsForm();
});

// Toast notification helper
function showToast(message, type = 'success') {
  const toast = document.getElementById('admin-toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');

  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  if (type === 'success') {
    toast.className = 'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl show';
    iconEl.className = 'fas fa-check-circle text-lg';
  } else {
    toast.className = 'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-rose-600 text-white shadow-xl show';
    iconEl.className = 'fas fa-exclamation-triangle text-lg';
  }

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Navigation between tabs
function setupNavigation() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  adminState.currentTab = tab;

  // Update active state in sidebar
  document.querySelectorAll('.admin-nav-item').forEach(el => {
    if (el.dataset.tab === tab) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Hide all sections, show target
  document.querySelectorAll('.tab-section').forEach(el => {
    el.classList.add('hidden');
  });

  const targetEl = document.getElementById(`tab-${tab}`);
  if (targetEl) targetEl.classList.remove('hidden');

  // Load relevant data for tab
  if (tab === 'dashboard') loadDashboardData();
  if (tab === 'articles') loadAdminArticles();
  if (tab === 'categories') loadCategoriesTable();
  if (tab === 'breaking') loadBreakingTable();
  if (tab === 'comments') loadCommentsTable();
  if (tab === 'polls') loadPollsManager();
  if (tab === 'settings') loadSettingsForm();
  if (tab === 'add-article' && !adminState.editingArticleId) resetArticleForm();
}

// 1. DASHBOARD
async function loadDashboardData() {
  try {
    const res = await fetch('/api/stats');
    const { success, data } = await res.json();
    if (!success || !data) return;

    // Stat KPI counters
    document.getElementById('stat-total-articles').textContent = data.summary.totalArticles.toLocaleString();
    document.getElementById('stat-total-views').textContent = data.summary.totalViews.toLocaleString();
    document.getElementById('stat-total-comments').textContent = data.summary.totalComments.toLocaleString();
    document.getElementById('stat-total-categories').textContent = data.summary.totalCategories;
    document.getElementById('stat-breaking-count').textContent = data.summary.breakingCount;

    // Category distribution bars
    const catDist = document.getElementById('dash-category-distribution');
    if (catDist && data.categoryStats) {
      let maxVal = Math.max(...data.categoryStats.map(c => c.count), 1);
      let catHtml = '';
      data.categoryStats.forEach(c => {
        const pct = Math.round((c.count / maxVal) * 100);
        catHtml += `
          <div class="space-y-1">
            <div class="flex justify-between text-xs font-semibold text-slate-700">
              <span>${c.name}</span>
              <span class="text-slate-500">${c.count} xəbər</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width: ${pct}%; background-color: ${c.color || '#e11d48'}"></div>
            </div>
          </div>
        `;
      });
      catDist.innerHTML = catHtml;
    }

    // Top 5 Most Read in dashboard
    const topList = document.getElementById('dash-top-articles');
    if (topList && data.topArticles) {
      let topHtml = '';
      data.topArticles.forEach((art, idx) => {
        topHtml += `
          <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="py-2.5 px-3 font-mono font-bold text-xs text-rose-600">${idx + 1}</td>
            <td class="py-2.5 px-3 text-xs font-semibold text-slate-800 line-clamp-1 max-w-xs">${art.title}</td>
            <td class="py-2.5 px-3 text-xs font-mono font-bold text-slate-700">${art.views.toLocaleString()}</td>
            <td class="py-2.5 px-3 text-right">
              <a href="/article.html?id=${art.id}" target="_blank" class="text-xs text-rose-600 hover:underline">
                <i class="fas fa-external-link-alt"></i>
              </a>
            </td>
          </tr>
        `;
      });
      topList.innerHTML = topHtml;
    }

    // Recent comments in dashboard
    const commList = document.getElementById('dash-recent-comments');
    if (commList && data.recentComments) {
      let commHtml = '';
      data.recentComments.forEach(c => {
        commHtml += `
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-slate-800">${c.author_name}</span>
              <span class="text-[10px] text-slate-400">${new Date(c.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p class="text-slate-600 line-clamp-1 mb-1 font-normal">${c.content}</p>
            <div class="text-[10px] text-slate-400 truncate">Məqalə: ${c.article_title || ''}</div>
          </div>
        `;
      });
      commList.innerHTML = commHtml || '<p class="text-xs text-slate-400">Şərh yoxdur</p>';
    }

  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// Load Categories for Select Boxes and State
async function loadAdminCategories() {
  try {
    const res = await fetch('/api/categories');
    const { success, data } = await res.json();
    if (success && data) {
      adminState.categories = data;

      // Populate Article Category Select
      const select = document.getElementById('article-form-category');
      const filterSelect = document.getElementById('articles-filter-category');

      if (select) {
        select.innerHTML = '<option value="">-- Kateqoriya Seçin --</option>';
        data.forEach(c => {
          select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
      }

      if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Bütün Kateqoriyalar</option>';
        data.forEach(c => {
          filterSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
      }
    }
  } catch (err) {
    console.error('Admin categories error:', err);
  }
}

// 2. ARTICLES LIST
async function loadAdminArticles() {
  const tableBody = document.getElementById('articles-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-xs text-slate-400"><i class="fas fa-spinner fa-spin text-lg text-rose-600"></i><p class="mt-1">Xəbərlər gətirilir...</p></td></tr>`;

  try {
    const search = document.getElementById('articles-search-input')?.value.trim() || '';
    const cat = document.getElementById('articles-filter-category')?.value || '';

    let url = `/api/news?status=all&limit=${adminState.articlesLimit}&page=${adminState.articlesPage}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (cat) url += `&category=${cat}`;

    const res = await fetch(url);
    const { success, data, pagination } = await res.json();

    if (!success || !data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-xs text-slate-400">Heç bir xəbər tapılmadı</td></tr>`;
      return;
    }

    adminState.articlesTotal = pagination.total;
    let html = '';

    data.forEach(art => {
      let manshetBadge = '';
      if (art.is_manshet === 1) manshetBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Baş Manşet</span>';
      else if (art.is_manshet === 2) manshetBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Yan Manşet</span>';

      let breakingBadge = art.is_breaking ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">Təcili</span>' : '';

      html += `
        <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
          <td class="py-3 px-4">
            <img src="${art.image_url}" alt="" class="w-14 h-10 object-cover rounded-lg shadow-sm border border-slate-200">
          </td>
          <td class="py-3 px-4">
            <div class="text-xs font-bold text-slate-900 line-clamp-1 max-w-md">${art.title}</div>
            <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Müəllif: ${art.author}</span>
              <span>•</span>
              <span>${new Date(art.created_at).toLocaleDateString('az-AZ')}</span>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-xs" style="background-color: ${art.category_color || '#64748b'}">
              ${art.category_name || 'Təyinsiz'}
            </span>
          </td>
          <td class="py-3 px-4 text-xs font-mono font-bold text-slate-700">
            ${art.views.toLocaleString()}
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${art.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
                ${art.status === 'published' ? 'Dərc edilib' : 'Qaralama'}
              </span>
              ${manshetBadge}
              ${breakingBadge}
            </div>
          </td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-2">
              <a href="/article.html?id=${art.id}" target="_blank" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors" title="Bax">
                <i class="fas fa-external-link-alt"></i>
              </a>
              <button onclick="editArticle(${art.id})" class="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors" title="Redaktə et">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteArticle(${art.id}, '${art.title.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors" title="Sil">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    // Render pagination
    renderArticlesPagination(pagination);
  } catch (err) {
    console.error('Articles load error:', err);
  }
}

function renderArticlesPagination(p) {
  const container = document.getElementById('articles-pagination');
  if (!container || !p) return;

  container.innerHTML = `
    <div class="text-xs text-slate-500">
      Toplam <strong class="text-slate-800">${p.total}</strong> xəbərdən ${(p.page - 1) * p.limit + 1} - ${Math.min(p.page * p.limit, p.total)} göstərilir
    </div>
    <div class="flex items-center gap-1">
      <button onclick="changeArticlesPage(${p.page - 1})" ${p.page <= 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50">
        Əvvəlki
      </button>
      <span class="px-3 py-1.5 text-xs font-bold text-slate-700">Səhifə ${p.page} / ${p.pages || 1}</span>
      <button onclick="changeArticlesPage(${p.page + 1})" ${p.page >= p.pages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50">
        Növbəti
      </button>
    </div>
  `;
}

function changeArticlesPage(newPage) {
  adminState.articlesPage = newPage;
  loadAdminArticles();
}

// 3. ADD / EDIT NEWS FORM
function setupNewsForm() {
  const form = document.getElementById('article-form');
  const fileInput = document.getElementById('article-form-file');
  const urlInput = document.getElementById('article-form-image');
  const imgPreview = document.getElementById('image-preview');

  // File Upload handling
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
          urlInput.value = data.url;
          if (imgPreview) {
            imgPreview.src = data.url;
            imgPreview.classList.remove('hidden');
          }
          showToast('Şəkil uğurla yükləndi!');
        } else {
          showToast(data.message || 'Yükləmə xətası', 'error');
        }
      } catch (err) {
        showToast('Şəkil yüklənərkən xəta baş verdi', 'error');
      }
    });
  }

  // Live URL input preview
  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val && imgPreview) {
        imgPreview.src = val;
        imgPreview.classList.remove('hidden');
      }
    });
  }

  // Form submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('article-form-title').value.trim();
      const category_id = document.getElementById('article-form-category').value;
      const summary = document.getElementById('article-form-summary').value.trim();
      const content = document.getElementById('article-form-content').value.trim();
      const image_url = document.getElementById('article-form-image').value.trim();
      const author = document.getElementById('article-form-author').value.trim() || 'Redaksiya';
      const tags = document.getElementById('article-form-tags').value.trim();
      const is_manshet = document.querySelector('input[name="is_manshet"]:checked')?.value || 0;
      const is_breaking = document.getElementById('article-form-breaking').checked ? 1 : 0;
      const is_featured = document.getElementById('article-form-featured').checked ? 1 : 0;
      const status = document.getElementById('article-form-status').value;
      const read_time = parseInt(document.getElementById('article-form-readtime').value) || 3;

      if (!title || !content) {
        showToast('Başlıq və mətn mütləqdir', 'error');
        return;
      }

      const payload = {
        title,
        category_id: category_id ? parseInt(category_id) : null,
        summary,
        content,
        image_url,
        author,
        tags,
        is_manshet: parseInt(is_manshet),
        is_breaking,
        is_featured,
        status,
        read_time
      };

      try {
        let res;
        if (adminState.editingArticleId) {
          // Update
          res = await fetch(`/api/news/${adminState.editingArticleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          // Create
          res = await fetch('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        const resData = await res.json();
        if (resData.success) {
          showToast(adminState.editingArticleId ? 'Xəbər uğurla yeniləndi!' : 'Xəbər uğurla dərc edildi!');
          resetArticleForm();
          switchTab('articles');
        } else {
          showToast(resData.message || 'Xəta baş verdi', 'error');
        }
      } catch (err) {
        console.error('Save article error:', err);
        showToast('Əməliyyat zamanı xəta yarandı', 'error');
      }
    });
  }
}

function resetArticleForm() {
  adminState.editingArticleId = null;
  const form = document.getElementById('article-form');
  if (form) form.reset();
  const preview = document.getElementById('image-preview');
  if (preview) preview.classList.add('hidden');
  document.getElementById('form-page-title').textContent = 'Yeni Xəbər Əlavə Et';
  document.getElementById('form-submit-btn').innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Xəbəri Dərc Et';
}

// Edit Article Trigger
async function editArticle(id) {
  try {
    const res = await fetch(`/api/news/${id}`);
    const { success, data } = await res.json();
    if (!success || !data) return;

    adminState.editingArticleId = id;
    switchTab('add-article');

    document.getElementById('form-page-title').textContent = 'Xəbəri Redaktə Et #' + id;
    document.getElementById('form-submit-btn').innerHTML = '<i class="fas fa-save mr-2"></i> Dəyişiklikləri Saxla';

    document.getElementById('article-form-title').value = data.title;
    document.getElementById('article-form-category').value = data.category_id || '';
    document.getElementById('article-form-summary').value = data.summary || '';
    document.getElementById('article-form-content').value = data.content || '';
    document.getElementById('article-form-image').value = data.image_url || '';
    document.getElementById('article-form-author').value = data.author || '';
    document.getElementById('article-form-tags').value = data.tags || '';
    document.getElementById('article-form-readtime').value = data.read_time || 3;
    document.getElementById('article-form-status').value = data.status || 'published';
    document.getElementById('article-form-breaking').checked = data.is_breaking === 1;
    document.getElementById('article-form-featured').checked = data.is_featured === 1;

    // Manshet radio
    const radio = document.querySelector(`input[name="is_manshet"][value="${data.is_manshet || 0}"]`);
    if (radio) radio.checked = true;

    if (data.image_url) {
      const preview = document.getElementById('image-preview');
      if (preview) {
        preview.src = data.image_url;
        preview.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error('Edit error:', err);
  }
}

// Delete Article
async function deleteArticle(id, title) {
  if (!confirm(`"${title}" adlı xəbəri silmək istədiyinizdən əminsiniz?`)) return;

  try {
    const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Xəbər uğurla silindi!');
      loadAdminArticles();
      loadDashboardData();
    } else {
      showToast(data.message || 'Silinmə xətası', 'error');
    }
  } catch (err) {
    showToast('Xəbər silinərkən xəta baş verdi', 'error');
  }
}

// 4. BREAKING NEWS MANAGER
async function loadBreakingTable() {
  const container = document.getElementById('breaking-table-body');
  if (!container) return;

  try {
    const res = await fetch('/api/breaking/all');
    const { success, data } = await res.json();
    if (!success || !data) return;

    let html = '';
    data.forEach(item => {
      html += `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="py-3 px-4 font-bold text-xs text-slate-800">${item.title}</td>
          <td class="py-3 px-4 text-xs text-slate-500">${item.url || 'Yoxdur'}</td>
          <td class="py-3 px-4 text-xs">
            <button onclick="toggleBreaking(${item.id})" class="px-2.5 py-1 rounded-full text-[11px] font-bold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
              ${item.is_active ? 'Aktiv' : 'Deaktiv'}
            </button>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="deleteBreaking(${item.id})" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = html || '<tr><td colspan="4" class="text-center py-6 text-xs text-slate-400">Heç bir təcili xəbər yoxdur</td></tr>';
  } catch (err) {
    console.error('Breaking load error:', err);
  }
}

async function addBreakingItem() {
  const input = document.getElementById('new-breaking-title');
  const title = input.value.trim();
  if (!title) {
    showToast('Başlıq daxil edin', 'error');
    return;
  }

  try {
    const res = await fetch('/api/breaking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, is_active: 1 })
    });
    const data = await res.json();
    if (data.success) {
      input.value = '';
      showToast('Təcili xəbər lentə əlavə edildi!');
      loadBreakingTable();
    }
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

async function toggleBreaking(id) {
  try {
    await fetch(`/api/breaking/${id}/toggle`, { method: 'PUT' });
    loadBreakingTable();
    showToast('Status dəyişdirildi');
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

async function deleteBreaking(id) {
  if (!confirm('Bu xəbərdarlığı silmək istəyirsiniz?')) return;
  try {
    await fetch(`/api/breaking/${id}`, { method: 'DELETE' });
    loadBreakingTable();
    showToast('Silindi');
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

// 5. CATEGORIES MANAGER
async function loadCategoriesTable() {
  const container = document.getElementById('categories-table-body');
  if (!container) return;

  try {
    const res = await fetch('/api/categories');
    const { success, data } = await res.json();
    if (!success || !data) return;

    let html = '';
    data.forEach(c => {
      html += `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="py-3 px-4 font-bold text-xs text-slate-800">${c.name}</td>
          <td class="py-3 px-4 font-mono text-xs text-slate-500">${c.slug}</td>
          <td class="py-3 px-4">
            <span class="inline-block w-4 h-4 rounded-full shadow-inner" style="background-color: ${c.color}"></span>
          </td>
          <td class="py-3 px-4 text-xs font-bold text-slate-700">${c.article_count}</td>
          <td class="py-3 px-4 text-right">
            <button onclick="deleteCategory(${c.id}, '${c.name}')" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error('Categories error:', err);
  }
}

async function addCategory() {
  const nameInput = document.getElementById('new-cat-name');
  const colorInput = document.getElementById('new-cat-color');
  const name = nameInput.value.trim();
  const color = colorInput.value;

  if (!name) {
    showToast('Kateqoriya adını qeyd edin', 'error');
    return;
  }

  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    const data = await res.json();
    if (data.success) {
      nameInput.value = '';
      showToast('Kateqoriya əlavə edildi!');
      loadCategoriesTable();
      loadAdminCategories();
    }
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

async function deleteCategory(id, name) {
  if (!confirm(`"${name}" kateqoriyasını silmək istəyirsiniz?`)) return;
  try {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    loadCategoriesTable();
    loadAdminCategories();
    showToast('Kateqoriya silindi');
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

// 6. COMMENTS MODERATION
async function loadCommentsTable() {
  const container = document.getElementById('comments-table-body');
  if (!container) return;

  try {
    const res = await fetch('/api/comments');
    const { success, data } = await res.json();
    if (!success || !data) return;

    let html = '';
    data.forEach(c => {
      html += `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="py-3 px-4 font-bold text-xs text-slate-800">${c.author_name}</td>
          <td class="py-3 px-4 text-xs text-slate-700 max-w-sm">${c.content}</td>
          <td class="py-3 px-4 text-xs text-slate-500">${c.article_title || 'Məqalə tapılmadı'}</td>
          <td class="py-3 px-4 text-xs text-slate-400">${new Date(c.created_at).toLocaleString('az-AZ')}</td>
          <td class="py-3 px-4 text-right">
            <button onclick="deleteComment(${c.id})" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold" title="Sil">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = html || '<tr><td colspan="5" class="text-center py-6 text-xs text-slate-400">Heç bir şərh yoxdur</td></tr>';
  } catch (err) {
    console.error('Comments error:', err);
  }
}

async function deleteComment(id) {
  if (!confirm('Bu şərhi silmək istəyirsiniz?')) return;
  try {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    loadCommentsTable();
    showToast('Şərh silindi');
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

// 7. POLL MANAGER
async function loadPollsManager() {
  const container = document.getElementById('polls-list-container');
  if (!container) return;

  try {
    const res = await fetch('/api/poll/all');
    const { success, data } = await res.json();
    if (!success || !data) return;

    let html = '';
    data.forEach(p => {
      html += `
        <div class="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
                ${p.is_active ? 'Hazırda Aktiv' : 'Qeyri-aktiv'}
              </span>
              <span class="text-xs text-slate-400">Toplam: ${p.total_votes} səs</span>
            </div>
            <div class="flex items-center gap-2">
              ${!p.is_active ? `
                <button onclick="setActivePoll(${p.id})" class="text-xs font-bold text-indigo-600 hover:underline">
                  Aktiv et
                </button>
              ` : ''}
              <button onclick="deletePoll(${p.id})" class="text-xs text-rose-600 hover:underline ml-2">
                Sil
              </button>
            </div>
          </div>
          <h4 class="text-sm font-bold text-slate-900">${p.question}</h4>
          <div class="space-y-1.5 pl-2 border-l-2 border-slate-100">
            ${p.options.map(opt => `
              <div class="flex justify-between text-xs text-slate-600">
                <span>${opt.option_text}</span>
                <span class="font-mono font-bold">${opt.votes} səs</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html || '<p class="text-xs text-slate-400">Sorğu tapılmadı</p>';
  } catch (err) {
    console.error('Polls error:', err);
  }
}

async function createNewPoll() {
  const question = document.getElementById('new-poll-question').value.trim();
  const opt1 = document.getElementById('new-poll-opt1').value.trim();
  const opt2 = document.getElementById('new-poll-opt2').value.trim();
  const opt3 = document.getElementById('new-poll-opt3').value.trim();
  const opt4 = document.getElementById('new-poll-opt4').value.trim();

  const options = [opt1, opt2, opt3, opt4].filter(Boolean);

  if (!question || options.length < 2) {
    showToast('Sual və ən az 2 cavab variantı daxil edin', 'error');
    return;
  }

  try {
    const res = await fetch('/api/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options, is_active: 1 })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Yeni sorğu yaradıldı və aktiv edildi!');
      document.getElementById('new-poll-question').value = '';
      document.getElementById('new-poll-opt1').value = '';
      document.getElementById('new-poll-opt2').value = '';
      document.getElementById('new-poll-opt3').value = '';
      document.getElementById('new-poll-opt4').value = '';
      loadPollsManager();
    }
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

async function setActivePoll(id) {
  try {
    await fetch(`/api/poll/${id}/active`, { method: 'PUT' });
    showToast('Aktiv sorğu dəyişdirildi');
    loadPollsManager();
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

async function deletePoll(id) {
  if (!confirm('Bu sorğunu silmək istəyirsiniz?')) return;
  try {
    await fetch(`/api/poll/${id}`, { method: 'DELETE' });
    showToast('Sorğu silindi');
    loadPollsManager();
  } catch (err) {
    showToast('Xəta baş verdi', 'error');
  }
}

// 8. SETTINGS & RATES
async function loadSettingsForm() {
  try {
    const res = await fetch('/api/settings');
    const { success, data } = await res.json();
    if (!success || !data) return;

    for (const [k, v] of Object.entries(data)) {
      const el = document.getElementById(`setting-${k}`);
      if (el) el.value = v;
    }
  } catch (err) {
    console.error('Settings error:', err);
  }
}

function setupSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      site_name: document.getElementById('setting-site_name')?.value,
      site_slogan: document.getElementById('setting-site_slogan')?.value,
      contact_email: document.getElementById('setting-contact_email')?.value,
      contact_phone: document.getElementById('setting-contact_phone')?.value,
      whatsapp_number: document.getElementById('setting-whatsapp_number')?.value,
      usd_rate: document.getElementById('setting-usd_rate')?.value,
      eur_rate: document.getElementById('setting-eur_rate')?.value,
      rub_rate: document.getElementById('setting-rub_rate')?.value,
      brent_rate: document.getElementById('setting-brent_rate')?.value,
      weather_baku: document.getElementById('setting-weather_baku')?.value,
      weather_desc: document.getElementById('setting-weather_desc')?.value
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Tənzimləmələr uğurla yadda saxlanıldı!');
      } else {
        showToast('Xəta baş verdi', 'error');
      }
    } catch (err) {
      showToast('Yadda saxlanarkən xəta baş verdi', 'error');
    }
  });
}

// Global expose
window.switchTab = switchTab;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.changeArticlesPage = changeArticlesPage;
window.addBreakingItem = addBreakingItem;
window.toggleBreaking = toggleBreaking;
window.deleteBreaking = deleteBreaking;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.deleteComment = deleteComment;
window.createNewPoll = createNewPoll;
window.setActivePoll = setActivePoll;
window.deletePoll = deletePoll;
window.resetArticleForm = resetArticleForm;
