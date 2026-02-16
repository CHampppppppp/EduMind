from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger
import json
from typing import List, Dict, Any, Optional, AsyncGenerator

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
