export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const sendSuccess = (res, data, statusCode = 200) => res.status(statusCode).json({ success: true, data });

export const badRequest = (message, details) => new ApiError(400, message, details);
export const unauthorized = (message = 'Not authenticated') => new ApiError(401, message);
export const forbidden = (message = 'You do not have permission to perform this action') => new ApiError(403, message);
export const notFound = (message = 'Resource not found') => new ApiError(404, message);
export const serviceUnavailable = (message) => new ApiError(503, message);
