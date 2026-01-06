// src/service/secureFileUrl.ts
/**
 * Converts a Firebase Storage file path to a secure proxy URL
 * The proxy URL hides the bucket name, token, and file structure
 */

// Get the function URL from environment or construct it dynamically
const getFunctionBaseUrl = (): string => {
  // Try to get from environment variable first
  const envUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fallback to hardcoded project URL
  // Format: https://us-central1-PROJECT_ID.cloudfunctions.net
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "thinkstudio-cpt";
  const region = import.meta.env.VITE_CLOUD_FUNCTION_REGION || "us-central1";
  
  return `https://${region}-${projectId}.cloudfunctions.net`;
};

/**
 * Generate a secure proxy URL for a file
 * @param filePath - The original file path in storage (e.g., "generators/:generatorId/gallery-images/image.jpg")
 * @returns Secure proxy URL
 */
export const getSecureFileUrl = (filePath: string): string => {
  // Encode the file path to base64 using browser's btoa function
  const encodedFileId = btoa(unescape(encodeURIComponent(filePath)));
  
  // Get the base function URL
  const baseUrl = getFunctionBaseUrl();
  
  // Return the secure proxy URL
  return `${baseUrl}/serveFile?fid=${encodedFileId}`;
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
    
    // Decode the base64 file ID back to the original path
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