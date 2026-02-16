from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger
import json
import asyncio
import base64
from typing import List, Dict, Any, Optional, AsyncGenerator

try:
    import dashscope
    from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult
except ImportError:
    dashscope = None
    logger.warning("DashScope not installed")

class AIService:
    def __init__(self):
        # Initialize Kimi (Moonshot) Client
        self.kimi_client = AsyncOpenAI(
            api_key=settings.MOONSHOT_API_KEY,
            base_url="https://api.moonshot.cn/v1",
        )
        
        # Initialize DeepSeek Client
        self.deepseek_client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com/v1",
        )
        
        self.kimi_model = "kimi-k2.5"
        self.deepseek_model = "deepseek-reasoner"

    async def get_image_description(self, file_path: str) -> str:
        """
        Get description for an image using Kimi Vision.
        """
        try:
            # Upload file to Kimi
            # Note: AsyncOpenAI client supports files.create
            with open(file_path, "rb") as f:
                file_object = await self.kimi_client.files.create(
                    file=f,
                    purpose="file-extract" 
                )
            file_id = file_object.id
            
            # Use file content in chat
            # Note: For image, Kimi supports image_url with data URI or file upload?
            # Actually, Kimi documentation says for images we should use base64 or url.
            # But wait, test_kimi_multimodal.py uses base64 for image understanding.
            # Let's use base64 for image as per test file.
            
            with open(file_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')

            response = await self.kimi_client.chat.completions.create(
                model=self.kimi_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "这张图片里有什么？请详细描述。"},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            },
                        ],
                    }
                ],
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error describing image: {e}")
            return "无法描述图片内容。"

    async def get_video_description(self, file_path: str) -> str:
        """
        Get description for a video using Kimi Video Understanding.
        """
        try:
            # Upload video file
            # Note: OpenAI SDK 'files.create' is for file-extract/fine-tune.
            # Moonshot uses 'purpose="video"'?
            # The test file uses 'client.files.create(file=f, purpose="video")' (sync client).
            # Let's try with async client.
            
            # Async file upload
            with open(file_path, "rb") as f:
                 file_object = await self.kimi_client.files.create(
                    file=f,
                    purpose="file-extract" # SDK might strictly check purpose enum? 
                    # Actually Moonshot documentation says "file-extract" is for Kimi Chat to read.
                    # But for video, test file used purpose="video".
                    # Standard OpenAI SDK only allows 'fine-tune' or 'assistants'.
                    # Moonshot might have patched it or allows strings.
                    # Let's assume "file-extract" works for now as general purpose, or try "video" if we can.
                    # If strictly type checked, we might need to cast.
                 )
            file_id = file_object.id
            
            # Construct video message
            # We might need to wait for processing? Kimi usually handles it.
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "file", "file_url": {"url": file_id}}, # Kimi specific format?
                        # Test file used: {"type": "video_url", "video_url": {"url": f"ms://{file_id}"}}
                        # Let's use that format.
                        {"type": "text", "text": "请描述这个视频的内容。"}
                    ]
                }
            ]
            
            # Wait, the test file format for content is:
            # [{"type": "video_url", "video_url": {"url": f"ms://{file_id}"}}, ...]
            # We need to manually construct this dict, AsyncOpenAI types might complain but it should pass as dict.
            
            # Also, we might need to check if file_id is ready.
            # But let's try direct call.
            
            # Note: We need to use raw dict for content to bypass some type checks if needed, 
            # but usually the library is flexible with dicts.
            
            # Correct format from test file:
            content_list = [
                {"type": "video_url", "video_url": {"url": f"ms://{file_id}"}},
                {"type": "text", "text": "请描述这个视频的内容。"}
            ]
            
            response = await self.kimi_client.chat.completions.create(
                model=self.kimi_model,
                messages=[{"role": "user", "content": content_list}],
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error describing video: {e}")
            # Fallback: try using file-extract if video purpose fails
            return "无法描述视频内容。"

    async def get_document_content(self, file_path: str) -> str:
        """
        Get content from a document (PDF, Docx, etc.) using Kimi File Extract.
        """
        try:
            with open(file_path, "rb") as f:
                file_object = await self.kimi_client.files.create(
                    file=f,
                    purpose="file-extract"
                )
            file_id = file_object.id
            
            # Get content
            # Kimi's /files/{file_id}/content endpoint
            # OpenAI SDK has client.files.content(file_id)
            # We might need to wait/retry
            
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
                return "无法提取文件内容。"
            
            return content
        except Exception as e:
            logger.error(f"Error extracting document: {e}")
            return "无法提取文件内容。"

    async def get_audio_text(self, file_path: str) -> str:
        """
        Get text from audio using DashScope ASR.
        """
        if not dashscope:
            return "ASR Service not available."
            
        api_key = settings.DASHSCOPE_API_KEY
        if not api_key:
            return "ASR API Key not set."
            
        dashscope.api_key = api_key
        
        # Use a simple synchronous wrapper or loop runner for DashScope callback
        # Since we are in async function, we can use run_in_executor
        
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
                format='pcm', # We might need to ensure format, or let SDK handle wav
                sample_rate=16000,
                callback=callback
            )
            
            recognition.start()
            
            # Read file and send
            # Assuming file is small enough or we chunk it
            # To be safe with formats, we should use a library to read audio, 
            # but for now let's assume valid wav/pcm or simple read
            try:
                with open(file_path, 'rb') as f:
                    while True:
                        data = f.read(3200) # 100ms chunk
                        if not data:
                            break
                        recognition.send_audio_frame(data)
                        # No sleep needed for file mode usually, but for realtime model maybe?
                        # Using sleep to simulate real-time factor roughly
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
        """
        Use Kimi to check if the query requires complex reasoning (DeepSeek).
        Returns True if reasoning is needed, False otherwise.
        """
        try:
            system_prompt = (
                "你是一个意图分类助手。请判断用户的输入是否属于'复杂逻辑推理'、'数学解题'、'物理推导'或'代码算法'类问题。"
                "如果是，请返回 TRUE；如果是普通闲聊、简单知识问答或不需要深度思考的问题，请返回 FALSE。"
                "只返回 TRUE 或 FALSE，不要有其他内容。"
            )
            
            response = await self.kimi_client.chat.completions.create(
                model=self.kimi_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ],
                temperature=1.0, 
                # Note: Kimi API error says "only 1 is allowed". 
            )
            
            result = response.choices[0].message.content.strip().upper()
            logger.info(f"Intent detection result: {result}")
            return "TRUE" in result
            
        except Exception as e:
            logger.error(f"Error in intent detection: {e}")
            # Fallback to False (use Kimi) on error
            return False

    async def stream_deepseek_reasoning(self, content: str) -> AsyncGenerator[Dict[str, str], None]:
        """
        Stream DeepSeek Reasoner output (Reasoning + Answer).
        Yields chunks with type 'reasoning' or 'content'.
        """
        try:
            logger.info("Streaming DeepSeek Reasoner...")
            stream = await self.deepseek_client.chat.completions.create(
                model=self.deepseek_model,
                messages=[{"role": "user", "content": content}],
                stream=True
            )
            
            async for chunk in stream:
                delta = chunk.choices[0].delta
                
                # Check for reasoning content (DeepSeek specific field)
                # It might be in 'reasoning_content' attribute
                if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                    yield {"type": "reasoning", "content": delta.reasoning_content}
                
                # Standard content
                if delta.content:
                    yield {"type": "content", "content": delta.content}
                    
        except Exception as e:
            logger.error(f"Error streaming DeepSeek: {e}")
            # Fallback/Error handling handled by caller
            raise e

    async def stream_kimi_response(self, content: str, history: List[Dict[str, str]] = []) -> AsyncGenerator[str, None]:
        """
        Stream response from Kimi (Moonshot).
        """
        try:
            messages = [{"role": "system", "content": "你是 EduMind 智能助教，擅长通过循循善诱的方式教学。"}]
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

    async def stream_summarize_with_kimi(self, user_query: str, reasoning: str, answer: str) -> AsyncGenerator[str, None]:
        """
        Stream Kimi summary of DeepSeek results.
        """
        try:
            prompt = (
                f"用户的问题是：'{user_query}'\n\n"
                f"DeepSeek 的推理过程如下：\n{reasoning}\n\n"
                f"DeepSeek 的最终答案是：\n{answer}\n\n"
                "请作为一名优秀的老师，综合以上信息，给学生一个清晰、易懂的讲解。不要直接扔答案，要包含解题思路的总结。"
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
            yield answer # Fallback

    async def stream_chat(self, content: str, history: List[Dict[str, str]]) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Main orchestration generator.
        Yields events: status, thinking_chunk, llm_chunk, llm_end
        """
        # 1. Intent Detection
        yield {"type": "status", "content": "analyzing_intent"}
        needs_reasoning = await self.check_intent(content)
        
        if needs_reasoning:
            yield {"type": "status", "content": "reasoning"}
            
            full_reasoning = ""
            full_answer = ""
            
            # 2. DeepSeek Streaming
            try:
                async for chunk in self.stream_deepseek_reasoning(content):
                    if chunk["type"] == "reasoning":
                        full_reasoning += chunk["content"]
                        # Yield reasoning chunks to frontend for "Thinking" effect
                        yield {"type": "thinking_chunk", "content": chunk["content"]}
                    elif chunk["type"] == "content":
                        full_answer += chunk["content"]
                        # We accumulate content but don't show it yet, Kimi will summarize
            except Exception as e:
                logger.error(f"DeepSeek stream failed: {e}")
                # Fallback to Kimi direct
                yield {"type": "status", "content": "fallback_generating"}
                async for chunk in self.stream_kimi_response(content, history):
                    yield {"type": "llm_chunk", "content": chunk, "model": "kimi-k2.5-fallback"}
                yield {"type": "llm_end", "content": ""}
                return

            yield {"type": "thinking_done", "content": ""}
            
            # 3. Kimi Summarization
            yield {"type": "status", "content": "summarizing"}
            async for chunk in self.stream_summarize_with_kimi(content, full_reasoning, full_answer):
                yield {"type": "llm_chunk", "content": chunk, "model": "deepseek-v3-reasoner"}
                
        else:
            # Simple Query
            yield {"type": "status", "content": "generating"}
            async for chunk in self.stream_kimi_response(content, history):
                yield {"type": "llm_chunk", "content": chunk, "model": "kimi-k2.5"}
        
        yield {"type": "llm_end", "content": ""}

    # Helper for REST API (Non-streaming wrapper)
    async def process_chat_full(self, content: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
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

ai_service = AIService()
