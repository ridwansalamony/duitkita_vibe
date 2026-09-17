import { t } from 'elysia';
import type { ObjectId } from 'mongodb';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface InvitationDocument {
  _id?: ObjectId;
  householdId: ObjectId;
  invitedBy: ObjectId;     // userId yang membuat undangan
  email: string;           // email orang yang diundang
  tokenHash: string;       // SHA-256 hash dari plain token (JANGAN simpan plaintext)
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export const CreateInvitationSchema = t.Object({
  householdId: t.String({ minLength: 1, error: 'householdId is required' }),
  email: t.String({
    format: 'email',
    error: 'A valid email address is required'
  })
});

export type CreateInvitationInput = typeof CreateInvitationSchema.static;
