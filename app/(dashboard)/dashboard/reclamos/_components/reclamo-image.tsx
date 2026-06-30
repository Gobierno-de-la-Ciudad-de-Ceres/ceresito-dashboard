'use client';

import { isValidReclamoImageUrl } from '@/lib/reclamoImageUrl';

type ReclamoImageProps = {
  url?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  emptyLabel?: string;
};

export function ReclamoImage({
  url,
  alt,
  className,
  width = 64,
  height = 64,
  emptyLabel = 'No img',
}: ReclamoImageProps) {
  if (!isValidReclamoImageUrl(url)) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  const src = `/api/reclamo/image?url=${encodeURIComponent(url)}&inline=1`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
    />
  );
}
