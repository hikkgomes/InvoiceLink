import { LegalPage } from '@/components/legal-page';
import { getMessages, resolveLocale } from '@/lib/i18n';

interface TermsPageProps {
  searchParams?: Promise<{ lang?: string | string[] }>;
}

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const params = (await searchParams) ?? {};
  const locale = resolveLocale(params.lang);
  const messages = getMessages(locale);
  const doc = messages.legal.docs.terms;

  return (
    <LegalPage
      locale={locale}
      footerMessages={messages.footer}
      updatedPrefix={messages.legal.updatedPrefix}
      title={doc.title}
      updatedOn={doc.updatedOn}
      intro={doc.intro}
      sections={doc.sections}
    />
  );
}
