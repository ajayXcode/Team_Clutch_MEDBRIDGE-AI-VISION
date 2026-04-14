/**
 * Specialized OCR Utility for MedBridge AI Vision (2026 Standard)
 * Optimized for Gemini 3.0+ Payloads
 */

export const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str.startsWith('data:') ? base64Str : `data:image/jpeg;base64,${base64Str}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context context failed"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.onerror = (e) => reject(e);
  });
};

export const GEMINI_3_STABLE = "gemini-3-flash";
export const GEMINI_3_PRO = "gemini-3-pro";
