from groq import Groq
import os
import time

class GroqClient:
    # Leave headroom below Groq's 8000 TPM limit for estimation variance.
    MAX_REQUEST_TOKENS = 7600
    MIN_COMPLETION_TOKENS = 256
    MAX_STREAM_CONTINUATIONS = 2

    @staticmethod
    def _estimate_prompt_tokens(messages):
        text = "\n".join(str(message.get("content", "")) for message in messages)
        # Vietnamese prose can tokenize more densely than English; /3 is conservative.
        return max(1, (len(text) + 2) // 3)

    def _safe_max_tokens(self, messages, requested):
        prompt_tokens = self._estimate_prompt_tokens(messages)
        available = self.MAX_REQUEST_TOKENS - prompt_tokens
        if available < self.MIN_COMPLETION_TOKENS:
            raise ValueError("Nội dung yêu cầu quá dài, hãy rút gọn bản phác thảo hoặc lịch sử truyện rồi thử lại.")
        return min(requested, available)

    @staticmethod
    def _is_request_too_large(error):
        message = str(error)
        return "413" in message or "rate_limit_exceeded" in message or "Request too large" in message

    @staticmethod
    def _retry_budgets(initial):
        budgets = [initial, max(256, int(initial * 0.75)), max(256, int(initial * 0.5))]
        return list(dict.fromkeys(budgets))

    def __init__(self, model_name: str = "qwen/qwen3.8-27b", api_key: str = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("Thiếu biến môi trường GROQ_API_KEY hoặc key chuyên dụng tương ứng")
            
        self.client = Groq(api_key=self.api_key)
        self.model = model_name
    
    def generate(self, prompt: str, system_prompt: str = "", temperature: float = 0.7, max_tokens: int = 2000, response_format = None) -> str:
        """Convenience method to generate text from a prompt with optional system prompt."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return self.chat(messages, temperature=temperature, max_tokens=max_tokens, response_format=response_format)

    FALLBACK_MODELS = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "allam-2-7b",
    ]

    def chat(self, messages, temperature=0.7, max_tokens=2000, response_format=None):
        """Send message to Groq LLM with multi-model rate-limit resilience"""
        models_to_try = [self.model] + [m for m in self.FALLBACK_MODELS if m != self.model]
        last_error = None

        for model_candidate in models_to_try:
            safe_max_tokens = self._safe_max_tokens(messages, max_tokens)
            budgets = self._retry_budgets(safe_max_tokens)
            
            for index, budget in enumerate(budgets):
                params = {
                    "model": model_candidate,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": budget,
                }
                if response_format:
                    params["response_format"] = response_format
                try:
                    response = self.client.chat.completions.create(**params)
                    return response.choices[0].message.content
                except Exception as error:
                    last_error = error
                    err_msg = str(error).lower()
                    if "rate_limit" in err_msg or "429" in err_msg or "tokens per day" in err_msg or "request too large" in err_msg or "413" in err_msg:
                        # Break budget loop to immediately switch to next model candidate
                        break
                    if not self._is_request_too_large(error) or index == len(budgets) - 1:
                        break
                    time.sleep(0.25)
        raise last_error

    def chat_stream(self, messages, temperature=0.7, max_tokens=2000):
        """Stream the completion with multi-model fallback resilience and resume once or twice if needed."""
        models_to_try = [self.model] + [m for m in self.FALLBACK_MODELS if m != self.model]
        last_error = None

        for model_candidate in models_to_try:
            original_messages = list(messages)
            request_messages = original_messages
            generated_text = ""
            continuation_count = 0
            candidate_emitted_anything = False

            try:
                while True:
                    safe_max_tokens = self._safe_max_tokens(request_messages, max_tokens)
                    budgets = self._retry_budgets(safe_max_tokens)
                    should_continue = False
                    finish_reason = None

                    for index, budget in enumerate(budgets):
                        emitted_this_request = False
                        try:
                            response = self.client.chat.completions.create(
                                model=model_candidate,
                                messages=request_messages,
                                temperature=temperature,
                                max_tokens=budget,
                                stream=True
                            )
                            for chunk in response:
                                choice = chunk.choices[0]
                                finish_reason = getattr(choice, "finish_reason", None) or finish_reason
                                content = getattr(choice.delta, "content", None)
                                if content:
                                    emitted_this_request = True
                                    candidate_emitted_anything = True
                                    generated_text += content
                                    yield content
                            break
                        except Exception as error:
                            # If nothing emitted yet for this candidate, check if we can retry with smaller budget or try next model
                            if not emitted_this_request:
                                if self._is_request_too_large(error) and index < len(budgets) - 1:
                                    time.sleep(0.25)
                                    continue
                                # Let outer loop try next candidate model
                                raise error

                            if generated_text and continuation_count < self.MAX_STREAM_CONTINUATIONS:
                                continuation_count += 1
                                should_continue = True
                                break
                            raise error

                    if finish_reason == "length":
                        if not generated_text:
                            raise RuntimeError("The language model reached its output limit before producing story text.")
                        if continuation_count < self.MAX_STREAM_CONTINUATIONS:
                            continuation_count += 1
                            should_continue = True

                    if not should_continue:
                        return

                    continuation_context = generated_text[-6000:]
                    request_messages = [
                        *original_messages,
                        {
                            "role": "assistant",
                            "content": continuation_context,
                        },
                        {
                            "role": "user",
                            "content": (
                                "Hãy viết tiếp ngay từ vị trí kết thúc của đoạn văn bản trên. "
                                "Không lặp lại câu hoặc đoạn đã có; hoàn thành câu đang dang dở nếu cần, "
                                "sau đó tiếp tục tự nhiên và giữ nguyên nhân vật, bối cảnh, giọng văn."
                            ),
                        },
                    ]
            except Exception as candidate_err:
                last_error = candidate_err
                # If we already yielded chunks to the caller, we cannot switch to another model without duplicating
                if candidate_emitted_anything:
                    raise candidate_err
                # If no chunks were emitted yet, smoothly try the next fallback model candidate
                time.sleep(0.2)
                continue

        if last_error:
            raise last_error
