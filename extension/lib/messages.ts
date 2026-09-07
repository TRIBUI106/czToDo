// extension/lib/messages.ts

export type MessageType =
  | 'ADD_TODO'
  | 'UPDATE_TODO'
  | 'DELETE_TODO'
  | 'GET_TODOS'
  | 'SYNC_STATUS'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CAPTURE_TEXT'
  | 'GITHUB_ISSUE'
  | 'ADD_GITHUB'
  | 'SET_GITHUB_TOKEN'
  | 'GET_GITHUB_TOKEN';

export interface Message<T = any> {
  type: MessageType;
  payload: T;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const createMessage = <T>(
  type: MessageType,
  payload: T
): Message<T> => ({
  type,
  payload,
});

export const createResponse = <T>(
  success: boolean,
  data?: T,
  error?: string
): MessageResponse<T> => ({
  success,
  data,
  error,
});
