import { getImage } from '~/lib/images';

/** A responsive image from `src/content/images.json`, with its blur placeholder. */
export function Picture({
  name,
  alt,
  sizes = '100vw',
  priority = false,
  className,
  fit = 'cover'
}: {
  name: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fit?: 'cover' | 'contain';
}) {
  const image = getImage(name);
  return (
    <img
      src={image.src}
      srcSet={image.srcset.map((s) => `${s.src} ${s.width}w`).join(', ')}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding='async'
      className={className}
      style={{
        objectFit: fit,
        backgroundImage: `url(${image.blur})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    />
  );
}
