import { useEffect, useRef, useState } from 'react';
import { getImage } from '../../services/images/imageService';

interface ItemImageProps {
  imageId: string | null;
  alt: string;
  className?: string;
  /** Thumbnail max width to render at. */
  maxWidth?: number;
}

/**
 * Loads an image blob from IndexedDB and renders it via an object URL.
 * Revokes the previous URL only after the new one is committed to state,
 * avoiding a brief broken-image flicker when imageId changes.
 */
export function ItemImage({ imageId, alt, className, maxWidth }: ItemImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  // Track the current object URL so we can revoke it after the next one loads.
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!imageId) {
        setUrl(null);
        return;
      }
      const img = await getImage(imageId);
      if (!active) return;
      if (img) {
        const newUrl = URL.createObjectURL(img.blob);
        // Revoke the previous URL only after the new one is ready.
        const prev = currentUrlRef.current;
        currentUrlRef.current = newUrl;
        setUrl(newUrl);
        if (prev) URL.revokeObjectURL(prev);
      } else {
        setUrl(null);
      }
    })();
    return () => {
      active = false;
      // On unmount, revoke the current URL.
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [imageId]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
    />
  );
}
