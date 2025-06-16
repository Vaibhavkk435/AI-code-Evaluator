import express from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
// import {analyzeTextOrCode} from '../gemini'; // Adjust the import path as needed

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    // Extract text from image using OCR
    const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
    // const analysisResult = analyzeTextOrCode(text);
    // Optionally, you can now analyze the extracted text with your existing logic
    // For now, just return the extracted text:
    res.json({
  feedback: 'Screenshot analysis complete.',
  extractedText: text,
  // ...analysisResult // merge in the real analysis results
});
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

export default router;