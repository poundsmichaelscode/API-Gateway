export type Role = 'admin' | 'developer' | 'user';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
}
