import { APP_NAME, LEGAL_CONTACT_EMAIL } from '@/lib/constants';

export const SUPPORTED_LOCALES = ['en', 'es', 'pt', 'fr', 'de', 'it'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  updatedOn: string;
  intro: string;
  sections: LegalSection[];
};

export type I18nMessages = {
  header: {
    homeLabel: string;
  };
  footer: {
    disclaimerLine1: string;
    disclaimerLine2: string;
    links: {
      legal: string;
      privacy: string;
      terms: string;
    };
    theme: {
      light: string;
      dark: string;
      toggleAria: string;
    };
    language: {
      label: string;
      options: Record<Locale, string>;
    };
  };
  home: {
    badge: string;
    heroTitle: string;
    heroDescription: string;
    cardNonCustodialTitle: string;
    cardNonCustodialBody: string;
    cardFastSharingTitle: string;
    cardFastSharingBody: string;
    howItWorksTitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    riskTitle: string;
    riskBody: string;
    riskLink: string;
  };
  form: {
    title: string;
    description: string;
    amountLabel: string;
    currencyLabel: string;
    addressLabel: string;
    addressPlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    expiresLabel: string;
    expiresPlaceholder: string;
    submitLabel: string;
    footnote: string;
    errors: {
      createTitle: string;
      createDescription: string;
      invalidAddressTitle: string;
      invalidAddressDescription: string;
    };
  };
  invoiceDisplay: {
    title: string;
    amountLabel: string;
    sendToLabel: string;
    quoteExpiresLabel: string;
    invoiceValidUntil: string;
    status: {
      pending: string;
      detected: string;
      confirmed: string;
      quoteExpired: string;
      refreshing: string;
      invoiceExpired: string;
      error: string;
    };
    actions: {
      openWallet: string;
      viewTransaction: string;
      copyPaymentLink: string;
    };
    copyItems: {
      btcAmount: string;
      address: string;
      paymentLink: string;
    };
    toasts: {
      copied: string;
      copyFailed: string;
      refreshFailedTitle: string;
      refreshFailedDescription: string;
    };
  };
  invoicePage: {
    loading: string;
    errors: {
      invalidLink: string;
      expired: string;
      loadFailed: string;
      missingIdTitle: string;
      missingIdDescription: string;
    };
  };
  legal: {
    updatedPrefix: string;
    docs: {
      legal: LegalDocument;
      privacy: LegalDocument;
      terms: LegalDocument;
    };
  };
};

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
};

function legalDocEn(): LegalDocument {
  return {
    title: 'Legal Disclosure',
    updatedOn: 'March 14, 2026',
    intro: `${APP_NAME} is software for creating and sharing Bitcoin invoice pages. This disclosure summarizes platform role, risk boundaries, and user responsibilities.`,
    sections: [
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
        paragraphs: [`For legal or compliance questions related to this service, contact ${LEGAL_CONTACT_EMAIL}.`],
      },
    ],
  };
}

function privacyDocEn(): LegalDocument {
  return {
    title: 'Privacy Notice',
    updatedOn: 'March 14, 2026',
    intro: `This notice explains how ${APP_NAME} processes data required to operate Bitcoin invoice links. The service is designed to minimize personal data collection.`,
    sections: [
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
    ],
  };
}

function termsDocEn(): LegalDocument {
  return {
    title: 'Terms of Service',
    updatedOn: 'March 14, 2026',
    intro: `These terms govern use of ${APP_NAME}. By using the service, you agree to the conditions below.`,
    sections: [
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
    ],
  };
}

const MESSAGES: Record<Locale, I18nMessages> = {
  en: {
    header: {
      homeLabel: 'Home',
    },
    footer: {
      disclaimerLine1: `${APP_NAME} is non-custodial software infrastructure for Bitcoin invoicing. Funds move directly between payer and merchant wallets.`,
      disclaimerLine2: `Rates and blockchain data depend on third-party providers. No financial, tax, or legal advice. Contact: ${LEGAL_CONTACT_EMAIL}`,
      links: {
        legal: 'Legal',
        privacy: 'Privacy',
        terms: 'Terms',
      },
      theme: {
        light: 'Light',
        dark: 'Dark',
        toggleAria: 'Toggle theme',
      },
      language: {
        label: 'Language',
        options: LANGUAGE_NAMES,
      },
    },
    home: {
      badge: 'Built for direct Bitcoin payments',
      heroTitle: 'Invoicing for Bitcoin businesses without custody or complexity.',
      heroDescription: `${APP_NAME} lets you generate branded payment requests in seconds. Send one link to your client and receive funds directly in your own wallet.`,
      cardNonCustodialTitle: 'Non-custodial',
      cardNonCustodialBody: 'You control keys and wallet access. We never hold funds.',
      cardFastSharingTitle: 'Fast link sharing',
      cardFastSharingBody: 'Share a payment page your client can open instantly.',
      howItWorksTitle: 'How it works',
      step1Title: '1. Create an invoice',
      step1Body: 'Set amount, currency, wallet address, and optional description.',
      step2Title: '2. Send the link',
      step2Body: 'Share a payment page with QR code, amount, and quote validity timer.',
      step3Title: '3. Track status live',
      step3Body: 'See payment progress live from detection through confirmation.',
      riskTitle: 'Operational notes',
      riskBody: 'Prices and chain data come from external providers and can fail or drift. Final payment settlement depends on Bitcoin network conditions and confirmations.',
      riskLink: 'Read legal and risk disclosures',
    },
    form: {
      title: 'Create an invoice',
      description: 'Instant, non-custodial request link for your client.',
      amountLabel: 'Amount',
      currencyLabel: 'Currency',
      addressLabel: 'Bitcoin wallet address',
      addressPlaceholder: 'bc1...',
      descriptionLabel: 'Description (optional)',
      descriptionPlaceholder: 'e.g. Design retainer payment',
      expiresLabel: 'Invoice expiry in days (optional)',
      expiresPlaceholder: 'Default: 7',
      submitLabel: 'Generate Invoice Link',
      footnote: `Funds go wallet-to-wallet. ${APP_NAME} never takes custody of client balances.`,
      errors: {
        createTitle: 'Error creating invoice',
        createDescription: 'Failed to create invoice. Please try again.',
        invalidAddressTitle: 'Invalid address',
        invalidAddressDescription: 'Please enter a valid Bitcoin address.',
      },
    },
    invoiceDisplay: {
      title: 'Bitcoin Invoice',
      amountLabel: 'Amount',
      sendToLabel: 'Send to',
      quoteExpiresLabel: 'Quote expires in',
      invoiceValidUntil: 'Invoice valid until',
      status: {
        pending: 'Waiting for payment',
        detected: 'Payment detected',
        confirmed: 'Payment confirmed',
        quoteExpired: 'Quote expired',
        refreshing: 'Refreshing quote...',
        invoiceExpired: 'Invoice expired',
        error: 'Status check error',
      },
      actions: {
        openWallet: 'Open in wallet',
        viewTransaction: 'View transaction',
        copyPaymentLink: 'Copy payment link',
      },
      copyItems: {
        btcAmount: 'BTC amount',
        address: 'address',
        paymentLink: 'payment link',
      },
      toasts: {
        copied: '{item} copied to clipboard.',
        copyFailed: 'Failed to copy {item}.',
        refreshFailedTitle: 'Refresh failed',
        refreshFailedDescription: 'Could not refresh quote. Please try again.',
      },
    },
    invoicePage: {
      loading: 'Loading invoice...',
      errors: {
        invalidLink: 'Invalid invoice link',
        expired: 'Invoice expired',
        loadFailed: 'Failed to load invoice',
        missingIdTitle: 'Missing invoice ID',
        missingIdDescription: 'The invoice URL is incomplete. Ask the merchant to resend the full link.',
      },
    },
    legal: {
      updatedPrefix: 'Updated',
      docs: {
        legal: legalDocEn(),
        privacy: privacyDocEn(),
        terms: termsDocEn(),
      },
    },
  },
  es: {
    header: {
      homeLabel: 'Inicio',
    },
    footer: {
      disclaimerLine1: `${APP_NAME} es una infraestructura no custodia para facturación con Bitcoin. Los fondos se mueven directamente entre la cartera del pagador y la del comerciante.`,
      disclaimerLine2: `Las tasas y los datos de blockchain dependen de proveedores externos. No ofrecemos asesoramiento financiero, fiscal ni legal. Contacto: ${LEGAL_CONTACT_EMAIL}`,
      links: {
        legal: 'Legal',
        privacy: 'Privacidad',
        terms: 'Términos',
      },
      theme: {
        light: 'Claro',
        dark: 'Oscuro',
        toggleAria: 'Cambiar tema',
      },
      language: {
        label: 'Idioma',
        options: LANGUAGE_NAMES,
      },
    },
    home: {
      badge: 'Diseñado para pagos directos en Bitcoin',
      heroTitle: 'Facturación para negocios Bitcoin sin custodia ni complejidad.',
      heroDescription: `${APP_NAME} te permite generar solicitudes de pago con marca en segundos. Envía un enlace a tu cliente y recibe fondos directamente en tu cartera.`,
      cardNonCustodialTitle: 'Sin custodia',
      cardNonCustodialBody: 'Tú controlas las claves y el acceso a la cartera. Nunca retenemos fondos.',
      cardFastSharingTitle: 'Compartición rápida',
      cardFastSharingBody: 'Comparte una página de pago que tu cliente puede abrir al instante.',
      howItWorksTitle: 'Cómo funciona',
      step1Title: '1. Crea una factura',
      step1Body: 'Define importe, moneda, dirección de cartera y descripción opcional.',
      step2Title: '2. Envía el enlace',
      step2Body: 'Comparte una página de pago con código QR, importe y temporizador de cotización.',
      step3Title: '3. Sigue el estado en vivo',
      step3Body: 'Consulta el progreso del pago en tiempo real, desde detección hasta confirmación.',
      riskTitle: 'Notas operativas',
      riskBody: 'Los precios y datos de cadena provienen de proveedores externos y pueden fallar o variar. La liquidación final depende de las condiciones y confirmaciones de la red Bitcoin.',
      riskLink: 'Leer avisos legales y de riesgo',
    },
    form: {
      title: 'Crear factura',
      description: 'Enlace de cobro instantáneo y sin custodia para tu cliente.',
      amountLabel: 'Importe',
      currencyLabel: 'Moneda',
      addressLabel: 'Dirección de cartera Bitcoin',
      addressPlaceholder: 'bc1...',
      descriptionLabel: 'Descripción (opcional)',
      descriptionPlaceholder: 'p. ej. Retenedor de diseño',
      expiresLabel: 'Vencimiento de la factura en días (opcional)',
      expiresPlaceholder: 'Por defecto: 7',
      submitLabel: 'Generar enlace de factura',
      footnote: `Los fondos van de cartera a cartera. ${APP_NAME} nunca custodia saldos de clientes.`,
      errors: {
        createTitle: 'Error al crear la factura',
        createDescription: 'No se pudo crear la factura. Inténtalo de nuevo.',
        invalidAddressTitle: 'Dirección no válida',
        invalidAddressDescription: 'Introduce una dirección de Bitcoin válida.',
      },
    },
    invoiceDisplay: {
      title: 'Factura de Bitcoin',
      amountLabel: 'Importe',
      sendToLabel: 'Enviar a',
      quoteExpiresLabel: 'La cotización vence en',
      invoiceValidUntil: 'Factura válida hasta',
      status: {
        pending: 'Esperando pago',
        detected: 'Pago detectado',
        confirmed: 'Pago confirmado',
        quoteExpired: 'Cotización vencida',
        refreshing: 'Actualizando cotización...',
        invoiceExpired: 'Factura vencida',
        error: 'Error al consultar estado',
      },
      actions: {
        openWallet: 'Abrir en cartera',
        viewTransaction: 'Ver transacción',
        copyPaymentLink: 'Copiar enlace de pago',
      },
      copyItems: {
        btcAmount: 'importe en BTC',
        address: 'dirección',
        paymentLink: 'enlace de pago',
      },
      toasts: {
        copied: 'Se copió {item} al portapapeles.',
        copyFailed: 'No se pudo copiar {item}.',
        refreshFailedTitle: 'Error al actualizar',
        refreshFailedDescription: 'No se pudo actualizar la cotización. Inténtalo de nuevo.',
      },
    },
    invoicePage: {
      loading: 'Cargando factura...',
      errors: {
        invalidLink: 'Enlace de factura no válido',
        expired: 'Factura vencida',
        loadFailed: 'No se pudo cargar la factura',
        missingIdTitle: 'Falta el ID de factura',
        missingIdDescription: 'La URL de la factura está incompleta. Pide al comerciante que reenvíe el enlace completo.',
      },
    },
    legal: {
      updatedPrefix: 'Actualizado',
      docs: {
        legal: {
          title: 'Aviso legal',
          updatedOn: '14 de marzo de 2026',
          intro: `${APP_NAME} es un software para crear y compartir páginas de facturas en Bitcoin. Este aviso resume el rol de la plataforma, los límites de riesgo y las responsabilidades del usuario.`,
          sections: [
            {
              heading: 'Rol no custodio',
              paragraphs: [
                `${APP_NAME} no guarda claves privadas, no custodia saldos de clientes y no toma posesión de fondos en ningún momento.`,
                'Los pagos se mueven directamente de la cartera del pagador a la cartera del comerciante mostrada en cada factura.',
              ],
            },
            {
              heading: 'Riesgo de red y precio',
              paragraphs: [
                'El tiempo de liquidación de Bitcoin depende de la congestión de red y del mercado de comisiones mineras. Las transacciones sin confirmar pueden retrasarse o descartarse.',
                'Las conversiones fiduciarias dependen de proveedores externos de datos de mercado y pueden fallar, retrasarse o diferir del precio final al pagar.',
              ],
            },
            {
              heading: 'Sin asesoramiento profesional',
              paragraphs: [
                `${APP_NAME} no ofrece asesoramiento legal, fiscal, contable, financiero ni de inversión.`,
                'Los comerciantes son responsables de su propio cumplimiento normativo, requisitos de facturación y obligaciones de reporte.',
              ],
            },
            {
              heading: 'Contacto',
              paragraphs: [`Para dudas legales o de cumplimiento sobre este servicio, contacta con ${LEGAL_CONTACT_EMAIL}.`],
            },
          ],
        },
        privacy: {
          title: 'Aviso de privacidad',
          updatedOn: '14 de marzo de 2026',
          intro: `Este aviso explica cómo ${APP_NAME} procesa los datos necesarios para operar enlaces de facturas Bitcoin. El servicio está diseñado para minimizar la recopilación de datos personales.`,
          sections: [
            {
              heading: 'Datos que procesamos',
              paragraphs: [
                'Los registros de facturas incluyen dirección de cartera, descripción, importes/moneda y metadatos de estado necesarios para el seguimiento del pago.',
                'Los registros técnicos pueden incluir metadatos de solicitud y errores operativos para fiabilidad y prevención de abuso.',
                'El producto no requiere registro de cuentas de usuario final en la versión actual.',
              ],
            },
            {
              heading: 'Finalidad y base legal',
              paragraphs: [
                'El procesamiento se realiza para ofrecer creación, visualización y seguimiento de estado de facturas.',
                'También se utiliza para integridad del servicio, depuración y prevención de uso indebido de la infraestructura.',
              ],
            },
            {
              heading: 'Ubicación de datos y proveedores',
              paragraphs: [
                'La infraestructura de base de datos de facturas está alojada en la región europea.',
                'Se usan APIs de terceros para precio BTC y estado de transacciones; sus propias políticas de privacidad aplican a los datos que reciben.',
              ],
            },
            {
              heading: 'Tus derechos y contacto',
              paragraphs: [
                `Para acceso, rectificación, eliminación u oposición al tratamiento, contacta con ${LEGAL_CONTACT_EMAIL}.`,
                'Las solicitudes se revisan conforme a la normativa de protección de datos aplicable en la región donde opera el servicio.',
              ],
            },
          ],
        },
        terms: {
          title: 'Términos de servicio',
          updatedOn: '14 de marzo de 2026',
          intro: `Estos términos regulan el uso de ${APP_NAME}. Al usar el servicio, aceptas las condiciones siguientes.`,
          sections: [
            {
              heading: 'Descripción del servicio',
              paragraphs: [
                `${APP_NAME} ofrece herramientas de software para generar y alojar páginas de facturas Bitcoin vinculadas a direcciones de cartera del comerciante.`,
                'El servicio no realiza custodia, cambio, escrow ni transmisión de dinero en nombre de usuarios.',
              ],
            },
            {
              heading: 'Responsabilidades del usuario',
              paragraphs: [
                'Eres responsable de la exactitud del contenido de la factura, de la titularidad/control de la dirección de destino y del cumplimiento de leyes locales.',
                'No debes usar el servicio para actividades ilícitas, evasión de sanciones, fraude ni abuso de recursos de red.',
              ],
            },
            {
              heading: 'Disponibilidad y limitaciones',
              paragraphs: [
                'La disponibilidad del servicio no está garantizada. Puede haber interrupciones por infraestructura, caídas de proveedores o dependencias blockchain/API.',
                'En la máxima medida permitida por la ley, el servicio se ofrece tal cual, sin garantías de funcionamiento ininterrumpido o idoneidad para un fin concreto.',
              ],
            },
            {
              heading: 'Responsabilidad y contacto',
              paragraphs: [
                `${APP_NAME} no es responsable de volatilidad de mercado, condiciones de comisiones, mala configuración de cartera ni confirmaciones retrasadas/fallidas.`,
                `Para notificaciones legales, contacta con ${LEGAL_CONTACT_EMAIL}.`,
              ],
            },
          ],
        },
      },
    },
  },
  pt: {
    header: {
      homeLabel: 'Início',
    },
    footer: {
      disclaimerLine1: `${APP_NAME} é uma infraestrutura sem custódia para faturação em Bitcoin. Os fundos movem-se diretamente entre a carteira do pagador e a do comerciante.`,
      disclaimerLine2: `Taxas e dados de blockchain dependem de provedores externos. Sem aconselhamento financeiro, fiscal ou jurídico. Contacto: ${LEGAL_CONTACT_EMAIL}`,
      links: {
        legal: 'Legal',
        privacy: 'Privacidade',
        terms: 'Termos',
      },
      theme: {
        light: 'Claro',
        dark: 'Escuro',
        toggleAria: 'Alternar tema',
      },
      language: {
        label: 'Idioma',
        options: LANGUAGE_NAMES,
      },
    },
    home: {
      badge: 'Feito para pagamentos diretos em Bitcoin',
      heroTitle: 'Faturação para negócios Bitcoin sem custódia nem complexidade.',
      heroDescription: `${APP_NAME} permite gerar pedidos de pagamento com marca em segundos. Envie um link ao cliente e receba fundos diretamente na sua carteira.`,
      cardNonCustodialTitle: 'Sem custódia',
      cardNonCustodialBody: 'Você controla as chaves e o acesso à carteira. Nunca guardamos fundos.',
      cardFastSharingTitle: 'Partilha rápida',
      cardFastSharingBody: 'Partilhe uma página de pagamento que o cliente abre imediatamente.',
      howItWorksTitle: 'Como funciona',
      step1Title: '1. Crie uma fatura',
      step1Body: 'Defina valor, moeda, endereço da carteira e descrição opcional.',
      step2Title: '2. Envie o link',
      step2Body: 'Partilhe uma página de pagamento com QR code, valor e temporizador da cotação.',
      step3Title: '3. Acompanhe o estado em tempo real',
      step3Body: 'Veja o progresso do pagamento em tempo real, da deteção à confirmação.',
      riskTitle: 'Notas operacionais',
      riskBody: 'Preços e dados de rede vêm de provedores externos e podem falhar ou variar. A liquidação final depende das condições e confirmações da rede Bitcoin.',
      riskLink: 'Ler divulgações legais e de risco',
    },
    form: {
      title: 'Criar fatura',
      description: 'Link de cobrança instantâneo e sem custódia para o seu cliente.',
      amountLabel: 'Valor',
      currencyLabel: 'Moeda',
      addressLabel: 'Endereço da carteira Bitcoin',
      addressPlaceholder: 'bc1...',
      descriptionLabel: 'Descrição (opcional)',
      descriptionPlaceholder: 'ex.: pagamento de design mensal',
      expiresLabel: 'Validade da fatura em dias (opcional)',
      expiresPlaceholder: 'Padrão: 7',
      submitLabel: 'Gerar link da fatura',
      footnote: `Os fundos movem-se de carteira para carteira. ${APP_NAME} nunca tem custódia dos saldos dos clientes.`,
      errors: {
        createTitle: 'Erro ao criar fatura',
        createDescription: 'Não foi possível criar a fatura. Tente novamente.',
        invalidAddressTitle: 'Endereço inválido',
        invalidAddressDescription: 'Introduza um endereço Bitcoin válido.',
      },
    },
    invoiceDisplay: {
      title: 'Fatura Bitcoin',
      amountLabel: 'Valor',
      sendToLabel: 'Enviar para',
      quoteExpiresLabel: 'Cotação expira em',
      invoiceValidUntil: 'Fatura válida até',
      status: {
        pending: 'A aguardar pagamento',
        detected: 'Pagamento detetado',
        confirmed: 'Pagamento confirmado',
        quoteExpired: 'Cotação expirada',
        refreshing: 'A atualizar cotação...',
        invoiceExpired: 'Fatura expirada',
        error: 'Erro na verificação de estado',
      },
      actions: {
        openWallet: 'Abrir na carteira',
        viewTransaction: 'Ver transação',
        copyPaymentLink: 'Copiar link de pagamento',
      },
      copyItems: {
        btcAmount: 'valor em BTC',
        address: 'endereço',
        paymentLink: 'link de pagamento',
      },
      toasts: {
        copied: '{item} copiado para a área de transferência.',
        copyFailed: 'Falha ao copiar {item}.',
        refreshFailedTitle: 'Falha ao atualizar',
        refreshFailedDescription: 'Não foi possível atualizar a cotação. Tente novamente.',
      },
    },
    invoicePage: {
      loading: 'A carregar fatura...',
      errors: {
        invalidLink: 'Link de fatura inválido',
        expired: 'Fatura expirada',
        loadFailed: 'Falha ao carregar a fatura',
        missingIdTitle: 'ID da fatura em falta',
        missingIdDescription: 'O URL da fatura está incompleto. Peça ao comerciante para reenviar o link completo.',
      },
    },
    legal: {
      updatedPrefix: 'Atualizado',
      docs: {
        legal: {
          title: 'Divulgação legal',
          updatedOn: '14 de março de 2026',
          intro: `${APP_NAME} é um software para criar e partilhar páginas de fatura em Bitcoin. Esta divulgação resume o papel da plataforma, os limites de risco e as responsabilidades do utilizador.`,
          sections: [
            {
              heading: 'Papel da plataforma sem custódia',
              paragraphs: [
                `${APP_NAME} não guarda chaves privadas, não faz custódia de saldos de clientes e não toma posse de fundos em nenhum momento.`,
                'Os pagamentos vão diretamente da carteira do pagador para a carteira do comerciante mostrada em cada fatura.',
              ],
            },
            {
              heading: 'Divulgações de risco de rede e preço',
              paragraphs: [
                'O tempo de liquidação em Bitcoin depende do congestionamento da rede e do mercado de taxas de mineração. Transações não confirmadas podem atrasar ou ser descartadas.',
                'As conversões para moeda fiduciária dependem de provedores externos de dados e podem falhar, atrasar ou diferir do preço no momento do pagamento.',
              ],
            },
            {
              heading: 'Sem aconselhamento profissional',
              paragraphs: [
                `${APP_NAME} não fornece aconselhamento jurídico, fiscal, contabilístico, financeiro ou de investimento.`,
                'Os comerciantes são responsáveis pelo próprio cumprimento legal, requisitos de faturação e obrigações de reporte.',
              ],
            },
            {
              heading: 'Contacto',
              paragraphs: [`Para questões legais ou de compliance relacionadas com este serviço, contacte ${LEGAL_CONTACT_EMAIL}.`],
            },
          ],
        },
        privacy: {
          title: 'Aviso de privacidade',
          updatedOn: '14 de março de 2026',
          intro: `Este aviso explica como ${APP_NAME} processa os dados necessários para operar links de faturas Bitcoin. O serviço foi desenhado para minimizar a recolha de dados pessoais.`,
          sections: [
            {
              heading: 'Dados que processamos',
              paragraphs: [
                'Os registos de fatura incluem endereço da carteira do comerciante, descrição, valores/moeda e metadados de estado necessários para o acompanhamento do pagamento.',
                'Registos técnicos podem incluir metadados do pedido e erros operacionais para fiabilidade e prevenção de abuso.',
                'O produto não exige registo de conta de utilizador final na versão atual.',
              ],
            },
            {
              heading: 'Finalidade e base legal',
              paragraphs: [
                'O processamento é feito para disponibilizar criação, visualização e estado de pagamento das faturas.',
                'Também é usado para integridade do serviço, depuração e prevenção de uso abusivo da infraestrutura.',
              ],
            },
            {
              heading: 'Localização de dados e provedores',
              paragraphs: [
                'A infraestrutura da base de dados de faturas está alojada na região europeia.',
                'APIs de terceiros são usadas para preço BTC e estado de transações; os respetivos termos de privacidade aplicam-se aos dados recebidos por esses serviços.',
              ],
            },
            {
              heading: 'Os seus direitos e contacto',
              paragraphs: [
                `Para acesso, correção, eliminação ou oposição ao tratamento, contacte ${LEGAL_CONTACT_EMAIL}.`,
                'Os pedidos são analisados de acordo com as regras de proteção de dados aplicáveis na região onde o serviço opera.',
              ],
            },
          ],
        },
        terms: {
          title: 'Termos de serviço',
          updatedOn: '14 de março de 2026',
          intro: `Estes termos regulam o uso de ${APP_NAME}. Ao usar o serviço, concorda com as condições abaixo.`,
          sections: [
            {
              heading: 'Descrição do serviço',
              paragraphs: [
                `${APP_NAME} fornece ferramentas de software para gerar e alojar páginas de fatura Bitcoin ligadas a endereços de carteira de comerciantes.`,
                'O serviço não executa custódia, câmbio, escrow ou transmissão de dinheiro em nome dos utilizadores.',
              ],
            },
            {
              heading: 'Responsabilidades do utilizador',
              paragraphs: [
                'É responsável pela exatidão do conteúdo da fatura, propriedade/controlo dos endereços de destino e cumprimento das leis locais.',
                'Não deve usar o serviço para atividade ilícita, evasão de sanções, fraude ou abuso de recursos de rede.',
              ],
            },
            {
              heading: 'Disponibilidade e limitações',
              paragraphs: [
                'A disponibilidade do serviço não é garantida. Podem ocorrer paragens por infraestrutura, indisponibilidade de provedores ou dependências blockchain/API.',
                'Na máxima extensão permitida por lei, o serviço é fornecido no estado em que se encontra, sem garantias de funcionamento ininterrupto ou adequação a um fim específico.',
              ],
            },
            {
              heading: 'Responsabilidade e contacto',
              paragraphs: [
                `${APP_NAME} não é responsável por volatilidade de mercado, condições de taxas, configuração incorreta de carteira ou confirmações atrasadas/falhadas na blockchain.`,
                `Para notificações legais, contacte ${LEGAL_CONTACT_EMAIL}.`,
              ],
            },
          ],
        },
      },
    },
  },
  fr: {
    header: {
      homeLabel: 'Accueil',
    },
    footer: {
      disclaimerLine1: `${APP_NAME} est une infrastructure non dépositaire pour la facturation Bitcoin. Les fonds circulent directement entre le portefeuille du payeur et celui du marchand.`,
      disclaimerLine2: `Les taux et données blockchain dépendent de fournisseurs tiers. Aucun conseil financier, fiscal ou juridique. Contact : ${LEGAL_CONTACT_EMAIL}`,
      links: {
        legal: 'Juridique',
        privacy: 'Confidentialité',
        terms: 'Conditions',
      },
      theme: {
        light: 'Clair',
        dark: 'Sombre',
        toggleAria: 'Changer le thème',
      },
      language: {
        label: 'Langue',
        options: LANGUAGE_NAMES,
      },
    },
    home: {
      badge: 'Conçu pour les paiements Bitcoin directs',
      heroTitle: 'Facturation pour les entreprises Bitcoin sans garde ni complexité.',
      heroDescription: `${APP_NAME} vous permet de générer des demandes de paiement de marque en quelques secondes. Envoyez un lien à votre client et recevez les fonds directement dans votre portefeuille.`,
      cardNonCustodialTitle: 'Non dépositaire',
      cardNonCustodialBody: 'Vous contrôlez les clés et l’accès au portefeuille. Nous ne détenons jamais les fonds.',
      cardFastSharingTitle: 'Partage rapide',
      cardFastSharingBody: 'Partagez une page de paiement que votre client peut ouvrir instantanément.',
      howItWorksTitle: 'Comment ça marche',
      step1Title: '1. Créer une facture',
      step1Body: 'Définissez le montant, la devise, l’adresse du portefeuille et une description optionnelle.',
      step2Title: '2. Envoyer le lien',
      step2Body: 'Partagez une page de paiement avec QR code, montant et minuterie de validité du taux.',
      step3Title: '3. Suivre le statut en direct',
      step3Body: 'Suivez la progression du paiement en temps réel, de la détection à la confirmation.',
      riskTitle: 'Notes opérationnelles',
      riskBody: 'Les prix et données de chaîne proviennent de fournisseurs externes et peuvent échouer ou dériver. Le règlement final dépend des conditions et confirmations du réseau Bitcoin.',
      riskLink: 'Lire les mentions légales et risques',
    },
    form: {
      title: 'Créer une facture',
      description: 'Lien de paiement instantané, non dépositaire, pour votre client.',
      amountLabel: 'Montant',
      currencyLabel: 'Devise',
      addressLabel: 'Adresse du portefeuille Bitcoin',
      addressPlaceholder: 'bc1...',
      descriptionLabel: 'Description (facultative)',
      descriptionPlaceholder: 'ex. paiement mensuel de design',
      expiresLabel: 'Expiration de la facture en jours (facultatif)',
      expiresPlaceholder: 'Par défaut : 7',
      submitLabel: 'Générer le lien de facture',
      footnote: `Les fonds vont directement de portefeuille à portefeuille. ${APP_NAME} ne prend jamais la garde des fonds clients.`,
      errors: {
        createTitle: 'Erreur lors de la création',
        createDescription: 'Impossible de créer la facture. Veuillez réessayer.',
        invalidAddressTitle: 'Adresse invalide',
        invalidAddressDescription: 'Veuillez saisir une adresse Bitcoin valide.',
      },
    },
    invoiceDisplay: {
      title: 'Facture Bitcoin',
      amountLabel: 'Montant',
      sendToLabel: 'Envoyer à',
      quoteExpiresLabel: 'Le taux expire dans',
      invoiceValidUntil: 'Facture valable jusqu’au',
      status: {
        pending: 'En attente du paiement',
        detected: 'Paiement détecté',
        confirmed: 'Paiement confirmé',
        quoteExpired: 'Taux expiré',
        refreshing: 'Actualisation du taux...',
        invoiceExpired: 'Facture expirée',
        error: 'Erreur de vérification du statut',
      },
      actions: {
        openWallet: 'Ouvrir dans le portefeuille',
        viewTransaction: 'Voir la transaction',
        copyPaymentLink: 'Copier le lien de paiement',
      },
      copyItems: {
        btcAmount: 'montant BTC',
        address: 'adresse',
        paymentLink: 'lien de paiement',
      },
      toasts: {
        copied: '{item} copié dans le presse-papiers.',
        copyFailed: 'Échec de copie de {item}.',
        refreshFailedTitle: 'Échec de l’actualisation',
        refreshFailedDescription: 'Impossible d’actualiser le taux. Veuillez réessayer.',
      },
    },
    invoicePage: {
      loading: 'Chargement de la facture...',
      errors: {
        invalidLink: 'Lien de facture invalide',
        expired: 'Facture expirée',
        loadFailed: 'Impossible de charger la facture',
        missingIdTitle: 'ID de facture manquant',
        missingIdDescription: 'L’URL de la facture est incomplète. Demandez au marchand de renvoyer le lien complet.',
      },
    },
    legal: {
      updatedPrefix: 'Mis à jour',
      docs: {
        legal: {
          title: 'Mentions légales',
          updatedOn: '14 mars 2026',
          intro: `${APP_NAME} est un logiciel de création et de partage de pages de factures Bitcoin. Cette notice résume le rôle de la plateforme, les limites de risque et les responsabilités des utilisateurs.`,
          sections: [
            {
              heading: 'Rôle non dépositaire de la plateforme',
              paragraphs: [
                `${APP_NAME} ne détient pas les clés privées, ne garde pas les soldes clients et ne prend jamais possession des fonds.`,
                'Les paiements transitent directement du portefeuille du payeur vers celui du marchand indiqué sur chaque facture.',
              ],
            },
            {
              heading: 'Risques réseau et prix',
              paragraphs: [
                'Le délai de règlement Bitcoin dépend de la congestion réseau et du marché des frais miniers. Les transactions non confirmées peuvent être retardées ou abandonnées.',
                'Les conversions fiat reposent sur des fournisseurs tiers de données de marché et peuvent échouer, être retardées ou différer du prix d’exécution au paiement.',
              ],
            },
            {
              heading: 'Aucun conseil professionnel',
              paragraphs: [
                `${APP_NAME} ne fournit pas de conseil juridique, fiscal, comptable, financier ou d’investissement.`,
                'Les marchands sont responsables de leur conformité, de leurs obligations de facturation et de leurs obligations déclaratives.',
              ],
            },
            {
              heading: 'Contact',
              paragraphs: [`Pour toute question juridique ou conformité liée au service, contactez ${LEGAL_CONTACT_EMAIL}.`],
            },
          ],
        },
        privacy: {
          title: 'Politique de confidentialité',
          updatedOn: '14 mars 2026',
          intro: `Cette notice explique comment ${APP_NAME} traite les données nécessaires au fonctionnement des liens de facturation Bitcoin. Le service est conçu pour minimiser la collecte de données personnelles.`,
          sections: [
            {
              heading: 'Données traitées',
              paragraphs: [
                'Les enregistrements de factures incluent l’adresse de portefeuille fournie par le marchand, la description, les montants/devises et les métadonnées de statut nécessaires au suivi du paiement.',
                'Les journaux techniques peuvent inclure des métadonnées de requête et des erreurs opérationnelles pour la fiabilité et la prévention des abus.',
                'Le produit ne nécessite pas la création de comptes utilisateurs finaux dans la version actuelle.',
              ],
            },
            {
              heading: 'Finalité et base légale',
              paragraphs: [
                'Le traitement est effectué pour fournir la création, l’affichage et le suivi du statut des factures.',
                'Il sert également à l’intégrité du service, au débogage et à la prévention des usages abusifs de l’infrastructure.',
              ],
            },
            {
              heading: 'Localisation des données et fournisseurs',
              paragraphs: [
                'L’infrastructure de base de données des factures est hébergée dans la région européenne.',
                'Des API tierces sont utilisées pour le prix BTC et l’état des transactions blockchain ; leurs propres politiques de confidentialité s’appliquent aux données qu’elles reçoivent.',
              ],
            },
            {
              heading: 'Vos droits et contact',
              paragraphs: [
                `Pour l’accès, la rectification, la suppression ou l’opposition au traitement, contactez ${LEGAL_CONTACT_EMAIL}.`,
                'Les demandes sont examinées conformément aux règles de protection des données applicables dans la région où le service opère.',
              ],
            },
          ],
        },
        terms: {
          title: 'Conditions d’utilisation',
          updatedOn: '14 mars 2026',
          intro: `Ces conditions régissent l’utilisation de ${APP_NAME}. En utilisant le service, vous acceptez les conditions ci-dessous.`,
          sections: [
            {
              heading: 'Description du service',
              paragraphs: [
                `${APP_NAME} fournit des outils logiciels pour générer et héberger des pages de factures Bitcoin liées aux adresses de portefeuille des marchands.`,
                'Le service n’exécute pas de garde, d’échange, d’escrow ni de transmission de fonds pour le compte des utilisateurs.',
              ],
            },
            {
              heading: 'Responsabilités utilisateur',
              paragraphs: [
                'Vous êtes responsable de l’exactitude du contenu des factures, de la propriété/du contrôle des adresses de destination et du respect des lois locales.',
                'Vous ne devez pas utiliser le service pour des activités illicites, contournement de sanctions, fraude ou abus de ressources réseau.',
              ],
            },
            {
              heading: 'Disponibilité et limites',
              paragraphs: [
                'La disponibilité du service n’est pas garantie. Des interruptions peuvent se produire en raison de l’infrastructure, des pannes de fournisseurs ou des dépendances blockchain/API.',
                'Dans la mesure maximale autorisée par la loi, le service est fourni en l’état, sans garantie de fonctionnement ininterrompu ni d’adéquation à un usage particulier.',
              ],
            },
            {
              heading: 'Responsabilité et contact',
              paragraphs: [
                `${APP_NAME} n’est pas responsable de la volatilité du marché, des conditions de frais, d’une mauvaise configuration du portefeuille ou des confirmations retardées/échouées de la blockchain.`,
                `Pour toute notification légale, contactez ${LEGAL_CONTACT_EMAIL}.`,
              ],
            },
          ],
        },
      },
    },
  },
  de: {
    header: {
      homeLabel: 'Startseite',
    },
    footer: {
      disclaimerLine1: `${APP_NAME} ist eine nicht-verwahrende Infrastruktur für Bitcoin-Rechnungen. Gelder fließen direkt zwischen Zahler- und Händler-Wallet.`,
      disclaimerLine2: `Kurse und Blockchain-Daten stammen von Drittanbietern. Keine Finanz-, Steuer- oder Rechtsberatung. Kontakt: ${LEGAL_CONTACT_EMAIL}`,
      links: {
        legal: 'Rechtliches',
        privacy: 'Datenschutz',
        terms: 'Nutzungsbedingungen',
      },
      theme: {
        light: 'Hell',
        dark: 'Dunkel',
        toggleAria: 'Design wechseln',
      },
      language: {
        label: 'Sprache',
        options: LANGUAGE_NAMES,
      },
    },
    home: {
      badge: 'Für direkte Bitcoin-Zahlungen entwickelt',
      heroTitle: 'Rechnungsstellung für Bitcoin-Unternehmen ohne Verwahrung und ohne Komplexität.',
      heroDescription: `${APP_NAME} erstellt in Sekunden gebrandete Zahlungsanforderungen. Sende einen Link an deinen Kunden und erhalte Gelder direkt in deiner Wallet.`,
      cardNonCustodialTitle: 'Nicht-verwahrend',
      cardNonCustodialBody: 'Du kontrollierst Schlüssel und Wallet-Zugriff. Wir halten niemals Gelder.',
      cardFastSharingTitle: 'Schnelles Teilen',
      cardFastSharingBody: 'Teile eine Zahlungsseite, die dein Kunde sofort öffnen kann.',
      howItWorksTitle: 'So funktioniert es',
      step1Title: '1. Rechnung erstellen',
      step1Body: 'Betrag, Währung, Wallet-Adresse und optionale Beschreibung festlegen.',
      step2Title: '2. Link senden',
      step2Body: 'Teile eine Zahlungsseite mit QR-Code, Betrag und Kurs-Timer.',
      step3Title: '3. Status live verfolgen',
      step3Body: 'Verfolge den Zahlungsfortschritt live von Erkennung bis Bestätigung.',
      riskTitle: 'Betriebshinweise',
      riskBody: 'Preis- und Chain-Daten kommen von externen Anbietern und können ausfallen oder abweichen. Die endgültige Abwicklung hängt von Netzwerkbedingungen und Bestätigungen im Bitcoin-Netzwerk ab.',
      riskLink: 'Rechtliche Hinweise und Risiken lesen',
    },
    form: {
      title: 'Rechnung erstellen',
      description: 'Sofortiger, nicht-verwahrender Zahlungslink für deinen Kunden.',
      amountLabel: 'Betrag',
      currencyLabel: 'Währung',
      addressLabel: 'Bitcoin-Wallet-Adresse',
      addressPlaceholder: 'bc1...',
      descriptionLabel: 'Beschreibung (optional)',
      descriptionPlaceholder: 'z. B. monatliche Designzahlung',
      expiresLabel: 'Ablauf der Rechnung in Tagen (optional)',
      expiresPlaceholder: 'Standard: 7',
      submitLabel: 'Rechnungslink generieren',
      footnote: `Gelder gehen direkt von Wallet zu Wallet. ${APP_NAME} verwahrt niemals Kundengelder.`,
      errors: {
        createTitle: 'Fehler beim Erstellen',
        createDescription: 'Rechnung konnte nicht erstellt werden. Bitte erneut versuchen.',
        invalidAddressTitle: 'Ungültige Adresse',
        invalidAddressDescription: 'Bitte eine gültige Bitcoin-Adresse eingeben.',
      },
    },
    invoiceDisplay: {
      title: 'Bitcoin-Rechnung',
      amountLabel: 'Betrag',
      sendToLabel: 'Senden an',
      quoteExpiresLabel: 'Kurs läuft ab in',
      invoiceValidUntil: 'Rechnung gültig bis',
      status: {
        pending: 'Warte auf Zahlung',
        detected: 'Zahlung erkannt',
        confirmed: 'Zahlung bestätigt',
        quoteExpired: 'Kurs abgelaufen',
        refreshing: 'Kurs wird aktualisiert...',
        invoiceExpired: 'Rechnung abgelaufen',
        error: 'Fehler bei Statusprüfung',
      },
      actions: {
        openWallet: 'In Wallet öffnen',
        viewTransaction: 'Transaktion anzeigen',
        copyPaymentLink: 'Zahlungslink kopieren',
      },
      copyItems: {
        btcAmount: 'BTC-Betrag',
        address: 'Adresse',
        paymentLink: 'Zahlungslink',
      },
      toasts: {
        copied: '{item} wurde in die Zwischenablage kopiert.',
        copyFailed: '{item} konnte nicht kopiert werden.',
        refreshFailedTitle: 'Aktualisierung fehlgeschlagen',
        refreshFailedDescription: 'Kurs konnte nicht aktualisiert werden. Bitte erneut versuchen.',
      },
    },
    invoicePage: {
      loading: 'Rechnung wird geladen...',
      errors: {
        invalidLink: 'Ungültiger Rechnungslink',
        expired: 'Rechnung abgelaufen',
        loadFailed: 'Rechnung konnte nicht geladen werden',
        missingIdTitle: 'Rechnungs-ID fehlt',
        missingIdDescription: 'Die Rechnungs-URL ist unvollständig. Bitte den Händler um den vollständigen Link bitten.',
      },
    },
    legal: {
      updatedPrefix: 'Aktualisiert',
      docs: {
        legal: {
          title: 'Rechtliche Hinweise',
          updatedOn: '14. März 2026',
          intro: `${APP_NAME} ist Software zum Erstellen und Teilen von Bitcoin-Rechnungsseiten. Diese Hinweise fassen Rolle der Plattform, Risikogrenzen und Nutzerverantwortung zusammen.`,
          sections: [
            {
              heading: 'Nicht-verwahrende Plattformrolle',
              paragraphs: [
                `${APP_NAME} verwahrt keine privaten Schlüssel, hält keine Kundensalden und nimmt zu keinem Zeitpunkt Besitz von Geldern.`,
                'Zahlungen gehen direkt von der Wallet des Zahlers zur in der Rechnung angegebenen Händler-Wallet.',
              ],
            },
            {
              heading: 'Netzwerk- und Preisrisiken',
              paragraphs: [
                'Die Bitcoin-Abwicklungszeit hängt von Netzwerkauslastung und Miner-Gebührenmarkt ab. Unbestätigte Transaktionen können verzögert oder verworfen werden.',
                'Fiat-Umrechnungen basieren auf Marktdaten von Drittanbietern und können ausfallen, verzögert sein oder vom Ausführungspreis zum Zahlungszeitpunkt abweichen.',
              ],
            },
            {
              heading: 'Keine professionelle Beratung',
              paragraphs: [
                `${APP_NAME} bietet keine Rechts-, Steuer-, Buchhaltungs-, Finanz- oder Anlageberatung.`,
                'Händler sind selbst für Compliance, Rechnungsanforderungen und Meldepflichten in ihrer Rechtsordnung verantwortlich.',
              ],
            },
            {
              heading: 'Kontakt',
              paragraphs: [`Für rechtliche oder Compliance-Fragen zu diesem Service kontaktiere ${LEGAL_CONTACT_EMAIL}.`],
            },
          ],
        },
        privacy: {
          title: 'Datenschutzhinweis',
          updatedOn: '14. März 2026',
          intro: `Dieser Hinweis erklärt, wie ${APP_NAME} die für Bitcoin-Rechnungslinks erforderlichen Daten verarbeitet. Der Dienst ist auf minimale Erhebung personenbezogener Daten ausgelegt.`,
          sections: [
            {
              heading: 'Welche Daten wir verarbeiten',
              paragraphs: [
                'Rechnungsdatensätze enthalten vom Händler bereitgestellte Wallet-Adresse, Beschreibung, Beträge/Währungen und Status-Metadaten für die Zahlungsverfolgung.',
                'Technische Protokolle können Anfrage-Metadaten und Betriebsfehler zur Zuverlässigkeit und Missbrauchsprävention enthalten.',
                'In der aktuellen Version ist keine Endnutzer-Registrierung erforderlich.',
              ],
            },
            {
              heading: 'Zweck und Rechtsgrundlage',
              paragraphs: [
                'Die Verarbeitung erfolgt zur Bereitstellung von Rechnungserstellung, Anzeige und Zahlungsstatus-Funktionalität.',
                'Sie dient außerdem der Dienstintegrität, Fehlersuche und Verhinderung missbräuchlicher Nutzung der Infrastruktur.',
              ],
            },
            {
              heading: 'Datenstandort und Anbieter',
              paragraphs: [
                'Die Rechnungsdatenbank-Infrastruktur wird in der europäischen Region gehostet.',
                'Drittanbieter-APIs werden für BTC-Preis und Transaktionsstatus genutzt; deren eigene Datenschutzbedingungen gelten für die von ihnen empfangenen Daten.',
              ],
            },
            {
              heading: 'Ihre Rechte und Kontakt',
              paragraphs: [
                `Für Auskunft, Berichtigung, Löschung oder Widerspruch gegen Verarbeitung kontaktiere ${LEGAL_CONTACT_EMAIL}.`,
                'Anfragen werden entsprechend den geltenden Datenschutzregeln der Region geprüft, in der der Dienst betrieben wird.',
              ],
            },
          ],
        },
        terms: {
          title: 'Nutzungsbedingungen',
          updatedOn: '14. März 2026',
          intro: `Diese Bedingungen regeln die Nutzung von ${APP_NAME}. Mit der Nutzung des Dienstes stimmst du den folgenden Bedingungen zu.`,
          sections: [
            {
              heading: 'Dienstbeschreibung',
              paragraphs: [
                `${APP_NAME} bietet Software-Werkzeuge zum Erstellen und Hosten von Bitcoin-Rechnungsseiten, die mit Händler-Wallet-Adressen verknüpft sind.`,
                'Der Dienst führt keine Verwahrung, keinen Umtausch, kein Escrow und keine Geldübermittlung im Auftrag von Nutzern aus.',
              ],
            },
            {
              heading: 'Pflichten der Nutzer',
              paragraphs: [
                'Du bist verantwortlich für die Richtigkeit der Rechnungsinhalte, Eigentum/Kontrolle der Ziel-Wallet-Adressen und Einhaltung lokaler Gesetze.',
                'Der Dienst darf nicht für rechtswidrige Aktivitäten, Sanktionsumgehung, Betrug oder Missbrauch von Netzwerkressourcen verwendet werden.',
              ],
            },
            {
              heading: 'Verfügbarkeit und Einschränkungen',
              paragraphs: [
                'Die Verfügbarkeit des Dienstes ist nicht garantiert. Ausfälle können durch Infrastruktur, Anbieterstörungen oder Blockchain/API-Abhängigkeiten entstehen.',
                'Soweit gesetzlich zulässig, wird der Dienst „wie besehen“ bereitgestellt, ohne Gewähr für unterbrechungsfreien Betrieb oder Eignung für einen bestimmten Zweck.',
              ],
            },
            {
              heading: 'Haftung und Kontakt',
              paragraphs: [
                `${APP_NAME} haftet nicht für Marktvolatilität, Gebührenbedingungen, fehlerhafte Wallet-Konfiguration oder verzögerte/fehlgeschlagene Blockchain-Bestätigungen.`,
                `Für rechtliche Mitteilungen kontaktiere ${LEGAL_CONTACT_EMAIL}.`,
              ],
            },
          ],
        },
      },
    },
  },
  it: {
    header: {
      homeLabel: 'Home',
    },
    footer: {
      disclaimerLine1: `${APP_NAME} è un’infrastruttura non-custodial per la fatturazione in Bitcoin. I fondi passano direttamente tra il wallet del pagatore e quello del merchant.`,
      disclaimerLine2: `Tassi e dati blockchain dipendono da provider terzi. Nessuna consulenza finanziaria, fiscale o legale. Contatto: ${LEGAL_CONTACT_EMAIL}`,
      links: {
        legal: 'Legale',
        privacy: 'Privacy',
        terms: 'Termini',
      },
      theme: {
        light: 'Chiaro',
        dark: 'Scuro',
        toggleAria: 'Cambia tema',
      },
      language: {
        label: 'Lingua',
        options: LANGUAGE_NAMES,
      },
    },
    home: {
      badge: 'Creato per pagamenti Bitcoin diretti',
      heroTitle: 'Fatturazione per business Bitcoin senza custodia né complessità.',
      heroDescription: `${APP_NAME} ti permette di generare richieste di pagamento brandizzate in pochi secondi. Invia un link al cliente e ricevi i fondi direttamente nel tuo wallet.`,
      cardNonCustodialTitle: 'Non-custodial',
      cardNonCustodialBody: 'Controlli tu chiavi e accesso al wallet. Noi non deteniamo mai fondi.',
      cardFastSharingTitle: 'Condivisione rapida',
      cardFastSharingBody: 'Condividi una pagina di pagamento che il cliente può aprire subito.',
      howItWorksTitle: 'Come funziona',
      step1Title: '1. Crea una fattura',
      step1Body: 'Imposta importo, valuta, indirizzo wallet e descrizione facoltativa.',
      step2Title: '2. Invia il link',
      step2Body: 'Condividi una pagina pagamento con QR code, importo e timer della quotazione.',
      step3Title: '3. Monitora lo stato in tempo reale',
      step3Body: 'Segui l’avanzamento del pagamento in tempo reale, dal rilevamento alla conferma.',
      riskTitle: 'Note operative',
      riskBody: 'Prezzi e dati on-chain provengono da provider esterni e possono fallire o divergere. Il regolamento finale dipende da condizioni e conferme della rete Bitcoin.',
      riskLink: 'Leggi note legali e rischi',
    },
    form: {
      title: 'Crea fattura',
      description: 'Link di pagamento istantaneo e non-custodial per il tuo cliente.',
      amountLabel: 'Importo',
      currencyLabel: 'Valuta',
      addressLabel: 'Indirizzo wallet Bitcoin',
      addressPlaceholder: 'bc1...',
      descriptionLabel: 'Descrizione (facoltativa)',
      descriptionPlaceholder: 'es. pagamento mensile design',
      expiresLabel: 'Scadenza fattura in giorni (facoltativa)',
      expiresPlaceholder: 'Predefinito: 7',
      submitLabel: 'Genera link fattura',
      footnote: `I fondi vanno da wallet a wallet. ${APP_NAME} non custodisce mai i saldi dei clienti.`,
      errors: {
        createTitle: 'Errore creazione fattura',
        createDescription: 'Impossibile creare la fattura. Riprova.',
        invalidAddressTitle: 'Indirizzo non valido',
        invalidAddressDescription: 'Inserisci un indirizzo Bitcoin valido.',
      },
    },
    invoiceDisplay: {
      title: 'Fattura Bitcoin',
      amountLabel: 'Importo',
      sendToLabel: 'Invia a',
      quoteExpiresLabel: 'Quotazione in scadenza tra',
      invoiceValidUntil: 'Fattura valida fino al',
      status: {
        pending: 'In attesa del pagamento',
        detected: 'Pagamento rilevato',
        confirmed: 'Pagamento confermato',
        quoteExpired: 'Quotazione scaduta',
        refreshing: 'Aggiornamento quotazione...',
        invoiceExpired: 'Fattura scaduta',
        error: 'Errore verifica stato',
      },
      actions: {
        openWallet: 'Apri nel wallet',
        viewTransaction: 'Vedi transazione',
        copyPaymentLink: 'Copia link pagamento',
      },
      copyItems: {
        btcAmount: 'importo BTC',
        address: 'indirizzo',
        paymentLink: 'link di pagamento',
      },
      toasts: {
        copied: '{item} copiato negli appunti.',
        copyFailed: 'Impossibile copiare {item}.',
        refreshFailedTitle: 'Aggiornamento non riuscito',
        refreshFailedDescription: 'Impossibile aggiornare la quotazione. Riprova.',
      },
    },
    invoicePage: {
      loading: 'Caricamento fattura...',
      errors: {
        invalidLink: 'Link fattura non valido',
        expired: 'Fattura scaduta',
        loadFailed: 'Impossibile caricare la fattura',
        missingIdTitle: 'ID fattura mancante',
        missingIdDescription: 'L’URL della fattura è incompleto. Chiedi al merchant di inviare nuovamente il link completo.',
      },
    },
    legal: {
      updatedPrefix: 'Aggiornato',
      docs: {
        legal: {
          title: 'Informativa legale',
          updatedOn: '14 marzo 2026',
          intro: `${APP_NAME} è un software per creare e condividere pagine di fatture Bitcoin. Questa informativa riassume ruolo della piattaforma, limiti di rischio e responsabilità dell’utente.`,
          sections: [
            {
              heading: 'Ruolo non-custodial della piattaforma',
              paragraphs: [
                `${APP_NAME} non detiene chiavi private, non custodisce saldi clienti e non prende mai possesso dei fondi.`,
                'I pagamenti si muovono direttamente dal wallet del pagatore al wallet del merchant indicato in ogni fattura.',
              ],
            },
            {
              heading: 'Rischi di rete e prezzo',
              paragraphs: [
                'I tempi di regolamento Bitcoin dipendono dalla congestione di rete e dal mercato delle fee dei miner. Le transazioni non confermate possono essere ritardate o scartate.',
                'Le conversioni fiat si basano su provider terzi di dati di mercato e possono fallire, avere ritardi o differire dal prezzo di esecuzione al momento del pagamento.',
              ],
            },
            {
              heading: 'Nessuna consulenza professionale',
              paragraphs: [
                `${APP_NAME} non fornisce consulenza legale, fiscale, contabile, finanziaria o di investimento.`,
                'I merchant sono responsabili della propria conformità, dei requisiti di fatturazione e degli obblighi dichiarativi.',
              ],
            },
            {
              heading: 'Contatto',
              paragraphs: [`Per domande legali o di compliance relative al servizio, contatta ${LEGAL_CONTACT_EMAIL}.`],
            },
          ],
        },
        privacy: {
          title: 'Informativa privacy',
          updatedOn: '14 marzo 2026',
          intro: `Questa informativa spiega come ${APP_NAME} tratta i dati necessari al funzionamento dei link di fatture Bitcoin. Il servizio è progettato per minimizzare la raccolta di dati personali.`,
          sections: [
            {
              heading: 'Dati trattati',
              paragraphs: [
                'I record delle fatture includono indirizzo wallet del merchant, descrizione, importi/valuta e metadati di stato necessari al monitoraggio del pagamento.',
                'I log tecnici possono includere metadati della richiesta ed errori operativi per affidabilità e prevenzione degli abusi.',
                'La versione attuale del prodotto non richiede registrazione di account utente finale.',
              ],
            },
            {
              heading: 'Finalità e base giuridica',
              paragraphs: [
                'Il trattamento è effettuato per fornire creazione, visualizzazione e monitoraggio dello stato delle fatture.',
                'È inoltre usato per integrità del servizio, debug e prevenzione dell’uso improprio dell’infrastruttura.',
              ],
            },
            {
              heading: 'Localizzazione dati e provider',
              paragraphs: [
                'L’infrastruttura del database fatture è ospitata nella regione europea.',
                'Sono usate API di terze parti per prezzo BTC e stato transazioni blockchain; si applicano le rispettive policy privacy ai dati che ricevono.',
              ],
            },
            {
              heading: 'Diritti e contatto',
              paragraphs: [
                `Per accesso, rettifica, cancellazione o opposizione al trattamento, contatta ${LEGAL_CONTACT_EMAIL}.`,
                'Le richieste vengono valutate in linea con le norme di protezione dati applicabili nella regione in cui opera il servizio.',
              ],
            },
          ],
        },
        terms: {
          title: 'Termini di servizio',
          updatedOn: '14 marzo 2026',
          intro: `Questi termini regolano l’uso di ${APP_NAME}. Utilizzando il servizio accetti le condizioni seguenti.`,
          sections: [
            {
              heading: 'Descrizione del servizio',
              paragraphs: [
                `${APP_NAME} fornisce strumenti software per generare e ospitare pagine di fatture Bitcoin collegate agli indirizzi wallet dei merchant.`,
                'Il servizio non esegue custodia, exchange, escrow o money transmission per conto degli utenti.',
              ],
            },
            {
              heading: 'Responsabilità dell’utente',
              paragraphs: [
                'Sei responsabile dell’accuratezza dei contenuti delle fatture, della proprietà/controllo degli indirizzi di destinazione e del rispetto delle leggi locali.',
                'Non devi usare il servizio per attività illecite, evasione sanzioni, frode o abuso delle risorse di rete.',
              ],
            },
            {
              heading: 'Disponibilità e limiti',
              paragraphs: [
                'La disponibilità del servizio non è garantita. Possono verificarsi interruzioni dovute a infrastruttura, outage dei provider o dipendenze blockchain/API.',
                'Nei limiti massimi consentiti dalla legge, il servizio è fornito “così com’è”, senza garanzie di funzionamento continuo o idoneità a uno scopo specifico.',
              ],
            },
            {
              heading: 'Responsabilità e contatto',
              paragraphs: [
                `${APP_NAME} non è responsabile per volatilità di mercato, condizioni delle fee, configurazione errata del wallet o conferme blockchain ritardate/fallite.`,
                `Per notifiche legali, contatta ${LEGAL_CONTACT_EMAIL}.`,
              ],
            },
          ],
        },
      },
    },
  },
};

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function resolveLocale(raw: string | string[] | null | undefined): Locale {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase().trim();
  const base = normalized.split('-')[0];
  return isLocale(base) ? base : DEFAULT_LOCALE;
}

export function resolveLocaleFromAcceptLanguage(raw: string | null | undefined): Locale {
  if (!raw) return DEFAULT_LOCALE;
  const candidates = raw.split(',').map((part) => part.trim().split(';')[0]);
  for (const candidate of candidates) {
    const locale = resolveLocale(candidate);
    if (locale !== DEFAULT_LOCALE || candidate.toLowerCase().startsWith(DEFAULT_LOCALE)) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
}

export function withLocaleQuery(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}lang=${encodeURIComponent(locale)}`;
}

export function getMessages(locale: Locale): I18nMessages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
}
