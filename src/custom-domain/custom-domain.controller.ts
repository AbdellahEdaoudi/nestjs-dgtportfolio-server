import { Controller, Post, Get, Delete, Param, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CustomDomainService } from './custom-domain.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/custom-domain')
export class CustomDomainController {
  constructor(private readonly customDomainService: CustomDomainService) {}

  @Post('/set')
  @UseGuards(JwtAuthGuard)
  async updateDomain(@Req() req: Request, @Body('customDomain') customDomain: string, @Res() res: Response) {
    try {
      const data = await this.customDomainService.updateDomain((req as any).user?.email, customDomain);
      return res.json({ status: true, ...data });
    } catch (err: any) {
      return res.status(err.status || 500).json({ status: false, message: err.message });
    }
  }

  @Post('/verify')
  @UseGuards(JwtAuthGuard)
  async verifyDomain(@Req() req: Request, @Body('domain') domain: string, @Res() res: Response) {
    try {
      const data = await this.customDomainService.verifyDomain((req as any).user?.email, domain);
      return res.json({ status: data.verified, ...data });
    } catch (err: any) {
      return res.status(err.status || 500).json({ status: false, message: err.message });
    }
  }

  @Get('/settings/:email')
  async getSettings(@Param('email') email: string, @Res() res: Response) {
    try {
      const data = await this.customDomainService.getSettings(email);
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ status: false, message: err.message, data: null });
    }
  }

  @Delete('/remove')
  @UseGuards(JwtAuthGuard)
  async removeDomain(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.customDomainService.removeDomain((req as any).user?.email);
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ status: false, message: err.message });
    }
  }
}
