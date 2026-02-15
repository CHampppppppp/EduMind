# Kimi (Moonshot AI) 多模态 API 测试脚本

这个项目包含一个 Python 脚本，用于测试 Kimi (Moonshot AI) 的多模态能力，包括：
- **图片理解 (Image Understanding)**: 使用 Vision 模型分析图片内容。
- **文件理解 (File Understanding)**: 批量测试多种格式文件的上传与解析，包括：
    - 文本文件: `.txt`, `.md`, `.csv`
    - 代码文件: `.py`, `.js`
    - 文档文件: `.pdf`, `.docx`, `.pptx` (需安装相应依赖)
- **视频理解 (Video Understanding)**: 模拟视频帧分析（目前 API 标准做法）。
- **音频理解 (Audio Understanding)**: 模拟音频转录后的文本处理。

## 环境准备

1.  安装依赖:
    ```bash
    pip install -r requirements.txt
    ```
    *注意：为了生成 PDF, DOCX, PPTX 测试文件，脚本依赖 `fpdf`, `python-docx`, `python-pptx`。如果未安装这些库，脚本会自动跳过相应格式的生成。*

2.  获取 API Key:
    请访问 [Moonshot AI 开放平台](https://platform.moonshot.cn/) 获取您的 API Key。

3.  设置环境变量:
    ```bash
    export MOONSHOT_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    ```

## 运行测试

运行主脚本：

```bash
python3 test_kimi_multimodal.py
```

## 脚本说明

- `test_kimi_multimodal.py`: 主测试脚本。
    - 自动生成测试文件 (`test_gen.*`)。
    - 批量上传并测试文件理解能力。
    - 测试图片、视频（模拟）、音频（模拟）理解能力。
- `requirements.txt`: 项目依赖文件。
- `generate_audio.py`: 生成一个简单的 WAV 音频文件（辅助工具）。

## 注意事项

- **视频/音频支持**: 目前 Kimi API 原生支持主要集中在文本和文件（File Extract）。对于视频和音频，推荐使用“关键帧提取”和“语音转文字(ASR)”的组合方案，脚本中已包含相应的模拟代码。
- **文件解析**: `file-extract` 功能是 Moonshot 特有的，用于让模型读取长文档。
- **模型名称**: 默认配置为 `kimi-k2.5`（如需测试特定模型可修改脚本中的 `MODEL_NAME`）。
