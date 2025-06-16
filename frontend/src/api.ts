import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export async function analyzeText(inputText: string, options: any = {}) {
  const response = await api.post('/analyze', {
    text: inputText,
    options,
  });
  return response.data;
}

export async function analyzeImage(imageFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post('/analyze-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export const summarizeText = async (text: string) => {
  const response = await api.post('/summarize', { text });
  return response.data;
};
