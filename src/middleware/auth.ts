import { Request, Response, NextFunction } from "express";
import { verifyToken, AuthTokenPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Attaches req.user if a valid token is present, but does not reject the
// request otherwise. Useful for endpoints that behave differently for
// logged-in vs anonymous visitors (e.g. public product search).
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      req.user = verifyToken(header.slice("Bearer ".length));
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}
