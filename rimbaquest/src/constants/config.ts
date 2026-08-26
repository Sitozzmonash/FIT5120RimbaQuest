import { Platform } from 'react-native';

const configuredApiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');
export const API_BASE = configuredApiBase || Platform.select({
  android: 'http://10.0.2.2:8000',
  web: 'http://127.0.0.1:8000',
  default: 'http://127.0.0.1:8000'
});
