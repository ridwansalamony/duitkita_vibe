import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/db';
import { hashPassword, verifyPassword } from '../utils/password.util';
import type {
  UserDocument,
  SafeUser,
  RegisterUserInput,
  LoginUserInput,
  UpdateUserInput
} from '../models/user.model';
import type { HouseholdDocument } from '../models/household.model';

function toSafeUser(doc: UserDocument): SafeUser {
  const { passwordHash, ...safe } = doc;
  return safe;
}

export class AuthService {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<UserDocument>('users');
  }

  private static async getHouseholdCollection() {
    const db = await getDatabase();
    return db.collection<HouseholdDocument>('households');
  }

  static async register(input: RegisterUserInput) {
    const users = await this.getCollection();
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await users.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = await hashPassword(input.password);
    const now = new Date();

    const newUserDoc: UserDocument = {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
      avatar: input.avatar?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const insertResult = await users.insertOne(newUserDoc);
    const userId = insertResult.insertedId;

    // Automatically provision initial default household for the user
    const households = await this.getHouseholdCollection();
    const initialHousehold: HouseholdDocument = {
      name: `${input.name.trim()}'s Household`,
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      members: [{ userId, role: 'owner' }],
      settings: {
        startOfMonth: 1
      },
      createdAt: now,
      updatedAt: now
    };

    const householdResult = await households.insertOne(initialHousehold);

    const createdUser: UserDocument = {
      ...newUserDoc,
      _id: userId
    };

    return {
      user: toSafeUser(createdUser),
      primaryHousehold: {
        ...initialHousehold,
        _id: householdResult.insertedId
      }
    };
  }

  static async login(input: LoginUserInput) {
    const users = await this.getCollection();
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await users.findOne({ email: normalizedEmail });
    if (!user || !user.isActive) {
      throw new Error('Invalid email or password');
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const now = new Date();
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: now,
          updatedAt: now
        }
      }
    );

    return toSafeUser({
      ...user,
      lastLoginAt: now
    });
  }

  static async getProfile(userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    const user = await users.findOne({
      _id: new ObjectId(userId),
      isActive: true
    });

    if (!user) {
      throw new Error('User not found or inactive');
    }

    return toSafeUser(user);
  }

  static async updateProfile(userId: string, input: UpdateUserInput) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    const updateData: Partial<UserDocument> = {
      updatedAt: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.avatar !== undefined) updateData.avatar = input.avatar.trim();
    if (input.phone !== undefined) updateData.phone = input.phone.trim();

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId), isActive: true },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('User not found or unable to update');
    }

    return toSafeUser(result);
  }

  static async deleteProfile(userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId), isActive: true },
      {
        $set: {
          isActive: false,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('User not found or already deactivated');
    }

    return { message: 'User account deactivated successfully' };
  }
}
