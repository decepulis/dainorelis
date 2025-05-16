import type { APIRoute } from 'astro';

import { appStoreUrl, playStoreUrl } from '@/utils/urls';

export const prerender = false;

export const GET: APIRoute = ({ request, redirect }) => {
  const userAgent = request.headers.get('User-Agent');

  if (userAgent) {
    if (/android/i.test(userAgent)) {
      return redirect(playStoreUrl, 307);
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      return redirect(appStoreUrl, 307);
    }
  }

  return redirect('/', 307);
};
