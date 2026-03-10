import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BUCKET = 'property-images';
const MAX_SIZE_MB = 5;

interface UseImageUploadOptions {
  folder?: string;
  onSuccess?: (url: string) => void;
}

export const useImageUpload = ({ folder = 'properties', onSuccess }: UseImageUploadOptions = {}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File): Promise<string | null> => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB allowed.`);
      return null;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return null;
    }

    setUploading(true);
    setProgress(10);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      setProgress(40);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(80);

      const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      setProgress(100);

      const url = data.publicUrl;
      onSuccess?.(url);
      return url;
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const uploadMultiple = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const url = await upload(file);
      if (url) urls.push(url);
    }
    return urls;
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const path = url.split(`/${BUCKET}/`)[1];
      if (!path) return false;

      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
      return true;
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
      return false;
    }
  };

  return { upload, uploadMultiple, deleteImage, uploading, progress };
};
