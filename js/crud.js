/* ==========================================================================
   crud.js — 海丝智境管理端通用交互引擎
   提供：Toast 提示 / 弹窗 / 确认框 / localStorage 存储 / 表单生成 / 表格渲染
   每个模块只需定义「字段 + 列 + 操作」即可复用，无需重复写交互逻辑
   ========================================================================== */

const Crud = (function () {

  /* -------------------- Toast 提示 -------------------- */
  function toast(msg, type = 'info', duration = 2400) {
    let box = document.querySelector('.toast-container');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toast-container';
      document.body.appendChild(box);
    }
    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>',
      warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    };
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(msg)}</span>`;
    box.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut .25s ease forwards';
      setTimeout(() => el.remove(), 250);
    }, duration);
  }

  /* -------------------- 弹窗 -------------------- */
  let _onModalSubmit = null;

  function openModal({ title, bodyHTML, onSubmit, submitText = '保存', cancelText = '取消', size = 'md' }) {
    closeModal();
    _onModalSubmit = onSubmit;
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.id = 'crud-modal';
    mask.innerHTML = `
      <div class="modal modal--${size}" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3 class="modal__title">${escapeHtml(title)}</h3>
          <button class="modal__close" data-act="cancel" aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal__body">${bodyHTML}</div>
        <div class="modal__footer">
          <button class="btn btn--ghost" data-act="cancel">${cancelText}</button>
          <button class="btn btn--primary" data-act="submit">${escapeHtml(submitText)}</button>
        </div>
      </div>`;
    document.body.appendChild(mask);

    // 点击遮罩 / 取消按钮关闭
    mask.addEventListener('click', (e) => {
      if (e.target === mask || e.target.closest('[data-act="cancel"]')) {
        closeModal();
      }
    });
    // 提交
    mask.querySelector('[data-act="submit"]').addEventListener('click', () => {
      const form = mask.querySelector('[data-crud-form]');
      if (form && typeof _onModalSubmit === 'function') {
        const result = _onModalSubmit(form);
        if (result !== false) closeModal(); // 返回 false 阻止关闭（校验失败时）
      } else {
        closeModal();
      }
    });
    // Esc 关闭
    document.addEventListener('keydown', _escHandler);
    // 自动聚焦第一个输入框
    setTimeout(() => {
      const firstInput = mask.querySelector('input,select,textarea');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  function closeModal() {
    const m = document.getElementById('crud-modal');
    if (m) m.remove();
    _onModalSubmit = null;
    document.removeEventListener('keydown', _escHandler);
  }

  function _escHandler(e) {
    if (e.key === 'Escape') closeModal();
  }

  /* -------------------- 确认框 -------------------- */
  function confirm(message, onYes, { title = '请确认', yesText = '确定', danger = false } = {}) {
    openModal({
      title,
      size: 'sm',
      bodyHTML: `<p style="font-size:var(--fs-base);color:var(--c-ink-700);line-height:1.7;margin:0;">${escapeHtml(message)}</p>`,
      submitText: yesText,
      onSubmit: () => { onYes && onYes(); },
    });
    if (danger) {
      const btn = document.querySelector('#crud-modal [data-act="submit"]');
      if (btn) { btn.classList.remove('btn--primary'); btn.classList.add('btn--danger'); }
    }
  }

  /* -------------------- localStorage 存储封装 -------------------- */
  function store(key, defaultData = []) {
    const fullKey = 'hszj_' + key;
    // 初始化
    if (!localStorage.getItem(fullKey) && defaultData.length) {
      localStorage.setItem(fullKey, JSON.stringify(defaultData));
    }
    return {
      all() {
        try { return JSON.parse(localStorage.getItem(fullKey)) || []; }
        catch { return []; }
      },
      add(item) {
        const list = this.all();
        item.id = item.id || _genId();
        item.createdAt = item.createdAt || new Date().toISOString();
        list.unshift(item);
        this._save(list);
        return item;
      },
      update(id, patch) {
        const list = this.all();
        const idx = list.findIndex(r => String(r.id) === String(id));
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
          this._save(list);
          return list[idx];
        }
        return null;
      },
      remove(id) {
        const list = this.all().filter(r => String(r.id) !== String(id));
        this._save(list);
      },
      _save(list) { localStorage.setItem(fullKey, JSON.stringify(list)); },
      reset() { localStorage.removeItem(fullKey); },
    };
  }

  /* -------------------- 表单生成 -------------------- */
  /**
   * fields: [{ key, label, type, options?, required?, placeholder?, hint?, span? }]
   *   type: text | textarea | number | select | date | image | password | tag
   * values: 现有值（编辑时传入）
   * 返回 { html, collect(formEl) → {values, valid} }
   */
  function buildForm(fields, values = {}) {
    const html = fields.map(f => {
      const val = values[f.key] ?? '';
      const req = f.required ? '<span class="req">*</span>' : '';
      const error = `<span class="form__error">${escapeHtml(f.label)}不能为空</span>`;
      let control = '';

      if (f.type === 'textarea') {
        control = `<textarea class="form__textarea" name="${f.key}" placeholder="${escapeHtml(f.placeholder || '')}">${escapeHtml(val)}</textarea>`;
      } else if (f.type === 'select') {
        const opts = (f.options || []).map(o => {
          const sel = String(o.value) === String(val) ? 'selected' : '';
          return `<option value="${escapeHtml(o.value)}" ${sel}>${escapeHtml(o.label)}</option>`;
        }).join('');
        control = `<select class="form__select" name="${f.key}"><option value="">请选择</option>${opts}</select>`;
      } else if (f.type === 'image') {
        control = `
          <div class="form__image-drop" data-image-drop="${f.key}">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <div>点击或拖拽上传图片</div>
            <input type="file" accept="image/*" name="${f.key}" data-image-input="${f.key}" style="display:none">
          </div>
          ${val ? `<div class="form__image-preview"><img src="${escapeHtml(val)}" alt="预览"></div>` : ''}
        `;
      } else {
        const inputType = f.type === 'number' ? 'number' : (f.type === 'password' ? 'password' : (f.type === 'date' ? 'date' : 'text'));
        control = `<input class="form__input" type="${inputType}" name="${f.key}" value="${escapeHtml(val)}" placeholder="${escapeHtml(f.placeholder || '')}">`;
      }

      const hint = f.hint ? `<div class="form__hint">${escapeHtml(f.hint)}</div>` : '';
      const groupClass = f.span === 'full' ? 'form__group' : 'form__group';
      return `<div class="${groupClass}" data-field="${f.key}">
        <label class="form__label">${escapeHtml(f.label)}${req}</label>
        ${control}${hint}${error}
      </div>`;
    }).join('');

    return {
      html: `<form data-crud-form autocomplete="off" onsubmit="return false">${html}</form>`,
      collect(formEl) {
        const result = {};
        let valid = true;
        fields.forEach(f => {
          const group = formEl.querySelector(`[data-field="${f.key}"]`);
          if (f.type === 'image') {
            const input = formEl.querySelector(`[data-image-input="${f.key}"]`);
            // 如果有新文件，用 FileReader 读 base64（异步，这里取已缓存的 data-url）
            result[f.key] = input.dataset.dataUrl || (values[f.key] || '');
            if (f.required && !result[f.key]) { valid = false; group.classList.add('has-error'); }
            else group.classList.remove('has-error');
          } else {
            const el = formEl.querySelector(`[name="${f.key}"]`);
            result[f.key] = el ? el.value.trim() : '';
            if (f.required && !result[f.key]) { valid = false; group.classList.add('has-error'); }
            else group.classList.remove('has-error');
          }
        });
        return { values: result, valid };
      },
    };
  }

  /** 绑定图片上传字段（在 openModal 后调用） */
  function bindImageFields() {
    document.querySelectorAll('[data-image-drop]').forEach(drop => {
      const key = drop.dataset.imageDrop;
      const input = drop.querySelector(`[data-image-input="${key}"]`);
      drop.addEventListener('click', () => input.click());
      drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.borderColor = 'var(--c-brand-500)'; });
      drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
      drop.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) handleImageFile(input, e.dataTransfer.files[0]);
      });
      input.addEventListener('change', () => {
        if (input.files[0]) handleImageFile(input, input.files[0]);
      });
    });
  }

  function handleImageFile(input, file) {
    if (!file.type.startsWith('image/')) { toast('请上传图片文件', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { toast('图片不能超过 2MB（演示限制）', 'warn'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      input.dataset.dataUrl = e.target.result;
      let preview = input.parentElement.querySelector('.form__image-preview');
      if (!preview) {
        preview = document.createElement('div');
        preview.className = 'form__image-preview';
        input.parentElement.appendChild(preview);
      }
      preview.innerHTML = `<img src="${e.target.result}" alt="预览">`;
      toast('图片已选择', 'success', 1200);
    };
    reader.readAsDataURL(file);
  }

  /* -------------------- 表格渲染 -------------------- */
  /**
   * opts: {
   *   mount, columns, rows, rowKey='id',
   *   actions: [{ label, type, onClick(row) }]  // 行操作按钮
   *   emptyText
   * }
   * columns: [{ key, label, render?(row)?, width? }]
   */
  function table({ mount, columns, rows, rowKey = 'id', actions = [], emptyText = '暂无数据' }) {
    if (!mount) return;
    const hasActions = actions.length > 0;

    if (!rows || rows.length === 0) {
      mount.innerHTML = `
        <div class="data-table-wrap">
          <div class="empty-state">
            <div class="empty-state__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
            </div>
            <div class="empty-state__title">${escapeHtml(emptyText)}</div>
            <div class="empty-state__desc">点击右上角按钮添加第一条数据</div>
          </div>
        </div>`;
      return;
    }

    const headCells = columns.map(c => `<th${c.width ? ` style="width:${c.width}"` : ''}>${escapeHtml(c.label)}</th>`).join('')
      + (hasActions ? '<th style="width:1%">操作</th>' : '');

    const bodyRows = rows.map(row => {
      const cells = columns.map(c => {
        const v = c.render ? c.render(row) : (row[c.key] ?? '');
        return `<td>${v ?? '<span style="color:var(--c-ink-400)">—</span>'}</td>`;
      }).join('');
      const actionCells = hasActions
        ? `<td><div class="data-table__actions">${actions.map((a, ai) => {
            const labelText = typeof a.label === 'function' ? a.label(row) : a.label;
            return `<button class="btn btn--link ${a.type === 'danger' ? 'btn--danger' : ''}" data-action="${ai}" data-id="${escapeHtml(row[rowKey])}">${escapeHtml(labelText)}</button>`;
          }).join('')}</div></td>`
        : '';
      return `<tr data-id="${escapeHtml(row[rowKey])}">${cells}${actionCells}</tr>`;
    }).join('');

    mount.innerHTML = `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr>${headCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;

    // 绑定行操作
    if (hasActions) {
      mount.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const ai = parseInt(btn.dataset.action, 10);
          const row = rows.find(r => String(r[rowKey]) === String(id));
          const action = actions[ai];
          if (action && row) action.onClick(row);
        });
      });
    }
  }

  /* -------------------- 工具函数 -------------------- */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function _genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /** 格式化日期 */
  function fmtDate(iso, withTime = false) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const pad = n => String(n).padStart(2, '0');
    let s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (withTime) s += ` ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return s;
  }

  /** 生成头像首字母 */
  function avatarChar(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  /** 打开「新增/编辑」表单弹窗的快捷方法 */
  function openForm({ title, fields, values = {}, onSubmit, size = 'md', submitText = '保存' }) {
    const form = buildForm(fields, values);
    openModal({
      title, size, submitText, bodyHTML: form.html,
      onSubmit: (formEl) => {
        const { values: data, valid } = form.collect(formEl);
        if (!valid) { toast('请填写必填项', 'error'); return false; }
        onSubmit(data);
      },
    });
    bindImageFields();
  }

  return {
    toast, openModal, closeModal, confirm,
    store, buildForm, bindImageFields, table,
    openForm, escapeHtml, fmtDate, avatarChar,
  };
})();
