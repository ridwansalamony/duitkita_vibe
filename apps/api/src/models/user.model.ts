import { t } from 'elysia';
import type { ObjectId } from 'mongodb';

export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<UserDocument, 'passwordHash'>;

export const RegisterUserSchema = t.Object({
  name: t.String({
    minLength: 3,
    maxLength: 255,
    error: 'Name must be between 3 and 255 characters'
  }),
  email: t.String({
    format: 'email',
    error: 'Invalid email format'
  }),
  password: t.String({
    minLength: 6,
    maxLength: 100,
    error: 'Password must be at least 6 characters'
  }),
  avatar: t.Optional(t.String({ error: 'Avatar must be a valid URL string' })),
  phone: t.Optional(
    t.String({
      minLength: 10,
      maxLength: 15,
      error: 'Phone must be between 10 and 15 digits'
    })
  )
});

export const LoginUserSchema = t.Object({
  email: t.String({
    format: 'email',
    error: 'Invalid email format'
  }),
  password: t.String({
    minLength: 1,
    error: 'Password is required'
  })
});

export const UpdateUserSchema = t.Object({
  name: t.Optional(
    t.String({
      minLength: 3,
      maxLength: 255,
      error: 'Name must be between 3 and 255 characters'
    })
  ),
  avatar: t.Optional(t.String()),
  phone: t.Optional(
    t.String({
      minLength: 10,
      maxLength: 15,
      error: 'Phone must be between 10 and 15 digits'
    })
  )
});

export type RegisterUserInput = typeof RegisterUserSchema.static;
export type LoginUserInput = typeof LoginUserSchema.static;
export type UpdateUserInput = typeof UpdateUserSchema.static;
