import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaypalService {
  private readonly CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  private readonly SECRET = process.env.PAYPAL_SECRET;
  private readonly BASE = process.env.BASE;

  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.CLIENT_ID}:${this.SECRET}`).toString('base64');
    const response = await axios.post(
      `${this.BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    return response.data.access_token;
  }

  async createProductAndPlans() {
    const token = await this.getAccessToken();

    const productRes = await axios.post(
      `${this.BASE}/v1/catalogs/products`,
      {
        name: 'DGT Portfolio Subscription',
        description: 'Digital wallet subscription service',
        type: 'SERVICE',
        category: 'SOFTWARE',
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const productId = productRes.data.id;
    const plans: any[] = [];

    const createPlan = async (body: any, name: string) => {
      const planRes = await axios.post(`${this.BASE}/v1/billing/plans`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      plans.push({ name, planId: planRes.data.id });
    };

    await createPlan(
      {
        product_id: productId,
        name: 'Monthly Plan',
        billing_cycles: [
          {
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: '1', currency_code: 'USD' } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      },
      'Monthly Plan',
    );

    await createPlan(
      {
        product_id: productId,
        name: '6-Month Plan',
        billing_cycles: [
          {
            frequency: { interval_unit: 'MONTH', interval_count: 6 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: '5', currency_code: 'USD' } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      },
      '6-Month Plan',
    );

    await createPlan(
      {
        product_id: productId,
        name: 'Annual Plan',
        billing_cycles: [
          {
            frequency: { interval_unit: 'YEAR', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: '9', currency_code: 'USD' } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      },
      'Annual Plan',
    );

    return { productId, plans };
  }

  async createPromoProductAndPlans() {
    const token = await this.getAccessToken();

    const productRes = await axios.post(
      `${this.BASE}/v1/catalogs/products`,
      {
        name: 'DGT Portfolio Promo Subscription',
        description: 'Special promo subscription with discounted rates',
        type: 'SERVICE',
        category: 'SOFTWARE',
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const productId = productRes.data.id;
    const plans: any[] = [];

    const createPlan = async (body: any, name: string) => {
      const planRes = await axios.post(`${this.BASE}/v1/billing/plans`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      plans.push({ name, planId: planRes.data.id });
    };

    await createPlan(
      {
        product_id: productId,
        name: 'Promo Monthly Plan',
        billing_cycles: [
          {
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: '1', currency_code: 'USD' } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      },
      'Promo Monthly Plan',
    );

    await createPlan(
      {
        product_id: productId,
        name: 'Promo 6-Month Plan',
        billing_cycles: [
          {
            frequency: { interval_unit: 'MONTH', interval_count: 6 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: '3', currency_code: 'USD' } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      },
      'Promo 6-Month Plan',
    );

    await createPlan(
      {
        product_id: productId,
        name: 'Promo Annual Plan',
        billing_cycles: [
          {
            frequency: { interval_unit: 'YEAR', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: '5', currency_code: 'USD' } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      },
      'Promo Annual Plan',
    );

    return { productId, plans };
  }

  async getPlans() {
    const token = await this.getAccessToken();
    const response = await axios.get(`${this.BASE}/v1/billing/plans`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        status: 'ACTIVE',
        product_id: 'PROD-7UP07399WB609431P',
        page_size: 20,
      },
    });
    return { status: 'success', plans: response.data.plans || [] };
  }
}
