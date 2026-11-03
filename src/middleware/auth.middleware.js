import { verifyAccessToken } from "../utils/jwt.helper.js";
import { UnauthorizedError, ForbiddenError } from "../core/error.response.js";

export const authenticate = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Access token is missing or invalid");
  }
  try {
    req.user = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Token is invalid or expired");
  }
  next();
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
