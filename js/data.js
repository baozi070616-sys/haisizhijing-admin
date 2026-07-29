/* ==========================================================================
   模拟数据
   --------------------------------------------------------------------------
   后期对接后端（MyBatis / Spring Boot）时，把这个文件替换成：
     fetch('/api/admin/media').then(r => r.json()).then(data => state.resources = data)
   数据结构本身是后端约定的 JSON 形态。
   ========================================================================== */

const RESOURCES = [
  {
    id: 'ASSET-1001',
    name: '泉州古港 · 主页主视觉',
    type: 'image',                      // image / video / doc
    thumbClass: 'thumb--hero',          // 缩略图配色类
    size: '4.5 MB',
    sizeBytes: 4718592,
    format: 'PNG',
    resolution: '3840×2160',
    category: '官网主视觉',
    uploadedAt: '2026-07-26 14:20',
    uploader: '林主编',
    status: 'published',
    mounted: 2,                         // 被引用次数
    references: [
      { name: '门户首页主视觉', meta: '门户内容管理 / Hero 区块', icon: 'layout' },
      { name: '宋元泉州港商贸探索 · 活动详情', meta: '活动运营 / ACT-2026-QZ', icon: 'flag' }
    ]
  },
  {
    id: 'ASSET-1007',
    name: '泉州港南侧预案 · 活动封面',
    type: 'image',
    thumbClass: 'thumb--poster',
    size: '3.2 MB',
    sizeBytes: 3355443,
    format: 'JPG',
    resolution: '2560×1440',
    category: '活动封面',
    uploadedAt: '2026-07-24 10:08',
    uploader: '林主编',
    status: 'published',
    mounted: 1,
    references: [
      { name: '2026 泉州港南侧预案活动', meta: '活动运营 / ACT-2026-QZ-N', icon: 'flag' }
    ]
  },
  {
    id: 'ASSET-1012',
    name: '海丝智境 · 项目总宣传 CG',
    type: 'video',
    thumbClass: 'thumb--cg',
    size: '682 MB',
    sizeBytes: 715128832,
    format: 'MP4',
    resolution: '3840×2160 · 60fps',
    duration: '02:48',
    category: 'CG 宣传片',
    uploadedAt: '2026-07-20 16:32',
    uploader: '张导演',
    status: 'published',
    mounted: 1,
    references: [
      { name: '官网首页 · CG 展示区', meta: '门户内容管理 / CG Block', icon: 'layout' }
    ]
  },
  {
    id: 'ASSET-1015',
    name: '古港清晨 · 场景氛围',
    type: 'video',
    thumbClass: 'thumb--scene',
    size: '12.1 MB',
    sizeBytes: 12683568,
    format: 'MP4',
    resolution: '1920×1080 · 30fps',
    duration: '00:18',
    category: '场景氛围',
    uploadedAt: '2026-07-18 09:45',
    uploader: '林主编',
    status: 'published',
    mounted: 0,
    references: []
  },
  {
    id: 'ASSET-1016',
    name: '古港日落 · 场景氛围',
    type: 'video',
    thumbClass: 'thumb--scene',
    size: '12.1 MB',
    sizeBytes: 12683568,
    format: 'MP4',
    resolution: '1920×1080 · 30fps',
    duration: '00:18',
    category: '场景氛围',
    uploadedAt: '2026-07-18 09:46',
    uploader: '林主编',
    status: 'published',
    mounted: 0,
    references: []
  },
  {
    id: 'ASSET-1018',
    name: '数字引导员 · 开场介绍',
    type: 'video',
    thumbClass: 'thumb--video',
    size: '84 MB',
    sizeBytes: 88080384,
    format: 'MP4',
    resolution: '1920×1080 · 30fps',
    duration: '01:24',
    category: '数字人视频',
    uploadedAt: '2026-07-15 11:20',
    uploader: '王制作',
    status: 'published',
    mounted: 1,
    references: [
      { name: 'UE 客户端大厅 · 开场引导', meta: 'UE 展厅配置 / Lobby 场景', icon: 'cube' }
    ]
  },
  {
    id: 'DOC-2023',
    name: '宋元泉州港商贸探索 · 项目说明',
    type: 'doc',
    thumbClass: 'thumb--doc',
    size: '11 MB',
    sizeBytes: 11534336,
    format: 'PDF',
    resolution: 'A4 · 32 页',
    category: '项目说明',
    uploadedAt: '2026-07-10 15:30',
    uploader: '陈编辑',
    status: 'published',
    mounted: 1,
    references: [
      { name: '游客个人中心 · 资料下载', meta: '游客端 / Downloads', icon: 'download' }
    ]
  },
  {
    id: 'ASSET-1020',
    name: '陶瓷贸易任务 · 插画（待上传）',
    type: 'image',
    thumbClass: 'thumb--empty',
    size: '—',
    sizeBytes: 0,
    format: '—',
    resolution: '—',
    category: '任务插画',
    uploadedAt: '—',
    uploader: '—',
    status: 'empty',
    mounted: 0,
    references: []
  }
];

// 分类辅助：根据 type 返回显示标签
const TYPE_LABELS = {
  all:   '全部',
  image: '图片',
  video: '视频',
  doc:   '文档'
};

const STATUS_LABELS = {
  published: '已发布',
  draft:     '草稿',
  empty:     '占位'
};
