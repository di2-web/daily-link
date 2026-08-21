import React, { useState, useEffect } from 'react';
import { makeImageBackgroundTransparent } from '../lib/imageProcessor';

interface RoomObjectImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Memory cache for processed transparent images to avoid re-computing
const transparentCache = new Map<string, string>();

export const RoomObjectImage: React.FC<RoomObjectImageProps> = ({ src, alt, className = '' }) => {
  const [displaySrc, setDisplaySrc] = useState<string>(() => {
    return transparentCache.get(src) || src;
  });

  useEffect(() => {
    if (!src) return;

    if (transparentCache.has(src)) {
      setDisplaySrc(transparentCache.get(src)!);
      return;
    }

    let isMounted = true;

    // Process image for true background transparency
    makeImageBackgroundTransparent(src)
      .then((processed) => {
        if (isMounted) {
          transparentCache.set(src, processed);
          setDisplaySrc(processed);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDisplaySrc(src);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
};
