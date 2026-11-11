// Chapa Payment Integration
// Docs: https://developer.chapa.co/docs/

const CHAPA_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.chapa.co/v1'
  : 'https://api.chapa.co/v1'; // Sandbox uses same URL with test keys

export interface ChapaPaymentRequest {
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string; // Unique transaction reference
  callback_url: string; // Webhook URL
  return_url: string; // Redirect URL after payment
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: {
    hide_receipt?: boolean;
    customizations?: {
      title?: string;
      description?: string;
    };
  };
}

export interface ChapaPaymentResponse {
  status: 'success' | 'failed';
  message: string;
  data: {
    checkout_url: string;
    tx_ref: string;
  };
}

export interface ChapaVerifyResponse {
  status: 'success' | 'failed';
  message: string;
  data: {
    id: string;
    tx_ref: string;
    amount: string;
    currency: string;
    status: 'success' | 'failed' | 'pending';
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
}

export class ChapaService {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.CHAPA_SECRET_KEY || '';
    if (!this.secretKey) {
      console.warn('[Chapa] CHAPA_SECRET_KEY not set - payment will not work');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(data: ChapaPaymentRequest): Promise<ChapaPaymentResponse> {
    if (!this.secretKey) {
      throw new Error('Chapa secret key not configured. Please add CHAPA_SECRET_KEY to environment variables.');
    }

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || result.status === 'failed') {
      // Chapa returns errors in various formats - extract a readable message
      const message = 
        (typeof result.message === 'string' && result.message) ||
        (result.data?.message && typeof result.data.message === 'string' && result.data.message) ||
        (result.errors && JSON.stringify(result.errors)) ||
        `Chapa error (${response.status}): ${JSON.stringify(result)}`;
      throw new Error(message);
    }

    return result as ChapaPaymentResponse;
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(txRef: string): Promise<ChapaVerifyResponse> {
    if (!this.secretKey) {
      throw new Error('Chapa secret key not configured');
    }

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to verify payment');
    }

    return result as ChapaVerifyResponse;
  }

  /**
   * Refund a payment transaction
   * Chapa supports refunds via their API
   */
  async refundPayment(params: {
    txRef: string;
    amount?: number; // partial refund amount, omit for full refund
  }): Promise<{ ok: boolean; message: string; refundRef?: string }> {
    if (!this.secretKey) {
      throw new Error('Chapa secret key not configured');
    }

    try {
      const body: Record<string, any> = {
        tx_ref: params.txRef,
      };
      if (params.amount) {
        body.amount = String(params.amount);
      }

      const response = await fetch(`${CHAPA_BASE_URL}/refund`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        return {
          ok: true,
          message: result.message || 'Refund processed',
          refundRef: result.data?.refund_ref || result.data?.id,
        };
      }

      // Chapa may not support refund API yet — log and return gracefully
      console.warn('[Chapa] Refund API response:', response.status, result);
      return {
        ok: false,
        message: result.message || `Refund failed (${response.status})`,
      };
    } catch (error) {
      console.error('[Chapa] Refund error:', error);
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Refund request failed',
      };
    }
  }

  /**
   * Generate a unique transaction reference
   */
  static generateTxRef(prefix: string = 'TX'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

export function getChapaService() {
  return new ChapaService();
}
