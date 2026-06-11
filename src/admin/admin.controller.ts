import { Controller, Get, Post, Delete, Param, Body, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

function handleError(res: Response, err: any) {
  const status = err?.status || 500;
  const message = err?.message || 'Server error';
  return res.status(status).json({ message, error: err?.error || err.message });
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('appdata')
  @UseGuards(JwtAuthGuard)
  async getDataApp(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.getDataApp((req as any).user?.email);
      return res.status(200).json(data);
    } catch (err) { return res.status(500).json({ success: false, error: (err as Error).message }); }
  }

  @Delete('/users/:id')
  @UseGuards(JwtAuthGuard)
  async deleteUserById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.deleteUserById(id, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/contacte/:id')
  @UseGuards(JwtAuthGuard)
  async deleteContactById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.deleteContactById(id, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/links/:id')
  @UseGuards(JwtAuthGuard)
  async deleteLinkById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.deleteLinkById(id, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/promo/:id')
  @UseGuards(JwtAuthGuard)
  async deletePromoById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.deletePromoById(id, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Post('/send-trial-expired')
  @UseGuards(JwtAuthGuard)
  async sendTrialExpiredEmails(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.sendTrialExpiredEmails(body.users, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Post('/send-emails')
  @UseGuards(JwtAuthGuard)
  async sendBulkEmails(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.sendBulkEmails(body, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Get('/cloudinary-images')
  @UseGuards(JwtAuthGuard)
  async getCloudinaryImages(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.getCloudinaryImages(query, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/cloudinary-images')
  @UseGuards(JwtAuthGuard)
  async deleteCloudinaryImage(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.adminService.deleteCloudinaryImage(body.public_id, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }
}
