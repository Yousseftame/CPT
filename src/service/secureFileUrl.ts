// src/service/secureFileUrl.ts
/**
 * Converts a Firebase Storage URL or file path to a secure proxy URL
 * The proxy URL hides the bucket name, token, and file structure
 * 
 * Example:
 * Input: https://firebasestorage.googleapis.com/v0/b/thinkstudio-cpt.firebasestorage.app/o/generators%2F...
 * Output: https://us-central1-thinkstudio-cpt.cloudfunctions.net/serveFile?fid=Z2VuZXJhdG9ycy9nYWxsZXJ5LWltYWdlcy8xNzA0MDY3MjAwMDAwLWltYWdlLmpwZw==
 */

/**
 * Generate a secure proxy URL for a file
 * @param filePath - The original file path in storage (e.g., "generators/:generatorId/gallery-images/image.jpg")
 * @returns Secure proxy URL
 */
export const getSecureFileUrl = (filePath: string): string => {
  // Encode the file path to base64 using browser's btoa function (works in frontend)
  const encodedFileId = btoa(unescape(encodeURIComponent(filePath)));
  
  // Return the secure proxy URL
  return `https://us-central1-thinkstudio-cpt.cloudfunctions.net/serveFile?fid=${encodedFileId}`;
};

/**
 * Extract the original file path from a secure proxy URL
 * @param secureUrl - The secure proxy URL
 * @returns The original file path
 */
export const extractFilePathFromSecureUrl = (secureUrl: string): string => {
  try {
    const url = new URL(secureUrl);
    const fileId = url.searchParams.get("fid");
    
    if (!fileId) {
      throw new Error("Missing file ID in URL");
    }
    
    // Decode the base64 file ID back to the original path using browser's atob function
    const filePath = decodeURIComponent(escape(atob(fileId)));
    return filePath;
  } catch (error) {
    console.error("Error extracting file path from secure URL:", error);
    throw new Error("Invalid secure URL format");
  }
};

/**
 * Check if a URL is a secure proxy URL
 * @param url - URL to check
 * @returns True if it's a secure proxy URL
 */
export const isSecureProxyUrl = (url: string): boolean => {
  return url.includes("cloudfunctions.net/serveFile") && url.includes("fid=");
};