import type { Context } from 'elysia';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response.util';
import type { RegisterUserInput, LoginUserInput, UpdateUserInput } from '../models/user.model';
import type { AuthUser } from '../middlewares/auth.middleware';

export class AuthController {
  static async register({
    body,
    jwt,
    set
  }: {
    body: RegisterUserInput;
    jwt: any;
    set: any;
  }) {
    try {
      const result = await AuthService.register(body);
      const token = await jwt.sign({
        id: result.user._id?.toString(),
        email: result.user.email
      });

      set.status = 201;
      return successResponse(
        {
          user: result.user,
          primaryHousehold: result.primaryHousehold,
          token
        },
        'Registration successful',
        201
      );
    } catch (err: unknown) {
      set.status = 400;
      const message = err instanceof Error ? err.message : 'Registration failed';
      return errorResponse(message, 400);
    }
  }

  static async login({
    body,
    jwt,
    set
  }: {
    body: LoginUserInput;
    jwt: any;
    set: any;
  }) {
    try {
      const user = await AuthService.login(body);
      const token = await jwt.sign({
        id: user._id?.toString(),
        email: user.email
      });

      set.status = 200;
      return successResponse(
        {
          user,
          token
        },
        'Login successful',
        200
      );
    } catch (err: unknown) {
      set.status = 401;
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      return errorResponse(message, 401);
    }
  }

  static async logout({ set }: { set: Context['set'] }) {
    set.status = 200;
    return successResponse(null, 'Logout successful', 200);
  }

  static async getMe({
    currentUser,
    set
  }: {
    currentUser: AuthUser;
    set: Context['set'];
  }) {
    try {
      const profile = await AuthService.getProfile(currentUser.id);
      set.status = 200;
      return successResponse(profile, 'Profile retrieved successfully', 200);
    } catch (err: unknown) {
      set.status = 404;
      const message = err instanceof Error ? err.message : 'User not found';
      return errorResponse(message, 404);
    }
  }

  static async updateMe({
    currentUser,
    body,
    set
  }: {
    currentUser: AuthUser;
    body: UpdateUserInput;
    set: Context['set'];
  }) {
    try {
      const updated = await AuthService.updateProfile(currentUser.id, body);
      set.status = 200;
      return successResponse(updated, 'Profile updated successfully', 200);
    } catch (err: unknown) {
      set.status = 400;
      const message = err instanceof Error ? err.message : 'Update profile failed';
      return errorResponse(message, 400);
    }
  }

  static async deleteMe({
    currentUser,
    set
  }: {
    currentUser: AuthUser;
    set: Context['set'];
  }) {
    try {
      const result = await AuthService.deleteProfile(currentUser.id);
      set.status = 200;
      return successResponse(result, 'User account deleted successfully', 200);
    } catch (err: unknown) {
      set.status = 400;
      const message = err instanceof Error ? err.message : 'Delete profile failed';
      return errorResponse(message, 400);
    }
  }
}
