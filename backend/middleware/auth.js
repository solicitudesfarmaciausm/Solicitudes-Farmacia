import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Missing JWT_SECRET in environment');
    err.status = 500;
    throw err;
  }
  return secret;
}

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;

    return next();
  } catch (err) {
    const status = err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError' ? 401 : (err?.status ?? 500);
    return res.status(status).json({ error: status === 401 ? 'Invalid or expired token' : (err?.message ?? 'Auth error') });
  }
}
