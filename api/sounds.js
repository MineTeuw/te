export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = String(req.query?.q || 'sound effect').slice(0, 120);
  const page = Math.max(1, Math.min(12, Number(req.query?.page || 1)));
  const pageSize = 24;

  const url = new URL('https://api.openverse.org/v1/audio/');
  url.searchParams.set('q', q);
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('mature', 'false');

  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'SoundBox/1.0' } });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.detail || data.error || 'Audio search failed' });

    const results = (Array.isArray(data.results) ? data.results : []).map((s, i) => ({
      id: s.identifier || s.id || `${page}-${i}`,
      name: s.title || 'Untitled recording',
      creator: s.creator || 'Unknown creator',
      license: s.license ? `${s.license}${s.license_version ? ' ' + s.license_version : ''}` : 'Open license',
      duration: Number(s.duration || 0) / 1000,
      preview: s.url,
      source: s.foreign_landing_url || s.detail_url || 'https://openverse.org/',
      provider: s.provider || s.source || 'Openverse'
    })).filter(s => s.preview);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ count: data.result_count || results.length, page, results });
  } catch (e) {
    return res.status(500).json({ error: 'Could not reach the open audio library.' });
  }
}
