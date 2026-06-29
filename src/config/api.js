export const API = 'https://moozik-gft1.onrender.com';
const API_KEY = import.meta.env.ANTHROPIC_API_KEY;
export const ANTHROPIC_CONFIG = {
  API_KEY: API_KEY,
  VERSION: '2023-06-01',
  BASE_URL: 'https://api.anthropic.com/v1/messages',
  DEFAULT_MODEL: 'claude-3-5-sonnet-20240620'
};