/**
 * API Error Handler
 *
 * Centralized error handling for API calls
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

export function handleApiError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // Handle axios errors
  if (error.response) {
    // Server responded with error
    const statusCode = error.response.status;
    const data = error.response.data;
    
    if (data?.error) {
      return new ApiError(data.error, statusCode, data.code);
    }
    
    // Map common status codes to messages
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'A conflict occurred. Please try again.',
      500: 'An internal server error occurred.',
      502: 'The server is temporarily unavailable.',
      503: 'The service is temporarily unavailable.',
    };

    return new ApiError(
      messages[statusCode] || `Server error (${statusCode})`,
      statusCode
    );
  }

  if (error.request) {
    // Request made but no response
    return new ApiError(
      'Unable to connect to the server. Please check your network connection.',
      undefined,
      'NETWORK_ERROR'
    );
  }

  // Something else happened
  return new ApiError(
    error.message || 'An unexpected error occurred.',
    undefined,
    'UNKNOWN_ERROR'
  );
}

export function getErrorMessage(error: any): string {
  const apiError = handleApiError(error);
  return apiError.message;
}
