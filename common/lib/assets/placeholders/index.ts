import img1 from "./1.png";
import img2 from "./2.png";
import img3 from "./3.png";
import img4 from "./4.png";
import img5 from "./5.png";

export const placeholderImages = [img1, img2, img3, img4, img5];

let lastPlaceholderIndex = 0;
export const randomPlaceholderImage = (date: Date): string => {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
      1000 /
      60 /
      60 /
      24
  );
  const index = dayOfYear % placeholderImages.length;
  return placeholderImages[index];
};
