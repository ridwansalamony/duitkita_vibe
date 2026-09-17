import type { Context } from 'elysia';
import { HouseholdService } from '../services/household.service';
import { successResponse, errorResponse } from '../utils/response.util';
import type { CreateHouseholdInput, UpdateHouseholdInput } from '../models/household.model';
import type { AuthUser } from '../middlewares/auth.middleware';

export class HouseholdController {
  static async create({
    currentUser,
    body,
    set
  }: {
    currentUser: AuthUser;
    body: CreateHouseholdInput;
    set: Context['set'];
  }) {
    try {
      const household = await HouseholdService.createHousehold(currentUser.id, body);
      set.status = 201;
      return successResponse(household, 'Household created successfully', 201);
    } catch (err: unknown) {
      set.status = 400;
      const message = err instanceof Error ? err.message : 'Create household failed';
      return errorResponse(message, 400);
    }
  }

  static async getAll({
    currentUser,
    set
  }: {
    currentUser: AuthUser;
    set: Context['set'];
  }) {
    try {
      const households = await HouseholdService.getHouseholdsByUser(currentUser.id);
      set.status = 200;
      return successResponse(households, 'Households retrieved successfully', 200);
    } catch (err: unknown) {
      set.status = 400;
      const message = err instanceof Error ? err.message : 'Failed to retrieve households';
      return errorResponse(message, 400);
    }
  }

  static async getById({
    currentUser,
    params,
    set
  }: {
    currentUser: AuthUser;
    params: { id: string };
    set: Context['set'];
  }) {
    try {
      const household = await HouseholdService.getHouseholdById(params.id, currentUser.id);
      set.status = 200;
      return successResponse(household, 'Household retrieved successfully', 200);
    } catch (err: unknown) {
      set.status = 404;
      const message = err instanceof Error ? err.message : 'Household not found';
      return errorResponse(message, 404);
    }
  }

  static async update({
    currentUser,
    params,
    body,
    set
  }: {
    currentUser: AuthUser;
    params: { id: string };
    body: UpdateHouseholdInput;
    set: Context['set'];
  }) {
    try {
      const updated = await HouseholdService.updateHousehold(
        params.id,
        currentUser.id,
        body
      );
      set.status = 200;
      return successResponse(updated, 'Household updated successfully', 200);
    } catch (err: unknown) {
      set.status = 400;
      const message = err instanceof Error ? err.message : 'Failed to update household';
      return errorResponse(message, 400);
    }
  }

  static async delete({
    currentUser,
    params,
    set
  }: {
    currentUser: AuthUser;
    params: { id: string };
    set: Context['set'];
  }) {
    try {
      const result = await HouseholdService.deleteHousehold(params.id, currentUser.id);
      set.status = 200;
      return successResponse(result, 'Household deleted successfully', 200);
    } catch (err: unknown) {
      set.status = 400;
      const message = err instanceof Error ? err.message : 'Failed to delete household';
      return errorResponse(message, 400);
    }
  }
}
