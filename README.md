# Paris StoryMap · 巴黎故事地图

[**打开公开 Demo**](https://paris-storymap-language-preview.liaoyanqing666.chatgpt.site)

[独立源码仓库](https://github.com/zhengxinyu31-byte/paris-storymap-mvp)

四道旅行偏好选择，推荐一条适合用户的巴黎故事线。路线以地图为主，点击 POI 才打开卡片；名人轶事帮助用户理解眼前的地点。

**主线：四题测试 → 人格解析与推荐 → 地图选点 → 阅读故事 → 下一站 → 阅读回顾。**

返回使用时可继续上次路线。同址轶事、人物与作品足迹按需展开，探索和收藏保留明确的返回位置。支持全局中文与英文。

目前包含 16 种人格、16 条主题线、119 个 POI 记录、260 则故事、313 个人物/作品索引和 119 张本地实景照片。118 个地点有独立故事，另有一个公墓父记录；SHAN 线保留两处明确标注的巴黎近郊地点。

**本地运行**需要 Node.js 22+ 和 npm：

```sh
npm ci
npm run dev
```

打开 `http://127.0.0.1:5175/`。生产构建使用 `npm run build`，本地查看构建结果使用 `npm run preview`（4175 端口）。不需要数据库、付费 API 或环境变量；只有重建知识库时需要 Python 3.9+。

| 需要了解什么 | 对应文档 |
| --- | --- |
| 线上版本、更新与回退、源码交付边界 | [发布与交接](docs/release-and-handoff.txt) |
| 全部交互、入口去向与主支线返回 | [完整动线梳理](docs/interaction-audit.txt) |
| 产品目标、当前功能与 MVP 边界 | [产品与流程](docs/product-and-flows.txt) |
| 代码结构、状态、路由和数据生成 | [架构说明](docs/architecture.txt) |
| POI 字段、故事来源、路线组合与编辑入口 | [知识库维护](docs/knowledge-base.txt) |
| 安装、测试、构建、部署和常见问题 | [开发与部署](docs/development-and-deployment.txt) |
| 名人轶事如何写得轻松且准确 | [内容审校标准](docs/content-standard.txt) |
| 原项目、资料出处、地图图片与已知限制 | [来源与限制](docs/sources-and-limitations.txt) |
| 已完成的检查及验证边界 | [验证记录](docs/validation.txt) |
| 四道原题及人格计分 | [人格测试来源](docs/personality-quiz-source.txt) |
| 全局语言切换实现 | [语言切换](docs/language-switch.txt) |

维护内容时编辑 `content/`，然后运行 `npm run kb`；`src/data/` 是生成结果。修改站序或坐标后才需要联网运行 `npm run paths`。`public/photos/` 保存图片，`test/` 保存自动检查，`docs/archive/` 仅留存历史方案。

```sh
npm test
npm run build
# 浏览器检查前先启动 npm run dev
npm run test:journey
npm run test:quiz
npm run test:language
node test/language-focus.mjs
npm run test:route-map
npm run test:photo-fit
```

网站公开访问与源码仓库权限分别管理。收藏、答题和阅读进度只保存在访问者自己的浏览器；地图底图依赖网络。源码仓库中的 CI 检查不自动发布网站。当前版本尚未包含账号、跨设备同步、实时交通或 AI 动态编故事。
