import manifest from '~/content/images.json';

/** One image prepared by `pnpm add-images`. */
export type ImageEntry = {
  /** Largest version, used as the fallback `src`. */
  src: string;
  width: number;
  height: number;
  /** A tiny blurred WebP shown while the image loads. */
  blur: string;
  /** WebP versions by width. GIFs have one entry: the original file. */
  srcset: { src: string; width: number }[];
};

export const images = manifest as Record<string, ImageEntry>;

export function getImage(name: string): ImageEntry {
  const image = images[name];
  if (!image) {
    throw new Error(`No image named "${name}". Run \`pnpm add-images\` and check src/content/images.json.`);
  }
  return image;
}
