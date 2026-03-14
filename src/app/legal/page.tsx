import { LegalPage } from '@/components/legal-page';
import { APP_NAME, LEGAL_CONTACT_EMAIL } from '@/lib/constants';

export default function LegalDisclosurePage() {
  return (
    <LegalPage
      title="Legal Disclosure"
      updatedOn="March 14, 2026"
      intro={`${APP_NAME} is software for creating and sharing Bitcoin invoice pages. This disclosure summarizes platform role, risk boundaries, and user responsibilities.`}
      sections={[
        {
          heading: 'Non-custodial platform role',
          paragraphs: [
            `${APP_NAME} does not hold private keys, does not custody client balances, and does not take possession of funds at any time.`,
            'Payments move directly from the payer wallet to the merchant wallet shown on each invoice.',
          ],
        },
        {
          heading: 'Network and price-risk disclosures',
          paragraphs: [
            'Bitcoin settlement time depends on network congestion and miner fee markets. Unconfirmed transactions can be delayed or dropped.',
            'Fiat quote conversions rely on third-party market data providers and may fail, lag, or differ from execution prices at payment time.',
          ],
        },
        {
          heading: 'No professional advice',
          paragraphs: [
            `${APP_NAME} does not provide legal, tax, accounting, investment, or financial advice.`,
            'Merchants are responsible for their own compliance, invoicing requirements, and reporting obligations in their jurisdictions.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            `For legal or compliance questions related to this service, contact ${LEGAL_CONTACT_EMAIL}.`,
          ],
        },
      ]}
    />
  );
}
