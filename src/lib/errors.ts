/**
 * Error handling utilities for MCP tools
 */

import { ZodError } from 'zod';

/**
 * Format a Zod validation error into a user-friendly message
 */
export function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });

  return `Validation error: ${issues.join(', ')}`;
}

/**
 * Format any error into a user-friendly message
 */
export function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    return formatZodError(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Create an error result for MCP tools
 */
export function createErrorResult(error: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: formatError(error),
        }),
      },
    ],
  };
}
