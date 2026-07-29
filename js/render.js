/* ==========================================================================
   渲染层：把数据转成 DOM
   - renderCard(res)   → 单个资源卡片
   - renderDetail(res) → 详情面板
   - renderEmpty(msg)  → 空状态
   ========================================================================== */

// --- 工具：缩略图装饰 ---
function thumbDecoration(res) {
  if (res.type === 'doc') {
    return `<div class="thumb-label">PDF</div>`;
  }
  if (res.type === 'image') {
    if (res.thumbClass === 'thumb--empty') {
      return `
        <div class="thumb-deco__diagonal"></div>
        <div style="position:absolute; inset:0; display:grid; place-items:center; color:rgba(120,80,40,.4); font-size:13px; font-weight:500;">
          暂无预览
        </div>
      `;
    }
    // 港口/海洋/主视觉：太阳 + 海平面 + 光线
    return `
      <div class="thumb-deco__sun"></div>
      <div class="thumb-deco__rays"></div>
      <div class="thumb-deco__ship"></div>
    `;
  }
  if (res.type === 'video') {
    return `
      <div class="thumb-deco__frame"></div>
      <div class="thumb-deco__diagonal"></div>
      <button class="thumb-play" type="button" title="预览">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
    `;
  }
  return '';
}

// --- 工具：参考引用图标 ---
function refIcon(kind) {
  const map = {
    layout:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
    flag:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
    cube:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>`,
    download: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`
  };
  return map[kind] || map.layout;
}

// ===========================================================================
// 渲染：单个卡片
// ===========================================================================
function renderCard(res) {
  const isEmpty = res.status === 'empty';
  const mountedBadge = isEmpty
    ? `<span class="badge badge--tag">未上传</span>`
    : (res.mounted > 0
        ? `<span class="badge badge--mounted">已挂载 ${res.mounted} 处</span>`
        : `<span class="badge badge--tag">未挂载</span>`);

  return `
    <article class="resource-card" data-id="${res.id}">
      <div class="resource-card__thumb ${res.thumbClass || ''}">
        ${res.cover ? `<img src="${escapeHtml(res.cover)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">` : `<div class="thumb-deco">${thumbDecoration(res)}</div>`}
        ${res.status === 'draft' ? `
          <span class="thumb-status">
            <span class="thumb-status__dot"></span>草稿
          </span>
        ` : ''}
        <div class="thumb-actions">
          <button class="thumb-actions__btn" title="预览" data-action="preview">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="thumb-actions__btn" title="更多" data-action="more">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
        </div>
      </div>
      <div class="resource-card__body">
        <div class="resource-card__name" title="${escapeHtml(res.name)}">${escapeHtml(res.name)}</div>
        <div class="resource-card__meta">
          <span>${res.id}</span>
          <span class="resource-card__meta-sep">·</span>
          <span>${res.size}</span>
          ${res.duration ? `
            <span class="resource-card__meta-sep">·</span>
            <span>${res.duration}</span>
          ` : ''}
        </div>
      </div>
      <div class="resource-card__foot">
        ${mountedBadge}
      </div>
    </article>
  `;
}

// ===========================================================================
// 渲染：详情面板
// ===========================================================================
function renderDetail(res) {
  if (!res) {
    return `
      <div style="text-align:center; color: var(--c-ink-400); padding: 60px 20px; font-size: 14px;">
        请选择一张资源卡片查看详情
      </div>
    `;
  }

  const mounted = res.mounted;
  const references = (res.references || []).map(ref => `
    <div class="reference-item">
      <div class="reference-item__icon">${refIcon(ref.icon)}</div>
      <div class="reference-item__info">
        <div class="reference-item__name">${escapeHtml(ref.name)}</div>
        <div class="reference-item__meta">${escapeHtml(ref.meta)}</div>
      </div>
      <a href="javascript:;" class="reference-item__action">查看 →</a>
    </div>
  `).join('');

  return `
    <div class="detail-panel__thumb ${res.thumbClass}">
      <div class="thumb-deco" style="height: 180px;">${thumbDecoration(res)}</div>
    </div>

    <div class="detail-panel__heading">
      <h2 class="detail-panel__name">${escapeHtml(res.name)}</h2>
      <span class="detail-panel__asset-id">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h4M15 7h4a2 2 0 012 2v10a2 2 0 01-2 2h-4M8 12h8"/></svg>
        ${res.id}
      </span>
    </div>

    <table class="detail-panel__table">
      <tr>
        <th>资源类型</th>
        <td>${TYPE_LABELS[res.type] || res.type}</td>
      </tr>
      <tr>
        <th>资源分类</th>
        <td>${escapeHtml(res.category)}</td>
      </tr>
      <tr>
        <th>文件大小</th>
        <td>${res.size}</td>
      </tr>
      <tr>
        <th>上传时间</th>
        <td>${res.uploadedAt}</td>
      </tr>
      ${res.format !== '—' ? `
        <tr>
          <th>规格</th>
          <td>${res.format} · ${escapeHtml(res.resolution || '—')}</td>
        </tr>
      ` : ''}
    </table>

    ${res.status !== 'empty' ? `
      <div class="detail-panel__section">
        <div class="detail-panel__section-title">
          <span>引用关系</span>
          <span class="detail-panel__section-count">${mounted} 条引用</span>
        </div>
        ${mounted > 0 ? `
          <div class="reference-list">${references}</div>
        ` : `
          <div style="text-align:center; color: var(--c-ink-400); padding: 16px; font-size: 13px; background: var(--c-ink-50); border-radius: 8px;">
            暂无引用 — 资源处于空闲状态
          </div>
        `}
      </div>
    ` : ''}

    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="btn btn--ghost btn--sm" id="detailEditBtn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        编辑信息
      </button>
      <button class="btn btn--danger btn--sm" id="detailDeleteBtn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        删除资源
      </button>
    </div>

    <div class="protected-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      已变更空间保护
    </div>
  `;
}

// ===========================================================================
// 工具：HTML 转义（防 XSS）
// ===========================================================================
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
