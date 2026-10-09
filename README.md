# MyTask

> A task-centered workspace for humans and AI.  
> 一个将任务管理、长期推进、每日复盘与 ChatGPT Chat / Work 工作区连接起来的个人任务系统。

MyTask 不只是一个 Todo List。

传统任务管理工具通常只记录：

> **“我要做什么？”**

而 MyTask 更关注：

> **“这件事现在做到哪里了、下一步是什么、相关 AI 工作在哪里、明天如何继续？”**

MyTask 将任务本身作为工作入口，把 **任务信息、执行状态、每日进度、复盘记录、ChatGPT Chat / Work 会话以及项目链接**组织在同一个工作流中。

---

## ✨ Why MyTask?

在使用 ChatGPT、Work、IDE、GitHub 等工具完成长期任务时，经常会遇到一个问题：

**任务管理和真正工作的地方是分离的。**

例如：

- Todo 软件里写着“修改论文”
- ChatGPT 里有一个讨论论文的对话
- Work 中又有一个处理文件的工作区
- 本地电脑上还有对应工程
- GitHub 上可能还有仓库
- 第二天继续工作时，需要重新寻找昨天做到哪里

随着项目增多，这些上下文会逐渐碎片化。

MyTask 希望让：

```text
Task
 ├── Goal
 ├── Next Actions
 ├── Progress
 ├── ChatGPT Chat
 ├── ChatGPT Work
 ├── Project / Repository
 ├── Daily Log
 └── Review History
```

围绕同一个任务组织起来。

这样，每次重新进入任务，都可以快速回到原来的工作上下文。

---

# 🚀 Core Features

## 1. Daily Task Management

MyTask 提供基础任务管理能力，包括：

- Today / Upcoming / Backlog
- P1 / P2 / P3 / P4 优先级
- 预计耗时
- Deadline
- Project
- Tags
- Goal
- Notes
- Next Actions

任务状态支持：

| Status | Meaning |
|---|---|
| `todo` | 待开始 |
| `in_progress` | 正在进行 |
| `done` | 已完成 |
| `deferred` | 主动延期 |
| `blocked` | 被阻塞 |
| `dropped` | 不再执行 |

相比简单的 Done / Not Done，MyTask 希望保留任务没有完成背后的原因。

---

## 2. Task-centered AI Workspace

这是 MyTask 最核心的功能之一。

每个任务都可以绑定自己的：

- ChatGPT Chat
- ChatGPT Work

例如：

```text
论文修改
   ↓
对应论文 ChatGPT 对话
   ↓
对应 Work 工作区
   ↓
继续昨天的上下文
```

当任务已经绑定某个 Chat / Work 后，再次点击时会优先回到 **同一个会话**，而不是每次创建新的对话。

因此 AI 会话不再是一堆散落在历史记录中的聊天，而成为任务的一部分。

---

## 3. Chat / Work Session Reuse

MyTask 不伪造 ChatGPT 会话 URL，也不会假设新建页面最终对应哪个会话。

实际流程为：

```text
MyTask
   │
   ├── 已存在 Workspace URL
   │       ↓
   │   直接打开原会话
   │
   └── 尚未绑定
           ↓
       打开新的 Chat / Work
           ↓
       Browser Helper 获取真实会话 URL
           ↓
       保存到对应 Task
```

之后无论中间页面是否关闭，都可以重新从任务回到同一个 Chat / Work。

---

## 4. Browser Helper Extension

MyTask 可以配合浏览器辅助扩展使用。

扩展主要负责处理 MyTask 与 ChatGPT 页面之间的跳转和真实会话地址记录。

设计原则是：

> **MyTask 页面保持为任务控制中心，真正的 AI 工作在独立标签页完成。**

辅助扩展只负责必要的浏览器交互，不通过 OpenAI API 创建额外模型调用。

---

## 5. Single Tasks & Long-term Tasks

MyTask 区分两类任务。

### Single Task

适合：

```text
提交材料
修改一份 PPT
检查论文
发送邮件
修复一个 Bug
```

完成后即可结束。

### Long-term Task

适合：

```text
论文写作
项目开发
科研实验
IELTS 学习
健身计划
课程学习
长期研发项目
```

长期任务拥有自己的日期范围和每日推进记录。

---

# 📆 Long-term Task Timeline

长期任务可以记录每天的：

| Field | Description |
|---|---|
| Plan | 今天准备做什么 |
| Work Log | 实际完成了什么 |
| Blockers | 遇到了什么问题 |
| Next Plan | 下一步准备做什么 |

例如：

```text
2026-10-09

Plan
完成模型训练代码整理

Work Log
完成数据读取模块
完成训练脚本重构

Blockers
真实机器人数据格式仍需要统一

Next Plan
明天完成数据转换模块并开始第一次训练
```

长期任务因此不只是：

```text
完成 / 没完成
```

而会逐渐形成完整的项目推进历史。

---

# 🌙 Daily Review

MyTask 支持每日任务复盘。

对于当天没有完成的任务，可以明确记录原因：

```text
Tomorrow
今天没来得及，明天继续

Deferred
主动延期，目前优先级降低

Blocked
受到外部条件阻塞

Dropped
当前已经不需要继续执行
```

同时可以记录原因，例如：

```text
forgot_or_no_time
intentional
blocked
not_needed
```

这种设计的目标不是单纯统计“完成率”，而是让任务系统理解：

**为什么任务没有完成。**

---

# 📝 Daily Report

MyTask 支持保存每日复盘报告。

为了避免 AI 自动修改用户真实记录：

> Daily Report 只保存用户本人撰写，或用户明确授权修改的内容。

系统不会自动覆盖已有复盘。

---

# 🛌 Rest Days

MyTask 支持：

- 每周固定休息日
- 单独指定某一天为休息日
- 将默认休息日临时设置为工作日

例如：

```text
Monday    Work
Tuesday   Work
Wednesday Work
Thursday  Work
Friday    Work
Saturday  Rest
Sunday    Rest
```

也可以临时设置：

```text
2026-10-10 → Work
2026-10-11 → Rest
```

这样每日任务统计不会把正常休息误认为“任务失败”。

---

# 🔗 Project / Repository Links

任务可以保存对应项目或仓库链接，例如：

```text
GitHub Repository
Project Documentation
Experiment Dashboard
Online Workspace
```

需要特别说明：

**MyTask 不会自动替用户创建 GitHub 仓库，也不会自动 commit / push 代码。**

Repository Link 的作用是：

> 提供一个稳定、可点击的项目入口。

真正的 Git 操作仍由用户自己的开发环境完成。

---

# 🧠 Task Context

一个 Task 可以包含：

```text
Task
│
├── Title
├── Goal
├── Notes
├── Project
├── Tags
├── Priority
├── Estimated Time
│
├── Next Actions
│
├── Status
├── Due Date
│
├── Chat Workspace
├── Work Workspace
├── Repository Link
│
├── Daily Entries
│   ├── Plan
│   ├── Work Log
│   ├── Blockers
│   └── Next Plan
│
└── History
```

这使 Task 本身成为工作的最小上下文单元。

---

# 🔄 Typical Workflow

一个典型的 MyTask 工作流程：

```text
Create Task
    ↓
Define Goal
    ↓
Add Next Actions
    ↓
Start Task
    ↓
Open Chat / Work
    ↓
Do the actual work
    ↓
Record progress
    ↓
Complete or Review
    ↓
Continue tomorrow
```

对于长期项目：

```text
Long-term Task
      ↓
Daily Plan
      ↓
Work
      ↓
Daily Progress
      ↓
Blockers
      ↓
Next Plan
      ↓
Next Day
```

最终形成一条连续的项目历史。

---

# 🏗 Architecture

MyTask 目前可以理解为三个主要部分：

```text
┌───────────────────────────┐
│          MyTask           │
│                           │
│ Task / Timeline / Review  │
└─────────────┬─────────────┘
              │
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
 ChatGPT Chat      ChatGPT Work
      ▲                ▲
      │                │
      └───────┬────────┘
              │
      Browser Helper
              │
      Capture real URL
```

MyTask 负责管理任务状态和上下文。

Browser Helper 负责必要的浏览器页面连接。

ChatGPT Chat / Work 负责真正的 AI 协作。

---

# 🔐 Privacy & Design Principles

MyTask 的设计遵循几个原则。

### Explicit User Actions

只有用户明确要求时才修改任务。

不会因为 AI “觉得应该修改”就自动改变任务状态。

### No Extra OpenAI API Calls

Chat / Work 绑定只是保存实际工作区 URL。

MyTask 不需要为了任务管理再次调用 OpenAI API，也不会产生独立的模型调用费用。

### Real Session URLs

不会伪造 ChatGPT Chat / Work 地址。

真实 URL 由浏览器中的实际会话产生。

### User-owned Review

每日复盘属于用户自己的记录。

系统不会擅自生成并覆盖用户复盘。

---

# 📊 Example

例如一个科研任务：

```text
Title
完成半监督触地检测专利审核

Priority
P1

Project
论文衍生专利

Goal
完成专利逻辑检查并形成修改版本

Next Actions
☐ 完善专利整体架构
☐ 检查内部逻辑
☐ 检查理论描述

Status
In Progress

AI Workspace
Work → 专利半监督触地检测

Repository
Local / Project Repository

Estimate
60 min
```

第二天重新打开任务时，可以直接：

```text
Task
 ↓
Original Work Session
 ↓
Continue
```

而不需要重新向 AI 解释整个项目背景。

---

# 🛠 Installation

项目仍在持续开发中。

通常需要安装：

```text
1. MyTask 主程序 / 服务
2. MyTask Browser Helper Extension
3. 在 ChatGPT 中连接 MyTask
```

浏览器扩展可以通过 Chromium 系浏览器的开发者模式加载。

以 Chrome / Edge 为例：

```text
Extensions
→ Developer Mode
→ Load unpacked
→ Select MyTask extension directory
```

具体部署方式请根据仓库中的项目结构进行配置。

---

# 📁 Recommended Project Structure

一个推荐的仓库结构：

```text
MyTask/
│
├── README.md
├── LICENSE
│
├── server/
│   └── MyTask backend / MCP server
│
├── web/
│   └── MyTask interface
│
├── extension/
│   └── Browser Helper Extension
│
├── docs/
│   └── Documentation
│
└── examples/
    └── Usage examples
```

实际目录以当前仓库代码为准。

---

# 🗺 Roadmap

后续计划包括：

- [ ] 完善任务 Dashboard
- [ ] 优化 Chat / Work 自动绑定体验
- [ ] 完善长期任务时间轴
- [ ] 完善每日与每周 Review
- [ ] 增加更完整的统计分析
- [ ] 完善任务搜索与筛选
- [ ] 完善项目级工作区
- [ ] 改善 Browser Helper 的稳定性
- [ ] 增加数据导入 / 导出能力
- [ ] 完善部署与安装文档

---

# 💡 Philosophy

MyTask 的核心思想不是：

> 管理更多 Todo。

而是：

> **减少重新进入一项工作时丢失的上下文。**

对于越来越依赖 AI 协作的工作方式，真正需要管理的不只是任务名称，还有：

```text
What am I doing?
Why am I doing it?
Where did I stop?
What should I do next?
Where is the AI context?
Where is the project?
```

MyTask 希望让这些信息始终围绕同一个 Task 保留下来。

最终形成：

```text
Task
  +
Context
  +
AI Workspace
  +
Progress
  +
Review
  =
MyTask
```

---

# 🤝 Contributing

欢迎 Issue、Feature Request 和 Pull Request。

如果你对以下方向感兴趣：

- AI-native productivity
- Personal task management
- ChatGPT workflow
- Human-AI collaboration
- MCP
- Long-term project tracking

欢迎一起完善 MyTask。

---

# 📄 License

开源前建议在仓库中添加 `LICENSE` 文件。

如果没有特殊的商业限制需求，可以考虑使用 MIT License。

---

## MyTask

**Make every task a persistent workspace.**

让每一个任务，都拥有可以持续回到的工作上下文。
