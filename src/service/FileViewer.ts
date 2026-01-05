import React from "react";

interface FileViewerProps {
  path: string; // المسار داخل storage
  type: "image" | "pdf";
}

const FileViewer: React.FC<FileViewerProps> = ({ path, type }) => {
  const baseUrl = "https://us-central1-thinkstudio-cpt.cloudfunctions.net/serveFile";

  const url = `${baseUrl}?path=${encodeURIComponent(path)}`;

  if (type === "image") {
    return <img src={url} alt="Gallery" style={{ maxWidth: "100%", borderRadius: 8 }} />;
  }

  if (type === "pdf") {
    return (
      <iframe
        src={url}
        style={{ width: "100%", height: 600, border: "none" }}
        title="PDF Viewer"
      />
    );
  }

  return null;
};

export default FileViewer;
