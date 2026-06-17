import { toPng } from 'html-to-image';

/**
 * Render a DOM node to a PNG and trigger a download. Used to export the trip
 * summary card. `pixelRatio: 2` gives a crisp, retina-quality image.
 */
export async function downloadNodeAsPng(
  node: HTMLElement,
  filename = 'roadtrip.png',
): Promise<void> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
