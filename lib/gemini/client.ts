import { GoogleGenAI } from '@google/genai';

export const MODEL = 'gemini-2.5-flash-image';

let _client: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _client;
}
