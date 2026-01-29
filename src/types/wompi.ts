export interface WompiPaymentRequest {
  amount_in_cents: number;
  currency: 'COP';
  customer_email: string;
  reference: string;
  payment_method: {
    type: string;
    installments?: number;
    token?: string;
  };
  redirect_url?: string;
}

export interface WompiPaymentResponse {
  data: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
    amount_in_cents: number;
    reference: string;
    currency: string;
    payment_method_type: string;
    redirect_url: string | null;
  };
}

export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      amount_in_cents: number;
      reference: string;
      currency: string;
      payment_method_type: string;
    };
  };
  timestamp: number;
  signature: {
    checksum: string;
    properties: string[];
  };
}

export interface WompiDisbursementRequest {
  amount_in_cents: number;
  currency: 'COP';
  reference: string;
  bank_account: {
    type: 'SAVINGS' | 'CHECKING';
    financial_institution_code: string;
    account_number: string;
  };
  document: {
    type: 'CC' | 'CE' | 'NIT';
    number: string;
  };
  full_name: string;
}
