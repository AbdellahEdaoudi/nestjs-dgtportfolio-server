import { Controller, Get, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaypalService } from './paypal.service';

@Controller('api/paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('/create-plans')
  async createProductAndPlans(@Res() res: Response) {
    try {
      const data = await this.paypalService.createProductAndPlans();
      return res.json(data);
    } catch (err: any) {
      console.error('PayPal Error:', err.response?.data || err.message);
      return res.status(500).json({ message: 'Failed to create PayPal plans' });
    }
  }

  @Post('/create-promo-plans')
  async createPromoProductAndPlans(@Res() res: Response) {
    try {
      const data = await this.paypalService.createPromoProductAndPlans();
      return res.json(data);
    } catch (err: any) {
      console.error('PayPal Promo Error:', err.response?.data || err.message);
      return res.status(500).json({ message: 'Failed to create PayPal promo plans' });
    }
  }

  @Get('/plans')
  async getPlans(@Res() res: Response) {
    try {
      const data = await this.paypalService.getPlans();
      return res.json(data);
    } catch (err: any) {
      console.error('Fetch Plans Error:', err.response?.data || err.message);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch plans' });
    }
  }
}
