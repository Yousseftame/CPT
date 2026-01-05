// functions/src/functions/serveFile.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as mime from "mime-types";

const bucket = admin.storage().bucket();

export const serveFile = functions.https.onRequest(async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Only allow GET requests
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Get the encoded file ID from the query parameter
    const fileId = req.query.fid as string;

    if (!fileId) {
      res.status(400).json({ error: "Missing file identifier" });
      return;
    }

    // Decode the file ID back to the original path
    let filePath: string;
    try {
      filePath = Buffer.from(fileId, "base64").toString("utf-8");
    } catch (error) {
      res.status(400).json({ error: "Invalid file identifier" });
      return;
    }

    // Security: Ensure the path is within generators directory
    if (!filePath.startsWith("generators/")) {
      res.status(403).json({ error: "Unauthorized access" });
      return;
    }

    // Get the file from storage
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || mime.lookup(filePath) || "application/octet-stream";

    // Set response headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("Content-Disposition", `inline; filename="${metadata.name}"`);

    // Stream the file to the response
    file
      .createReadStream()
      .on("error", (err) => {
        console.error("Error streaming file:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error loading file" });
        }
      })
      .pipe(res);

  } catch (err) {
    console.error("Error in serveFile:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});