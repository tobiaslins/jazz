import OpenGraphImage, { imageSize, imageContentType } from 'gcmp-design-system/src/app/components/organisms/OpenGraphImage';

export const title = 'Whip up an app'
export const size = imageSize;
export const contentType = imageContentType;
export const alt = title;

export default async function Image() {
  return OpenGraphImage({ title })
}