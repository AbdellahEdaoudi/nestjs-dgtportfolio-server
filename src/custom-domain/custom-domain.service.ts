import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class CustomDomainService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private readonly VERIFY_URL = `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`;

  async updateDomain(email: string, customDomain: string) {
    if (!customDomain) throw { status: 400, message: "Custom domain is required" };

    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(customDomain)) throw { status: 400, message: "Invalid domain format" };

    const existingUser = await this.userModel.findOne({ customDomain });
    if (existingUser && existingUser.email !== email) throw { status: 400, message: "Domain already in use by another user" };

    const user = await this.userModel.findOne({ email });
    if (!user) throw { status: 404, message: "User not found" };

    try {
      if (user.customDomain && user.customDomain !== customDomain) {
        await fetch(`${this.VERIFY_URL}/${user.customDomain}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}` }
        });
      }

      const response = await fetch(this.VERIFY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: customDomain })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw { status: 400, message: `Vercel API error: ${errorData.error?.message || "Unknown error"}` };
      }

      const updatedUser = await this.userModel.findOneAndUpdate(
        { email },
        { $set: { customDomain, customDomainVerified: false } },
        { returnDocument: 'after' }
      );

      return { message: "Domain added to Vercel, please verify DNS settings", user: updatedUser };
    } catch (error: any) {
      console.error("Vercel error:", error);
      throw { status: error.status || 500, message: error.message || "Failed to link domain" };
    }
  }

  async verifyDomain(email: string, domain: string) {
    if (!domain) throw { status: 400, message: "Domain parameter is required" };

    try {
      const response = await fetch(`${this.VERIFY_URL}/${domain}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}` }
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        const updatedUser = await this.userModel.findOneAndUpdate(
          { email, customDomain: domain },
          { $set: { customDomainVerified: true } },
          { returnDocument: 'after' }
        );
        return { message: "Domain verified successfully", user: updatedUser, verified: true };
      } else {
        const statusRes = await fetch(`${this.VERIFY_URL}/${domain}`, {
          headers: { 'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}` }
        });
        const statusData = await statusRes.json();
        const errorMessage = data.error?.message || "Domain verification failed. Please check your DNS settings.";
        return { message: errorMessage, verified: false, details: statusData };
      }
    } catch (error: any) {
      console.error("Vercel verify error:", error);
      throw { status: 500, message: "Failed to verify domain with Vercel" };
    }
  }

  async getSettings(email: string) {
    const user = await this.userModel.findOne({ email }).select('username customDomain customDomainVerified');
    if (!user) {
      return { status: false, message: "User not found", data: null };
    }
    return { status: true, data: user };
  }

  async removeDomain(email: string) {
    const user = await this.userModel.findOne({ email });
    if (user?.customDomain) {
      try {
        await fetch(`${this.VERIFY_URL}/${user.customDomain}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}` }
        });
      } catch (e) {
        console.error(e);
      }
    }
    await this.userModel.findOneAndUpdate({ email }, { $unset: { customDomain: 1 }, $set: { customDomainVerified: false } });
    return { status: true, message: "Removed" };
  }
}
