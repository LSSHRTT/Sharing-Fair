const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export function jsonOk<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: JSON_HEADERS,
  });
}

export function jsonError(
  error: string,
  status = 400,
  details?: unknown,
): Response {
  return new Response(
    JSON.stringify({ ok: false, error, ...(details ? { details } : {}) }),
    { status, headers: JSON_HEADERS },
  );
}
