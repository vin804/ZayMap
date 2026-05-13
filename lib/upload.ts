"use client";

export interface UploadResult {
  urls: string[];
  error?: string;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ]);
}

export async function uploadImages(files: File[], folder: string = "products"): Promise<UploadResult> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return { 
      urls: [], 
      error: "Cloudinary not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env.local file." 
    };
  }

  if (!files || files.length === 0) {
    return { urls: [] };
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 5MB limit`);
        continue;
      }

      console.log(`[Upload] Starting Cloudinary upload for ${file.name}...`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", folder);
      
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const publicId = `${folder}/${timestamp}_${random}`;
      formData.append("public_id", publicId);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      
      // INCREASED TIMEOUT: 60 seconds instead of 30
      const uploadTask = fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      
      const response = await withTimeout(uploadTask, 60000, `Upload timeout for ${file.name}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.secure_url) {
        throw new Error("No URL returned from Cloudinary");
      }
      
      urls.push(data.secure_url);
      console.log(`[Upload] Cloudinary Success: ${file.name} -> ${data.secure_url.substring(0, 50)}...`);
    } catch (err) {
      console.error("[Upload] Error for file:", file.name, err);
      let errorMessage = err instanceof Error ? err.message : `Failed to upload ${file.name}`;
      
      if (errorMessage.includes("timeout")) {
        errorMessage = `${file.name}: Upload timed out.`;
      }
      
      errors.push(errorMessage);
      // CONTINUE to next file instead of aborting everything
      continue;
    }
  }

  // Return whatever succeeded, plus any errors as a warning
  if (urls.length === 0 && errors.length > 0) {
    return { urls: [], error: errors.join("; ") };
  }

  return { urls, error: errors.length > 0 ? errors.join("; ") : undefined };
}