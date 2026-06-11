import { Controller, Get, Post, Put, Delete, Param, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

function handleError(res: Response, err: any) {
  const status = err?.status || 500;
  const message = err?.message || 'Server error';
  return res.status(status).json({ message, error: err?.error || err });
}

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getContacts(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.contactsService.getContacts((req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Get('/user-contacts')
  @UseGuards(JwtAuthGuard)
  async getUserContacts(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.contactsService.getUserContacts((req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/user-contacts/:id')
  @UseGuards(JwtAuthGuard)
  async deleteUserContact(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.contactsService.deleteUserContact(id, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async getContactById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.contactsService.getContactById(id, (req as any).user?.email);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createContact(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.contactsService.createContact(body, (req as any).user?.email);
      return res.json(data);
    } catch (err: any) {
      if (err.status) return res.status(err.status).json({ success: false, message: err.message, error: err.error });
      return handleError(res, err);
    }
  }

  @Put('/:id')
  async updateContactById(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const data = await this.contactsService.updateContactById(id, body);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }
}
