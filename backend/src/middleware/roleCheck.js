// Usage: roleCheck("admin", "editor")
const roleCheck = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user ? req.user.role : "unknown"}' is not permitted to access this resource`,
    });
  }
  next();
};

module.exports = roleCheck;
