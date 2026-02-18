import os
import base64
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger

try:
    import dashscope
    from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult
except ImportError:
    dashscope = None

class AIService:
    def __init__(self):
        self.kimi_client = AsyncOpenAI(
            api_key=settings.MOONSHOT_API_KEY or "placeholder",
            base_url="https://api.moonshot.cn/v1",
        )
        
        self.deepseek_client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY or "placeholder",
            base_url="https://api.deepseek.com/v1",
        )
        
        self.kimi_model = "kimi-k2.5"
        self.deepseek_model = "deepseek-reasoner"

    async def get_image_description(self, file_path: str) -> tuple[str, str | None]:
        try:
            with open(file_path, "rb") as f:
                file_content = f.read()
                
            file_object = await self.kimi_client.files.create(
                file=(os.path.basename(file_path), file_content),
                purpose="image"
            )
            file_id = file_object.id
            
            with open(file_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')

            response = await self.kimi_client.chat.completions.create(
                model=self.kimi_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "这张图片里有什么？请详细描述。"},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ],
                    }
                ],
            )
            return response.choices[0].message.content, file_id
        except Exception as e:
            logger.error(f"Error describing image: {e}")
            return "无法描述图片内容。", None

    async def get_video_description(self, file_path: str) -> tuple[str, str | None]:
        try:
            with open(file_path, "rb") as f:
                 file_object = await self.kimi_client.files.create(
                    file=f,
                    purpose="video"
                 )
            file_id = file_object.id
            
            content_list = [
                {"type": "video_url", "video_url": {"url": f"ms://{file_id}"}},
                {"type": "text", "text": "请描述这个视频的内容。"}
            ]
            
            response = await self.kimi_client.chat.completions.create(
                model=self.kimi_model,
                messages=[{"role": "user", "content": content_list}],
            )
            return response.choices[0].message.content, file_id
        except Exception as e:
            logger.error(f"Error describing video: {e}")
            return "无法描述视频内容。", None

    async def get_document_content(self, file_path: str) -> tuple[str, str | None]:
        try:
            with open(file_path, "rb") as f:
                file_object = await self.kimi_client.files.create(
                    file=f,
                    purpose="file-extract"
                )
            file_id = file_object.id
            
            content = ""
            for _ in range(5):
                try:
                    file_content = await self.kimi_client.files.content(file_id)
                    content = file_content.text
                    if content:
                        break
                except Exception:
                    await asyncio.sleep(1)
            
            if not content:
                return "无法提取文件内容。", file_id
            
            return content, file_id
        except Exception as e:
            logger.error(f"Error extracting document: {e}")
            return "无法提取文件内容。", None

    async def get_audio_text(self, file_path: str) -> str:
        if not dashscope:
            return "ASR Service not available."
            
        api_key = settings.DASHSCOPE_API_KEY
        if not api_key:
            return "ASR API Key not set."
            
        dashscope.api_key = api_key
        
        loop = asyncio.get_running_loop()
        
        def _run_asr():
            result_text = []
            
            class SimpleCallback(RecognitionCallback):
                def on_event(self, result: RecognitionResult) -> None:
                    sentence = result.get_sentence()
                    if 'text' in sentence and result.is_sentence_end(sentence):
                        result_text.append(sentence['text'])
                
                def on_complete(self) -> None:
                    pass
                def on_error(self, result: RecognitionResult) -> None:
                    logger.error(f"ASR Error: {result}")

            callback = SimpleCallback()
            recognition = Recognition(
                model='paraformer-realtime-v1',
                format='pcm',
                sample_rate=16000,
                callback=callback
            )
            
            recognition.start()
            
            try:
                with open(file_path, 'rb') as f:
                    while True:
                        data = f.read(3200)
                        if not data:
                            break
                        recognition.send_audio_frame(data)
                        import time
                        time.sleep(0.005)
            except Exception as e:
                logger.error(f"Error reading audio file: {e}")
            
            recognition.stop()
            return "".join(result_text)

        try:
            text = await loop.run_in_executor(None, _run_asr)
            return text if text else "无法识别音频内容。"
        except Exception as e:
            logger.error(f"ASR failed: {e}")
            return "语音识别失败。"

    async def check_intent(self, content: str) -> bool:
        try:
            response = await self.kimi_client.chat.completions.create(
                model=self.kimi_model,
                messages=[
                    {"role": "system", "content": "你是一个意图分类助手。请判断用户的输入是否属于'复杂逻辑推理'、'数学解题'、'物理推导'或'代码算法'类问题。如果是，请返回 TRUE；否则返回 FALSE。只返回 TRUE 或 FALSE。"},
                    {"role": "user", "content": content}
                ],
            )
            
            result = response.choices[0].message.content.strip().upper()
            return "TRUE" in result
            
        except Exception as e:
            logger.error(f"Error in intent detection: {e}")
            return False

    async def stream_deepseek_reasoning(self, content: str):
        try:
            stream = await self.deepseek_client.chat.completions.create(
                model=self.deepseek_model,
                messages=[{"role": "user", "content": content}],
                stream=True
            )
            
            async for chunk in stream:
                delta = chunk.choices[0].delta
                
                if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                    yield {"type": "reasoning", "content": delta.reasoning_content}
                
                if delta.content:
                    yield {"type": "content", "content": delta.content}
                    
        except Exception as e:
            logger.error(f"Error streaming DeepSeek: {e}")
            raise e

    async def stream_kimi_response(self, content: str, history: list = []):
        try:
            messages = [{"role": "system", "content": "你是 EduMind 智能教研助手，专门辅助教师进行教学工作。你的职责是协助教师设计课程、优化教案、解答教学难题以及提供创新的教学思路。你的回答应当专业、高效、具有建设性，并视用户为教育领域的同行专家。"}]
            messages.extend(history[-10:])
            messages.append({"role": "user", "content": content})
            
            response = await self.kimi_client.chat.completions.create(
                model=self.kimi_model,
                messages=messages,
                temperature=0.6,
                stream=True, 
                extra_body={"thinking": {"type": "disabled"}}
            )
            
            async for chunk in response:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
            
        except Exception as e:
            logger.error(f"Error calling Kimi: {e}")
            raise e

    async def stream_summarize_with_kimi(self, user_query: str, reasoning: str, answer: str):
        prompt = f"用户的问题是：'{user_query}'\n\nDeepSeek 的推理过程如下：{reasoning}\n\nDeepSeek 的最终答案是：{answer}\n\n请作为教研顾问，为教师提供专业的教学建议。"
        
        try:
            prompt = (
                f"用户的问题是：'{user_query}'\n\n"
                f"DeepSeek 的推理过程如下：\n{reasoning}\n\n"
                f"DeepSeek 的最终答案是：\n{answer}\n\n"
                "请作为一名资深的教研顾问，综合以上信息，为教师提供专业的分析与建议。请重点阐述如何将这些推理逻辑应用到实际教学中，或者如何引导学生理解这些概念。你的目标是帮助教师更好地进行教学设计。"
            )
            
            response = await self.kimi_client.chat.completions.create(
                model=self.kimi_model,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                extra_body={"thinking": {"type": "disabled"}}
            )
            
            async for chunk in response:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
        except Exception as e:
            logger.error(f"Error summarizing with Kimi: {e}")
            yield answer

    async def stream_chat(self, content: str, history: list):
        yield {"type": "status", "content": "analyzing_intent"}
        needs_reasoning = await self.check_intent(content)
        
        if needs_reasoning:
            yield {"type": "status", "content": "reasoning"}
            
            full_reasoning = ""
            full_answer = ""
            
            try:
                async for chunk in self.stream_deepseek_reasoning(content):
                    if chunk["type"] == "reasoning":
                        full_reasoning += chunk["content"]
                        yield {"type": "thinking_chunk", "content": chunk["content"]}
                    elif chunk["type"] == "content":
                        full_answer += chunk["content"]
            except Exception as e:
                logger.error(f"DeepSeek stream failed: {e}")
                yield {"type": "status", "content": "fallback_generating"}
                async for chunk in self.stream_kimi_response(content, history):
                    yield {"type": "llm_chunk", "content": chunk, "model": "kimi-k2.5-fallback"}
                yield {"type": "llm_end", "content": ""}
                return

            yield {"type": "thinking_done", "content": ""}
            
            yield {"type": "status", "content": "summarizing"}
            async for chunk in self.stream_summarize_with_kimi(content, full_reasoning, full_answer):
                yield {"type": "llm_chunk", "content": chunk, "model": "deepseek-v3-reasoner"}
                
        else:
            yield {"type": "status", "content": "generating"}
            async for chunk in self.stream_kimi_response(content, history):
                yield {"type": "llm_chunk", "content": chunk, "model": "kimi-k2.5"}
        
        yield {"type": "llm_end", "content": ""}

    async def process_chat_full(self, content: str, history: list) -> dict:
        full_content = ""
        full_thinking = ""
        model = "kimi-k2.5"
        
        async for event in self.stream_chat(content, history):
            if event["type"] == "llm_chunk":
                full_content += event["content"]
                if "model" in event:
                    model = event["model"]
            elif event["type"] == "thinking_chunk":
                full_thinking += event["content"]
        
        return {
            "role": "assistant",
            "content": full_content,
            "model": model,
            "thinking": full_thinking
        }

    async def delete_file(self, file_id: str) -> bool:
        """
        Delete file from Kimi (Moonshot).
        """
        try:
            await self.kimi_client.files.delete(file_id)
            return True
        except Exception as e:
            logger.error(f"Error deleting file from Kimi {file_id}: {e}")
            return False

ai_service = AIService()
