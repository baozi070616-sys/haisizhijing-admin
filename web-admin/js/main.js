/* ==========================================================================
   入口：把所有交互串起来
   --------------------------------------------------------------------------
   真实后端接入时，这一层几乎不用改 — 只需要把 `state` 里的 resources
   替换成从 /api/admin/media 拉来的数据即可。
   ========================================================================== */

const state = {
  resources: RESOURCES,           // 当前可见的资源列表
  currentType: 'all',            // 当前选中的 tab
  currentKeyword: '',            // 当前搜索关键字
  selectedId: 'ASSET-1001',      // 当前选中的资源 ID（默认显示第一个）
  detailOpen: true               // 详情面板是否打开
};

// --- DOM 引用 ---
const els = {
  cardGrid:    document.getElementById('cardGrid'),
  detailPanel: document.getElementById('detailPanel'),
  detailBody:  document.getElementById('detailBody'),
  closeDetail: document.getElementById('closeDetail'),
  openDetail:  document.getElementById('openDetail'),
  search:      document.getElementById('searchInput'),
  tabs:        document.getElementById('tabs'),
  resultCount: document.getElementById('resultCount')
};

// --- 工具：按 type + keyword 过滤 ---
function getFiltered() {
  return state.resources.filter(r => {
    const typeOk = state.currentType === 'all' || r.type === state.currentType;
    const kw = state.currentKeyword.trim().toLowerCase();
    const kwOk = !kw ||
      r.name.toLowerCase().includes(kw) ||
      r.id.toLowerCase().includes(kw) ||
      (r.category || '').toLowerCase().includes(kw);
    return typeOk && kwOk;
  });
}

// --- 工具：更新 tab 上的计数 ---
function updateTabCounts() {
  const counts = { all: 0, image: 0, video: 0, doc: 0 };
  state.resources.forEach(r => {
    counts.all++;
    if (counts[r.type] !== undefined) counts[r.type]++;
  });
  document.querySelectorAll('.tab__count').forEach(el => {
    const key = el.dataset.count;
    if (counts[key] !== undefined) el.textContent = counts[key];
  });
}

// --- 渲染入口：卡片网格 ---
function renderCards() {
  const list = getFiltered();
  els.resultCount.textContent = list.length;

  if (list.length === 0) {
    els.cardGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 80px 20px; text-align:center; color: var(--c-ink-400);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: .5;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        <div style="font-size: 14px; margin-bottom: 4px;">没有匹配的资源</div>
        <div style="font-size: 12px;">试试调整筛选条件或搜索关键字</div>
      </div>
    `;
    return;
  }

  els.cardGrid.innerHTML = list.map(renderCard).join('');

  // 同步当前选中态
  document.querySelectorAll('.resource-card').forEach(card => {
    if (card.dataset.id === state.selectedId) {
      card.classList.add('resource-card--active');
    }
    card.addEventListener('click', (e) => {
      // 阻止缩略图操作按钮冒泡触发选中
      if (e.target.closest('[data-action]')) return;
      selectResource(card.dataset.id);
    });
  });
}

// --- 渲染入口：详情面板 ---
function renderDetailPanel() {
  const res = state.resources.find(r => r.id === state.selectedId);
  els.detailBody.innerHTML = renderDetail(res);
}

// --- 选中资源 ---
function selectResource(id) {
  state.selectedId = id;
  document.querySelectorAll('.resource-card').forEach(card => {
    card.classList.toggle('resource-card--active', card.dataset.id === id);
  });
  renderDetailPanel();
  // 选中时自动展开详情面板
  if (!state.detailOpen) toggleDetail(true);
}

// --- 切换详情面板 ---
function toggleDetail(open) {
  state.detailOpen = open;
  els.detailPanel.classList.toggle('detail-panel--collapsed', !open);
  els.openDetail.style.display = open ? 'none' : 'grid';
}

// ===========================================================================
// 事件绑定
// ===========================================================================
function bindEvents() {

  // Tab 切换
  els.tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
    tab.classList.add('tab--active');
    state.currentType = tab.dataset.type;
    renderCards();
  });

  // 搜索
  let searchTimer = null;
  els.search.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.currentKeyword = e.target.value;
      renderCards();
    }, 120);
  });

  // 关闭/打开详情
  els.closeDetail.addEventListener('click', () => toggleDetail(false));
  els.openDetail.addEventListener('click', () => toggleDetail(true));

  // 侧边栏菜单项已是真实导航链接；这里仅增强未选中态的交互提示
  document.querySelectorAll('.sidebar__item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      // 保持 hover 过渡，无额外逻辑
    });
  });

  // 上传按钮占位
  document.getElementById('uploadBtn').addEventListener('click', () => {
    showToast('上传功能演示中 — 实际项目中将打开文件选择对话框');
  });

  // 键盘 Esc 关闭详情
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.detailOpen) toggleDetail(false);
  });
}

// --- 极简 toast ---
function showToast(message) {
  const existing = document.getElementById('wbToast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'wbToast';
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15, 30, 61, .92)',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    zIndex: 9999,
    boxShadow: '0 8px 24px rgba(0,0,0,.2)',
    animation: 'fadeIn .25s ease'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

// ===========================================================================
// 启动
// ===========================================================================
function init() {
  updateTabCounts();
  renderCards();
  renderDetailPanel();
  bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
