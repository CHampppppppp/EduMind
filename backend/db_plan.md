# 数据库创建计划

## 目标
基于现有的 Pydantic 模式，为 EduMind 项目创建 MySQL 数据库和表。

## 数据库配置
- **主机**: localhost (默认)
- **用户名**: root
- **密码**: 123456
- **数据库名**: edumind

## 表结构

1.  **users (用户表)**
    - `id`: VARCHAR(36) PRIMARY KEY (UUID)
    - `username`: VARCHAR(255) UNIQUE NOT NULL (用户名，唯一且不为空)
    - `password_hash`: VARCHAR(255) NOT NULL (存储哈希后的密码)
    - `avatar_url`: VARCHAR(512) (头像链接)
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP (创建时间)

2.  **knowledge_base (知识库表)**
    - `id`: VARCHAR(36) PRIMARY KEY (UUID)
    - `user_id`: VARCHAR(36) NOT NULL (外键 -> users.id)
    - `title`: VARCHAR(255) NOT NULL (标题)
    - `type`: VARCHAR(50) NOT NULL (类型)
    - `url`: VARCHAR(512) NOT NULL (链接)
    - `status`: VARCHAR(50) DEFAULT 'pending' (状态，默认为 pending)
    - `summary`: TEXT (摘要)
    - `upload_date`: DATETIME DEFAULT CURRENT_TIMESTAMP (上传日期)

3.  **chats (对话表)**
    - `id`: VARCHAR(36) PRIMARY KEY (UUID)
    - `user_id`: VARCHAR(36) NOT NULL (外键 -> users.id)
    - `title`: VARCHAR(255) (对话标题)
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP (创建时间)

4.  **messages (消息表)**
    - `id`: VARCHAR(36) PRIMARY KEY (UUID)
    - `chat_id`: VARCHAR(36) NOT NULL (外键 -> chats.id)
    - `role`: VARCHAR(20) NOT NULL ('user', 'assistant', 'system') (角色)
    - `content`: LONGTEXT NOT NULL (内容)
    - `model`: VARCHAR(50) (模型)
    - `thinking`: TEXT (思考过程)
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP (创建时间)

5.  **analysis_results (分析结果表)**
    - `id`: VARCHAR(36) PRIMARY KEY (UUID)
    - `user_id`: VARCHAR(36) NOT NULL (外键 -> users.id)
    - `topic`: VARCHAR(255) NOT NULL (主题)
    - `audience`: VARCHAR(255) (受众)
    - `duration`: INT (时长)
    - `style`: VARCHAR(100) (风格)
    - `structure`: JSON (结构)
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP (创建时间)

6.  **generated_contents (生成内容表)**
    - `id`: VARCHAR(36) PRIMARY KEY (UUID)
    - `analysis_id`: VARCHAR(36) NOT NULL (外键 -> analysis_results.id)
    - `slides`: JSON (幻灯片)
    - `lesson_plan`: LONGTEXT (教案)
    - `games`: JSON (游戏)
    - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP (创建时间)

## 实施步骤
1.  安装 `pymysql` 依赖。
2.  创建 `backend/scripts/init_db.py` 以执行 SQL DDL 语句。
3.  执行脚本以创建数据库和表。
