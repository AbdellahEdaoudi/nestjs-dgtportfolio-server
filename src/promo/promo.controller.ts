import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PromoService } from './promo.service';

@Controller('api/promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Post('/create')
  async createPromo(@Body('code') code: string, @Res() res: Response) {
    try {
      const promo = await this.promoService.createPromo(code);
      return res.json({ success: true, promo });
    } catch (err: any) {
      console.error("Create promo error:", err);
      return res.status(err.status || 500).json({ error: err.message, name: err.name, stack: err.stack, code: err.code, ...(err.extra || {}) });
    }
  }

  @Post('/validate')
  async validatePromo(@Body('code') code: string, @Res() res: Response) {
    try {
      const data = await this.promoService.validatePromo(code);
      return res.json(data);
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      const status = err.response?.status || err.status || 500;
      const message = err.response?.data?.msg || err.response?.data?.message || err.message || "Failed to validate promo code";
      return res.status(status).json({ valid: false, msg: message });
    }
  }
}
