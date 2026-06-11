import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';

@Controller('api/webhook')
export class WebhookController {
  constructor(@InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>) {}

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
    const response = await axios.post(
      `${process.env.BASE}/v1/oauth2/token`,
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

  @Post('/')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const event = req.body;
      let subId = event.resource.id;
      if (event.resource.billing_agreement_id) {
        subId = event.resource.billing_agreement_id;
      }

      const subscription = await this.subscriptionModel.findOne({ subscriptionID: subId });
      if (!subscription) {
        console.log(`Webhook ignored: Subscription not found for ID ${subId}`);
        return res.sendStatus(200);
      }

      const planId = event.resource.plan_id;

      try {
        const token = await this.getAccessToken();
        const subRes = await axios.get(`${process.env.BASE}/v1/billing/subscriptions/${subId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (subRes.data.billing_info?.next_billing_time) {
          subscription.expiresAt = new Date(subRes.data.billing_info.next_billing_time);
        }
        if (subRes.data.status) {
          subscription.status = subRes.data.status;
        }
      } catch (apiErr: any) {
        console.error("Error fetching subscription from PayPal:", apiErr.message);
        subscription.status = event.resource.status || subscription.status;
        if (event.resource.billing_info?.next_billing_time) {
          subscription.expiresAt = new Date(event.resource.billing_info.next_billing_time);
        }
      }

      if (planId) {
        subscription.planId = planId;
      }

      await subscription.save();
      return res.sendStatus(200);
    } catch (err) {
      console.error("Webhook Error:", err);
      return res.sendStatus(500);
    }
  }
}
