import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export const uploadFiles = async (
  files: File[],
  generatorId: string,
  folder: "gallery-images" | "troubleshooting-pdfs"
): Promise<string[]> => {
  const urls: string[] = [];

  for (const file of files) {
    // New path: generators/:generatorId/gallery-images or generators/:generatorId/troubleshooting-pdfs
    const fileRef = ref(
      storage,
      `generators/${generatorId}/${folder}/${Date.now()}-${file.name}`
    );

    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    urls.push(downloadURL);
  }

  return urls;
};