import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('bitacora_token')?.value || cookieStore.get('token')?.value;

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const now = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp > now) {
          redirect('/dashboard');
        }
      }
    } catch (_) {}
  }

  redirect('/login');
}
