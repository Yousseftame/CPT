// src/service/deleteFileByUrl.ts
import { ref, deleteObject } from "firebase/storage";
import { storage } from "./firebase";
import { extractFilePathFromSecureUrl, isSecureProxyUrl } from "./secureFileUrl";

/**
 * Delete a file from Firebase Storage
 * Works with both secure proxy URLs and direct file paths
 * 
 * @param urlOrPath - Either a secure proxy URL or direct file path in storage
 * @throws Error if the URL format is invalid or file cannot be deleted
 */
export const deleteFileByUrl = async (urlOrPath: string) => {
  try {
    let filePath: string;

    // Check if it's a secure proxy URL
    if (isSecureProxyUrl(urlOrPath)) {
      // Extract the original file path from the secure URL
      filePath = extractFilePathFromSecureUrl(urlOrPath);
    } else if (urlOrPath.startsWith("generators/")) {
      // Direct file path
      filePath = urlOrPath;
    } else if (urlOrPath.startsWith("https://firebasestorage.googleapis.com")) {
      // Old public Firebase URL - extract path manually
      try {
        const url = new URL(urlOrPath);
        const encodedPath = url.pathname.split("/o/")[1].split("?")[0];
        filePath = decodeURIComponent(encodedPath);
      } catch {
        throw new Error("Unable to extract file path from URL");
      }
    } else {
      throw new Error("Invalid URL or file path format");
    }

    // Security check: ensure only generators files can be deleted
    if (!filePath.startsWith("generators/")) {
      throw new Error("Unauthorized: Can only delete files from generators directory");
    }

    // Delete the file
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    console.log(`File deleted successfully: ${filePath}`);
  } catch (error: any) {
    console.error("Error deleting file:", error.message);
    throw error;
  }
};