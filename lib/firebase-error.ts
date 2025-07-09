import { FirebaseError } from 'firebase/app';

export class FirebaseServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: FirebaseError
  ) {
    super(message);
    this.name = 'FirebaseServiceError';
  }
}

export function handleFirebaseError(error: unknown): FirebaseServiceError {
  if (error instanceof FirebaseError) {
    // Map Firebase error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested resource was not found',
      'already-exists': 'This resource already exists',
      'resource-exhausted': 'You have exceeded your quota',
      'failed-precondition': 'The operation was rejected because the system is not in a state required for the operation\'s execution',
      'aborted': 'The operation was aborted',
      'out-of-range': 'The operation was attempted past the valid range',
      'unimplemented': 'The operation is not implemented or not supported',
      'internal': 'An internal error occurred',
      'unavailable': 'The service is currently unavailable',
      'data-loss': 'Unrecoverable data loss or corruption',
      'unauthenticated': 'You must be authenticated to perform this action',
    };

    const message = errorMessages[error.code] || error.message;
    return new FirebaseServiceError(message, error.code, error);
  }

  // Handle non-Firebase errors
  return new FirebaseServiceError(
    error instanceof Error ? error.message : 'An unknown error occurred',
    'unknown'
  );
}

export function isFirebaseError(error: unknown): error is FirebaseServiceError {
  return error instanceof FirebaseServiceError;
} 