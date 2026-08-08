"""
Abstract base classes for AI service providers.
Defines the interface that all STT, LLM, and TTS providers must implement.
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator


class BaseSTTProvider(ABC):
    """
    Abstract base class for Speech-to-Text providers.
    """

    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, language: str) -> str:
        """
        Transcribe audio bytes to text.

        Args:
            audio_bytes: Raw audio data (WAV, MP3, WebM, etc.)
            language: BCP-47 language code or full language name, e.g. 'en', 'spanish'

        Returns:
            Transcribed text string.
        """
        ...


class BaseLLMProvider(ABC):
    """
    Abstract base class for Large Language Model providers.
    """

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat completion response.

        Args:
            messages: List of message dicts with 'role' and 'content' keys.
            system_prompt: The system instruction for the conversation.

        Yields:
            Text chunks as they stream from the model.
        """
        ...

    def strip_feedback_json(self, text: str) -> str:
        """
        Remove embedded JSON feedback blocks from LLM response text.
        Override in subclasses if the provider embeds structured feedback.
        """
        import re
        # Remove ```json ... ``` blocks
        clean = re.sub(r'```json\s*\{.*?\}\s*```', '', text, flags=re.DOTALL)
        return clean.strip()


class BaseTTSProvider(ABC):
    """
    Abstract base class for Text-to-Speech providers.
    """

    @abstractmethod
    async def synthesize_stream(
        self,
        text: str,
        voice: str,
    ) -> AsyncGenerator[bytes, None]:
        """
        Convert text to speech and stream audio bytes.

        Args:
            text: The text to synthesize.
            voice: Voice identifier (provider-specific).

        Yields:
            Audio chunks as bytes.
        """
        ...
