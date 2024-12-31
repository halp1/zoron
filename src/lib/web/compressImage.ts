export const compressImage = async (image: File, size = 128) => {
  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject("Failed to get canvas context");
          return;
        }
        canvas.width = size;
        canvas.height = size;
        const aspectRatio = img.width / img.height;
        let sx = 0,
          sy = 0,
          sWidth = img.width,
          sHeight = img.height;

        if (aspectRatio > 1) {
          // Image is wider than it is tall
          // Crop from center
          sx = (img.width - img.height) / 2;
          sWidth = img.height;
        } else {
          // Image is taller than it is wide
          // Crop from center
          sy = (img.height - img.width) / 2;
          sHeight = img.width;
        }

        // First crop by drawing the center square portion
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);

        // Then the scaling is handled automatically by the canvas size
        canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 }).then((blob) => {
          resolve(blob);
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(image);
  });
};
