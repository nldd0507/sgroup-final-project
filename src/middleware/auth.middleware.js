import { verifyAccessToken } from "../utils/jwt.helper.js";
import { UnauthorizedError, ForbiddenError } from "../core/error.response.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Access token is missing or invalid");
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    throw new UnauthorizedError("Token is invalid or expired");
  }
};
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new UnauthorizedError("Authentication required. Please log in first.");
    }
    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      throw new ForbiddenError("You do not have permission to access this feature!");
    }

    next();
  };
};
