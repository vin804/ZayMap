"use client";

export interface UploadResult {
  urls: string[];
  error?: string;
}

// Cloudinary configuration - uses unsigned uploads (free tier: 25GB storage)
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Helper to add timeout to any promise
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

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Validate file
      if (!file.type.startsWith("image/")) {
        return { urls: [], error: `File ${file.name} is not an image` };
      }
      if (file.size > 5 * 1024 * 1024) {
        return { urls: [], error: `File ${file.name} exceeds 5MB limit` };
      }

      console.log(`[Upload] Starting Cloudinary upload for ${file.name}...`);

      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", folder);
      
      // Create a unique public_id
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const publicId = `${folder}/${timestamp}_${random}`;
      formData.append("public_id", publicId);

      // Upload to Cloudinary with 30 second timeout
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      
      const uploadTask = fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      
      const response = await withTimeout(uploadTask, 30000, `Upload timeout for ${file.name}`);
      
      if (!response.ok) {
        const errorData = await response.json();
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
        errorMessage = `Upload timed out. Check your internet connection.`;
      } else if (errorMessage.includes("preset")) {
        errorMessage = `Cloudinary upload preset not found. Check NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local`;
      } else if (errorMessage.includes("cloud_name")) {
        errorMessage = `Cloudinary cloud name not found. Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local`;
      }
      
      return { 
        urls: [], 
        error: errorMessage 
      };
    }
  }

  return { urls };
}
