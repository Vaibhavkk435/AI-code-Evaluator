export async function analyzeText(inputText: string, options: any = {}) {
  const response = await fetch('http://localhost:3001/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: inputText, options })
  });
  if (!response.ok) throw new Error('Failed to analyze text');
  return response.json();
}
export async function analyzeImage(imageFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('http://localhost:3001/api/analyze-image', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to analyze image');
  return response.json();
}
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const summarizeText = async (text: string) => {
  const response = await api.post('/summarize', { text });
  return response.data;
};
