// Mirror of backend/src/lib/jwt.types.ts
// Dates come from the JWT spec — always numbers (Unix epoch seconds).

export interface JwtPayload {
  sub: string;
  email: string;
  displayName: string;
  iat: number;
  exp: number;
}

export type SessionUser = {
  userId: string;
  email: string;
  displayName: string;
};
