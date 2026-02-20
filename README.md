# EduMind 项目使用说明文档

欢迎加入 EduMind 开发团队！本文档旨在帮助新加入的开发人员快速配置开发环境，并了解项目的基本结构和启动流程。

---

## 目录

1. [项目简介](#1-项目简介)
2. [环境准备](#2-环境准备)
3. [后端配置](#3-后端配置)
4. [前端配置](#4-前端配置)
5. [启动项目](#5-启动项目)
6. [常见问题解答](#6-常见问题解答)
7. [项目结构说明](#7-项目结构说明)

---

## 1. 项目简介

### 1.1 什么是 EduMind？

EduMind 是一个**智能教育辅助平台**，基于人工智能技术，可以帮助用户：
- 上传学习资料（PDF、文档、图片等）
- 与 AI 进行对话学习
- 生成学习笔记和测验题目
- 语音交互功能

### 1.2 技术栈

| 组成部分 | 技术 |
|---------|------|
| 前端（用户界面） | React + TypeScript + Vite + Tailwind CSS |
| 后端（服务器） | Python FastAPI |
| 数据库 | MySQL |
| 向量数据库 | ChromaDB（用于 AI 语义搜索） |
| AI 服务 | 阿里云 DashScope、OpenAI、DeepSeek、月之暗面（Moonshot）|

### 1.3 系统架构图

```
┌─────────────────┐         ┌─────────────────┐
│   用户浏览器    │◄───────►│   前端 (React)  │
│  localhost:5173 │         │  localhost:5173 │
└─────────────────┘         └────────┬────────┘
                                      │ HTTP / WebSocket
                                      ▼
┌─────────────────┐         ┌─────────────────┐
│   AI 服务商     │◄───────►│  后端 (FastAPI) │
│ (OpenAI等API)   │         │  localhost:8000 │
└─────────────────┘         └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │   MySQL  │    │ ChromaDB │    │  文件存储 │
              │ (数据存储)│    │(向量存储) │    │ (上传文件)│
              └──────────┘    └──────────┘    └──────────┘
```

---

## 2. 环境准备

### 2.1 需要的软件

在开始之前，你需要安装以下软件：

| 软件 | 版本要求 | 用途 | 下载地址 |
|-----|---------|------|---------|
| **Git** | 任意版本 | 代码版本管理 | https://git-scm.com |
| **Node.js** | v18 或更高 | 前端运行环境 | https://nodejs.org |
| **Python** | v3.10 或更高 | 后端运行环境 | https://www.python.org |
| **MySQL** | v8.0 或更高 | 关系型数据库 | https://www.mysql.com |

### 2.2 安装检查

安装完成后，打开终端（Windows 下叫"命令提示符"或"PowerShell"，macOS/Linux 下叫"终端"），运行以下命令检查是否安装成功：

```bash
# 检查 Git 版本
git --version

# 检查 Node.js 版本
node --version

# 检查 Python 版本
python --version

# 检查 npm 版本（Node.js 自带）
npm --version
```

如果都能正常显示版本号，说明安装成功！

### 2.3 安装 MySQL 数据库

#### Windows 系统：

1. 下载 MySQL Installer：https://dev.mysql.com/downloads/installer/
2. 运行安装程序，选择 "Developer Default" 或 "Full" 安装
3. 设置 root 用户密码（请记住这个密码，后面会用）
4. 完成安装后，确保 MySQL 服务已启动

#### macOS 系统：

使用 Homebrew 安装：

```bash
# 安装 Homebrew（如果没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/head/install.sh)"

# 安装 MySQL
brew install mysql

# 启动 MySQL 服务
brew services start mysql
```

#### Linux 系统（Ubuntu/Debian）：

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

---

## 3. 后端配置

### 3.1 获取项目代码

```bash
# 1. 打开终端，进入你想存放项目的目录
cd ~/Documents

# 2. 克隆项目（如果有仓库地址）
git clone <你的仓库地址>

# 3. 进入项目目录
cd EduMind
```

### 3.2 创建后端工作目录

```bash
# 进入后端目录
cd backend
```

### 3.3 创建 Python 虚拟环境

**什么是虚拟环境？** 虚拟环境就像一个独立的文件夹，用来存放这个项目需要的 Python 包，不会和其他项目冲突。

```bash
# Windows 系统
python -m venv venv

# macOS / Linux 系统
python3 -m venv venv
```

### 3.4 激活虚拟环境

```bash
# Windows 系统
venv\Scripts\activate

# macOS / Linux 系统
source venv/bin/activate
```

激活成功后，终端前面会显示 `(venv)` 或 `(backend)` 字样。

> 💡 **小提示**：每次打开新的终端窗口开发时，都需要重新激活虚拟环境。

### 3.5 安装 Python 依赖

```bash
pip install -r requirements.txt
```

这个命令会根据 `requirements.txt` 文件自动安装所有需要的 Python 包，可能需要等待几分钟。

### 3.6 配置环境变量

1. 在 `backend` 文件夹下，创建一个新文件，命名为 `.env`

2. 用文本编辑器（如 VS Code、Notepad++）打开编辑，粘贴以下内容：

```ini
# ===========================================
# 应用基础配置
# ===========================================
APP_NAME="EduMind API"
APP_ENV="development"
APP_DEBUG=True

# ===========================================
# AI 服务 API Keys（必须填）
# 以下是示例 key，请替换为你申请的真实 key
# ===========================================

# 阿里云 DashScope（通义千问、TTS语音等）
DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# OpenAI（ChatGPT）
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# DeepSeek
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# 月之暗面（Moonshot Kimi）
MOONSHOT_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# ===========================================
# 数据库配置（必须填）
# ===========================================
DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="你的MySQL密码"
DB_NAME="edumind"
```

> ⚠️ **重要提示**：
> - `DB_PASSWORD` 请填入你安装 MySQL 时设置的 root 密码
> - API Keys 需要去各 AI 服务商官网申请：
>   - 阿里云：https://dashscope.console.aliyun.com
>   - OpenAI：https://platform.openai.com
>   - DeepSeek：https://platform.deepseek.com
>   - Moonshot：https://platform.moonshot.cn

### 3.7 初始化数据库

1. 确保 MySQL 服务已启动

2. 运行初始化脚本：

```bash
python scripts/init_db.py
```

如果成功，会显示类似 `数据库初始化成功！` 的消息，并在 MySQL 中创建名为 `edumind` 的数据库和所需的数据表。

### 3.8 启动后端服务

```bash
# 方法一：使用 run.py（推荐）
python run.py

# 方法二：直接使用 uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动成功后，终端会显示类似信息：

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     API docs available at http://localhost:8000/docs
```

> 🎉 **后端启动成功！** 此时后端服务运行在 http://localhost:8000

---

## 4. 前端配置

### 4.1 进入前端目录

打开**新的**终端窗口（后端服务保持运行）：

```bash
cd EduMind/frontend
```

### 4.2 安装前端依赖

```bash
npm install
```

这个命令会根据 `package.json` 文件自动安装所有需要的前端包，可能需要等待几分钟。

### 4.3 启动前端开发服务器

```bash
npm run dev
```

启动成功后，终端会显示类似信息：

```
  VITE v7.3.1  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

> 🎉 **前端启动成功！** 此时可以在浏览器中访问 http://localhost:5173 查看应用界面。

---

## 5. 启动项目

### 5.1 完整的启动流程

按照以下顺序启动整个应用：

```
┌─────────────────────────────────────────────────────────────┐
│  步骤 1：启动 MySQL 数据库                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Windows: 打开 "MySQL 8.0 Command Line Client"       │   │
│  │ macOS:   brew services start mysql                 │   │
│  │ Linux:   sudo systemctl start mysql                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  步骤 2：启动后端（终端窗口 1）                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ cd EduMind/backend                                  │   │
│  │ source venv/bin/activate   # macOS/Linux           │   │
│  │ venv\Scripts\activate     # Windows                │   │
│  │ python run.py                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  步骤 3：启动前端（终端窗口 2）                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ cd EduMind/frontend                                 │   │
│  │ npm run dev                                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  步骤 4：打开浏览器访问                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ http://localhost:5173                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 验证是否正常运行

1. 打开浏览器，访问 http://localhost:5173
2. 如果看到 EduMind 的界面，说明前端正常运行
3. 尝试使用一些功能，如果能正常工作，说明后端也正常运行

### 5.3 访问 API 文档

后端提供了交互式 API 文档，可以在浏览器中查看和测试：

- Swagger 文档：http://localhost:8000/docs
- ReDoc 文档：http://localhost:8000/redoc

---

## 6. 常见问题解答

### Q1: 运行 `python` 命令提示找不到 Python？

**解决方法**：尝试使用 `python3` 代替 `python`

```bash
python3 --version
python3 -m venv venv
python3 -r requirements.txt
```

### Q2: 安装 Python 依赖时出错？

**可能原因**：网络问题或缺少编译工具

**解决方法**：

```bash
# 切换到国内源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q3: 启动后端报错 `ModuleNotFoundError: No module named 'xxx'`？

**解决方法**：确保已激活虚拟环境，并重新安装依赖

```bash
# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# 重新安装依赖
pip install -r requirements.txt
```

### Q4: 连接 MySQL 失败？

**检查步骤**：
1. 确认 MySQL 服务已启动
2. 检查 `.env` 文件中的 `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD` 是否正确
3. 确认 MySQL 用户有权限访问数据库

**测试 MySQL 连接**：

```bash
# Windows
mysql -u root -p

# macOS
/usr/local/mysql/bin/mysql -u root -p
```

### Q5: 前端页面空白或显示错误？

**解决方法**：

```bash
# 清除缓存并重新安装
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Q6: API 请求失败，提示跨域错误？

这是后端的 CORS 配置问题。确保后端的 `app/main.py` 中包含以下配置：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Q7: 语音功能无法使用？

**可能原因**：
1. 未配置阿里云 DashScope API Key
2. 浏览器不支持 Web Audio API
3. 麦克风权限未开启

**解决方法**：
1. 检查 `.env` 中的 `DASHSCOPE_API_KEY` 是否正确
2. 确保使用 Chrome 或 Edge 浏览器
3. 允许浏览器访问麦克风

### Q8: 如何查看后端日志？

后端运行时会自动记录日志。如果遇到错误，可以查看终端输出中的红色错误信息，通常会包含错误原因和位置。

### Q9: 修改代码后需要重启服务吗？

- **后端**：使用了 `--reload` 参数，修改代码后会自动重启
- **前端**：Vite 支持热更新，修改代码后页面会自动刷新

### Q10: 如何停止服务？

在终端中按 `Ctrl + C` 可以停止当前运行的服务。

---

## 7. 项目结构说明

### 7.1 整体目录结构

```
EduMind/
├── backend/                    # 后端项目
│   ├── app/                    # 应用核心代码
│   │   ├── api/               # API 接口定义
│   │   │   └── v1/            # API v1 版本
│   │   ├── core/              # 核心配置
│   │   ├── services/          # 业务逻辑服务
│   │   └── schemas/           # 数据模型
│   ├── scripts/               # 脚本文件
│   │   └── init_db.py         # 数据库初始化
│   ├── upload/                # 上传文件存储
│   │   ├── audios/            # 音频文件
│   │   ├── documents/         # 文档文件
│   │   ├── images/            # 图片文件
│   │   └── videos/            # 视频文件
│   ├── chroma_db/             # ChromaDB 向量数据库
│   ├── requirements.txt        # Python 依赖
│   ├── run.py                  # 启动脚本
│   └── .env                   # 环境变量配置
│
├── frontend/                   # 前端项目
│   ├── src/                   # 源代码
│   │   ├── pages/             # 页面组件
│   │   ├── components/        # 通用组件
│   │   ├── context/           # React 上下文
│   │   ├── lib/               # 工具函数
│   │   └── types/             # TypeScript 类型
│   ├── public/                # 静态资源
│   ├── package.json           # 前端依赖
│   └── vite.config.ts         # Vite 配置
│
└── README.md                   # 项目说明文档
```

### 7.2 关键文件说明

| 文件/目录 | 说明 |
|---------|------|
| `backend/app/main.py` | 后端主入口文件 |
| `backend/app/api/v1/` | API 路由定义 |
| `backend/app/services/` | 业务逻辑实现 |
| `backend/.env` | 环境变量配置（重要！）|
| `frontend/src/pages/` | 前端页面组件 |
| `frontend/src/components/` | 前端通用组件 |
| `frontend/vite.config.ts` | Vite 配置（代理设置）|

---

## 附录：常用命令汇总

### 后端命令

```bash
cd backend

# 激活虚拟环境
source venv/bin/activate     # macOS/Linux
venv\Scripts\activate       # Windows

# 启动后端
python run.py

# 重新安装依赖
pip install -r requirements.txt
```

### 前端命令

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### Git 命令

```bash
# 克隆项目
git clone <仓库地址>

# 查看状态
git status

# 拉取更新
git pull

# 提交代码
git add .
git commit -m "提交说明"
git push
```

---

## 📞 获取帮助

如果在使用过程中遇到问题：

1. 查看终端中的错误信息
2. 查阅本文档的常见问题解答
3. 查看后端 API 文档：http://localhost:8000/docs
4. 联系项目维护人员

---

祝您使用愉快！🎉
