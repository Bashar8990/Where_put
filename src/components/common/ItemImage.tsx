import { useEffect, useState } from 'react';
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
 * Revokes the URL on unmount/change to avoid memory leaks.
 */
export function ItemImage({ imageId, alt, className, maxWidth }: ItemImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    (async () => {
      if (!imageId) {
        setUrl(null);
        return;
      }
      const img = await getImage(imageId);
      if (!active) return;
      if (img) {
        createdUrl = URL.createObjectURL(img.blob);
        setUrl(createdUrl);
      } else {
        setUrl(null);
      }
    })();
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
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
