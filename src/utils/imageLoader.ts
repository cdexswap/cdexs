export default function imageLoader({ src }: { src: string }) {
  // If the source is a full URL, return it directly
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // For local images, ensure they're served from the correct path
  // Remove any leading slash to work with assetPrefix
  const path = src.startsWith('/') ? src.slice(1) : src;
  return path;
}
