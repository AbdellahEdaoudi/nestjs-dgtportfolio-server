import { Controller, Get, Post, Put, Delete, Param, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LinksService } from './links.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

function handleError(res: Response, err: any) {
  const status = err?.status || 500;
  const message = err?.message || 'Server error';
  return res.status(status).json({ success: false, message });
}

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get('/email/:email')
  @UseGuards(JwtAuthGuard)
  async getLinkByEmail(@Param('email') email: string, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.linksService.getLinkByEmail(email, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createLink(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.linksService.createLink(body, (req as any).user?.email);
      return res.status(201).json({ message: 'Link created successfully', data });
    } catch (err) { return handleError(res, err); }
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  async updateLink(@Param('id') id: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.linksService.updateLink(id, body, (req as any).user?.email);
      return res.json({ message: 'Link updated successfully', data });
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deleteLink(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      await this.linksService.deleteLink(id, (req as any).user?.email);
      return res.json({ message: 'Link deleted successfully' });
    } catch (err) { return handleError(res, err); }
  }
}
