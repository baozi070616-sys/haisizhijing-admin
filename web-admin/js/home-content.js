/* ==========================================================================
   home-content.js — 首页内容管理
   功能：内容列表 / 新增 / 编辑 / 删除 / 上下架切换 / 搜索 / 筛选
   ========================================================================== */

(function () {
  'use strict';

  const FIELDS = [
    { key: 'title', label: '标题', type: 'text', required: true, placeholder: '请输入内容标题' },
    { key: 'type', label: '内容类型', type: 'select', required: true, options: [
      { value: '轮播图', label: '轮播图' },
      { value: '推荐位', label: '推荐位' },
      { value: '公告', label: '公告' },
      { value: '资讯', label: '资讯' },
    ]},
    { key: 'sort', label: '排序号', type: 'number', placeholder: '数字越小越靠前', hint: '默认 100' },
    { key: 'cover', label: '封面图', type: 'image', hint: '点击上传封面，建议 16:9，≤2MB' },
    { key: 'linkUrl', label: '跳转链接', type: 'text', placeholder: '选填，点击后跳转的页面地址' },
    { key: 'status', label: '状态', type: 'select', required: true, options: [
      { value: '上架', label: '上架' },
      { value: '下架', label: '下架' },
    ]},
    { key: 'description', label: '内容描述', type: 'textarea', placeholder: '选填' },
  ];

  const COLUMNS = [
    {
      key: 'title', label: '内容',
      render(r) {
        const cover = r.cover
          ? `<img class="thumb" src="${Crud.escapeHtml(r.cover)}" alt="">`
          : `<span class="thumb thumb--placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></span>`;
        return `<div style="display:flex;align-items:center;gap:12px">${cover}<div><div class="data-table__name">${Crud.escapeHtml(r.title)}</div><div style="font-size:var(--fs-xs);color:var(--c-ink-400)">${Crud.escapeHtml(r.linkUrl || '无跳转链接')}</div></div></div>`;
      },
    },
    { key: 'type', label: '类型', render: r => `<span class="badge badge--info">${Crud.escapeHtml(r.type)}</span>` },
    { key: 'sort', label: '排序', render: r => `<span style="font-family:var(--ff-mono)">${r.sort || 100}</span>` },
    { key: 'status', label: '状态', render: r => `<span class="badge ${r.status === '上架' ? 'badge--success' : 'badge--neutral'}">${Crud.escapeHtml(r.status)}</span>` },
    { key: 'createdAt', label: '创建时间', render: r => Crud.fmtDate(r.createdAt) },
  ];

  const DEFAULT_DATA = [
    { id: 'h001', title: '泉州古港数字展开幕', type: '轮播图', sort: 1, linkUrl: '/event/gangzhan', status: '上架', description: '首页主推轮播，展示古港数字展', createdAt: '2026-07-10T09:00:00' },
    { id: 'h002', title: '海丝文化研学营招募中', type: '推荐位', sort: 2, linkUrl: '/event/yanxue', status: '上架', description: '暑期研学活动推荐', createdAt: '2026-07-12T14:30:00' },
    { id: 'h003', title: '系统维护通知：7月20日凌晨暂停服务', type: '公告', sort: 10, linkUrl: '', status: '上架', description: '', createdAt: '2026-07-15T10:00:00' },
    { id: 'h004', title: '数字人「海丝」上线，带你云游世遗', type: '资讯', sort: 5, linkUrl: '/news/digital-human', status: '下架', description: '数字人导览功能上线资讯', createdAt: '2026-07-18T16:20:00' },
  ];

  const db = Crud.store('home_content', DEFAULT_DATA);
  let keyword = '', typeFilter = '', statusFilter = '';

  function render() {
    let list = db.all();
    if (typeFilter) list = list.filter(r => r.type === typeFilter);
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(r => (r.title || '').toLowerCase().includes(kw));
    }
    // 按排序号升序
    list.sort((a, b) => (a.sort || 100) - (b.sort || 100));

    document.getElementById('count-text').textContent = `共 ${list.length} 条`;
    Crud.table({
      mount: document.getElementById('table-mount'),
      columns: COLUMNS,
      rows: list,
      rowKey: 'id',
      actions: [
        {
          label: r => r.status === '上架' ? '下架' : '上架',
          onClick(row) {
            const newStatus = row.status === '上架' ? '下架' : '上架';
            db.update(row.id, { status: newStatus });
            Crud.toast(`已${newStatus}`, 'success');
            render();
          },
        },
        { label: '编辑', onClick: openEdit },
        { label: '删除', type: 'danger', onClick: openDelete },
      ],
      emptyText: keyword || typeFilter || statusFilter ? '没有匹配的内容' : '暂无内容',
    });
  }

  function openAdd() {
    Crud.openForm({
      title: '新增首页内容',
      fields: FIELDS,
      submitText: '创建',
      onSubmit: (data) => {
        if (!data.sort) data.sort = 100;
        db.add(data);
        Crud.toast('内容已添加', 'success');
        render();
      },
    });
  }

  function openEdit(row) {
    Crud.openForm({
      title: '编辑内容',
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
    Crud.confirm(`确定删除「${row.title}」吗？`, () => {
      db.remove(row.id);
      Crud.toast('已删除', 'success');
      render();
    }, { title: '删除内容', yesText: '确认删除', danger: true });
  }

  document.getElementById('btn-add').addEventListener('click', openAdd);
  document.getElementById('search-input').addEventListener('input', (e) => { keyword = e.target.value.trim(); render(); });
  document.getElementById('filter-type').addEventListener('change', (e) => { typeFilter = e.target.value; render(); });
  document.getElementById('filter-status').addEventListener('change', (e) => { statusFilter = e.target.value; render(); });

  render();
})();
