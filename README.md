# EduMind 项目快速上手指南

欢迎加入 EduMind 开发团队！本文档旨在帮助新加入的开发人员快速配置开发环境，并了解项目的基本结构和启动流程。

## 📖 项目简介

EduMind 是一个基于 AI 的教育辅助平台，采用前后端分离架构。
- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Python (FastAPI) + MySQL + ChromaDB (向量数据库)

## 🛠️ 环境要求

在开始之前，请确保你的开发环境已安装以下工具：

- **Git**: 版本控制
- **Node.js**: 建议 v18+ (包含 npm)
- **Python**: 建议 v3.10+
- **MySQL**: 建议 v8.0+

## 📂 目录结构

```
EduMind/
├── backend/            # 后端项目 (FastAPI)
│   ├── app/            # 应用核心代码
│   ├── scripts/        # 脚本文件 (如数据库初始化)
│   ├── requirements.txt # Python 依赖
│   └── ...
├── frontend/           # 前端项目 (React)
│   ├── src/            # 源代码
│   ├── package.json    # 前端依赖
│   └── vite.config.ts  # Vite 配置
└── README.md           # 本文档
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <仓库url>
cd EduMind
```

### 2. 后端配置 (Backend)

后端服务运行在 `http://localhost:8000`。

#### 2.1 进入后端目录

```bash
cd backend
```

#### 2.2 创建虚拟环境 (可选)

建议使用虚拟环境来管理 Python 依赖，避免污染全局环境。

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

#### 2.3 安装依赖

```bash
pip install -r requirements.txt
```

#### 2.4 配置环境变量

在 `backend` 目录下创建一个 `.env` 文件，并参考以下内容填写配置。你需要填入你的 API Key 和数据库信息。

**`.env` 文件示例：**

```ini
# 应用配置
APP_NAME="EduMind API"
APP_ENV="development"
APP_DEBUG=True

# API Keys (请填入实际的 Key)
DASHSCOPE_API_KEY="sk-..."（阿里asr/tts）
OPENAI_API_KEY="sk-..."
DEEPSEEK_API_KEY="sk-..."
MOONSHOT_API_KEY="sk-..."（kimi）

# 数据库配置 (请根据本地 MySQL 配置修改)
DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="your_password"
DB_NAME="edumind"
```

#### 2.5 初始化数据库

确保你的 MySQL 服务已启动，然后运行初始化脚本创建数据库和表结构。

```bash
python scripts/init_db.py
```

#### 2.6 启动后端服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

或者运行run.py脚本：
```bash
python run.py
```

启动成功后，访问 [http://localhost:8000/docs](http://localhost:8000/docs) 查看 API 文档。

---

### 3. 前端配置 (Frontend)

前端服务默认运行在 `http://localhost:5173`，并通过代理转发 API 请求到后端。

#### 3.1 进入前端目录

打开一个新的终端窗口，进入前端目录：

```bash
cd frontend
```

#### 3.2 安装依赖

```bash
npm install
```

#### 3.3 启动开发服务器

```bash
npm run dev
```

启动成功后，访问 [http://localhost:5173](http://localhost:5173) 查看应用。

## 📝 常用命令

| 任务 | 目录 | 命令 | 说明 |
| --- | --- | --- | --- |
| **启动后端** | `backend/` | `uvicorn app.main:app --reload` | 开发模式启动，支持热重载 |
| **初始化 DB** | `backend/` | `python scripts/init_db.py` | 创建数据库和表 |
| **启动前端** | `frontend/` | `npm run dev` | 启动 Vite 开发服务器 |
| **构建前端** | `frontend/` | `npm run build` | 生产环境构建 |

## 🤝 开发规范

- **分支管理**: 请基于 `main` 分支创建新的功能分支 `feature/your-feature-name`。
- **代码提交**: 请编写清晰的 Commit Message。
- **接口文档**: 后端修改接口后，请确保 Swagger 文档 (`/docs`) 更新。

祝 开发愉快！
