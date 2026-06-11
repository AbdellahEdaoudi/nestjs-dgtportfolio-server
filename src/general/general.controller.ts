import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GeneralService } from './general.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request, Response } from 'express';

@Controller()
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get('/')
  getHello(@Res() res: Response) {
    return res.status(200).json({ message: 'API is running on NestJS!' });
  }

  @Get('alldata')
  @UseGuards(JwtAuthGuard)
  async getAllData(@Req() req: Request, @Res() res: Response) {
    try {
      const email = (req as any).user?.email;
      const data = await this.generalService.getAllData(email);
      if (!data) {
        return res
          .status(401)
          .json({ success: false, message: 'User not found' });
      }
      return res.status(200).json({ success: true, ...data });
    } catch (error) {
      console.error('Error in getAllData:', error);
      return res
        .status(500)
        .json({ success: false, error: (error as Error).message });
    }
  }
}
