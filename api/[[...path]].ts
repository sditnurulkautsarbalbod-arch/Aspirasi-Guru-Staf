// TEST MODE: Pure handler to verify [[...path]] multi-segment routing
export function GET(req: Request): Response {
  const url = new URL(req.url);
  return new Response(
    JSON.stringify({
      ok: true,
      method: 'GET',
      pathname: url.pathname,
      segments: url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean),
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
      pathname: url.pathname,
      segments: url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean),
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
    JSON.stringify({
      ok: true,
      method: 'PATCH',
      pathname: url.pathname,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function DELETE(req: Request): Response {
  const url = new URL(req.url);
  return new Response(
    JSON.stringify({
      ok: true,
      method: 'DELETE',
      pathname: url.pathname,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function OPTIONS(req: Request): Response {
  return new Response(null, { status: 204 });
}
