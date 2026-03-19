核心价值： 让普通用户一眼看穿 macOS 后台 App 的网络行为，通过地理可视化和行为审计，解决“谁在传我数据”的隐私焦虑。
一、核心技术栈选型
1. 基础框架层
    •    运行时： Electron
    •    工程化： electron-vite
    •    前端框架： Vue 3 (Composition API) + TypeScript。


2. 前端表现层
    •    样式/UI： TailwindCSS + Radix Vue (或类似 Headless UI)。
    ◦    视觉风格： macOS 自带的透明模糊 (Vibrancy)、SF Pro 字体、大圆角卡片。
    •    
    •    数据可视化：
    ◦    ECharts (Map)：用于展示全球连接地图。
    ◦    D3.js / Canvas：用于制作灵动的、类似雷达的实时气泡流或流向图。
    •    
    •    状态管理： Pinia (存储实时的进程流量快照)。



二、界面设计方案 
设计风格定调：Glassmorphism (玻璃拟态) + Apple Design Resources (SF Pro 字体)。
1. 核心视图：全球流量雷达 (Global Radar View)
    •    左侧 (3/4 区域)：3D/2.5D 全球地图
    ◦    使用 ECharts 或 Three.js 渲染一个暗色调的极简地图。
    ◦    动态流向线： 当 WeChat 向深圳服务器发送数据时，地图上会有一条从用户所在地（起点）发射到深圳（终点）的亮色流向线。
    ◦    气泡感： 流量越大的节点，圆点越大，颜色越深（橙红表示高频，淡蓝表示心跳包）。
    •    
    •    右侧 (1/4 区域)：实时动态流 (Live Stream)
    ◦    类似代码滚动的瀑布流，显示：[14:20:01] Music.app -> Japan (Sony Music Server) 1.2MB。
    •    


2. 进程清单页 (Process Inspector)
    •    卡片式布局： 每个 App 是一个磨砂玻璃质感的卡片。
    •    关键指标：
    ◦    App 图标、名称、PID。
    ◦    地理归属地： 旗帜图标 + 国家/城市名。
    ◦    安全评级： 绿/黄/红（基于是否是已知 CDN、是否是系统进程、是否有加密）。
    •    
    •    交互： 点击卡片，侧滑出详情页。


3. 详情页/审计页 (Audit Detail)
    •    域名解析： 不仅显示 IP，还要通过反向 DNS 显示 api.growingio.com（让用户一眼看出这是统计插件）。
    •    流量图表： 展示过去 24 小时的流量峰值（D3.js 绘制的阶梯图）。
    •    断点追踪： 显示该 App 历史上访问过的所有国家分布。


**核心约定**
1. 禁止直接给出我代码
2. 使用引导性问答来启发我的思考
3. 我没有electron基础，这部分可以直接给出我代码