import type { Timestamp } from 'firebase/firestore';

export interface UserCover {
  id: string;
  uid: string;
  imageUrl: string;
  thumbnailUrl: string;
  maxPhotos: 1 | 2;
  name?: string;
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
}
