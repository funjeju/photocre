import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseDb, getFirebaseStorage } from '@/lib/firebase/client';
import type { UserCover } from '@/types/user-cover';

export const MAX_USER_COVERS = 20;

function resizeToBlob(file: File, maxSide: number, quality = 0.88): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

export async function uploadUserCover(
  uid: string,
  file: File,
  maxPhotos: 1 | 2,
  currentCount: number,
): Promise<UserCover> {
  if (currentCount >= MAX_USER_COVERS) {
    throw new Error('COVER_LIMIT_REACHED');
  }

  const coverId = crypto.randomUUID();
  const storage = getFirebaseStorage();
  const db = getFirebaseDb();

  const [mainBlob, thumbBlob] = await Promise.all([
    resizeToBlob(file, 1024),
    resizeToBlob(file, 256),
  ]);

  const mainRef = ref(storage, `userCovers/${uid}/${coverId}.jpg`);
  const thumbRef = ref(storage, `userCovers/${uid}/${coverId}_thumb.jpg`);

  const [mainSnap, thumbSnap] = await Promise.all([
    uploadBytes(mainRef, mainBlob, { contentType: 'image/jpeg' }),
    uploadBytes(thumbRef, thumbBlob, { contentType: 'image/jpeg' }),
  ]);

  const [imageUrl, thumbnailUrl] = await Promise.all([
    getDownloadURL(mainSnap.ref),
    getDownloadURL(thumbSnap.ref),
  ]);

  const coverRef = doc(collection(db, 'userCovers'), coverId);
  await setDoc(coverRef, {
    uid,
    imageUrl,
    thumbnailUrl,
    maxPhotos,
    createdAt: serverTimestamp(),
    lastUsedAt: serverTimestamp(),
  });

  return {
    id: coverId,
    uid,
    imageUrl,
    thumbnailUrl,
    maxPhotos,
    createdAt: null as unknown as UserCover['createdAt'],
    lastUsedAt: null as unknown as UserCover['lastUsedAt'],
  };
}

export async function deleteUserCover(uid: string, coverId: string): Promise<void> {
  const storage = getFirebaseStorage();
  const db = getFirebaseDb();

  await Promise.all([
    deleteObject(ref(storage, `userCovers/${uid}/${coverId}.jpg`)).catch(() => {}),
    deleteObject(ref(storage, `userCovers/${uid}/${coverId}_thumb.jpg`)).catch(() => {}),
  ]);

  await deleteDoc(doc(db, 'userCovers', coverId));
}

export async function touchLastUsed(coverId: string): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'userCovers', coverId), {
    lastUsedAt: serverTimestamp(),
  }).catch(() => {});
}
