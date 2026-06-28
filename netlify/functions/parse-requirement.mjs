const DEFAULT_BACKEND =
  'https://parseclientrequirement-kuz6vb23eq-uc.a.run.app';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let text;
  try {
    ({ text } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: { message: 'Invalid JSON body' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const backendUrl = process.env.PARSE_REQUIREMENT_BACKEND_URL || DEFAULT_BACKEND;
  const auth = req.headers.get('authorization');

  const backendRes = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {}),
    },
    body: JSON.stringify({ data: { text } }),
  });

  const body = await backendRes.text();
  return new Response(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
