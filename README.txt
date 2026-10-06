Paris StoryMap · 巴黎故事地图 MVP

用故事线串起巴黎 POI。用户做四道选择题，即可得到旅行人格解析与对应路线；地图是路线页的主要入口，点击地点才展开故事卡片。

公开 Demo：https://paris-storymap-language-preview.liaoyanqing666.chatgpt.site
任何获得链接的人均可访问。GitHub 的可点击文档索引见 README.md；线上版本与更新方式见 docs/release-and-handoff.txt。

本地运行
需要 Node.js 22+、npm。重建知识库另需 Python 3.9+。
npm ci
npm run dev
浏览器打开 http://127.0.0.1:5175/
无需数据库、付费 API 或环境变量。

生产预览
npm run build
npm run preview
打开 http://127.0.0.1:4175/。dist/ 可以部署到静态托管服务；请通过 HTTP 访问，不要双击 HTML。

当前范围
16 种人格、16 条主题线、119 个 POI 记录、260 则故事、313 个人物/作品索引、119 张本地实景照片。
118 个地点有独立故事；另一个是公墓父记录。主题聚焦巴黎，其中 SHAN 保留两处有明确标记的巴黎近郊支线。
全局中英文、四题测试、地图选点、主线阅读、同址轶事、人物/作品足迹、知识库搜索、收藏、阅读进度、可分享链接。
人格用于推荐故事偏好，不是心理诊断；故事顺序不强制用户走完。

文档入口
- docs/release-and-handoff.txt：公开网址、已发布版本、源码交付、更新与回退
- docs/interaction-audit.txt：全部交互功能、主支线动线与精简依据
- docs/product-and-flows.txt：产品边界、功能与主支线链路
- docs/architecture.txt：代码结构、数据生成、状态与路由
- docs/knowledge-base.txt：POI、故事、路线、来源、图片字段及维护方法
- docs/development-and-deployment.txt：安装、测试、构建和部署
- docs/content-standard.txt：轻松叙事与史实准确的编辑规则、本轮修正
- docs/sources-and-limitations.txt：来源、外部服务、已知限制
- docs/validation.txt：本轮独立安装与回归结果
- docs/personality-quiz-source.txt：四道原题的来源与评分依据
- docs/language-switch.txt：语言切换的实现记录
- docs/archive/：历史说明，不作为当前规格

常用命令
npm test                 数据与状态测试
npm run kb               从 content/ 重建知识库和人物索引
npm run paths            联网更新路线缓存；仅修改站序或坐标后需要
npm run build            翻译检查与生产构建
npm run test:route-map    地图、卡片、16 条路线及手机端回归
npm run test:quiz         四题测试、人格结果及推荐链路
npm run test:journey      首访、继续路线、支线返回、搜索与收藏来源
npm run test:language     全局语言切换回归
npm run test:photo-fit    图片裁切与布局检查
浏览器测试先启动 dev 服务，默认读取 5175 端口。

2026-10-06 更新
首访进入四题推荐，返回使用恢复当前路线；导航聚焦“我的路线”。读完章节回到下一站地图；补充内容按需展开，搜索与收藏保留返回来源。
所有路线按相邻站点顺序统一连线，地图带方向箭头；不区分步行与换乘，不推荐交通方式。
补齐 11 个点位坐标，拉雪兹六个墓位可分别点选。POI 卡片显示下一站和导航链接。
重写存在主义路线标题，定向修订历史归因、世界遗产范围、发明权争议与未经限定的第一/唯一表述，并同步英文。
完整来源仍可在故事内查看。附有来源不等于所有历史细节均已独立复核。
