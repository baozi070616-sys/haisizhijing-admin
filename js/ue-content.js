/* ==========================================================================
   ue-content.js — UE活动内容管理
   功能：场景列表 / 新增 / 编辑 / 删除 / 上下线 / 搜索 / 筛选
   ========================================================================== */

(function () {
  'use strict';

  const FIELDS = [
    { key: 'sceneName', label: '场景名称', type: 'text', required: true, placeholder: '请输入场景名称' },
    { key: 'sceneType', label: '场景类型', type: 'select', required: true, options: [
      { value: '历史复原', label: '历史复原' },
      { value: '互动叙事', label: '互动叙事' },
      { value: '数字人讲解', label: '数字人讲解' },
      { value: '沉浸漫游', label: '沉浸漫游' },
    ]},
    { key: 'linkedActivity', label: '关联活动', type: 'text', placeholder: '选填，关联的活动名称' },
    { key: 'duration', label: '体验时长(分钟)', type: 'number', placeholder: '如 15' },
    { key: 'cover', label: '场景封面', type: 'image', hint: '点击上传场景预览图，≤2MB' },
    { key: 'status', label: '状态', type: 'select', required: true, options: [
      { value: '已上线', label: '已上线' },
      { value: '已配置', label: '已配置' },
      { value: '草稿', label: '草稿' },
    ]},
    { key: 'description', label: '场景描述', type: 'textarea', placeholder: '选填，场景内容说明' },
  ];

  const COLUMNS = [
    {
      key: 'sceneName', label: '场景',
      render(r) {
        const cover = r.cover
          ? `<img class="thumb" src="${Crud.escapeHtml(r.cover)}" alt="">`
          : `<span class="thumb thumb--placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg></span>`;
        return `<div style="display:flex;align-items:center;gap:12px">${cover}<div><div class="data-table__name">${Crud.escapeHtml(r.sceneName)}</div><div style="font-size:var(--fs-xs);color:var(--c-ink-400)">${Crud.escapeHtml(r.linkedActivity || '未关联活动')}</div></div></div>`;
      },
    },
    { key: 'sceneType', label: '类型', render: r => `<span class="badge badge--info">${Crud.escapeHtml(r.sceneType)}</span>` },
    { key: 'duration', label: '体验时长', render: r => r.duration ? `<span style="font-family:var(--ff-mono)">${r.duration} 分钟</span>` : '—' },
    { key: 'status', label: '状态', render: r => {
        const map = { '已上线': 'badge--success', '已配置': 'badge--brand', '草稿': 'badge--neutral' };
        return `<span class="badge ${map[r.status] || 'badge--neutral'}">${Crud.escapeHtml(r.status)}</span>`;
      }
    },
    { key: 'createdAt', label: '创建时间', render: r => Crud.fmtDate(r.createdAt) },
  ];

  const DEFAULT_DATA = [
    { id: 'ue001', sceneName: '宋元古港全景复原', sceneType: '历史复原', linkedActivity: '泉州古港数字展', duration: 12, status: '已上线', description: '基于史料复原宋元时期泉州古港全貌', createdAt: '2026-06-25T09:00:00' },
    { id: 'ue002', sceneName: '市舶司故事·互动叙事', sceneType: '互动叙事', linkedActivity: '泉州古港数字展', duration: 20, status: '已上线', description: '玩家扮演市舶司官员体验海上贸易', createdAt: '2026-06-28T14:00:00' },
    { id: 'ue003', sceneName: '数字人「海丝」讲解·世遗篇', sceneType: '数字人讲解', linkedActivity: '', duration: 8, status: '已配置', description: 'AI数字人讲解22处世遗点', createdAt: '2026-07-05T10:30:00' },
    { id: 'ue004', sceneName: '深海沉船沉浸漫游', sceneType: '沉浸漫游', linkedActivity: '海丝文化研学营·暑期档', duration: 15, status: '草稿', description: '水下考古沉浸体验，开发中', createdAt: '2026-07-20T16:00:00' },
  ];

  const db = Crud.store('ue_content', DEFAULT_DATA);
  let keyword = '', typeFilter = '', statusFilter = '';

  function render() {
    let list = db.all();
    if (typeFilter) list = list.filter(r => r.sceneType === typeFilter);
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(r => (r.sceneName || '').toLowerCase().includes(kw) || (r.linkedActivity || '').toLowerCase().includes(kw));
    }

    document.getElementById('count-text').textContent = `共 ${list.length} 条`;
    Crud.table({
      mount: document.getElementById('table-mount'),
      columns: COLUMNS,
      rows: list,
      rowKey: 'id',
      actions: [
        {
          label: r => r.status === '已上线' ? '下线' : '上线',
          onClick(row) {
            const ns = row.status === '已上线' ? '已配置' : '已上线';
            db.update(row.id, { status: ns });
            Crud.toast(`场景已${ns === '已上线' ? '上线' : '下线'}`, 'success');
            render();
          },
        },
        { label: '编辑', onClick: openEdit },
        { label: '删除', type: 'danger', onClick: openDelete },
      ],
      emptyText: keyword || typeFilter || statusFilter ? '没有匹配的场景' : '暂无场景',
    });
  }

  function openAdd() {
    Crud.openForm({
      title: '新增UE场景',
      fields: FIELDS,
      submitText: '创建',
      onSubmit: (data) => {
        db.add(data);
        Crud.toast('场景已添加', 'success');
        render();
      },
    });
  }

  function openEdit(row) {
    Crud.openForm({
      title: '编辑场景',
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
    Crud.confirm(`确定删除场景「${row.sceneName}」吗？`, () => {
      db.remove(row.id);
      Crud.toast('已删除', 'success');
      render();
    }, { title: '删除场景', yesText: '确认删除', danger: true });
  }

  document.getElementById('btn-add').addEventListener('click', openAdd);
  document.getElementById('search-input').addEventListener('input', (e) => { keyword = e.target.value.trim(); render(); });
  document.getElementById('filter-type').addEventListener('change', (e) => { typeFilter = e.target.value; render(); });
  document.getElementById('filter-status').addEventListener('change', (e) => { statusFilter = e.target.value; render(); });

  render();
})();
