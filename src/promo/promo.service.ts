import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Promocode, PromocodeDocument } from '../schemas/promocode.schema';

@Injectable()
export class PromoService {
  constructor(@InjectModel(Promocode.name) private promocodeModel: Model<PromocodeDocument>) {}

  private readonly CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  private readonly SECRET = process.env.PAYPAL_SECRET;
  private readonly BASE = process.env.BASE;
  private readonly PROMO_PRODUCT_ID = "PROD-96T7711539353642S";

  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.CLIENT_ID}:${this.SECRET}`).toString("base64");
    const response = await axios.post(
      `${this.BASE}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  }

  async createPromo(code: string) {
    if (!code || !code.trim()) throw { status: 400, message: "Promo code is required" };
    const existing = await this.promocodeModel.findOne({ code });
    if (existing) throw { status: 400, message: "Duplicate promo code. This code already exists.", extra: { promo: existing } };
    const promo = await this.promocodeModel.create({ code });
    return promo;
  }

  async validatePromo(code: string) {
    const promo = await this.promocodeModel.findOne({ code });
    if (!promo) throw { status: 400, message: "Invalid promo code", extra: { valid: false } };

    const token = await this.getAccessToken();
    const plansRes = await axios.get(`${this.BASE}/v1/billing/plans`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { product_id: this.PROMO_PRODUCT_ID },
    });

    const plans = plansRes.data.plans || [];
    return { valid: true, promo, plans };
  }
}
