#!/usr/bin/env python
"""
Test script to verify the free AI configuration works correctly.
Run this before deploying to ensure all providers are configured properly.

Usage:
    python test_free_ai.py
"""
import os
import sys
import asyncio
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import django
django.setup()


async def test_llm():
    """Test Groq LLM provider."""
    print("\n🧠 Testing LLM (Groq)...")
    try:
        from services.llm_service import get_llm_provider
        
        llm = get_llm_provider()
        print(f"✅ LLM provider initialized: {llm.__class__.__name__}")
        
        # Test a simple chat
        messages = [
            {"role": "user", "content": "Say 'Hello, I am working!' in one sentence."}
        ]
        system_prompt = "You are a helpful assistant. Be brief."
        
        response = ""
        async for chunk in llm.chat_stream(messages, system_prompt):
            response += chunk
        
        if response:
            print(f"✅ LLM Response: {response[:100]}...")
            return True
        else:
            print("❌ LLM returned empty response")
            return False
            
    except Exception as e:
        print(f"❌ LLM Test Failed: {e}")
        return False


async def test_tts():
    """Test Edge TTS provider."""
    print("\n🔊 Testing TTS (Edge)...")
    try:
        from services.tts_service import get_tts_provider
        
        tts = get_tts_provider()
        print(f"✅ TTS provider initialized: {tts.__class__.__name__}")
        
        # Test synthesis
        audio_chunks = []
        async for chunk in tts.synthesize_stream(
            "Hello, this is a test.",
            voice="alloy",
            language="en"
        ):
            audio_chunks.append(chunk)
        
        total_size = sum(len(chunk) for chunk in audio_chunks)
        if total_size > 0:
            print(f"✅ TTS generated {len(audio_chunks)} chunks ({total_size} bytes)")
            return True
        else:
            print("❌ TTS returned no audio data")
            return False
            
    except Exception as e:
        print(f"❌ TTS Test Failed: {e}")
        return False


async def test_stt():
    """Test Groq STT provider (requires actual audio file)."""
    print("\n🎤 Testing STT (Groq)...")
    print("⚠️  STT test requires an audio file, skipping for now.")
    print("💡 To test STT manually:")
    print("   1. Record a short audio file")
    print("   2. Send it via WebSocket to /ws/audio/<session_id>/")
    print("   3. Check the transcript in the response")
    return True


def check_env_vars():
    """Check if all required environment variables are set."""
    print("\n🔍 Checking Environment Variables...")
    
    required_vars = {
        'GROQ_API_KEY': 'Groq API key for LLM and STT',
        'LLM_PROVIDER': 'Should be "groq"',
        'TTS_PROVIDER': 'Should be "edge"',
        'STT_PROVIDER': 'Should be "groq"',
    }
    
    optional_vars = {
        'GROQ_MODEL': 'LLM model (default: llama-3.3-70b-versatile)',
        'GROQ_WHISPER_MODEL': 'STT model (default: whisper-large-v3-turbo)',
        'EDGE_TTS_VOICE': 'TTS voice (default: en-US-AriaNeural)',
    }
    
    all_good = True
    
    # Check required
    for var, description in required_vars.items():
        value = os.environ.get(var)
        if value:
            # Mask API keys
            if 'KEY' in var:
                display_value = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
            else:
                display_value = value
            print(f"✅ {var}: {display_value}")
        else:
            print(f"❌ {var}: NOT SET - {description}")
            all_good = False
    
    # Check optional
    print("\nOptional variables:")
    for var, description in optional_vars.items():
        value = os.environ.get(var)
        if value:
            print(f"✅ {var}: {value}")
        else:
            print(f"ℹ️  {var}: using default - {description}")
    
    return all_good


async def main():
    """Run all tests."""
    print("=" * 60)
    print("🧪 Free AI Configuration Test Suite")
    print("=" * 60)
    
    # Check environment
    env_ok = check_env_vars()
    
    if not env_ok:
        print("\n❌ Environment variables not properly configured!")
        print("📝 Please update your .env file and try again.")
        print("💡 See FREE_AI_SETUP.md for configuration guide.")
        return False
    
    # Run tests
    results = {}
    
    results['LLM'] = await test_llm()
    results['TTS'] = await test_tts()
    results['STT'] = await test_stt()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    for test, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! Your free AI stack is ready to deploy.")
        print("\n📚 Next steps:")
        print("   1. Commit your changes (except .env)")
        print("   2. Deploy to Railway/Render")
        print("   3. Set environment variables in your hosting platform")
        print("   4. Test the live deployment")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        print("💡 See FREE_AI_SETUP.md for troubleshooting.")
    
    return all_passed


if __name__ == '__main__':
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
