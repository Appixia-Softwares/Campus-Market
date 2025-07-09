import { handleFirebaseError } from './firebase-error';

export type ActionHandler<T = any> = (...args: any[]) => Promise<T>;

export function withActionErrorHandler<T>(
  handler: ActionHandler<T>
): ActionHandler<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await handler(...args);
    } catch (error) {
      const firebaseError = handleFirebaseError(error);
      console.error('Action Error:', firebaseError);
      throw firebaseError;
    }
  };
}

export function createAction<T>(
  handler: ActionHandler<T>
): ActionHandler<T> {
  return withActionErrorHandler(handler);
} 