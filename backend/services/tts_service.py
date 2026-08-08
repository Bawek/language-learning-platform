"""
Text-to-Speech service implementations.
Supports OpenAI TTS API and a local TTS stub for future integration.
"""
import os
import logging
from typing import AsyncGenerator, Optional

from .ai_provider import BaseTTSProvider

logger = logging.getLogger(__name__)

# OpenAI TTS voice options
OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']

# Default chunk size for audio streaming (32 KB)
AUDIO_CHUNK_SIZE = 32 * 1024


class OpenAITTSProvider(BaseTTSProvider):
    """
    Text-to-Speech using the OpenAI TTS API with streaming audio output.
    Produces high-quality audio in opus format by default.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = 'tts-1',
        response_format: str = 'opus',
    ):
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY', '')
        if not self.api_key:
            raise ValueError('OPENAI_API_KEY is required for OpenAITTSProvider.')
        self.model = model
        self.response_format = response_format

    async def synthesize_stream(
        self,
        text: str,
        voice: str = 'alloy',
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream TTS audio from the OpenAI API.
        Yields audio bytes in chunks suitable for WebSocket streaming.
        """
        if voice not in OPENAI_VOICES:
            logger.warning('Unknown voice %r, falling back to "alloy".', voice)
            voice = 'alloy'

        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=self.api_key)

        try:
            async with client.audio.speech.with_streaming_response.create(
                model=self.model,
                voice=voice,
                input=text,
                response_format=self.response_format,
            ) as response:
                async for chunk in response.iter_bytes(chunk_size=AUDIO_CHUNK_SIZE):
                    if chunk:
                        yield chunk

        except Exception as exc:
            logger.error('OpenAI TTS streaming error: %s', exc, exc_info=True)
            raise


class LocalTTSProvider(BaseTTSProvider):
    """
    Stub for local TTS integration (e.g., Coqui TTS, Piper, or custom models).
    Replace the `synthesize_stream` implementation with your local TTS call.
    """

    def __init__(self, model_path: Optional[str] = None, base_url: Optional[str] = None):
        self.model_path = model_path or os.environ.get('LOCAL_TTS_MODEL_PATH', '')
        self.base_url = base_url or os.environ.get('LOCAL_TTS_BASE_URL', 'http://localhost:5500')

    async def synthesize_stream(
        self,
        text: str,
        voice: str = 'default',
    ) -> AsyncGenerator[bytes, None]:
        """
        Placeholder for local TTS.
        Currently calls a local HTTP TTS endpoint if configured,
        or generates silence as a fallback.
        """
        import aiohttp

        if self.base_url:
            # Example: POST to a local Coqui TTS server
            url = f'{self.base_url}/api/tts'
            payload = {'text': text, 'speaker_id': voice}
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=payload) as response:
                        if response.status == 200:
                            async for chunk in response.content.iter_chunked(AUDIO_CHUNK_SIZE):
                                if chunk:
                                    yield chunk
                            return
                        else:
                            logger.warning('Local TTS server returned %d', response.status)
            except Exception as exc:
                logger.error('Local TTS request failed: %s', exc)

        # Fallback: yield an empty WAV file (silence)
        logger.warning('LocalTTSProvider: no audio generated (stub mode). Yielding silence.')
        yield _generate_silence_wav(duration_ms=500)


def _generate_silence_wav(duration_ms: int = 500, sample_rate: int = 22050) -> bytes:
    """Generate a minimal silent WAV file for fallback/testing."""
    import struct
    num_samples = int(sample_rate * duration_ms / 1000)
    # PCM 16-bit mono
    audio_data = b'\x00\x00' * num_samples
    data_size = len(audio_data)
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF', 36 + data_size, b'WAVE',
        b'fmt ', 16, 1, 1,  # PCM, mono
        sample_rate, sample_rate * 2, 2, 16,
        b'data', data_size,
    )
    return header + audio_data


def get_tts_provider() -> BaseTTSProvider:
    """
    Factory function that returns the configured TTS provider.
    Reads TTS_PROVIDER env var: 'openai' (default) | 'local'
    """
    provider = os.environ.get('TTS_PROVIDER', 'openai').lower()
    if provider == 'local':
        logger.info('Using local TTS provider.')
        return LocalTTSProvider()
    else:
        model = os.environ.get('OPENAI_TTS_MODEL', 'tts-1')
        logger.info('Using OpenAI TTS provider (model=%s).', model)
        return OpenAITTSProvider(model=model)
