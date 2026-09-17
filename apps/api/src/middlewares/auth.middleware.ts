import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export const jwtPlugin = jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRET || 'duitkita_secret_key_change_in_production'
});

export interface AuthUser {
  id: string;
  email: string;
}

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ jwt, headers, set }) => {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      throw new AuthError('Authentication required: Bearer token missing');
    }

    const token = authHeader.slice(7).trim();
    const payload = await jwt.verify(token);

    if (!payload || !payload.id) {
      set.status = 401;
      throw new AuthError('Invalid or expired authentication token');
    }

    return {
      currentUser: {
        id: String(payload.id),
        email: String(payload.email)
      } as AuthUser
    };
  });
