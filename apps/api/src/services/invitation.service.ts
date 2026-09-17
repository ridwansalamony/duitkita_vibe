import { ObjectId } from "mongodb";
import { getDatabase } from "../config/db";
import type { InvitationDocument, CreateInvitationInput } from "../models/invitation.model";
import type { HouseholdDocument } from "../models/household.model";
import type { UserDocument } from "../models/user.model";
import { generateToken, hashToken } from "../utils/token.util";

const INVITATION_EXPIRES_DAYS = 7;

export class InvitationService {
  private static async getInvitationCollection() {
    const db = await getDatabase();
    return db.collection<InvitationDocument>("invitations");
  }

  private static async getHouseholdCollection() {
    const db = await getDatabase();
    return db.collection<HouseholdDocument>("households");
  }

  private static async getUserCollection() {
    const db = await getDatabase();
    return db.collection<UserDocument>("users");
  }

  /**
   * Create a new invitation. Only the household owner can do this.
   * Returns the plaintext token to embed in the invitation URL.
   */
  static async createInvitation(invitedByUserId: string, input: CreateInvitationInput) {
    if (!ObjectId.isValid(invitedByUserId) || !ObjectId.isValid(input.householdId)) {
      throw new Error("Invalid ID format");
    }

    const households = await this.getHouseholdCollection();

    // Verify the caller is an owner of the target household
    const household = await households.findOne({
      _id: new ObjectId(input.householdId),
      members: {
        $elemMatch: {
          userId: new ObjectId(invitedByUserId),
          role: "owner"
        }
      }
    });

    if (!household) {
      throw new Error("Household not found or you are not the owner");
    }

    const invitations = await this.getInvitationCollection();

    // Cancel any existing pending invitation for the same email in this household
    await invitations.updateMany(
      {
        householdId: new ObjectId(input.householdId),
        email: input.email.trim().toLowerCase(),
        status: "pending"
      },
      { $set: { status: "cancelled" } }
    );

    // Generate token
    const plainToken = generateToken();
    const tokenHash = hashToken(plainToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    const invitation: InvitationDocument = {
      householdId: new ObjectId(input.householdId),
      invitedBy: new ObjectId(invitedByUserId),
      email: input.email.trim().toLowerCase(),
      tokenHash,
      status: "pending",
      expiresAt,
      createdAt: now
    };

    const result = await invitations.insertOne(invitation);

    return {
      invitationId: result.insertedId.toString(),
      token: plainToken,       // Only time the plaintext token is exposed
      expiresAt
    };
  }

  /**
   * Validate an invitation token (public, no auth required).
   * Returns household info for the invitation preview page.
   */
  static async validateInvitation(plainToken: string) {
    const tokenHash = hashToken(plainToken);
    const now = new Date();

    const invitations = await this.getInvitationCollection();
    const invitation = await invitations.findOne({
      tokenHash,
      status: "pending",
      expiresAt: { $gt: now }
    });

    if (!invitation) {
      throw new Error("Invitation is invalid, expired, or already used");
    }

    // Get household info
    const households = await this.getHouseholdCollection();
    const household = await households.findOne({ _id: invitation.householdId });
    if (!household) {
      throw new Error("Associated household not found");
    }

    // Get inviter info
    const users = await this.getUserCollection();
    const inviter = await users.findOne({ _id: invitation.invitedBy });

    return {
      householdId: invitation.householdId.toString(),
      householdName: household.name,
      invitedByName: inviter?.name || "Unknown",
      email: invitation.email,
      expiresAt: invitation.expiresAt
    };
  }

  /**
   * Accept an invitation. The accepting user must be authenticated.
   * Adds the user to the household members array with role "member".
   */
  static async acceptInvitation(plainToken: string, acceptingUserId: string) {
    if (!ObjectId.isValid(acceptingUserId)) {
      throw new Error("Invalid user ID");
    }

    const tokenHash = hashToken(plainToken);
    const now = new Date();

    const invitations = await this.getInvitationCollection();
    const invitation = await invitations.findOne({
      tokenHash,
      status: "pending",
      expiresAt: { $gt: now }
    });

    if (!invitation) {
      throw new Error("Invitation is invalid, expired, or already used");
    }

    const acceptingObjectId = new ObjectId(acceptingUserId);

    const households = await this.getHouseholdCollection();

    // Check if user is already a member
    const household = await households.findOne({ _id: invitation.householdId });
    if (!household) {
      throw new Error("Associated household not found");
    }

    const alreadyMember = household.members.some(
      (m) => m.userId.toString() === acceptingUserId
    );

    if (alreadyMember) {
      throw new Error("You are already a member of this household");
    }

    // Add user to household members
    const updatedHousehold = await households.findOneAndUpdate(
      { _id: invitation.householdId },
      {
        $push: { members: { userId: acceptingObjectId, role: "member" } } as any,
        $set: { updatedAt: now }
      },
      { returnDocument: "after" }
    );

    // Mark invitation as accepted
    await invitations.updateOne(
      { _id: invitation._id },
      {
        $set: {
          status: "accepted",
          acceptedAt: now
        }
      }
    );

    return updatedHousehold;
  }
}
