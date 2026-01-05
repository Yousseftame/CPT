// src/service/uploadFiles.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { getSecureFileUrl } from "./secureFileUrl";

export const uploadFiles = async (
  files: File[],
  generatorId: string,
  folder: "gallery-images" | "troubleshooting-pdfs"
): Promise<string[]> => {
  const secureUrls: string[] = [];

  for (const file of files) {
        // New path: generators/:generatorId/gallery-images or generators/:generatorId/troubleshooting-pdfs
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `generators/${generatorId}/${folder}/${fileName}`;
    
    const fileRef = ref(storage, filePath);

    // Upload the file to Firebase Storage
    await uploadBytes(fileRef, file);
    
    // Instead of returning the public Firebase URL, return the secure proxy URL
    const secureUrl = getSecureFileUrl(filePath);
    secureUrls.push(secureUrl);
  }

  return secureUrls;
};