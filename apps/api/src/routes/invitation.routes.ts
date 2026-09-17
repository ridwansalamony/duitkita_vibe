import { Elysia } from "elysia";
import { InvitationController } from "../controllers/invitation.controller";
import { CreateInvitationSchema } from "../models/invitation.model";
import { authMiddleware } from "../middlewares/auth.middleware";

export const invitationRoutes = new Elysia({ prefix: "/invitations" })
  // Public route - validate token without auth
  .get("/validate/:token", InvitationController.validate)
  // Protected routes - require authentication
  .use(authMiddleware)
  .post("/", InvitationController.create, {
    body: CreateInvitationSchema
  })
  .post("/accept/:token", InvitationController.accept);
