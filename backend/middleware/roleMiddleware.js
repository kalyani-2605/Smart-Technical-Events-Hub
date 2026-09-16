// Usage: authorize('admin'), authorize('organizer', 'admin'), etc.
// Must run AFTER the `protect` middleware, since it relies on req.user.
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' cannot access this resource`,
      });
    }
    next();
  };
};

module.exports = { authorize };
