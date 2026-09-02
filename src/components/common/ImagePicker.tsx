import { Camera, ImagePlus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getImage, saveImage } from '../../services/images/imageService';
import { processImage } from '../../utils/images';

interface ImagePickerProps {
  /** Current imageId (when editing). */
  imageId: string | null;
  onImageChange: (imageId: string | null) => void;
}

export function ImagePicker({ imageId, onImageChange }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Load preview when imageId changes.
  useEffect(() => {
    let url: string | null = null;
    let active = true;
    (async () => {
      if (!imageId) {
        setPreviewUrl(null);
        return;
      }
      const img = await getImage(imageId);
      if (!active) return;
      if (img) {
        url = URL.createObjectURL(img.blob);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    })();
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [imageId]);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const processed = await processImage(file);
      const saved = await saveImage({
        blob: processed.blob,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        originalSize: processed.originalSize,
        compressedSize: processed.compressedSize,
      });
      // If there was a previous image that is not yet associated, we leave cleanup
      // to the parent save flow (itemService.updateItem handles it).
      onImageChange(saved.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر معالجة الصورة.');
    } finally {
      setBusy(false);
    }
  }

  function clearImage() {
    onImageChange(null);
    setPreviewUrl(null);
    setError(null);
  }

  if (previewUrl) {
    return (
      <div className="space-y-2">
        <div className="relative radius-md overflow-hidden border border-app bg-surface-muted">
          <img
            src={previewUrl}
            alt="معاينة الصورة"
            className="w-full max-h-64 object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 left-2 bg-black/60 text-white rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 hover:bg-black/80"
            aria-label="حذف الصورة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
        >
          تغيير الصورة
        </button>
        <HiddenInputs
          fileInputRef={fileInputRef}
          cameraInputRef={cameraInputRef}
          onFile={handleFile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-dashed border-app radius-md py-6 text-muted hover:text-app hover:border-brand-400 transition-colors text-sm"
        >
          <ImagePlus className="w-5 h-5" />
          اختيار صورة
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 border-2 border-dashed border-app radius-md px-4 py-6 text-muted hover:text-app hover:border-brand-400 transition-colors text-sm"
          aria-label="التقاط صورة بالكاميرا"
          title="التقاط صورة"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>
      {busy && <p className="text-xs text-muted">جارٍ معالجة الصورة…</p>}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
          <Trash2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      <HiddenInputs
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onFile={handleFile}
      />
    </div>
  );
}

function HiddenInputs({
  fileInputRef,
  cameraInputRef,
  onFile,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
}) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
}
