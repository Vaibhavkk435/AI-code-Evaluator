import express from 'express';
import prisma from '../prismaClient';
import { summarizeText } from '../gemini';

const router = express.Router();

router.post('/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const summary = await summarizeText(text);

    const saved = await prisma.summary.create({
      data: {
        inputText: text,
        outputText: summary,
      },
    });

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
