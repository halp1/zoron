export const compressImage = (image: File, size = 32) =>
  new Promise<string>((resolve, reject) => {
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
          sx = (img.width - img.height) / 2;
          sWidth = img.height;
        } else {
          // Image is taller than it is wide
          sy = (img.height - img.width) / 2;
          sHeight = img.width;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
        canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 }).then((blob) => {
          resolve(
            blob.arrayBuffer().then((buffer) => {
              const base64 = btoa(
                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
              );
              return `data:image/jpeg;base64,${base64}`;
            })
          );
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(image);
  });
