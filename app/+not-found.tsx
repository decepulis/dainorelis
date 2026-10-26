import { useTranslation } from 'react-i18next';

import NotFound from '@/lib/components/NotFound';

// a link to a page the app doesn't have; on the web, also the host's 404 page (`build:web` copies it to 404.html)
export default function NotFoundPage() {
  const { t } = useTranslation();
  return <NotFound message={t('pageNotFound')} />;
}
