import { LegalPage } from '@/components/legal-page';
import { APP_NAME, LEGAL_CONTACT_EMAIL } from '@/lib/constants';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updatedOn="March 14, 2026"
      intro={`These terms govern use of ${APP_NAME}. By using the service, you agree to the conditions below.`}
      sections={[
        {
          heading: 'Service description',
          paragraphs: [
            `${APP_NAME} provides software tooling to generate and host Bitcoin invoice pages tied to merchant wallet addresses.`,
            'The service does not execute custody, exchange, escrow, or money transmission on behalf of users.',
          ],
        },
        {
          heading: 'User responsibilities',
          paragraphs: [
            'You are responsible for the accuracy of invoice content, ownership/control of destination wallet addresses, and compliance with local laws.',
            'You must not use the service for unlawful activity, sanctions evasion, fraud, or abuse of network resources.',
          ],
        },
        {
          heading: 'Availability and limitations',
          paragraphs: [
            'Service availability is not guaranteed. Downtime can occur due to infrastructure, provider outages, or blockchain/API dependencies.',
            'To the maximum extent allowed by law, the service is provided on an as-is basis without warranties of uninterrupted operation or fitness for a particular purpose.',
          ],
        },
        {
          heading: 'Liability and contact',
          paragraphs: [
            `${APP_NAME} is not liable for market volatility, transaction fee conditions, wallet misconfiguration, or delayed/failed blockchain confirmations.`,
            `For legal notices, contact ${LEGAL_CONTACT_EMAIL}.`,
          ],
        },
      ]}
    />
  );
}
