"use client";
import { useAccount } from "jazz-react";
import { FileStream } from "jazz-tools";
import { useRef, useState } from "react";

export function FileWidget() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { me } = useAccount();

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!me?.profile) {
      setError("User profile not found");
      return;
    }

    setProgress(0);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setIsUploading(true);
      me.profile.file = await FileStream.createFromBlob(file, {
        onProgress: (p) => setProgress(Math.round(p * 100)),
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to upload file",
      );
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  }

  function handleDelete() {
    if (!me?.profile) return;
    delete me.profile?.file;
  }

  async function handleDownload() {
    if (!me?.profile) return;

    const file = me.profile.file;
    if (!file) return;

    try {
      const blob = file.toBlob();
      const url = URL.createObjectURL(blob || new Blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = file.id || "download";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  if (me?.profile?.file == null) {
    return (
      <div className="flex flex-col gap-4">
        <form onSubmit={handleUpload} className="flex gap-2">
          <input
            className="bg-stone-100 py-1.5 px-3 text-sm rounded-md w-4/5"
            ref={inputRef}
            type="file"
            accept="file"
            onChange={() => setError(null)}
            aria-label="Choose file"
            disabled={isUploading}
          />

          <button
            type="submit"
            className="bg-stone-100 py-1.5 px-3 text-sm rounded-md disabled:opacity-50"
            disabled={isUploading}
          >
            {isUploading ? `Uploading...` : "Upload file"}
          </button>
        </form>

        {error && (
          <div className="text-red-800 text-sm pl-4" role="alert">
            {error}
          </div>
        )}

        {isUploading && (
          <div className="flex gap-2 items-center">
            <div className="py-1.5 px-3 text-sm">Progress: {progress}%</div>
            <div className="h-2 bg-stone-200 rounded-full flex-1">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  const fileData = me?.profile?.file?.getChunks();
  const mimeType = fileData?.mimeType || "unknown";

  return (
    <div className="gap-2">
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-bold">File name</span>
            <span>{fileData?.fileName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Type</span>
            <span>{mimeType}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Size</span>
            <span>{formatFileSize(fileData?.totalSizeBytes)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
          onClick={handleDelete}
        >
          Delete file
        </button>

        <button
          className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
          onClick={handleDownload}
        >
          Download file
        </button>
      </div>

      <div className="w-full justify-center pt-8">
        {fileData?.mimeType?.startsWith("image/") && (
          <div className="flex justify-center">
            <img
              src={URL.createObjectURL(
                me?.profile?.file?.toBlob() || new Blob(),
              )}
              alt="File preview"
              className="max-w-xs mb-4"
            />
          </div>
        )}

        {fileData?.mimeType?.startsWith("audio/") && (
          <div className="flex justify-center">
            <audio
              src={URL.createObjectURL(
                me?.profile?.file?.toBlob() || new Blob(),
              )}
              controls
              className="w-full mb-4"
            />
          </div>
        )}

        {fileData?.mimeType?.startsWith("video/") && (
          <div className="flex justify-center">
            <video
              src={URL.createObjectURL(
                me?.profile?.file?.toBlob() || new Blob(),
              )}
              controls
              className="w-full mb-4"
            />
          </div>
        )}
      </div>
    </div>
  );
}
