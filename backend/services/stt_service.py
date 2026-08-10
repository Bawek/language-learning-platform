"""
Speech-to-Text service implementations.
Supports faster-whisper (local) and OpenAI Whisper API.
"""
import io
import os
import logging
from typing import Optional

from .ai_provider import BaseSTTProvider

logger = logging.getLogger(__name__)

# Language code normalization map for faster-whisper
LANGUAGE_MAP = {
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'japanese': 'ja',
    'mandarin': 'zh',
    'portuguese': 'pt',
    'italian': 'it',
    'korean': 'ko',
    'arabic': 'ar',
}


def normalize_language_code(language: str) -> str:
    """Convert full language names to BCP-47 codes."""
    return LANGUAGE_MAP.get(language.lower(), language)


class FasterWhisperSTT(BaseSTTProvider):
    """
    Local Speech-to-Text using faster-whisper.
    Runs entirely on-device with no API calls required.
    """

    _model = None  # Class-level singleton to avoid reloading

    def __init__(self, model_size: str = 'base', device: str = 'auto', compute_type: str = 'auto'):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type

    def _get_model(self):
        if FasterWhisperSTT._model is None:
            from faster_whisper import WhisperModel
            logger.info('Loading faster-whisper model: %s', self.model_size)
            # Auto-select device/compute_type based on availability
            device = self.device if self.device != 'auto' else 'cpu'
            compute_type = self.compute_type if self.compute_type != 'auto' else 'int8'
            FasterWhisperSTT._model = WhisperModel(
                self.model_size,
                device=device,
                compute_type=compute_type,
            )
            logger.info('faster-whisper model loaded.')
        return FasterWhisperSTT._model

    async def transcribe(self, audio_bytes: bytes, language: str) -> str:
        """Transcribe audio using local faster-whisper model."""
        import asyncio
        lang_code = normalize_language_code(language)

        def _sync_transcribe():
            model = self._get_model()
            audio_file = io.BytesIO(audio_bytes)
            segments, info = model.transcribe(
                audio_file,
                language=lang_code if lang_code != 'auto' else None,
                beam_size=5,
                vad_filter=True,
                vad_parameters={'min_silence_duration_ms': 500},
            )
            text = ' '.join(seg.text.strip() for seg in segments)
            logger.debug(
                'STT (local): detected_language=%s, transcript=%r',
                info.language,
                text[:80],
            )
            return text

        # Run the blocking model in a thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _sync_transcribe)


class OpenAIWhisperSTT(BaseSTTProvider):
    """
    Speech-to-Text using the OpenAI Whisper API.
    Requires OPENAI_API_KEY environment variable.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY', '')
        if not self.api_key:
            raise ValueError('OPENAI_API_KEY is required for OpenAIWhisperSTT.')

    async def transcribe(self, audio_bytes: bytes, language: str) -> str:
        """Transcribe audio using the OpenAI Whisper API."""
        from openai import AsyncOpenAI

        lang_code = normalize_language_code(language)
        client = AsyncOpenAI(api_key=self.api_key)

        # OpenAI Whisper requires a file-like object with a name
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = 'audio.webm'

        try:
            response = await client.audio.transcriptions.create(
                model='whisper-1',
                file=audio_file,
                language=lang_code,
                response_format='text',
            )
            transcript = str(response).strip()
            logger.debug('STT (OpenAI): transcript=%r', transcript[:80])
            return transcript
        except Exception as exc:
            logger.error('OpenAI Whisper API error: %s', exc)
            raise


class GroqWhisperSTT(BaseSTTProvider):
    """
    Speech-to-Text using Groq's Whisper API (OpenAI-compatible).
    Free tier available with generous limits.
    Supports whisper-large-v3 and whisper-large-v3-turbo models.
    """

    def __init__(self, api_key: Optional[str] = None, model: str = 'whisper-large-v3-turbo'):
        self.api_key = api_key or os.environ.get('GROQ_API_KEY', '')
        if not self.api_key:
            raise ValueError('GROQ_API_KEY is required for GroqWhisperSTT.')
        self.model = model
        self.base_url = os.environ.get('GROQ_BASE_URL', 'https://api.groq.com/openai/v1')

    async def transcribe(self, audio_bytes: bytes, language: str) -> str:
        """Transcribe audio using Groq's Whisper API."""
        from openai import AsyncOpenAI

        lang_code = normalize_language_code(language)
        client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )

        # Groq Whisper API is OpenAI-compatible
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = 'audio.webm'

        try:
            response = await client.audio.transcriptions.create(
                model=self.model,
                file=audio_file,
                language=lang_code,
                response_format='text',
            )
            transcript = str(response).strip()
            logger.debug('STT (Groq): model=%s, transcript=%r', self.model, transcript[:80])
            return transcript
        except Exception as exc:
            logger.error('Groq Whisper API error: %s', exc, exc_info=True)
            raise


def get_stt_provider() -> BaseSTTProvider:
    """
    Factory function that returns the configured STT provider.
    Reads STT_PROVIDER env var: 'groq' (default) | 'openai' | 'local'
    """
    provider = os.environ.get('STT_PROVIDER', 'groq').lower()
    
    if provider == 'groq':
        model = os.environ.get('GROQ_WHISPER_MODEL', 'whisper-large-v3-turbo')
        logger.info('Using Groq Whisper STT provider (model=%s).', model)
        return GroqWhisperSTT(model=model)
    elif provider == 'openai':
        logger.info('Using OpenAI Whisper STT provider.')
        return OpenAIWhisperSTT()
    else:  # local
        model_size = os.environ.get('WHISPER_MODEL_SIZE', 'base')
        logger.info('Using local faster-whisper STT provider (model=%s).', model_size)
        return FasterWhisperSTT(model_size=model_size)
