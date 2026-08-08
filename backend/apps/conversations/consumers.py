"""
Django Channels WebSocket consumers for real-time conversation.
"""
import json
import logging
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)


class ConversationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for text-based AI conversations.
    Handles real-time text messaging with LLM streaming responses and grammar feedback.

    Connect: ws/conversation/<session_id>/?token=<jwt>
    """

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'conversation_{self.session_id}'
        self.user = self.scope.get('user')

        # Reject unauthenticated connections
        if not self.user or isinstance(self.user, AnonymousUser):
            logger.warning('Unauthenticated WebSocket connection attempt rejected.')
            await self.close(code=4001)
            return

        # Verify session belongs to this user
        session = await self.get_session()
        if session is None:
            logger.warning('Session %s not found for user %s', self.session_id, self.user)
            await self.close(code=4004)
            return

        self.session = session

        # Join channel group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        logger.info('User %s connected to conversation %s', self.user.username, self.session_id)

        # Send a welcome message
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'session_id': self.session_id,
            'message': f'Connected to conversation. Agent: {session.agent.name if session.agent else "Unknown"}',
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        logger.info(
            'User %s disconnected from conversation %s (code: %s)',
            getattr(self.user, 'username', 'unknown'),
            self.session_id,
            close_code,
        )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON payload.')
            return

        message_type = data.get('type')

        if message_type == 'text_message':
            await self.handle_text_message(data)
        elif message_type == 'session_end':
            await self.handle_session_end(data)
        elif message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))
        else:
            await self.send_error(f'Unknown message type: {message_type}')

    async def handle_text_message(self, data: dict):
        """Process an incoming text message and stream back the AI response."""
        content = data.get('content', '').strip()
        if not content:
            await self.send_error('Message content cannot be empty.')
            return

        mode = data.get('mode', 'text')

        # Save user message to DB
        user_message = await self.save_message(
            role='user',
            content=content,
            mode=mode,
            feedback=None,
        )

        # Notify start of streaming
        await self.send(text_data=json.dumps({
            'type': 'stream_start',
            'message_id': user_message.id,
        }))

        # Get conversation history for context
        history = await self.get_message_history()

        # Build system prompt from agent
        system_prompt = await self.get_system_prompt()

        try:
            from services.llm_service import get_llm_provider
            llm = get_llm_provider()

            full_response = ''
            async for chunk in llm.chat_stream(history, system_prompt):
                full_response += chunk
                await self.send(text_data=json.dumps({
                    'type': 'stream_chunk',
                    'chunk': chunk,
                }))

            # Extract feedback from the response
            feedback = await self.extract_feedback(full_response)
            clean_response = llm.strip_feedback_json(full_response) if hasattr(llm, 'strip_feedback_json') else full_response

            # Save assistant response to DB
            assistant_message = await self.save_message(
                role='assistant',
                content=clean_response,
                mode=mode,
                feedback=feedback,
            )

            # Update session stats
            await self.increment_message_count()

            # Send final complete message with feedback
            await self.send(text_data=json.dumps({
                'type': 'message_complete',
                'message_id': assistant_message.id,
                'content': clean_response,
                'feedback': feedback,
            }))

        except Exception as exc:
            logger.error('LLM error in conversation %s: %s', self.session_id, exc, exc_info=True)
            await self.send_error('An error occurred while processing your message. Please try again.')

    async def handle_session_end(self, data: dict):
        """Handle a session end request and mark the session as complete."""
        try:
            summary = data.get('summary', '')
            await self.end_session(summary)
            await self.send(text_data=json.dumps({
                'type': 'session_ended',
                'session_id': self.session_id,
            }))
        except Exception as exc:
            logger.error('Error ending session %s: %s', self.session_id, exc)
            await self.send_error('Failed to end session.')

    async def send_error(self, message: str):
        await self.send(text_data=json.dumps({'type': 'error', 'message': message}))

    # Channel layer event handlers
    async def conversation_message(self, event):
        await self.send(text_data=json.dumps(event['data']))

    # Database helpers
    @database_sync_to_async
    def get_session(self):
        from apps.sessions.models import LearningSession
        try:
            return LearningSession.objects.select_related('agent').get(
                id=self.session_id,
                user=self.user,
                is_active=True,
            )
        except LearningSession.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, role: str, content: str, mode: str, feedback):
        from apps.conversations.models import Message
        return Message.objects.create(
            session=self.session,
            role=role,
            content=content,
            mode=mode,
            feedback=feedback,
        )

    @database_sync_to_async
    def get_message_history(self):
        from apps.conversations.models import Message
        messages = Message.objects.filter(
            session=self.session,
            role__in=['user', 'assistant'],
        ).order_by('timestamp')[:40]  # last 40 messages for context
        return [{'role': m.role, 'content': m.content} for m in messages]

    @database_sync_to_async
    def get_system_prompt(self) -> str:
        if self.session.agent:
            return self.session.agent.get_system_prompt(
                target_language=self.session.target_language,
                proficiency_level=self.session.proficiency_level,
                user_name=self.user.username,
            )
        return (
            f'You are a helpful language tutor. Help the user practice '
            f'{self.session.target_language} at {self.session.proficiency_level} level.'
        )

    @database_sync_to_async
    def increment_message_count(self):
        from apps.sessions.models import LearningSession
        LearningSession.objects.filter(id=self.session_id).update(
            total_messages=LearningSession.total_messages + 1,  # type: ignore[operator]
        )

    @database_sync_to_async
    def end_session(self, summary: str):
        from django.utils import timezone
        from apps.sessions.models import LearningSession
        LearningSession.objects.filter(id=self.session_id).update(
            is_active=False,
            ended_at=timezone.now(),
            summary=summary,
        )

    @staticmethod
    async def extract_feedback(response_text: str) -> dict | None:
        """Attempt to extract JSON feedback block from LLM response."""
        import re
        pattern = r'```json\s*(\{.*?\})\s*```'
        match = re.search(pattern, response_text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return None


class AudioConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for binary audio streaming.
    Handles the full STT -> LLM -> TTS pipeline for voice conversations.

    Connect: ws/audio/<session_id>/?token=<jwt>
    """

    AUDIO_BUFFER_MAX_BYTES = 10 * 1024 * 1024  # 10 MB safety limit

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.user = self.scope.get('user')

        if not self.user or isinstance(self.user, AnonymousUser):
            await self.close(code=4001)
            return

        session = await self.get_session()
        if session is None:
            await self.close(code=4004)
            return

        self.session = session
        self.audio_buffer = bytearray()
        self.is_recording = False

        await self.accept()
        logger.info('AudioConsumer connected: session=%s user=%s', self.session_id, self.user.username)

        await self.send(text_data=json.dumps({
            'type': 'connected',
            'session_id': self.session_id,
        }))

    async def disconnect(self, close_code):
        logger.info('AudioConsumer disconnected: session=%s code=%s', self.session_id, close_code)

    async def receive(self, text_data=None, bytes_data=None):
        if bytes_data:
            await self.handle_audio_bytes(bytes_data)
        elif text_data:
            await self.handle_control_message(text_data)

    async def handle_control_message(self, text_data: str):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')

        if msg_type == 'start_recording':
            self.audio_buffer = bytearray()
            self.is_recording = True
            await self.send(text_data=json.dumps({'type': 'recording_started'}))

        elif msg_type == 'stop_recording':
            self.is_recording = False
            if self.audio_buffer:
                # Process the accumulated audio
                asyncio.ensure_future(self.process_audio())
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'No audio data received.',
                }))

        elif msg_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def handle_audio_bytes(self, data: bytes):
        """Accumulate audio chunks into the buffer."""
        if len(self.audio_buffer) + len(data) > self.AUDIO_BUFFER_MAX_BYTES:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Audio buffer limit exceeded.',
            }))
            self.audio_buffer = bytearray()
            return
        self.audio_buffer.extend(data)

    async def process_audio(self):
        """Run the STT -> LLM -> TTS pipeline on accumulated audio."""
        audio_data = bytes(self.audio_buffer)
        self.audio_buffer = bytearray()

        try:
            # Step 1: Speech-to-Text
            await self.send(text_data=json.dumps({'type': 'processing', 'stage': 'stt'}))
            from services.stt_service import get_stt_provider
            stt = get_stt_provider()
            transcript = await stt.transcribe(audio_data, language=self.session.target_language)

            if not transcript.strip():
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Could not transcribe audio. Please try again.',
                }))
                return

            # Send transcript back to client
            await self.send(text_data=json.dumps({
                'type': 'transcript',
                'content': transcript,
            }))

            # Save user message
            await self.save_message(role='user', content=transcript, mode='audio')

            # Step 2: LLM response
            await self.send(text_data=json.dumps({'type': 'processing', 'stage': 'llm'}))
            history = await self.get_message_history()
            system_prompt = await self.get_system_prompt()

            from services.llm_service import get_llm_provider
            llm = get_llm_provider()

            full_response = ''
            async for chunk in llm.chat_stream(history, system_prompt):
                full_response += chunk

            # Save assistant message
            assistant_msg = await self.save_message(
                role='assistant',
                content=full_response,
                mode='audio',
            )

            await self.send(text_data=json.dumps({
                'type': 'ai_response',
                'message_id': assistant_msg.id,
                'content': full_response,
            }))

            # Step 3: TTS
            await self.send(text_data=json.dumps({'type': 'processing', 'stage': 'tts'}))
            from services.tts_service import get_tts_provider
            tts = get_tts_provider()

            await self.send(text_data=json.dumps({'type': 'audio_start'}))
            async for audio_chunk in tts.synthesize_stream(full_response, voice='alloy'):
                await self.send(bytes_data=audio_chunk)

            await self.send(text_data=json.dumps({'type': 'audio_end'}))
            await self.increment_message_count()

        except Exception as exc:
            logger.error('Audio pipeline error: %s', exc, exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'An error occurred while processing your audio.',
            }))

    # Database helpers
    @database_sync_to_async
    def get_session(self):
        from apps.sessions.models import LearningSession
        try:
            return LearningSession.objects.select_related('agent').get(
                id=self.session_id,
                user=self.user,
                is_active=True,
            )
        except LearningSession.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, role: str, content: str, mode: str):
        from apps.conversations.models import Message
        return Message.objects.create(
            session=self.session,
            role=role,
            content=content,
            mode=mode,
        )

    @database_sync_to_async
    def get_message_history(self):
        from apps.conversations.models import Message
        messages = Message.objects.filter(
            session=self.session,
            role__in=['user', 'assistant'],
        ).order_by('timestamp')[:20]
        return [{'role': m.role, 'content': m.content} for m in messages]

    @database_sync_to_async
    def get_system_prompt(self) -> str:
        if self.session.agent:
            return self.session.agent.get_system_prompt(
                target_language=self.session.target_language,
                proficiency_level=self.session.proficiency_level,
                user_name=self.user.username,
            )
        return (
            f'You are a helpful language tutor. Help the user practice '
            f'{self.session.target_language} at {self.session.proficiency_level} level.'
        )

    @database_sync_to_async
    def increment_message_count(self):
        from apps.sessions.models import LearningSession
        LearningSession.objects.filter(id=self.session_id).update(
            total_messages=LearningSession.total_messages + 1,  # type: ignore[operator]
        )
