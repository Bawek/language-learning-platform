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


class EdgeTTSProvider(BaseTTSProvider):
    """
    Text-to-Speech using Microsoft Edge's free TTS API via edge-tts library.
    Completely free with no API key required. Supports 400+ voices in 100+ languages.
    
    Popular voices:
    - English: en-US-AriaNeural, en-US-GuyNeural, en-GB-SoniaNeural
    - Spanish: es-ES-ElviraNeural, es-MX-DaliaNeural, es-AR-ElenaNeural
    - Amharic: am-ET-AmehaNeural, am-ET-MekdesNeural
    - Somali: so-SO-MuuseNeural, so-SO-UbaxNeural
    """

    # Voice mapping for common languages (can be overridden via EDGE_TTS_VOICE env var)
    DEFAULT_VOICES = {
        'en': 'en-US-AriaNeural',
        'es': 'es-ES-ElviraNeural',
        'am': 'am-ET-MekdesNeural',
        'om': 'en-US-AriaNeural',  # Oromo not supported, fallback to English
        'ti': 'en-US-AriaNeural',  # Tigrinya not supported, fallback to English
        'so': 'so-SO-UbaxNeural',
        'fr': 'fr-FR-DeniseNeural',
        'de': 'de-DE-KatjaNeural',
        'ar': 'ar-SA-ZariyahNeural',
        'zh': 'zh-CN-XiaoxiaoNeural',
    }

    def __init__(self, default_voice: Optional[str] = None):
        self.default_voice = default_voice or os.environ.get('EDGE_TTS_VOICE', 'en-US-AriaNeural')

    async def synthesize_stream(
        self,
        text: str,
        voice: str = 'alloy',
        language: str = 'en',
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream TTS audio using edge-tts.
        
        Args:
            text: Text to synthesize
            voice: Voice name (edge-tts format) or 'alloy'/'echo'/etc (will map to appropriate voice)
            language: Language code to auto-select voice if voice is generic
        """
        try:
            import edge_tts
        except ImportError:
            logger.error('edge-tts not installed. Install with: pip install edge-tts')
            yield _generate_silence_wav(duration_ms=500)
            return

        # Map OpenAI-style voice names to edge-tts voices
        if voice in ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']:
            # Use language-specific default voice
            voice = self.DEFAULT_VOICES.get(language, self.default_voice)
        
        try:
            communicate = edge_tts.Communicate(text, voice)
            
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
                    
            logger.debug('TTS (Edge): voice=%s, text_length=%d', voice, len(text))
            
        except Exception as exc:
            logger.error('Edge TTS error: %s', exc, exc_info=True)
            # Fallback to silence on error
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
    Reads TTS_PROVIDER env var: 'edge' (default, free) | 'openai' | 'local'
    """
    provider = os.environ.get('TTS_PROVIDER', 'edge').lower()
    
    if provider == 'edge':
        voice = os.environ.get('EDGE_TTS_VOICE', 'en-US-AriaNeural')
        logger.info('Using Edge TTS provider (voice=%s) - FREE.', voice)
        return EdgeTTSProvider(default_voice=voice)
    elif provider == 'openai':
        model = os.environ.get('OPENAI_TTS_MODEL', 'tts-1')
        logger.info('Using OpenAI TTS provider (model=%s).', model)
        return OpenAITTSProvider(model=model)
    else:  # local
        logger.info('Using local TTS provider.')
        return LocalTTSProvider()
