# Reflect

面向 Mac 与 iPhone 的纯文件笔记:每日笔记、双向链接、本地搜索,以及基于你自己的 Markdown 的可选 AI。

[![Release](https://img.shields.io/github/v/release/team-reflect/reflect-open)](https://github.com/team-reflect/reflect-open/releases/latest)
[![CI](https://github.com/team-reflect/reflect-open/actions/workflows/ci.yml/badge.svg)](https://github.com/team-reflect/reflect-open/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Reflect 是一款围绕一文件夹 Markdown 文件构建的开源笔记应用。它打开即今日笔记,用 `[[双向链接]]` 把人物、项目与想法串联起来,并保持搜索与反向链接的迅捷,而不会把你的笔记变成只能由本应用读取的数据库。

本应用不需要 Reflect 账户。笔记存放在你自选的文件夹中,可选服务(如 AI 服务商、转写、iCloud、GitHub 或其它 git 远程仓库)均由用户自行连接。

<img width="2926" height="1800" alt="Reflect" src="https://github.com/user-attachments/assets/6da0e0d2-3f25-4fc4-850c-b764548c3abe" />

## 功能特性

- **每日笔记:** 应用打开即今日笔记,所有速记默认汇入此处。
- **双向链接与反向链接:** 输入 `[[` 即可链接笔记;每条笔记都会展示链接到它的其它笔记。
- **本地搜索:** `⌘K` 搜索笔记、反向链接与标签;可选在本地启用语义搜索。
- **向你的笔记提问:** `⌘J` 可通过用户自备的 OpenAI、Anthropic、Google 或 OpenRouter 密钥查询笔记,回答会引用来源笔记。
- **私密笔记:** `private: true` 可将笔记内容排除在 AI 及其它外部服务之外。
- **语音备忘:** 录制音频并经已配置的转写服务商转写为文字,写入每日笔记。
- **浏览器采集:** 从 Chrome 保存链接、选中文本、截图与页面正文。
- **同步方式:** 使用 iCloud Drive 做文件同步,或用 git/GitHub 做带版本历史的备份。
- **命令行:** `reflect today`、`reflect search`、`reflect show` 可供脚本与智能体调用,详见 [docs/cli.md](docs/cli.md)。

## 安装

1. **安装 Mac 版。** 下载适合你 Mac 的最新版本:
   - **稳定版:** [Apple 芯片(M 系列)](https://github.com/team-reflect/reflect-open/releases/latest/download/Reflect_aarch64.dmg) · [Intel](https://github.com/team-reflect/reflect-open/releases/latest/download/Reflect_x86_64.dmg)
   - **测试版:** [Apple 芯片(M 系列)](https://github.com/team-reflect/reflect-open/releases/download/updater-beta/Reflect.Beta_aarch64.dmg) · [Intel](https://github.com/team-reflect/reflect-open/releases/download/updater-beta/Reflect.Beta_x86_64.dmg)

   每个构建均经过签名与公证,并通过 GitHub Releases 自动更新。你也可以[查看全部发布版本](https://github.com/team-reflect/reflect-open/releases)。
2. **安装 iOS 测试版。** 加入 [TestFlight](https://testflight.apple.com/join/j2eEz43d)。iOS 应用与 Mac 版使用相同的纯文件图谱与同步选项。
3. **安装 Chrome 扩展。** 从 Chrome 应用商店添加 [Reflect Capture](https://chromewebstore.google.com/detail/reflect-capture/ccabifmooehighoonjeiololjfofkhkd),即可从 Chrome 保存当前页面、选中文本、截图与可选的页面正文。

你也可以[从源码构建](#从源码构建)。

发布说明见 [CHANGELOG.md](CHANGELOG.md)。

## 你的笔记就是文件

Reflect 把一个笔记文件夹称为一个**图谱(graph)**。图谱是一个你可以检视、备份、同步或用其它工具编辑的普通文件夹:

```text
my-graph/
├── daily/2026-06-12.md     # 每日笔记,按日期命名
├── notes/some-title.md     # 其它笔记,以标题命名
├── assets/                 # 图片与附件
└── audio-memos/            # 录音与转写文本
```

Markdown 文件是唯一事实来源。Reflect 在其上叠加搜索、反向链接、标签与相关笔记,但这些文件在任何 Markdown 编辑器中依然可用。

## 同步与隐私

若要在 Apple 设备间做简单的文件同步,可把图谱创建在 iCloud 同步文件夹中,例如 `iCloud Drive/ReflectGraph`。

若需要带版本历史的备份或非 iCloud 同步,可在应用内连接 GitHub,或添加[任意 SSH git 远程仓库](docs/generic-git-remotes.md)。git 同步会把 Markdown 图谱存放在由你掌控的仓库中。

默认情况下,笔记内容仅保留在本机。只有在你配置了服务商、连接了 git 远程仓库或使用了平台同步服务之后,才会发生外部调用。完整隐私模型见 [docs/privacy.md](docs/privacy.md)。

## 从源码构建

前置条件:

- 较新的稳定版 [Rust 工具链](https://rustup.rs)
- 带 [pnpm](https://pnpm.io) 10 的 Node.js
- Xcode 命令行工具

```bash
git clone https://github.com/team-reflect/reflect-open.git
cd reflect-open
corepack enable
pnpm install
pnpm tauri dev
pnpm tauri build
```

## 项目结构

Reflect 是一个 pnpm/Turborepo 单体仓库:

```text
reflect-open/
├── apps/desktop/          # Mac 与 iOS 应用
├── apps/cli/              # `reflect` 命令行
├── apps/extension/        # Chrome 采集扩展
├── apps/native-host/      # 浏览器采集辅助程序
├── packages/core/         # 共享 TypeScript 逻辑
├── packages/db/           # 数据库类型与辅助
├── crates/index-schema/   # 共享索引 schema
├── design-system/         # 设计令牌与 UI 基础组件
└── docs/                  # 产品、架构与贡献者文档
```

约定与开发指南见 [CONTRIBUTING.md](CONTRIBUTING.md)、[docs/contributing/](docs/contributing/) 与 [AGENTS.md](AGENTS.md)。

## 开发

从仓库根目录执行的常用命令:

```bash
pnpm dev              # 仅 Vite,http://localhost:1420
pnpm typecheck        # TypeScript 类型检查
pnpm lint             # oxlint
pnpm test             # vitest;单文件用 --run path/to/test
pnpm check            # typecheck + lint

# 编译 desktop crate 的 Rust 测试需先暂存 sidecar
pnpm --filter @reflect/desktop sidecar
cargo test --workspace
```

iOS 模拟器开发:

```bash
pnpm tauri:ios:dev "iPhone 17 Pro"
```

TestFlight 构建:

```bash
pnpm release:ios preflight --build-number=123
pnpm release:ios testflight --build-number=123 --wait
```

## 状态

Reflect 处于测试版,且每日在用。当前重点是 Mac 应用、iOS 伴侣应用、浏览器采集、本地优先数据模型与同步可靠性。

Windows、Android 与插件 API 暂不在范围内。更长期的方向见 [V2 产品愿景](docs/reflect-v2-product-vision.md)及 [docs/plans/](docs/plans/) 中的实施计划。

## 许可证

[MIT](LICENSE)。
