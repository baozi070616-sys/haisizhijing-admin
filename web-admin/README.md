# 海丝智境 · 管理端（web-admin）

> 媒体资源管理模块 — A3
> 这是小组项目里你负责的"内容运营管理端"前端原型。

---

## 1. 快速开始

### 1.1 用 VSCode 打开

```bash
# 在 VSCode 中打开本目录
code D:\新建文件夹\haisizhijing\apps\web-admin
```

### 1.2 在浏览器中打开

有两种方式，二选一：

#### 方式 A：直接双击 `index.html`（最简单）
打开文件资源管理器，进入 `D:\新建文件夹\haisizhijing\apps\web-admin`，双击 `index.html` 即可在默认浏览器中看到效果。

> 注意：直接 `file://` 打开时，浏览器的 `fetch`/`ES Modules` 会受到限制。
> 本项目目前是纯静态 HTML + 原生 JS，不依赖任何模块或远程接口，所以可以直接打开。

#### 方式 B：用 VSCode Live Server 扩展（推荐）
1. VSCode 左侧扩展商店搜索 **Live Server**（作者 Ritwick Dey）安装
2. 在 VSCode 中右键 `index.html` → **Open with Live Server**
3. 浏览器自动打开 `http://127.0.0.1:5500/`，修改任何文件后浏览器自动刷新

#### 方式 C：用 Python 起本地服务（如果你装了 Python）
```bash
cd D:\新建文件夹\haisizhijing\apps\web-admin
python -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080/
```

---

## 2. 目录结构

```
web-admin/
├── index.html              ← 入口页面（媒体资源管理）
├── css/
│   ├── variables.css       ← 设计令牌：颜色/间距/圆角/阴影
│   ├── reset.css           ← 浏览器样式重置
│   ├── sidebar.css         ← 左侧导航
│   ├── layout.css          ← 整体布局 + 顶部栏
│   ├── main.css            ← 页面标题、提示条、工具栏
│   ├── cards.css           ← 资源卡片网格
│   └── detail-panel.css    ← 右侧详情面板
├── js/
│   ├── data.js             ← 模拟数据（8 条资源）
│   ├── render.js           ← 渲染层：把数据转 DOM
│   └── main.js             ← 入口 + 交互
├── pages/                  ← 留作后续：工作台 / 内容管理 / 活动运营等
└── README.md               ← 本文件
```

---

## 3. 演示的功能

| 能力 | 操作 | 位置 |
| --- | --- | --- |
| Tab 筛选 | 切换"全部 / 图片 / 视频 / 文档" | 主区 |
| 搜索 | 输入资源名/编号关键字 | 主区 |
| 选中资源 | 点击任一卡片 → 右侧详情自动更新 | 主区 |
| 关闭详情 | 点击详情右上角 ✕ 或按 Esc | 详情面板 |
| 打开详情 | 右下角浮动按钮 | 浮动按钮 |
| 其它模块 | 点击侧栏其它项 → 弹"即将上线"提示 | 侧栏 |
| 上传按钮 | 顶部右上角 → 弹演示提示 | 顶部 |

---

## 4. 跟项目规划文档的对应关系

按《海丝智境-项目规划.md》第十节的 Monorepo 约定，本目录对应：

```
haisizhijing/
└── apps/
    └── web-admin/      ← 本目录，管理端前端
```

后续要补的目录（小组分工时会用到）：

```
haisizhijing/
├── apps/
│   ├── web-admin/          ← 本目录
│   ├── web-portal/         ← 官方门户端（其他组员）
│   ├── api-server/         ← 后端服务（你或后端同学）
│   └── launcher/           ← UE 启动器（后期）
├── packages/
│   ├── api-types/          ← 前后端共用的 TS 类型
│   ├── validation-schemas/ ← 校验规则
│   └── shared-constants/   ← 共享常量（活动状态、版本状态等）
├── infrastructure/         ← nginx / docker / 数据库脚本
├── docs/                   ← 设计稿 / 接口文档
└── unreal/
    └── HaisiExperience/    ← UE 客户端工程
```

---

## 5. 怎么接你的 SSM / MyBatis 后端

你现在正在学 SSM（Spring + SpringMVC + MyBatis），**这条技术栈完全可以直接接本项目**。

### 5.1 数据结构对应

`js/data.js` 里 `RESOURCES` 数组的每一条，对应数据库表 `media_resource`：

```sql
CREATE TABLE media_resource (
  id              VARCHAR(20)  PRIMARY KEY,   -- ASSET-1001 / DOC-2023
  name            VARCHAR(200) NOT NULL,      -- 资源名
  type            VARCHAR(10)  NOT NULL,      -- image / video / doc
  thumb_class     VARCHAR(50),                -- thumb--hero 等
  size_text       VARCHAR(20),                -- "4.5 MB"
  size_bytes      BIGINT,
  format          VARCHAR(10),                -- PNG / MP4 / PDF
  resolution      VARCHAR(50),
  duration        VARCHAR(10),                -- 视频时长
  category        VARCHAR(50),
  uploaded_at     DATETIME,
  uploader        VARCHAR(50),
  status          VARCHAR(20),                -- published / draft / empty
  mounted_count   INT             DEFAULT 0
);
```

引用关系单独一张表：

```sql
CREATE TABLE media_reference (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  resource_id  VARCHAR(20)  NOT NULL,
  ref_name     VARCHAR(200) NOT NULL,
  ref_meta     VARCHAR(200),
  ref_icon     VARCHAR(20),
  FOREIGN KEY (resource_id) REFERENCES media_resource(id)
);
```

### 5.2 后端接口（REST）

```
GET    /api/admin/media              → 资源列表（分页 + 筛选）
GET    /api/admin/media/{id}         → 单个资源详情
GET    /api/admin/media/{id}/refs    → 引用关系列表
POST   /api/admin/media              → 上传/创建
PUT    /api/admin/media/{id}         → 更新
DELETE /api/admin/media/{id}         → 删除（有引用时拒绝）
POST   /api/admin/media/upload       → 文件上传（multipart）
```

### 5.3 把模拟数据换成真实接口

打开 `js/main.js`，把最上面：

```js
const state = {
  resources: RESOURCES,   // ← 改成从后端拉
  ...
};
```

替换为：

```js
const state = {
  resources: [],
  ...
};

// 启动时拉数据
fetch('/api/admin/media?type=' + state.currentType)
  .then(r => r.json())
  .then(list => {
    state.resources = list.data || list;
    renderCards();
    renderDetailPanel();
  });
```

> 跨域问题：开发阶段在后端 SpringBoot 里加一个 CORS 配置类，
> 允许 `http://127.0.0.1:5500`（Live Server 端口）即可。

### 5.4 你的 MySQL 8.0.32 现状

上一轮已经处理过兼容（root 改成 `mysql_native_password`），所以 MyBatis 用课程原版老驱动 5.1.47 也能直连 `spring_db`。等你给本项目建好 `haisizhijing` 库后，连接信息：

```properties
jdbc.url=jdbc:mysql://localhost:3406/haisizhijing?useSSL=false&characterEncoding=utf8
jdbc.username=root
jdbc.password=root
```

---

## 6. 设计系统速查

所有视觉参数都在 `css/variables.css` 里统一管理——以后想换主题色，改这一处即可。

| 用途 | 颜色变量 |
| --- | --- |
| 主蓝（按钮、链接） | `--c-brand-500: #3B6CFF` |
| 侧栏深蓝 | `--c-side-bg: #0F1E3D` |
| 主区背景 | `--c-bg: #F4F6FA` |
| 卡片背景 | `--c-card: #FFFFFF` |
| 主文字 | `--c-ink-900: #0E1530` |
| 次要文字 | `--c-ink-500: #5A6280` |
| 警告/已挂载 | `--c-warn-bg: #FFF1E0` / `--c-warn-ink: #C7540A` |

---

## 7. 后续可以加的东西（按规划文档优先级）

按《项目规划》第十二节的优先级，你这个 M3 模块接下来要补的：

- [ ] 真正的文件上传（multipart + 进度条 + OSS/MinIO 存储）
- [ ] 资源替换（保留 asset_id，重置 version）
- [ ] 标签管理（多对多 `media_tag`）
- [ ] 引用关系图（哪些活动 / 哪些页面在用）
- [ ] 删除前的引用检查（接口里强制校验）
- [ ] 操作审计日志（`media_audit_log`）
- [ ] 工作台页（数据看板）
- [ ] 内容管理 / 活动运营 / UE 配置 / 客户端版本 四个模块
- [ ] 登录页 + 鉴权（JWT）
- [ ] 接 SpringBoot / MyBatis 后端，部署到内网
