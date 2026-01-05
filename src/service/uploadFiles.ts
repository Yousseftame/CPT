import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export const uploadFiles = async (
  files: File[],
  folder: string
): Promise<string[]> => {
  const urls: string[] = [];

  for (const file of files) {
    const fileRef = ref(
      storage,
      `${folder}/${Date.now()}-${file.name}`
    );

    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    urls.push(downloadURL);
  }

  return urls;
};
