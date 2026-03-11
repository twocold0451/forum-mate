# ForumMate (论坛增强助手)

ForumMate 是一个面向论坛场景的浏览器辅助工具。当前已支持 [2libra.com](https://2libra.com/)、[middlefun.com](https://middlefun.com/)、[v2ex.com](https://v2ex.com/) 与 [linux.do](https://linux.do/)（均支持子域名），后续会继续扩展更多论坛。

## 📥 安装方式

### 油猴脚本一键安装
1. 点击 [GreasyFork一键安装](https://greasyfork.org/en/scripts/562089)
2. 点击“安装此脚本”
3. 脚本会自动在 Tampermonkey 中打开，点击保存

### GitHub 直接安装
1. **安装扩展**：确保你的浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展。
2. **安装脚本**：
   - 点击 [forummate-tampermonkey.user.js](https://raw.githubusercontent.com/twocold0451/forum-mate/main/forummate-tampermonkey.user.js) 链接。
   - Tampermonkey 会自动识别并提示安装，点击“安装”即可。
3. **开始使用**：刷新已支持的论坛页面即可生效。

## 🌐 支持的网站

### 2libra.com
- 当前能力：帖子快速预览、纯净模式、通知快速查看、返回顶部按钮

#### 功能说明
- **快速预览 (Quick View)**：弹窗中预览主题内容。
- **通知快速查看**：点击通知入口可在弹窗中快速查看通知内容。
- **返回顶部按钮**：滚动后显示悬浮按钮。

### middlefun.com
- 当前能力：点击帖子标题快速预览、返回顶部按钮

#### 功能说明
- **点击帖子标题快速查看**：弹窗中预览主题内容。
- **返回顶部按钮**：滚动后显示悬浮按钮。

### v2ex.com
- 当前能力：点击帖子标题快速查看、按频道与标题关键字屏蔽帖子、返回顶部按钮

#### 功能说明
- **点击帖子标题快速查看**：弹窗中预览主题内容。
- **频道屏蔽**：可按频道中文名或英文 slug 屏蔽帖子，支持多个频道。
- **频道/标题独立屏蔽**：`屏蔽频道` 与 `标题关键字` 都可单独生效，不再要求必须同时填写。
- **规则关系可选**：当两项都填写时，可在设置里选择 `and` 或 `or` 关系决定命中方式。
- **返回顶部按钮**：滚动后显示悬浮按钮。

### linux.do
- 当前能力：点击帖子标题快速查看、返回顶部按钮

#### 功能说明
- **点击帖子标题快速查看**：弹窗中预览主题内容。
- **返回顶部按钮**：滚动后显示悬浮按钮。

## ⚙️ 设置说明

- 设置项按站点分组展示（2libra / middlefun / v2ex / linux.do）。
- 默认行为为：**当前访问站点展开，其他站点折叠**。
- 支持站点分组手动展开/收起。
- 支持按站点分别设置预览弹窗宽度。
- 支持一键 **展开全部 / 收起全部**。


## 赞赏支持

如果 ForumMate 对你有帮助，欢迎扫码支持继续更新。

<img src="wx_appreciation_code.jpg" alt="微信赞赏码" width="240" />

---
Author: [twocold0451](https://github.com/twocold0451)
License: MIT


