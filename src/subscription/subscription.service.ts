import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';

@Injectable()
export class SubscriptionService {
  constructor(@InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>) {}

  private readonly CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  private readonly SECRET = process.env.PAYPAL_SECRET;
  private readonly BASE = process.env.BASE;

  async getAccessToken(): Promise<string> {
    const res = await fetch(`${this.BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: { 
        'Authorization': 'Basic ' + Buffer.from(this.CLIENT_ID + ':' + this.SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    return data.access_token;
  }

  async createSubscription(body: any) {
    const { userEmail, planId, subscriptionID, nameplan, promoCode } = body;
    if (!userEmail || !planId || !subscriptionID || !nameplan) throw { status: 400, message: "Missing required fields" };

    let subscription = await this.subscriptionModel.findOne({userEmail, planId});
    if (subscription) {
        subscription.subscriptionID = subscriptionID;
        subscription.nameplan = nameplan;
        subscription.planId = planId;
        subscription.status = "ACTIVE";
        subscription.paymentType = "subscription";
        subscription.expiresAt = null as any;
        await subscription.save();
        return { message: "Subscription reactivated" };
    }
    subscription = await this.subscriptionModel.create({
      userEmail, planId, nameplan, subscriptionID, promoCode, paymentType: "subscription", status: "ACTIVE"
    });
    return { message: "Subscription saved", subscription };
  }

  async getSubscriptions() {
    return this.subscriptionModel.find().select("-__v");
  }

  async getUserSubscription(email: string) {
    const subscription = await this.subscriptionModel.findOne({ userEmail: email, status: "ACTIVE" }).sort({ createdAt: -1 });
    if (!subscription) return { success: false, message: "No active subscription found" };
    return { success: true, data: subscription };
  }

  async deleteSubscriptionById(id: string) {
    const subscription = await this.subscriptionModel.findByIdAndDelete(id);
    if (!subscription) throw { status: 404, message: "Subscription not found" };
    return { message: "Subscription deleted successfully" };
  }

  async cancelSubscription(id: string) {
    const subscription = await this.subscriptionModel.findById(id);
    if (!subscription || !subscription.subscriptionID) throw { status: 404, message: "Subscription not found" };

    const token = await this.getAccessToken();
    const response = await fetch(`${this.BASE}/v1/billing/subscriptions/${subscription.subscriptionID}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: "Customer requested cancellation" })
    });

    if (response.ok || response.status === 204) {
      subscription.status = "CANCELLED";
      await subscription.save();
      return { message: "Subscription cancelled successfully" };
    } else {
      const errorData = await response.json();
      console.error("PayPal Error:", errorData);
      throw { status: 400, message: "Failed to cancel at PayPal" };
    }
  }

  async syncSubscription(id: string) {
    const subscription = await this.subscriptionModel.findById(id);
    if (!subscription || !subscription.subscriptionID) throw { status: 404, message: "Subscription not found" };

    const token = await this.getAccessToken();
    const response = await fetch(`${this.BASE}/v1/billing/subscriptions/${subscription.subscriptionID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const paypalData = await response.json();
      subscription.status = paypalData.status;
      if (paypalData.billing_info && paypalData.billing_info.next_billing_time) {
        subscription.expiresAt = new Date(paypalData.billing_info.next_billing_time);
      }
      await subscription.save();
      return { message: "Subscription synced successfully", data: subscription };
    } else {
      const errorData = await response.json();
      console.error("PayPal Sync Error:", errorData);
      throw { status: 400, message: "Failed to fetch status from PayPal" };
    }
  }
}
