import http from 'node:http';

const port = Number(process.env.PORT || 8787);
const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const systemPrompt = `You are Orbit, a careful AI study tutor. Answer the learner's question directly and accurately. Explain the reasoning in simple steps, define unfamiliar terms, show formulas or examples when useful, and say when you are uncertain. Never invent sources or facts. If the question is ambiguous, ask one concise clarification. Format responses with these headings when useful: Answer, Reasoning, Example, Check yourself.`;

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  response.end(JSON.stringify(body));
}

async function askGemini(message, context) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: `Learner context: ${JSON.stringify(context)}\n\nQuestion: ${message}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 900 }
    })
  });
  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || null;
}

async function askOpenAI(message, context) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Learner context: ${JSON.stringify(context)}\n\nQuestion: ${message}` }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {});
  if (request.method !== 'POST' || request.url !== '/api/ask') return sendJson(response, 404, { error: 'Not found' });

  let raw = '';
  request.on('data', (chunk) => { raw += chunk; });
  request.on('end', async () => {
    try {
      const { message, context = {} } = JSON.parse(raw || '{}');
      if (!message?.trim()) return sendJson(response, 400, { error: 'A question is required.' });
      const reply = await askGemini(message, context) || await askOpenAI(message, context);
      if (!reply) return sendJson(response, 503, { error: 'No AI provider configured.' });
      sendJson(response, 200, { reply });
    } catch (error) {
      sendJson(response, 502, { error: error.message || 'AI request failed.' });
    }
  });
});

server.listen(port, () => console.log(`Orbit AI server running at http://localhost:${port}`));
