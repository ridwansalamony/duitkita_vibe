import { Elysia } from 'elysia';
import { HouseholdController } from '../controllers/household.controller';
import {
  CreateHouseholdSchema,
  UpdateHouseholdSchema
} from '../models/household.model';
import { authMiddleware } from '../middlewares/auth.middleware';

export const householdRoutes = new Elysia({ prefix: '/households' })
  .use(authMiddleware)
  .post('/', HouseholdController.create, {
    body: CreateHouseholdSchema
  })
  .get('/', HouseholdController.getAll)
  .get('/:id', HouseholdController.getById)
  .put('/:id', HouseholdController.update, {
    body: UpdateHouseholdSchema
  })
  .delete('/:id', HouseholdController.delete);
