import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import type { ApiResponse } from '@finance-app/types';
import { HTTP_STATUS, TRANSACTION_CATEGORIES } from '@finance-app/constants';
import { isValidEmail } from '@finance-app/validation';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = new Elysia()
  .use(cors())
  .get('/', (): ApiResponse<{ message: string; docs: string }> => ({
    success: true,
    data: {
      message: 'Finance App API with ElysiaJS on Bun',
      docs: '/health'
    }
  }))
  .get('/health', (): ApiResponse<{ status: string; timestamp: string }> => ({
    success: true,
    data: {
      status: 'UP',
      timestamp: new Date().toISOString()
    }
  }))
  .group('/api/v1', (app) =>
    app
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

export type App = typeof app;
