export function parseIntParam(value, name) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) {
    const err = new Error(`${name} must be a number`);
    err.status = 400;
    throw err;
  }
  return n;
}

export function parsePagination(query, { defaultLimit = 50, maxLimit = 200 } = {}) {
  const limitRaw = query?.limit ?? defaultLimit;
  const offsetRaw = query?.offset ?? 0;

  const limit = parseIntParam(limitRaw, 'limit') ?? defaultLimit;
  const offset = parseIntParam(offsetRaw, 'offset') ?? 0;

  const safeLimit = Math.min(Math.max(limit, 1), maxLimit);
  const safeOffset = Math.max(offset, 0);

  return {
    limit: safeLimit,
    offset: safeOffset,
    from: safeOffset,
    to: safeOffset + safeLimit - 1,
  };
}

export function setPaginationHeaders(res, { from, to, count }) {
  if (typeof count !== 'number') return;
  res.set('X-Total-Count', String(count));
  res.set('Content-Range', `${from}-${to}/${count}`);
  res.set('Access-Control-Expose-Headers', 'X-Total-Count, Content-Range');
}
