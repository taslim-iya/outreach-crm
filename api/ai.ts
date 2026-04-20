import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { provider, apiKey, messages, model, systemPrompt, maxTokens } = req.body || {};
  if (!provider || !apiKey || !messages) {
    return res.status(400).json({ error: 'Missing provider, apiKey, or messages' });
  }

  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: maxTokens || 16000,
        }),
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);
      return res.status(200).json({ content: data.choices?.[0]?.message?.content || '' });
    }

    // Currently only OpenAI is supported. To add another provider (e.g. Anthropic,
    // Google), add an `else if (provider === '...')` block above this line.
    return res.status(400).json({ error: `Unknown provider: "${provider}". Only "openai" is currently supported.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI proxy failed' });
  }
}
