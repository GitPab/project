import jwt from 'jsonwebtoken';

// Get JWT_SECRET from environment - throw error if not set in production
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    console.warn('[SECURITY] JWT_SECRET not set, using development fallback');
    return 'dev-secret-do-not-use-in-production';
  }
  return secret;
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, getJwtSecret());
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    
    // All admin roles except 'student'
    const adminRoles = ['super_admin', 'admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
