type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Bucket = {
  resetAt: number;
  count: number;
};

const store = new Map<string, Bucket>();

function cleanup(now: number) {
  // Keep this lightweight: only cleanup occasionally
  if (store.size < 1000) return;
  for (const [k, b] of store.entries()) {
    if (b.resetAt <= now) store.delete(k);
  }
}

export function getRequestIp(request: Request) {
  const xfwd = request.headers.get("x-forwarded-for");
  if (xfwd) {
    const first = xfwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

export function rateLimitOrThrow(params: {
  request: Request;
  key: string;
  options: RateLimitOptions;
}) {
  const now = Date.now();
  cleanup(now);

  const ip = getRequestIp(params.request);
  const composite = `${params.key}:${ip}`;

  const existing = store.get(composite);
  if (!existing || existing.resetAt <= now) {
    store.set(composite, { resetAt: now + params.options.windowMs, count: 1 });
    return { ok: true as const, remaining: params.options.max - 1 };
  }

  if (existing.count >= params.options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      ok: false as const,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  store.set(composite, existing);
  return { ok: true as const, remaining: Math.max(0, params.options.max - existing.count) };
}
