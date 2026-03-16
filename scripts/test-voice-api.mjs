/**
 * Voice API Connectivity Test
 * Tests the OpenAI Realtime API endpoint to verify voice features work.
 *
 * Usage: node scripts/test-voice-api.mjs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load dotenv
const dotenv = require('dotenv');
dotenv.config({ path: join(__dirname, '../.env') });

const key = process.env.OPENAI_API_KEY || '';

if (!key) {
  console.error('FAIL: OPENAI_API_KEY is not set');
  process.exit(1);
}

console.log('OPENAI_API_KEY: set (length:', key.length, ')');
console.log('Testing OpenAI Realtime API endpoint...\n');

try {
  const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy',
      instructions: 'You are NEO, the AI assistant for Golden Team Trading Services.',
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 600,
      },
    }),
  });

  const body = await resp.text();

  if (resp.ok) {
    const data = JSON.parse(body);
    console.log('PASS: Ephemeral token minted successfully');
    console.log('  Session ID:', data.id);
    console.log('  Model:', data.model);
    console.log('  Voice:', data.voice);
    console.log('  Token TTL: 60 seconds (expires at', new Date(data.client_secret.expires_at * 1000).toISOString(), ')');
    console.log('\nVoice API is fully operational.');
  } else {
    const err = JSON.parse(body);
    console.error('FAIL: OpenAI Realtime API returned error');
    console.error('  Status:', resp.status, resp.statusText);
    console.error('  Error type:', err?.error?.type);
    console.error('  Error message:', err?.error?.message);

    if (resp.status === 401) {
      console.error('\nDIAGNOSIS: API key is invalid or expired.');
      console.error('ACTION: Update OPENAI_API_KEY in project secrets.');
    } else if (resp.status === 403) {
      console.error('\nDIAGNOSIS: API key does not have access to gpt-4o-realtime-preview.');
      console.error('ACTION: Ensure your OpenAI account has Realtime API access enabled.');
    } else if (resp.status === 429) {
      console.error('\nDIAGNOSIS: Rate limit exceeded.');
      console.error('ACTION: Wait and retry, or check your OpenAI usage limits.');
    }
    process.exit(1);
  }
} catch (err) {
  console.error('FAIL: Network error reaching OpenAI API');
  console.error('  Error:', err.message);
  process.exit(1);
}
