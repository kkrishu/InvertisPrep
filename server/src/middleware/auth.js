import jwt from 'jsonwebtoken';

export const authenticateJWT = async (req, res, next) => {
  try {
    let token = req.headers.authorization || req.cookies?.token;

    if (!token) {
      console.log(`[Auth] No token provided for ${req.method} ${req.originalUrl}`);
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    // Handle "Bearer <token>" format
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Trim any accidental whitespace or newlines (common in mobile app injections)
    token = token.trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(`[Auth] JWT Verification failed: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }

  next();
};

export const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'super-admin') {
    res.status(403).json({ success: false, message: 'Super admin access required' });
    return;
  }

  next();
};
