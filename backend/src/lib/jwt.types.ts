// JWT payload written by backend, read by frontend middleware and server actions.
// Must be kept identical to the TypeBox schema in requireAuth.ts.

export interface JwtPayload {
  sub: string; // users.id (UUID)
  email: string;
  displayName: string;
  iat: number; // issued-at (added by jose/jwt library)
  exp: number; // expiry   (added by jose/jwt library)
}

// Shape returned to the client — never includes the raw token
export type SessionUser = {
  userId: string;
  email: string;
  displayName: string;
};
