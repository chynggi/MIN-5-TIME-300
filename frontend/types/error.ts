export interface APIError {
  success: false;
  error: string;
  statusCode?: number;
  details?: Record<string, string[]>;
}

export class CustomError extends Error {
  public statusCode: number;
  public details?: Record<string, string[]>;

  constructor(message: string, statusCode: number = 500, details?: Record<string, string[]>) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.details = details;
  }
}