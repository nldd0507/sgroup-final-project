import { isTokenRevoked } from "../utils/tokenDenylist.js";
import { UnauthorizedError, ForbiddenError } from "../core/error.response.js";
import { verifyAccessToken } from "../utils/jwt.helper.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Access token is missing or invalid");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw new UnauthorizedError("Token is invalid or expired");
  }

  if (await isTokenRevoked(decoded.jti)) {
    throw new UnauthorizedError("Token has been revoked");
  }
  req.user = decoded;
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
