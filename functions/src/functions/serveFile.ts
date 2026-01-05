// functions/src/functions/serveFile.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as mime from "mime-types";

const bucket = admin.storage().bucket();

export const serveFile = functions.https.onRequest(async (req, res) => {
  try {
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).send("Missing file path");
      return;
    }

    const file = bucket.file(filePath);

    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || mime.lookup(filePath) || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");

    file.createReadStream()
      .on("error", (err) => {
        console.error(err);
        res.status(500).send("Error loading file");
      })
      .pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});
