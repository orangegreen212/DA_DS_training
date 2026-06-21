// api/transcribe.js — Groq Whisper STT (CommonJS для Vercel)
const { Readable } = require('stream');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Collect raw body
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });
    const body = Buffer.concat(chunks);
    const contentType = req.headers['content-type'];

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': contentType,
      },
      body,
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('Whisper error:', err);
      return res.status(502).json({ error: 'Transcription failed', detail: err });
    }

    const data = await groqRes.json();
    return res.status(200).json({ text: data.text || '' });

  } catch (e) {
    console.error('transcribe error:', e);
    return res.status(500).json({ error: 'Internal server error', detail: e.message });
  }
};
