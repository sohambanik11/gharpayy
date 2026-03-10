import { useCallback, useState } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  className?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  folder = 'properties',
  maxImages = 10,
  className,
}: ImageUploadProps) => {
  const [dragging, setDragging] = useState(false);
  const { upload, uploading, progress, deleteImage } = useImageUpload({ folder });

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remaining = maxImages - value.length;
      const toUpload = Array.from(files).slice(0, remaining);

      for (const file of toUpload) {
        const url = await upload(file);
        if (url) onChange([...value, url]);
      }
    },
    [value, onChange, upload, maxImages]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = async (url: string, idx: number) => {
    await deleteImage(url);
    onChange(value.filter((_, i) => i !== idx));
  };

  const canUpload = value.length < maxImages && !uploading;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      {canUpload && (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all',
            dragging
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/50 hover:bg-secondary/30'
          )}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 size={22} className="text-accent animate-spin" />
              <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Upload size={18} className="text-accent" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">
                  Drop images here or <span className="text-accent">click to browse</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  JPEG, PNG, WebP · Max 5MB · {maxImages - value.length} remaining
                </p>
              </div>
            </>
          )}
        </label>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {value.map((url, idx) => (
            <div key={url} className="relative group aspect-square rounded-xl overflow-hidden bg-secondary">
              <img
                src={url}
                alt={`Property image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url, idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X size={10} />
              </button>
              {idx === 0 && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-accent/90 text-[9px] text-accent-foreground font-medium">
                  Cover
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !canUpload && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon size={13} />
          No images yet
        </div>
      )}
    </div>
  );
};
