# 前后端集成文档

本文档概述了 EduMind 前端与后端通信所需的 API 端点和数据结构。
当前前端实现使用的是位于 `src/mocks` 中的模拟数据。

## 基础 URL (Base URL)
`http://localhost:8000/api/v1`

## 1. 知识库 (RAG)

### 获取知识库列表
- **端点 (Endpoint)**: `GET /knowledge`
- **响应 (Response)**: `KnowledgeItem[]`
```json
[
  {
    "id": "1",
    "title": "Physics.pdf",
    "type": "pdf",
    "url": "...",
    "status": "ready"
  }
]
```

### 上传素材
- **端点 (Endpoint)**: `POST /knowledge/upload`
- **Content-Type**: `multipart/form-data`
- **请求体 (Body)**: `file` (二进制文件)
- **响应 (Response)**: `KnowledgeItem`

## 2. 对话交互 (Interface)

### 发送消息
- **端点 (Endpoint)**: `POST /chat`
- **请求体 (Body)**:
```json
{
  "content": "创建一节关于排序的课程",
  "history": [] // 可选的上下文历史
}
```
- **响应 (Response)**: `Message` (AI 回复)

## 3. 意图理解 (Brain)

### 获取分析结果
- **端点 (Endpoint)**: `GET /analysis/latest` 或 `GET /analysis/:id`
- **响应 (Response)**:
```json
{
  "intent": {
    "topic": "排序",
    "audience": "大一新生",
    "duration": 45,
    "style": "可视化"
  },
  "structure": [
    { "section": "引言", "points": ["..."] }
  ]
}
```

## 4. 课件工厂 (Factory)

### 生成内容
- **端点 (Endpoint)**: `POST /generate`
- **请求体 (Body)**:
```json
{
  "analysisId": "123",
  "modifiers": "使其更具互动性"
}
```
- **响应 (Response)**: `GeneratedContent`
```json
{
  "id": "gen-1",
  "slides": [...],
  "lessonPlan": "...",
  "games": [...]
}
```

## 数据类型
有关所有共享模型的 TypeScript 定义，请参阅 `src/types/index.ts`。
