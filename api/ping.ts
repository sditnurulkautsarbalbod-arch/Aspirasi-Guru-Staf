export function GET(req: Request) {
  return new Response(
    JSON.stringify({ ok: true, method: 'GET', url: req.url }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function POST(req: Request) {
  return new Response(
    JSON.stringify({ ok: true, method: 'POST', url: req.url }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
