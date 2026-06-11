import { Controller, Get, Post, Delete, Param, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SubscriptionService } from './subscription.service';

function handleError(res: Response, err: any) {
  const status = err?.status || 500;
  const message = err?.message || 'Server Error';
  return res.status(status).json({ success: false, message });
}

@Controller('api/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('/')
  async createSubscription(@Body() body: any, @Res() res: Response) {
    try {
      const data = await this.subscriptionService.createSubscription(body);
      return res.status(201).json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Get('/')
  async getSubscriptions(@Res() res: Response) {
    try {
      const data = await this.subscriptionService.getSubscriptions();
      return res.status(200).json({ success: true, data });
    } catch (err) { return handleError(res, err); }
  }

  @Get('/user/:email')
  async getUserSubscription(@Param('email') email: string, @Res() res: Response) {
    try {
      const data = await this.subscriptionService.getUserSubscription(email);
      return res.status(200).json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/:id')
  async deleteSubscriptionById(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.subscriptionService.deleteSubscriptionById(id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) { return handleError(res, err); }
  }

  @Post('/:id/cancel')
  async cancelSubscription(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.subscriptionService.cancelSubscription(id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) { return handleError(res, err); }
  }

  @Post('/:id/sync')
  async syncSubscription(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.subscriptionService.syncSubscription(id);
      return res.status(200).json({ success: true, ...data });
    } catch (err) { return handleError(res, err); }
  }
}
