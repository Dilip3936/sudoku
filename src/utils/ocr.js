// src/ocr.js
import { createWorker } from 'tesseract.js';

// This function takes either a File, Blob, or image URL and returns the recognized text.
// You can also expose more features (progress, language switching, etc.) as needed.
export async function ocr(image, lang = 'eng') {
  const worker = await createWorker(lang);
  const { data } = await worker.recognize(image);
  await worker.terminate();
  return data.text; // Or return data for more detailed output
}
