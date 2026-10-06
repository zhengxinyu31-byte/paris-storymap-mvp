Paris StoryMap v3 · 巴黎故事地图

打开预览
npm install
npm run dev
http://127.0.0.1:5175/

构建静态站
npm run build
npm run preview
构建产物在 dist/，需要通过HTTP服务打开，不直接双击HTML。

本轮内容
以 paris-storymap c1d190e 为主要内容与页面结构依据。
完整NERD八章、17篇本轮深度人物故事；其余人格恢复原项目的具体主题。
119个POI、260条公开故事条目、16条主题路线。
原研究中的同地点关联、人物、作品、轶事均以POI为中心汇总。
正文、关联人物、同地点其他故事、相关主题、观察提示、来源与访问说明分层呈现。
可用四道选择题匹配人格与故事线，也可直接选人格进入路线；点击人物/作品可跨地点阅读。
保留收藏、深链接与进度；自由浏览知识库不自动推进某条路线。

数据结构及编辑
content/input/storymap/：原仓库数据快照，保留原始史料与原分级，不直接作为最终公开库。
content/input/v1/：上一版数据快照，仅作为补充素材。
content/nerd.json：八章人物叙事与支线，含逐篇证据URL。
content/culture-routes.json：CTRL/BLUE/MYTH/BUDD主题补充。
content/film-routes.json：DODO/GOAT/TIME/BEE主题补充。
content/editorial-overrides.json：同源冲突修正、公开候选移除及引用替换。
content/coordinates.json：地址或地标坐标；未定位墓位不伪造。
content/geocode-evidence.json、landmark-evidence.json：IGN响应及匹配依据。
tools/build_kb.py：可重复生成 src/data 的本地构建程序。
npm run kb：根据输入和编辑记录重建知识库。

公开知识库
src/data/pois.json 地点主记录
src/data/stories.json 人物/作品/事件故事与证据引用
src/data/routes.json 有序章节及所选story_id，不复制故事事实
src/data/personas.json 人格标签与推荐入口
src/data/sources.json 来源URL、标题、发布机构
src/data/media.json 本地图片、来源、地点匹配说明及核对状态
src/data/paths.json NERD实际步行路线使用；其他旧路径没有用于新版主题

证据说明
附资料来源 = 该条有列出的依据，不等于所有字段均已独立复核。
带着出处读 = 回忆录、经营方介绍、单方说法或原分级尚未统一的内容。
记载有出入/传说辨读 = 需要阅读对照与caveat的内容。
本轮重点核查原八站与前九条主题；原第二批研究保留来源和争议说明。
13条原故事退出公开库，研究原稿仍在input/中；5条已定向更正。

位置与游览
地图显示已取得的地址/地标位置，不把它们当作已核验入口。
公墓子POI提供官方墓区资料，精确墓位未定位；界面有列表降级。
部分主题跨区或含城外支线，章节顺序不是全部可连续步行的承诺。
NERD绘制预取的FOSSGIS步行路网；其他主题显示地点分布。
无网时本地故事可读；首次加载仍需本地服务器，未实现离线安装/PWA。
入场、价格、开放和街头作品存续请看所附官方页面。

图片与地图
119个POI均有本地实景照片，覆盖118个可阅读地点与1个公墓父记录。
批量检索 Commons / 百科地点页，结合官方页面与摄影/旅行报道补齐；逐张按地址、分店、墓主、路段核对。
content/photo-manifest.json 为图片主记录；来源链接、中文说明、地点匹配依据、校验哈希和图片尺寸一并保留。
照片压缩为 WebP，合计约21 MB；路线章节、探索卡片和地点详情均可见，按需延迟加载，无付费图片API和运行时图片外链。
原址铭牌、建筑底层和历史照片均写明画面内容；不表示现场当前状态或允许入内。
下载失效时才显示城市意象插画。
维护：tools/prepare_photos.py 下载已人工选定的图片；启动本地预览后运行 node tools/optimize_photos.mjs 压缩；npm run kb 写回POI媒体关联。
重新构建知识库不需要联网取图。新增候选必须核对后才写入 photo-selections.json 或 photo-special-*.json。
底图：MapLibre / OpenFreeMap / OpenMapTiles / OpenStreetMap，署名在地图内。
步行路径：FOSSGIS OSRM / OpenStreetMap；生成记录由上版沿用，仅用于相同NERD站序。
地理编码：IGN Géoplateforme（BAN / BD TOPO），只读请求，保留匹配记录。
https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/

验证
npm test：16项数据/状态/归一化测试。
npm run test:browser：桌面手机、全部16主题、人物跨点、同点多故事、收藏、刷新、自由阅读和无网降级。
浏览器脚本使用本机Chrome，可在test/browser.mjs修改executablePath。
artifacts/保存检查结果及截图。

本轮 v3 交互升级（参考 cuizicheng1024/storymap 的设计，不复制代码/素材）
人物/作品从弹窗升级为可分享的故事时间线与地点地图。
人物时间线显示原 when 文本，按首个明确年份排序；未知年代保留，不代表完整生平。
主线进入同址轶事/人物足迹后，origin 参数保留原章节；支线不会推进主线。
点击“为什么在这里 / 人物关系 / 今天看什么 / 争议辨读”直接读现有资料与出处。
src/data/entities.json：313 个人物/作品实体，含别名、POI、故事、年代及来源引用。
tools/build_entities.mjs 生成该衍生索引；运行时从同一 stories 原始记录计算足迹，避免两份事实。
119个POI记录包含1个无独立故事的公墓父条目，探索页118个阅读地点。
node test/map.mjs：真实 MapLibre 引擎 + 固定底图响应验证镜头、选点与总览。
参考项目完整分析与阅读证据在上层 repo-review/，不属于旅行产品界面。

图片验证：node test/photos-browser.mjs 在阻断外网的情况下解码119张图片，并检查118张探索卡片、路线照片、手机布局和加载失败降级。

产品方向校正：以故事线串联巴黎POI。人格是推荐入口，每个地点是一个章节，人物/作品是叙事素材和补充阅读。
探索页首屏推荐故事线；总览展示章节作用和转场；地点页标记当前故事线；人物支线从当前章节展开并可返回，不改变主线进度。
数据继续以POI维护，通过路线各章的poi_id/story_id引用实现多线共享；完整方向约束见 docs/product-direction.txt。

内容边界：项目聚焦巴黎。cuizicheng1024/storymap 仅供交互参考，不引入其中的中国历史人物、城市或历史事件。人物和作品只有与巴黎具体POI及故事线存在可查证关联时才收录。

全局中英文切换
右上角语言按钮可选中文或 English，默认中文；当前浏览器自动记住选择。
导航、16条故事线、260则完整故事、POI、人物作品、图片说明、来源、地图控件和弹窗同步切换。
语言偏好使用独立 localStorage 键 paris-storymap-language；不改写路线ID、URL、收藏或阅读进度。
content/i18n/en-*.json 保存本地英文词典，zh-ui.json 保存中文装饰标题与地图控件。
中文知识库是规范记录；按完整源字符串映射英文，保持现有POI与故事引用。
译文随站点一起打包，阅读过程不调用翻译服务、不需翻译API密钥。
修改中文源文本后，应同步更新对应英文词条；npm run build 会先验证知识库全部展示字段的译文覆盖。
搜索始终检索中文和英文，切换语言保留查询条件和结果。
npm run test:language：全字段覆盖 + 16条路线/260则全文 + 名称和无障碍文案 + 搜索 + 收藏/进度 + 390/320像素手机检查。
UI字典 en-ui.json、名称 en-names.json、路线 en-routes.json、故事 en-stories-1/2/3.json、图片与地点说明 en-misc.json。

路线地图页（2026-10-06）
路线首页以一张大地图为主体，不再平铺全部POI和故事卡片。
初始显示编号点位；点选后只展开一个地点卡片，包含照片、章节、轶事标题和摘要。
点击“读这则故事”进入原有完整正文；返回时保留当前地图卡片，收藏、进度和支线逻辑不变。
关闭卡片、Escape或“查看全部地点”回到地图总览。卡片可切换上/下一个地点。
路线简介和步行说明收在地图内的“路线简介”入口。
地图上相邻点位自动错开标记，并以细线连回真实坐标；缩放时重新排布。
未核验墓位共用公墓入口标记，通过卡片切换各则故事并注明需按官方墓区导览寻找。
其他缺少可靠坐标的POI保留在可展开的“地点待定位”入口，不补造坐标。
底图服务异常时显示本地点位方位示意，仍可点选故事，不依赖付费地图服务。
手机端地图底部显示紧凑卡片；全局中英文切换覆盖新增文案。
npm run test:route-map 验证大地图、初始无卡片、点选/关闭、全文往返、16条路线、手机与底图异常。

四题旅行人格测试（2026-10-06）
直接预览：http://127.0.0.1:5175/#/quiz
导航“旅行人格测试”、故事线选择弹窗和探索页均可进入；测试为可选入口。
题目从最初 paris-storymap 项目的12题中提取第1、4、7、12题，保留原有三个选项及双语原文。
四个维度分别是文化兴趣、计划习惯、社交偏好和消费倾向。
一屏一题，选择后280ms自动继续；第四题后直接展示人格解析、四个实际偏好、推荐理由与故事线。
推荐按钮进入对应人格的大地图，点击地图POI才显示卡片，再进入完整故事正文。
支持上一题修改、结果页修改答案、重新测试、刷新恢复、答题中切换中英文。
答题使用独立localStorage键 paris-storymap-quiz-v1，不改变收藏、阅读进度或语言偏好。
无法使用localStorage时仍可完成本次测试；跨刷新保存不可用。
content/personality-quiz.json 保存四道原题、人格画像及源文件SHA256；content/i18n/en-quiz.json 保存新增英文文案。
src/quiz-model.mjs 负责纯计分与存储校验，PersonalityQuiz.jsx 负责问答、结果与推荐交互。
每个维度原有三个0/1/2分问题，原判定阈值为累计>=4；四题版将单题分乘3后沿用阈值。
因此第三选项为较高倾向，第一、二选项为另一组。16种人格均可到达，但这是简化推荐，不等同于原12题结果。
中间选项的结果解析按实际选择生成，避免把“有大致计划”描述为“没有计划”。
推荐使用当前personas.default_route_id，不复制原Demo中多数人格都指向nerd的themeId。
本轮修正了7条旧人格推荐理由与当前路线不一致的内容，并修正CUTE实际8章的说明；修改由editorial-overrides.json重建。
详细题目溯源和选题理由：docs/personality-quiz-source.txt。
npm test：枚举81种答案组合、16种人格可达、修改计分、输入校验与深链接。
npm run test:quiz：浏览器逐一走通16种人格→地图，双击保护、改选、刷新、双语、收藏/进度、手机和存储异常。

图片比例与取景修正（2026-10-06）
逐张检查119张照片，修复22张contain图片在横卡、竖卡中的留边；所有图片等比填满容器。
75张照片设置单独的横向/纵向裁切位置，保留建筑、店招、人物雕像、墓碑与阿拉戈铜牌等可识别主体。
取景位置保存在content/photo-manifest.json的crop.landscape与crop.portrait，并同步到src/data/media.json。
原始119张实景照片、来源、尺寸与文件哈希均保留；以浏览器裁切避免重复压缩和新增图片请求。
手机地图卡片采用88×88缩略图，避免把图片挤成64像素宽的长条；故事信息与阅读按钮仍在同一卡片。
修复探索卡片因正文长短不同而使图片上下居中的留空，图片统一贴齐卡片顶部。
统一样式在src/photos.css，照片组件提供每张图片的取景变量；重新生成知识库会保留取景记录。
npm run test:photo-fit 检查探索页、地图卡片、正文和16种人格结果页在桌面与手机上的图片边界及填充方式。
node test/photo-crop-contact.mjs 生成119张照片的横向/纵向裁切对照图；供逐张人工复查。
