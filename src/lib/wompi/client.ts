const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY!;
const WOMPI_ENVIRONMENT = process.env.WOMPI_ENVIRONMENT || 'sandbox';

const BASE_URL = WOMPI_ENVIRONMENT === 'sandbox'
  ? 'https://sandbox.wompi.co/v1'
  : 'https://production.wompi.co/v1';

export async function createWompiPayment(data: {
  amountInCents: number;
  currency: string;
  customerEmail: string;
  reference: string;
  redirectUrl: string;
}) {
  // Create payment link/session
  const response = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount_in_cents: data.amountInCents,
      currency: data.currency,
      customer_email: data.customerEmail,
      reference: data.reference,
      redirect_url: data.redirectUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Wompi payment failed: ${error}`);
  }

  return response.json();
}

export async function getWompiTransaction(transactionId: string) {
  const response = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
    headers: {
      'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch transaction');
  return response.json();
}

export async function createWompiDisbursement(data: {
  amountInCents: number;
  reference: string;
  bankAccount: {
    type: string;
    financialInstitutionCode: string;
    accountNumber: string;
  };
  document: { type: string; number: string };
  fullName: string;
}) {
  const response = await fetch(`${BASE_URL}/disbursements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount_in_cents: data.amountInCents,
      currency: 'COP',
      reference: data.reference,
      bank_account: {
        type: data.bankAccount.type,
        financial_institution_code: data.bankAccount.financialInstitutionCode,
        account_number: data.bankAccount.accountNumber,
      },
      document: data.document,
      full_name: data.fullName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Wompi disbursement failed: ${error}`);
  }

  return response.json();
}
