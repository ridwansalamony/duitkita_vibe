import { Elysia } from 'elysia';
import { AuthController } from '../controllers/auth.controller';
import {
  RegisterUserSchema,
  LoginUserSchema,
  UpdateUserSchema
} from '../models/user.model';
import { jwtPlugin, authMiddleware } from '../middlewares/auth.middleware';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .post('/register', AuthController.register, {
    body: RegisterUserSchema
  })
  .post('/login', AuthController.login, {
    body: LoginUserSchema
  })
  .post('/logout', AuthController.logout)
  .use(authMiddleware)
  .get('/me', AuthController.getMe)
  .put('/me', AuthController.updateMe, {
    body: UpdateUserSchema
  })
  .delete('/me', AuthController.deleteMe);
