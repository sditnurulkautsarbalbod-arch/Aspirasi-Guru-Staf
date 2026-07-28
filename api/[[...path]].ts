// Debug handler: verify rewrite preserves original URL for multi-segment paths
export function GET(req: Request): Response {
  const url = new URL(req.url);
  return new Response(
    JSON.stringify({
      ok: true,
      method: 'GET',
      href: req.url,
      pathname: url.pathname,
      search: url.search,
      headers: Object.fromEntries(req.headers.entries()),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function POST(req: Request): Response {
  const url = new URL(req.url);
  return new Response(
    JSON.stringify({
      ok: true,
      method: 'POST',
      href: req.url,
      pathname: url.pathname,
      search: url.search,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function PATCH(req: Request): Response {
  const url = new URL(req.url);
  return new Response(
    JSON.stringify({ ok: true, method: 'PATCH', pathname: url.pathname }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export function DELETE(req: Request): Response {
  const url = new URL(req.url);
  return new Response(
    JSON.stringify({ ok: true, method: 'DELETE', pathname: url.pathname }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export function OPTIONS(req: Request): Response {
  return new Response(null, { status: 204 });
}
