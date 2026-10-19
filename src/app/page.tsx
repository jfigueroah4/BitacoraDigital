import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    }
  } catch (_) {}
  return null;
}

export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('bitacora_token')?.value || cookieStore.get('token')?.value;

  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      const now = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp > now) {
        redirect('/dashboard');
      }
    }
  }

  redirect('/login');
}
