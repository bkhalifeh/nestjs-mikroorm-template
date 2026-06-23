import { UserRole } from '../../user/enums/user-role.enum';

export interface JwtUser {
  id: string;
  role: UserRole;
  tokenVersion: number;
  jti: string;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  tv: number;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface RefreshPayload {
  sub: string;
  jti: string;
  tv: number;
  iat?: number;
  exp?: number;
}
