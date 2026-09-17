export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = String(req.query?.q || 'funny sound').slice(0, 120);
  const page = Math.max(1, Math.min(20, Number(req.query?.page || 1)));
  const limit = Math.max(1, Math.min(50, Number(req.query?.limit || 48)));

  const url = new URL('https://sfxmint.com/api/v1/search');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', String(limit));

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error || data.message || 'Sound API request failed' });

    const raw = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
    const results = raw.map((s, i) => ({
      id: s.slug || s.id || `${q}-${page}-${i}`,
      name: s.title || s.name || `Sound ${i + 1}`,
      creator: s.creator || s.author || 'SFXMint',
      license: s.license || 'CC0 1.0',
      duration: Number(s.duration_ms || s.duration || 0) / (s.duration_ms ? 1000 : 1),
      preview: s.mp3_url || s.download_url || s.preview_url || s.url,
      source: s.page_url || `https://sfxmint.com/sounds/${encodeURIComponent(s.slug || '')}`
    })).filter(s => s.preview);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ count: results.length, page, results });
  } catch (e) {
    return res.status(500).json({ error: 'Could not reach the sound library.' });
  }
}
