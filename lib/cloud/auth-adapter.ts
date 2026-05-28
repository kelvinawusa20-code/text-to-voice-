// Auth adapter placeholder. No auth implementation is provided here.
// This module defines the shapes and a planned interface for client-side auth adapters.

export type AuthToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
};

export async function signInStub(): Promise<AuthToken | null> {
  // stub: in future, show sign-in UI and return tokens
  return null;
}

export async function signOutStub(): Promise<void> {
  // stub: sign-out behavior
  return;
}
