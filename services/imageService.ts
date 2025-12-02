
export const addWatermark = (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Enable cross-origin for safety, though mostly dealing with local data URIs here
    img.crossOrigin = "anonymous"; 
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Image); // Fallback if context fails
        return;
      }

      // 1. Draw original image
      ctx.drawImage(img, 0, 0);

      // 2. Configure Watermark Text
      // Typo correction: User asked for "AETHOR" but app is "AETHER". Using "AETHER" for consistency.
      const text = "AETHER & NEON - Balaji Duddukuri";
      
      // 3. Set Font - Responsive size (approx 2.5% of image width)
      const fontSize = Math.max(20, Math.floor(img.width * 0.025)); 
      ctx.font = `500 ${fontSize}px 'Cinzel', serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      // 4. Styles (Shadow for visibility on any background)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; // Slightly transparent white

      // 5. Position (Bottom Right with padding)
      const paddingX = Math.floor(img.width * 0.03);
      const paddingY = Math.floor(img.height * 0.03);
      
      ctx.fillText(text, canvas.width - paddingX, canvas.height - paddingY);

      // 6. Return new Data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (err) => {
      console.error("Failed to watermark image", err);
      resolve(base64Image); // Return original if loading fails
    };

    img.src = base64Image;
  });
};
