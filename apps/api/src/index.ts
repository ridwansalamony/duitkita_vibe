import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import type { ApiResponse } from '@finance-app/types';
import { HTTP_STATUS, TRANSACTION_CATEGORIES } from '@finance-app/constants';
import { isValidEmail } from '@finance-app/validation';
import { authRoutes } from './routes/auth.routes';
import { householdRoutes } from './routes/household.routes';
import { errorResponse, successResponse } from './utils/response.util';
import { AuthError } from './middlewares/auth.middleware';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = new Elysia()
  .use(cors())
  .onError(({ code, error, set }) => {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : String(error);

    if (error instanceof AuthError || (error as Error)?.name === 'AuthError') {
      set.status = 401;
      return errorResponse(message, 401);
    }

    if (code === 'VALIDATION') {
      set.status = 400;
      return errorResponse(message, 400);
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return errorResponse('Endpoint not found', 404);
    }

    const statusCode = typeof set.status === 'number' ? set.status : 500;
    return errorResponse(message || 'Internal Server Error', statusCode);
  })
  .get('/', () =>
    successResponse(
      {
        message: 'Finance App API with ElysiaJS on Bun',
        docs: '/health'
      },
      'Welcome to Finance App API'
    )
  )
  .get('/health', () =>
    successResponse(
      {
        status: 'UP',
        timestamp: new Date().toISOString()
      },
      'Service is healthy'
    )
  )
  .group('/api', (api) => api.use(authRoutes).use(householdRoutes))
  .group('/api/v1', (api) =>
    api
      .get('/categories', (): ApiResponse<readonly string[]> => ({
        success: true,
        data: TRANSACTION_CATEGORIES
      }))
      .post(
        '/validate-email',
        ({ body }): ApiResponse<{ email: string; valid: boolean }> => {
          const { email } = body as { email: string };
          const valid = isValidEmail(email);
          return {
            success: true,
            data: { email, valid }
          };
        },
        {
          body: t.Object({
            email: t.String()
          })
        }
      )
  )
  .listen(port);

console.log(`🦊 Elysia API is running at http://${app.server?.hostname}:${app.server?.port}`);

export { app };
export type App = typeof app;
