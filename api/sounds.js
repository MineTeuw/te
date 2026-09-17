export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.FREESOUND_API_KEY;
  if (!key) return res.status(500).json({ error: 'FREESOUND_API_KEY is not configured on Vercel.' });

  const q = String(req.query?.q || 'funny sound').slice(0, 120);
  const page = Math.max(1, Math.min(20, Number(req.query?.page || 1)));
  const url = new URL('https://freesound.org/apiv2/search/text/');
  url.searchParams.set('query', q);
  url.searchParams.set('token', key);
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', '48');
  url.searchParams.set('fields', 'id,name,previews,username,license,duration,url,description');
  url.searchParams.set('filter', 'duration:[0.1 TO 20]');

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.detail || 'Freesound request failed' });
    const results = (data.results || []).map(s => ({
      id: s.id,
      name: s.name,
      creator: s.username,
      license: s.license,
      duration: s.duration,
      preview: s.previews?.['preview-hq-mp3'] || s.previews?.['preview-lq-mp3'],
      source: s.url
    })).filter(s => s.preview);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ count: data.count || 0, page, results });
  } catch (e) {
    return res.status(500).json({ error: 'Could not reach Freesound.' });
  }
}
