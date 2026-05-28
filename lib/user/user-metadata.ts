export type UserMetadata = {
  anonymousUserId: string;
  deviceId: string;
  createdAt: string;
  lastActiveAt: string;
};

export const USER_META_STORAGE_KEY = "aura_user_meta_v1";
