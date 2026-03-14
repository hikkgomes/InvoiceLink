import { LegalPage } from '@/components/legal-page';
import { APP_NAME, LEGAL_CONTACT_EMAIL } from '@/lib/constants';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Notice"
      updatedOn="March 14, 2026"
      intro={`This notice explains how ${APP_NAME} processes data required to operate Bitcoin invoice links. The service is designed to minimize personal data collection.`}
      sections={[
        {
          heading: 'Data we process',
          paragraphs: [
            'Invoice records include merchant-provided wallet address, invoice description, amount/currency values, and status metadata needed for payment tracking.',
            'Technical logs may include request metadata and operational errors for reliability and abuse prevention.',
            'The product does not require end-user account registration in the current version.',
          ],
        },
        {
          heading: 'Purpose and legal basis',
          paragraphs: [
            'Processing is performed to deliver invoice creation, display, and payment-status functionality.',
            'Processing is also used for service integrity, debugging, and preventing misuse of infrastructure.',
          ],
        },
        {
          heading: 'Data location and providers',
          paragraphs: [
            'Invoice database infrastructure is hosted in the European region.',
            'Third-party APIs are used for BTC price and blockchain transaction status lookups; their own privacy terms apply to data they receive.',
          ],
        },
        {
          heading: 'Your rights and contact',
          paragraphs: [
            `For access, correction, deletion, or processing objections, contact ${LEGAL_CONTACT_EMAIL}.`,
            'Requests are reviewed in line with applicable data-protection rules for the region where the service operates.',
          ],
        },
      ]}
    />
  );
}
