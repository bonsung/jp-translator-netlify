const MODE_DESC = {
  business: '격식있고 전문적인 비즈니스 문체로',
  sns: '친근하고 캐주얼한 말투로',
  email: '이메일 형식으로 공손하고 명확하게'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, lang, mode } = req.body;
    if (!text || !lang) {
      return res.status(400).json({ error: '파라미터 오류' });
    }

    const target = lang === 'cn' ? '중국어 간체' : '영어';
    const style = MODE_DESC[mode] || MODE_DESC.business;
    const prompt = `다음 한국어를 ${target}로 번역하세요. 스타일: ${style}. 번역문만 출력하고 설명 없이.\n\n${text}`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(r.status).json({ error: err });
    }

    const data = await r.json();
    const result = data.content?.map(b => b.text || '').join('').trim() || '';
    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
