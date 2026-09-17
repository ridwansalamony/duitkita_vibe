import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/db';
import type {
  HouseholdDocument,
  CreateHouseholdInput,
  UpdateHouseholdInput
} from '../models/household.model';

export class HouseholdService {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<HouseholdDocument>('households');
  }

  static async createHousehold(ownerId: string, input: CreateHouseholdInput) {
    if (!ObjectId.isValid(ownerId)) {
      throw new Error('Invalid owner ID');
    }

    const households = await this.getCollection();
    const now = new Date();

    const newHousehold: HouseholdDocument = {
      name: input.name.trim(),
      currency: (input.currency?.trim() || 'IDR').toUpperCase(),
      timezone: input.timezone?.trim() || 'Asia/Jakarta',
      ownerId: new ObjectId(ownerId),
      settings: {
        startOfMonth: input.settings?.startOfMonth ?? 1,
        defaultAccountId: input.settings?.defaultAccountId,
        defaultCategoryId: input.settings?.defaultCategoryId
      },
      createdAt: now,
      updatedAt: now
    };

    const result = await households.insertOne(newHousehold);
    return {
      ...newHousehold,
      _id: result.insertedId
    };
  }

  static async getHouseholdsByUser(userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const households = await this.getCollection();
    return await households
      .find({ ownerId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async getHouseholdById(householdId: string, userId: string) {
    if (!ObjectId.isValid(householdId) || !ObjectId.isValid(userId)) {
      throw new Error('Invalid ID format');
    }

    const households = await this.getCollection();
    const household = await households.findOne({
      _id: new ObjectId(householdId),
      ownerId: new ObjectId(userId)
    });

    if (!household) {
      throw new Error('Household not found or access denied');
    }

    return household;
  }

  static async updateHousehold(
    householdId: string,
    userId: string,
    input: UpdateHouseholdInput
  ) {
    if (!ObjectId.isValid(householdId) || !ObjectId.isValid(userId)) {
      throw new Error('Invalid ID format');
    }

    const households = await this.getCollection();
    const updateData: Partial<HouseholdDocument> = {
      updatedAt: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.currency !== undefined)
      updateData.currency = input.currency.trim().toUpperCase();
    if (input.timezone !== undefined) updateData.timezone = input.timezone.trim();

    if (input.settings) {
      updateData.settings = {
        startOfMonth: input.settings.startOfMonth,
        defaultAccountId: input.settings.defaultAccountId,
        defaultCategoryId: input.settings.defaultCategoryId
      };
    }

    const result = await households.findOneAndUpdate(
      {
        _id: new ObjectId(householdId),
        ownerId: new ObjectId(userId)
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Household not found or access denied');
    }

    return result;
  }

  static async deleteHousehold(householdId: string, userId: string) {
    if (!ObjectId.isValid(householdId) || !ObjectId.isValid(userId)) {
      throw new Error('Invalid ID format');
    }

    const households = await this.getCollection();
    const result = await households.deleteOne({
      _id: new ObjectId(householdId),
      ownerId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      throw new Error('Household not found or access denied');
    }

    return { message: 'Household deleted successfully' };
  }
}
