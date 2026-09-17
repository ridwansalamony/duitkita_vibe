export interface ApiMeta {
  status: boolean;
  statusCode: number;
  message: string;
}

export interface ApiResponseFormat<T = unknown> {
  meta: ApiMeta;
  data: T;
}

export function successResponse<T>(
  data: T,
  message = 'Operation successful',
  statusCode = 200
): ApiResponseFormat<T> {
  return {
    meta: {
      status: true,
      statusCode,
      message
    },
    data
  };
}

export function errorResponse(
  message = 'Operation failed',
  statusCode = 400,
  data: unknown = null
): ApiResponseFormat<unknown> {
  return {
    meta: {
      status: false,
      statusCode,
      message
    },
    data
  };
}
