# AutoWatch AD

## 项目定位

AutoWatch AD 是一个**独立 APK**，安装到手机后即可自行运行：

- **独立 APK**：不依赖 AScript、不需要电脑、不需要配置 IP，装到手机上就能用。
- **纯本地运行**：所有逻辑都在本机完成，不上传任何数据，不访问网络服务。
- 目标 App：**汽水音乐**，包名为 `com.luna.music`。

## 构建与安装

1. **Fork 仓库**：点击仓库右上角 Fork，把本仓库复制到你自己的账号下。
2. **运行 Actions**：进入你 fork 的仓库，打开 `Actions` 标签，找到 `Build Debug APK`，点击 `Run workflow` 手动触发一次构建。
3. **下载 APK**：构建完成后，进入该次运行页面，在页面底部 `Artifacts` 区域下载 `autowatch-ad-debug`，解压压缩包得到 `.apk` 文件。
4. **手机安装**：把 APK 传到手机，点击安装；系统提示“未知来源”时选择允许安装。
5. **开启无障碍权限**：打开手机 `系统设置` → `无障碍`（辅助功能）→ 找到 `AutoWatch AD` → 开启无障碍服务，并在弹窗中确认授权。
6. **回到 App 点开始**：返回 AutoWatch AD 主界面，点击 **开始** 按钮，程序即开始自动监听并跳过目标 App 的广告。

## 无障碍权限用途说明

本 App 申请的无障碍权限（`BIND_ACCESSIBILITY_SERVICE`）仅用于以下用途：

- 监听目标 App `com.luna.music` 的窗口状态与内容变化（`typeWindowStateChanged` / `typeWindowContentChanged`）。
- 当检测到广告界面上的关键词（如“立即领取”“继续观看”“关闭”等）时，辅助点击对应的跳过/关闭按钮。

权限范围被严格限制在 `com.luna.music` 这一个包名内，不会读取其他 App 的界面内容，也不会收集、上传任何个人信息。

## 30 天周期机制

- **首启计时**：首次成功启动并开始运行时，程序会把当前时间写入本地持久化记录（`firstRunMs`），作为 30 天周期的起点。
- **杀进程连续**：起点时间一经写入便不会重置；即使手动杀掉进程、重启手机或重新打开 App，30 天周期仍然连续计算，不会重新开始。
- **满 30 天自动停**：自首启时间起满 30 天（`30 * 24 * 60 * 60 * 1000` 毫秒）后，程序会自动停止，不再执行任何操作。

## 微调指引

实机适配时，只需要修改 `app/src/main/java/com/autowatch/ad/Config.java` 一个文件，然后重新构建安装：

- **关键词数组**：`ENTRY_KEYWORDS`、`CLAIM_SUCCESS_KEYWORDS`、`CLAIM_REWARD_KEYWORDS`、`CONTINUE_WATCH_KEYWORDS`、`CLOSE_KEYWORDS`、`RENEW_DIALOG_KEYWORDS`、`COUNTDOWN_KEYWORDS`。界面文案变化时改这里。
- **等待时长**：`AD_WAIT_MS`、`ENTRY_WAIT_MS`、`CLAIM1_WAIT_MS`、`CLAIM2_WAIT_MS`、`POLL_INTERVAL_MS`、`MAX_IDLE_ROUNDS`（单位：毫秒或轮数）。广告节奏快慢变化时改这里。
- **目标包名**：`TARGET_PACKAGE`（默认 `com.luna.music`）。目标 App 更换时改这里，同时要同步修改 `app/src/main/res/xml/accessibility_service_config.xml` 中的 `android:packageNames`。

改完后，按上面的“构建与安装”流程重新跑一次 Actions、下载新 APK 并安装即可生效。
