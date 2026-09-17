import type { Context } from "elysia";
import { InvitationService } from "../services/invitation.service";
import { successResponse, errorResponse } from "../utils/response.util";
import type { CreateInvitationInput } from "../models/invitation.model";
import type { AuthUser } from "../middlewares/auth.middleware";

export const InvitationController = {
  /**
   * POST /api/invitations
   * Create a new household invitation. Requires owner role.
   */
  async create({
    currentUser,
    body,
    set
  }: {
    currentUser: AuthUser;
    body: CreateInvitationInput;
    set: Context["set"];
  }) {
    try {
      const result = await InvitationService.createInvitation(currentUser.id, body);
      set.status = 201;
      return successResponse(result, "Invitation created successfully", 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create invitation";
      const isAccessDenied =
        msg.includes("not found") ||
        msg.includes("not the owner") ||
        msg.includes("Invalid");
      const status = isAccessDenied ? 403 : 400;
      set.status = status;
      return errorResponse(msg, status);
    }
  },

  /**
   * GET /api/invitations/validate/:token
   * Validate an invitation token. No authentication required.
   */
  async validate({
    params,
    set
  }: {
    params: { token: string };
    set: Context["set"];
  }) {
    try {
      const result = await InvitationService.validateInvitation(params.token);
      set.status = 200;
      return successResponse(result, "Invitation is valid");
    } catch (err: unknown) {
      set.status = 400;
      const msg = err instanceof Error ? err.message : "Invalid invitation";
      return errorResponse(msg, 400);
    }
  },

  /**
   * POST /api/invitations/accept/:token
   * Accept an invitation. Requires authentication.
   */
  async accept({
    currentUser,
    params,
    set
  }: {
    currentUser: AuthUser;
    params: { token: string };
    set: Context["set"];
  }) {
    try {
      const household = await InvitationService.acceptInvitation(params.token, currentUser.id);
      set.status = 200;
      return successResponse(household, "Invitation accepted. Welcome to the household!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to accept invitation";
      const isAlready = msg.includes("already a member");
      const status = isAlready ? 409 : 400;
      set.status = status;
      return errorResponse(msg, status);
    }
  }
};
