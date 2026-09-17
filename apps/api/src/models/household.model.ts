import { t } from 'elysia';
import type { ObjectId } from 'mongodb';

export interface HouseholdSettings {
  startOfMonth?: number;
  defaultAccountId?: ObjectId | string;
  defaultCategoryId?: ObjectId | string;
}

export interface HouseholdMember {
  userId: ObjectId;
  role: 'owner' | 'member';
}

export interface HouseholdDocument {
  _id?: ObjectId;
  name: string;
  currency: string;
  timezone: string;
  members: HouseholdMember[];
  settings: HouseholdSettings;
  createdAt: Date;
  updatedAt: Date;
}

export const HouseholdSettingsSchema = t.Object({
  startOfMonth: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 31,
      error: 'Start of month must be between 1 and 31'
    })
  ),
  defaultAccountId: t.Optional(t.String()),
  defaultCategoryId: t.Optional(t.String())
});

export const CreateHouseholdSchema = t.Object({
  name: t.String({
    minLength: 3,
    maxLength: 100,
    error: 'Household name must be between 3 and 100 characters'
  }),
  currency: t.Optional(
    t.String({
      minLength: 3,
      maxLength: 3,
      error: 'Currency must be 3 uppercase letters (e.g. IDR, USD)'
    })
  ),
  timezone: t.Optional(
    t.String({
      error: 'Timezone must be a valid IANA string (e.g. Asia/Jakarta)'
    })
  ),
  settings: t.Optional(HouseholdSettingsSchema)
});

export const UpdateHouseholdSchema = t.Object({
  name: t.Optional(
    t.String({
      minLength: 3,
      maxLength: 100,
      error: 'Household name must be between 3 and 100 characters'
    })
  ),
  currency: t.Optional(
    t.String({
      minLength: 3,
      maxLength: 3,
      error: 'Currency must be 3 uppercase letters (e.g. IDR, USD)'
    })
  ),
  timezone: t.Optional(
    t.String({
      error: 'Timezone must be a valid IANA string (e.g. Asia/Jakarta)'
    })
  ),
  settings: t.Optional(HouseholdSettingsSchema)
});

export type CreateHouseholdInput = typeof CreateHouseholdSchema.static;
export type UpdateHouseholdInput = typeof UpdateHouseholdSchema.static;
