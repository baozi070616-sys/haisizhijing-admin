/* ==========================================================================
   activity.js — 活动管理
   功能：活动列表 / 新建 / 编辑 / 删除 / 上下线切换 / 搜索 / 筛选
   ========================================================================== */

(function () {
  'use strict';

  const FIELDS = [
    { key: 'name', label: '活动名称', type: 'text', required: true, placeholder: '请输入活动名称' },
    { key: 'type', label: '活动类型', type: 'select', required: true, options: [
      { value: '展览', label: '展览' },
      { value: '讲座', label: '讲座' },
      { value: '互动体验', label: '互动体验' },
      { value: '研学', label: '研学' },
    ]},
    { key: 'location', label: '活动地点', type: 'text', placeholder: '请输入活动地点' },
    { key: 'startDate', label: '开始日期', type: 'date' },
    { key: 'endDate', label: '结束日期', type: 'date' },
    { key: 'cover', label: '活动封面', type: 'image', hint: '点击上传，建议 16:9，≤2MB' },
    { key: 'status', label: '状态', type: 'select', required: true, options: [
      { value: '进行中', label: '进行中' },
      { value: '未开始', label: '未开始' },
      { value: '已结束', label: '已结束' },
      { value: '已下线', label: '已下线' },
    ]},
    { key: 'description', label: '活动描述', type: 'textarea', placeholder: '选填，活动详情介绍' },
  ];

  const COLUMNS = [
    {
      key: 'name', label: '活动',
      render(r) {
        const cover = r.cover
          ? `<img class="thumb" src="${Crud.escapeHtml(r.cover)}" alt="">`
          : `<span class="thumb thumb--placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></span>`;
        return `<div style="display:flex;align-items:center;gap:12px">${cover}<div><div class="data-table__name">${Crud.escapeHtml(r.name)}</div><div style="font-size:var(--fs-xs);color:var(--c-ink-400)">${Crud.escapeHtml(r.location || '地点未定')}</div></div></div>`;
      },
    },
    { key: 'type', label: '类型', render: r => `<span class="badge badge--info">${Crud.escapeHtml(r.type)}</span>` },
    { key: 'date', label: '活动时间', render: r => {
        const s = r.startDate ? Crud.fmtDate(r.startDate) : '?';
        const e = r.endDate ? Crud.fmtDate(r.endDate) : '?';
        return `<span style="font-size:var(--fs-sm)">${s} ~ ${e}</span>`;
      }
    },
    { key: 'status', label: '状态', render: r => {
        const map = { '进行中': 'badge--success', '未开始': 'badge--brand', '已结束': 'badge--neutral', '已下线': 'badge--danger' };
        return `<span class="badge ${map[r.status] || 'badge--neutral'}">${Crud.escapeHtml(r.status)}</span>`;
      }
    },
    { key: 'createdAt', label: '创建时间', render: r => Crud.fmtDate(r.createdAt) },
  ];

  const DEFAULT_DATA = [
    { id: 'a001', name: '泉州古港数字展', type: '展览', location: '海丝智境展厅 A 区', startDate: '2026-07-01', endDate: '2026-09-30', status: '进行中', description: '以数字技术复原宋元泉州古港繁华景象', createdAt: '2026-06-20T09:00:00' },
    { id: 'a002', name: '海丝文化研学营·暑期档', type: '研学', location: '海上丝绸之路博物馆', startDate: '2026-08-05', endDate: '2026-08-10', status: '未开始', description: '面向中学生的海丝文化深度研学', createdAt: '2026-07-05T14:00:00' },
    { id: 'a003', name: '数字人导览体验日', type: '互动体验', location: '展厅 B 区互动区', startDate: '2026-07-15', endDate: '2026-07-15', status: '已结束', description: 'AI数字人「海丝」现场导览体验', createdAt: '2026-07-01T10:30:00' },
    { id: 'a004', name: '世遗泉州·专家讲座', type: '讲座', location: '多功能报告厅', startDate: '2026-08-20', endDate: '2026-08-20', status: '未开始', description: '邀请文化遗产专家讲述泉州世遗价值', createdAt: '2026-07-18T16:00:00' },
  ];

  const db = Crud.store('activities', DEFAULT_DATA);
  let keyword = '', typeFilter = '', statusFilter = '';

  function render() {
    let list = db.all();
    if (typeFilter) list = list.filter(r => r.type === typeFilter);
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(r => (r.name || '').toLowerCase().includes(kw) || (r.location || '').toLowerCase().includes(kw));
    }

    document.getElementById('count-text').textContent = `共 ${list.length} 条`;
    Crud.table({
      mount: document.getElementById('table-mount'),
      columns: COLUMNS,
      rows: list,
      rowKey: 'id',
      actions: [
        {
          label: r => r.status === '已下线' ? '上线' : '下线',
          onClick(row) {
            const ns = row.status === '已下线' ? '进行中' : '已下线';
            db.update(row.id, { status: ns });
            Crud.toast(`活动已${ns === '已下线' ? '下线' : '上线'}`, 'success');
            render();
          },
        },
        { label: '编辑', onClick: openEdit },
        { label: '删除', type: 'danger', onClick: openDelete },
      ],
      emptyText: keyword || typeFilter || statusFilter ? '没有匹配的活动' : '暂无活动',
    });
  }

  function openAdd() {
    Crud.openForm({
      title: '新建活动',
      fields: FIELDS,
      submitText: '创建',
      onSubmit: (data) => {
        db.add(data);
        Crud.toast('活动已创建', 'success');
        render();
      },
    });
  }

  function openEdit(row) {
    Crud.openForm({
      title: '编辑活动',
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
    Crud.confirm(`确定删除活动「${row.name}」吗？`, () => {
      db.remove(row.id);
      Crud.toast('已删除', 'success');
      render();
    }, { title: '删除活动', yesText: '确认删除', danger: true });
  }

  document.getElementById('btn-add').addEventListener('click', openAdd);
  document.getElementById('search-input').addEventListener('input', (e) => { keyword = e.target.value.trim(); render(); });
  document.getElementById('filter-type').addEventListener('change', (e) => { typeFilter = e.target.value; render(); });
  document.getElementById('filter-status').addEventListener('change', (e) => { statusFilter = e.target.value; render(); });

  render();
})();
