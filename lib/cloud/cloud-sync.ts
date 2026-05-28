// Cloud sync placeholder for future SaaS integration.
// This file intentionally includes only client-side stubs and no network/auth logic.

import { CloudSession } from "./types";

export async function uploadSessionStub(session: CloudSession): Promise<void> {
  // stub: in future, this will POST session to cloud with authentication
  return;
}

export async function fetchUserSessionsStub(userId: string): Promise<CloudSession[] | null> {
  // stub: fetch sessions for a user
  return null;
}
