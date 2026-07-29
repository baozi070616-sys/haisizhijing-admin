/* ==========================================================================
   user-data.js — 用户与数据管理
   功能：用户列表 / 新增(注册) / 编辑个人信息 / 删除 / 搜索 / 角色筛选
   数据存 localStorage，刷新不丢
   ========================================================================== */

(function () {
  'use strict';

  // ---- 字段定义（新增/编辑表单用） ----
  const FIELDS = [
    { key: 'name', label: '姓名', type: 'text', required: true, placeholder: '请输入姓名' },
    { key: 'phone', label: '手机号', type: 'text', required: true, placeholder: '请输入手机号', hint: '11 位手机号' },
    { key: 'email', label: '邮箱', type: 'text', placeholder: '选填' },
    { key: 'avatar', label: '头像', type: 'image', hint: '点击上传，建议正方形，≤2MB' },
    { key: 'role', label: '角色', type: 'select', required: true, options: [
      { value: '注册游客', label: '注册游客' },
      { value: '管理员', label: '管理员' },
      { value: '内容编辑', label: '内容编辑' },
    ]},
    { key: 'gender', label: '性别', type: 'select', options: [
      { value: '男', label: '男' },
      { value: '女', label: '女' },
      { value: '保密', label: '保密' },
    ]},
    { key: 'status', label: '状态', type: 'select', required: true, options: [
      { value: '正常', label: '正常' },
      { value: '禁用', label: '禁用' },
    ]},
    { key: 'bio', label: '个人简介', type: 'textarea', placeholder: '选填，介绍一下这位用户' },
  ];

  // ---- 表格列定义 ----
  const COLUMNS = [
    {
      key: 'name', label: '用户',
      render(r) {
        const avatar = r.avatar
          ? `<img class="avatar avatar--sm" src="${Crud.escapeHtml(r.avatar)}" alt="">`
          : `<span class="avatar avatar--sm">${Crud.avatarChar(r.name)}</span>`;
        return `<div style="display:flex;align-items:center;gap:10px">${avatar}<div><div class="data-table__name">${Crud.escapeHtml(r.name)}</div><div style="font-size:var(--fs-xs);color:var(--c-ink-400)">${Crud.escapeHtml(r.email || '未填邮箱')}</div></div></div>`;
      },
    },
    { key: 'phone', label: '手机号', render: r => `<span style="font-family:var(--ff-mono)">${Crud.escapeHtml(r.phone || '—')}</span>` },
    { key: 'role', label: '角色', render: r => `<span class="badge ${r.role === '管理员' ? 'badge--brand' : r.role === '内容编辑' ? 'badge--info' : 'badge--neutral'}">${Crud.escapeHtml(r.role)}</span>` },
    { key: 'gender', label: '性别', render: r => Crud.escapeHtml(r.gender || '保密') },
    { key: 'status', label: '状态', render: r => `<span class="badge ${r.status === '正常' ? 'badge--success' : 'badge--danger'}">${Crud.escapeHtml(r.status)}</span>` },
    { key: 'registeredAt', label: '注册时间', render: r => Crud.fmtDate(r.createdAt, true) },
  ];

  // ---- 模拟初始数据 ----
  const DEFAULT_DATA = [
    { id: 'u001', name: '陈思远', phone: '13800001111', email: 'chensy@example.com', role: '注册游客', gender: '男', status: '正常', bio: '泉州本地文史爱好者', createdAt: '2026-06-15T09:30:00' },
    { id: 'u002', name: '林婉清', phone: '13900002222', email: 'linwq@example.com', role: '管理员', gender: '女', status: '正常', bio: '海丝馆内容运营负责人', createdAt: '2026-05-20T14:00:00' },
    { id: 'u003', name: '王浩然', phone: '13700003333', email: '', role: '注册游客', gender: '男', status: '正常', bio: '', createdAt: '2026-07-01T10:15:00' },
    { id: 'u004', name: '赵雅芝', phone: '13600004444', email: 'zhaoyz@example.com', role: '内容编辑', gender: '女', status: '禁用', bio: '负责 UE 活动文案', createdAt: '2026-06-28T16:45:00' },
  ];

  const db = Crud.store('users', DEFAULT_DATA);
  let keyword = '';
  let roleFilter = '';

  // ---- 渲染 ----
  function render() {
    let list = db.all();
    if (roleFilter) list = list.filter(r => r.role === roleFilter);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(r =>
        (r.name || '').toLowerCase().includes(kw) ||
        (r.phone || '').includes(kw) ||
        (r.email || '').toLowerCase().includes(kw)
      );
    }

    // 统计卡片
    const all = db.all();
    const active = all.filter(r => r.status === '正常').length;
    const admins = all.filter(r => r.role === '管理员' || r.role === '内容编辑').length;
    const guests = all.filter(r => r.role === '注册游客').length;
    document.getElementById('stat-row').innerHTML = `
      <div class="stat-card"><div class="stat-card__num">${all.length}</div><div class="stat-card__label">用户总数</div></div>
      <div class="stat-card"><div class="stat-card__num">${guests}</div><div class="stat-card__label">注册游客</div></div>
      <div class="stat-card"><div class="stat-card__num">${admins}</div><div class="stat-card__label">管理人员</div></div>
      <div class="stat-card"><div class="stat-card__num">${active}</div><div class="stat-card__label">正常状态</div></div>
    `;

    document.getElementById('count-text').textContent = `共 ${list.length} 条`;
    Crud.table({
      mount: document.getElementById('table-mount'),
      columns: COLUMNS,
      rows: list,
      rowKey: 'id',
      actions: [
        { label: '编辑', onClick: openEdit },
        { label: '删除', type: 'danger', onClick: openDelete },
      ],
      emptyText: keyword || roleFilter ? '没有匹配的用户' : '暂无用户',
    });
  }

  // ---- 新增 ----
  function openAdd() {
    Crud.openForm({
      title: '新增用户（注册）',
      fields: FIELDS,
      submitText: '创建用户',
      onSubmit: (data) => {
        db.add(data);
        Crud.toast('用户创建成功', 'success');
        render();
      },
    });
  }

  // ---- 编辑 ----
  function openEdit(row) {
    Crud.openForm({
      title: '编辑用户信息',
      fields: FIELDS,
      values: row,
      submitText: '保存修改',
      onSubmit: (data) => {
        db.update(row.id, data);
        Crud.toast('已保存修改', 'success');
        render();
      },
    });
  }

  // ---- 删除 ----
  function openDelete(row) {
    Crud.confirm(`确定删除用户「${row.name}」吗？此操作不可撤销。`, () => {
      db.remove(row.id);
      Crud.toast('用户已删除', 'success');
      render();
    }, { title: '删除用户', yesText: '确认删除', danger: true });
  }

  // ---- 事件绑定 ----
  document.getElementById('btn-add-user').addEventListener('click', openAdd);
  document.getElementById('search-input').addEventListener('input', (e) => {
    keyword = e.target.value.trim();
    render();
  });
  document.getElementById('filter-role').addEventListener('change', (e) => {
    roleFilter = e.target.value;
    render();
  });

  // 首次渲染
  render();
})();
