/* ==========================================================================
   version.js — 客户端版本管理
   功能：版本列表 / 发布新版本 / 编辑 / 停用 / 删除 / 搜索 / 筛选
   ========================================================================== */

(function () {
  'use strict';

  const FIELDS = [
    { key: 'version', label: '版本号', type: 'text', required: true, placeholder: '如 1.2.0', hint: '语义化版本号' },
    { key: 'platform', label: '平台', type: 'select', required: true, options: [
      { value: 'Windows', label: 'Windows' },
      { value: 'Android', label: 'Android' },
      { value: 'iOS', label: 'iOS' },
    ]},
    { key: 'updateType', label: '更新类型', type: 'select', required: true, options: [
      { value: '正式版', label: '正式版' },
      { value: '灰度版', label: '灰度版' },
      { value: '强制更新', label: '强制更新' },
    ]},
    { key: 'changelog', label: '更新说明', type: 'textarea', required: true, placeholder: '本次更新内容…' },
    { key: 'packageUrl', label: '安装包地址', type: 'text', placeholder: '选填，安装包下载地址' },
    { key: 'status', label: '状态', type: 'select', required: true, options: [
      { value: '已发布', label: '已发布' },
      { value: '已停用', label: '已停用' },
    ]},
  ];

  const COLUMNS = [
    {
      key: 'version', label: '版本',
      render(r) {
        const platformIcon = {
          Windows: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5.5L10.5 4.5v7H3v-6zM3 12.5h7.5v7L3 18.5v-6zM11.5 4.3L21 3v8.5h-9.5v-7.2zM11.5 12.5H21V21l-9.5-1.3v-7.2z"/></svg>',
          Android: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.5l1.5-2.6c.1-.2 0-.4-.1-.5-.2-.1-.4 0-.5.1l-1.5 2.6C15.7 8.4 14.4 8 13 8s-2.7.4-4 1.1L7.5 6.5c-.1-.2-.3-.2-.5-.1-.2.1-.2.3-.1.5l1.5 2.6C5.3 11 4 13.3 4 16h16c0-2.7-1.3-5-3.4-6.5zM9 14a1 1 0 110-2 1 1 0 010 2zm8 0a1 1 0 110-2 1 1 0 010 2z"/></svg>',
          iOS: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 2c-1.3.1-2.7.9-3.5 1.9-.8.9-1.4 2.2-1.2 3.5 1.4.1 2.8-.7 3.5-1.7.8-1 1.4-2.2 1.2-3.7zM21 17c-.5 1.1-.7 1.6-1.4 2.6-.9 1.3-2.2 3-3.8 3-1.4 0-1.8-.9-3.7-.9s-2.4.9-3.7.9c-1.6 0-2.8-1.6-3.7-2.9-2.4-3.4-2.7-7.4-1.2-9.5.9-1.3 2.4-2.1 3.8-2.1s2.3.9 3.5.9c1.1 0 1.8-.9 3.5-.9 1.2 0 2.5.7 3.5 1.8-3 1.7-2.5 6 .7 7.1z"/></svg>',
        };
        return `<div style="display:flex;align-items:center;gap:8px"><span style="color:var(--c-ink-500)">${platformIcon[r.platform] || ''}</span><span class="data-table__name" style="font-family:var(--ff-mono)">v${Crud.escapeHtml(r.version)}</span></div>`;
      },
    },
    { key: 'platform', label: '平台', render: r => `<span class="badge badge--neutral">${Crud.escapeHtml(r.platform)}</span>` },
    { key: 'updateType', label: '类型', render: r => {
        const map = { '正式版': 'badge--success', '灰度版': 'badge--warn', '强制更新': 'badge--danger' };
        return `<span class="badge ${map[r.updateType] || 'badge--neutral'}">${Crud.escapeHtml(r.updateType)}</span>`;
      }
    },
    { key: 'changelog', label: '更新说明', render: r => {
        const text = r.changelog || '—';
        return `<span style="display:inline-block;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--c-ink-500);font-size:var(--fs-sm)" title="${Crud.escapeHtml(text)}">${Crud.escapeHtml(text)}</span>`;
      }
    },
    { key: 'createdAt', label: '发布时间', render: r => Crud.fmtDate(r.createdAt, true) },
    { key: 'status', label: '状态', render: r => `<span class="badge ${r.status === '已发布' ? 'badge--success' : 'badge--danger'}">${Crud.escapeHtml(r.status)}</span>` },
  ];

  const DEFAULT_DATA = [
    { id: 'v001', version: '1.0.0', platform: 'Windows', updateType: '正式版', changelog: '首个正式版本，包含古港数字展、数字人讲解功能', packageUrl: '/download/haisizhijing-1.0.0-win.exe', status: '已发布', createdAt: '2026-06-01T10:00:00' },
    { id: 'v002', version: '1.1.0', platform: 'Windows', updateType: '正式版', changelog: '新增互动叙事场景、优化加载性能', packageUrl: '/download/haisizhijing-1.1.0-win.exe', status: '已发布', createdAt: '2026-07-01T14:00:00' },
    { id: 'v003', version: '1.2.0', platform: 'Android', updateType: '灰度版', changelog: '安卓端首发，支持移动端沉浸漫游', packageUrl: '/download/haisizhijing-1.2.0-android.apk', status: '已发布', createdAt: '2026-07-15T09:30:00' },
    { id: 'v004', version: '1.1.0', platform: 'iOS', updateType: '正式版', changelog: 'iOS 版本，适配 iPad', packageUrl: '', status: '已停用', createdAt: '2026-07-10T16:00:00' },
  ];

  const db = Crud.store('versions', DEFAULT_DATA);
  let keyword = '', platformFilter = '', statusFilter = '';

  function render() {
    let list = db.all();
    if (platformFilter) list = list.filter(r => r.platform === platformFilter);
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(r => (r.version || '').toLowerCase().includes(kw));
    }
    // 按发布时间倒序
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    document.getElementById('count-text').textContent = `共 ${list.length} 条`;
    Crud.table({
      mount: document.getElementById('table-mount'),
      columns: COLUMNS,
      rows: list,
      rowKey: 'id',
      actions: [
        {
          label: r => r.status === '已发布' ? '停用' : '启用',
          onClick(row) {
            const ns = row.status === '已发布' ? '已停用' : '已发布';
            db.update(row.id, { status: ns });
            Crud.toast(`版本已${ns === '已发布' ? '启用' : '停用'}`, 'success');
            render();
          },
        },
        { label: '编辑', onClick: openEdit },
        { label: '删除', type: 'danger', onClick: openDelete },
      ],
      emptyText: keyword || platformFilter || statusFilter ? '没有匹配的版本' : '暂无版本',
    });
  }

  function openAdd() {
    Crud.openForm({
      title: '发布新版本',
      fields: FIELDS,
      submitText: '发布',
      onSubmit: (data) => {
        db.add(data);
        Crud.toast('版本已发布', 'success');
        render();
      },
    });
  }

  function openEdit(row) {
    Crud.openForm({
      title: '编辑版本',
      fields: FIELDS,
      values: row,
      submitText: '保存',
      onSubmit: (data) => {
        db.update(row.id, data);
        Crud.toast('已保存', 'success');
        render();
      },
    });
  }

  function openDelete(row) {
    Crud.confirm(`确定删除版本 v${row.version}（${row.platform}）吗？`, () => {
      db.remove(row.id);
      Crud.toast('已删除', 'success');
      render();
    }, { title: '删除版本', yesText: '确认删除', danger: true });
  }

  document.getElementById('btn-add').addEventListener('click', openAdd);
  document.getElementById('search-input').addEventListener('input', (e) => { keyword = e.target.value.trim(); render(); });
  document.getElementById('filter-platform').addEventListener('change', (e) => { platformFilter = e.target.value; render(); });
  document.getElementById('filter-status').addEventListener('change', (e) => { statusFilter = e.target.value; render(); });

  render();
})();
