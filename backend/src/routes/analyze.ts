import express from 'express';
import { analyzeText } from '../gemini';


const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await analyzeText(text, options);
    res.json(result); // This includes score and feedback (summary)
  } catch (error) {
     res.status(500).json({ error: (error as Error).message });
  }
});


export default router;