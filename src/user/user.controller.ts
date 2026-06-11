import {
  Controller, Get, Post, Put, Delete,
  Req, Res, Param, Body, UseGuards, UseInterceptors, UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request, Response } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

const multerStorage = diskStorage({
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

function handleError(res: Response, err: any) {
  const status = err?.status || 500;
  const message = err?.message || 'Server error';
  return res.status(status).json({ error: message, ...(err?.extra || {}) });
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users
  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getUsers(@Res() res: Response) {
    try {
      const users = await this.userService.getUsers();
      return res.json(users);
    } catch (err) { return handleError(res, err); }
  }

  // GET /users/active-usernames
  @Get('/active-usernames')
  async getActiveUsernames(@Res() res: Response) {
    try {
      const data = await this.userService.getActiveUsernames();
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  // GET /users/email/:email
  @Get('/email/:email')
  @UseGuards(JwtAuthGuard)
  async getUserByEmail(@Param('email') email: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.userService.getUserByEmail(email, (req as any).user?.email);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // GET /users/username/:username
  @Get('/username/:username')
  async getUserByUsername(@Param('username') username: string, @Res() res: Response) {
    try {
      const result = await this.userService.getUserByUsername(username);
      return res.status(result.status).json({ status: result.status, ...result.data });
    } catch (err) { return handleError(res, err); }
  }

  // GET /users/customdomain/:customDomain
  @Get('/customdomain/:customDomain')
  async getUserByCustomDomain(@Param('customDomain') customDomain: string, @Res() res: Response) {
    try {
      const result = await this.userService.getUserByCustomDomain(customDomain);
      return res.status(result.status).json({ status: result.status, ...result.data });
    } catch (err) { return handleError(res, err); }
  }

  // GET /users/metauser/:username
  @Get('/metauser/:username')
  async getUserByUsernameMeta(@Param('username') username: string, @Res() res: Response) {
    try {
      const data = await this.userService.getUserByUsernameMeta(username);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  // GET /users/metacustomdomain/:customDomain
  @Get('/metacustomdomain/:customDomain')
  async getUserByCustomDomainMeta(@Param('customDomain') customDomain: string, @Res() res: Response) {
    try {
      const data = await this.userService.getUserByCustomDomainMeta(customDomain);
      return res.json(data);
    } catch (err) { return handleError(res, err); }
  }

  // POST /users
  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createUser(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const result = await this.userService.createUser(body, (req as any).user?.email);
      return res.status(result.status).json(result.data);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/:email
  @Put('/:email')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('urlimage', { storage: multerStorage }))
  async updateUserByEmail(
    @Param('email') email: string,
    @Req() req: Request,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const user = await this.userService.updateUserByEmail(email, (req as any).user?.email, body, file);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/user-info
  @Put('/update/user-info')
  @UseGuards(JwtAuthGuard)
  async upUserInfo(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserInfo((req as any).user?.email, body);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/user-image
  @Put('/update/user-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('urlimage', { storage: multerStorage }))
  async upUserImage(@Req() req: Request, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    try {
      const user = await this.userService.upUserImage((req as any).user?.email, file);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/about
  @Put('/update/about')
  @UseGuards(JwtAuthGuard)
  async upUserAbout(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserAbout((req as any).user?.email, body.about);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/bgcolor
  @Put('/update/bgcolor')
  @UseGuards(JwtAuthGuard)
  async upUserBgColor(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserBgColor((req as any).user?.email, body.bgcolorp);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/languages
  @Put('/update/languages')
  @UseGuards(JwtAuthGuard)
  async upUserLanguages(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserLanguages((req as any).user?.email, body.languages);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/services
  @Put('/update/services')
  @UseGuards(JwtAuthGuard)
  async upUserServices(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserServices((req as any).user?.email, body.services);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/skills
  @Put('/update/skills')
  @UseGuards(JwtAuthGuard)
  async upUserSkills(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserSkills((req as any).user?.email, body.skills);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/socials
  @Put('/update/socials')
  @UseGuards(JwtAuthGuard)
  async upUserSocials(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserSocials((req as any).user?.email, body.socials);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/theme
  @Put('/update/theme')
  @UseGuards(JwtAuthGuard)
  async upUserTheme(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserTheme((req as any).user?.email, body.theme);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/display-language
  @Put('/update/display-language')
  @UseGuards(JwtAuthGuard)
  async upUserDisplayLanguage(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserDisplayLanguage((req as any).user?.email, body.displayLanguage);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // PUT /users/update/section-order
  @Put('/update/section-order')
  @UseGuards(JwtAuthGuard)
  async upUserSectionOrder(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.upUserSectionOrder((req as any).user?.email, body.sectionOrder);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // ─── Projects ────────────────────────────────────────────────────────────────

  @Put('/update/project/item')
  @UseGuards(JwtAuthGuard)
  async saveProjectItem(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.saveUserProjectItem((req as any).user?.email, body);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/update/project/:projectId')
  @UseGuards(JwtAuthGuard)
  async deleteProject(@Req() req: Request, @Param('projectId') projectId: string, @Res() res: Response) {
    try {
      const user = await this.userService.deleteUserProject((req as any).user?.email, projectId);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  @Put('/update/projects/order')
  @UseGuards(JwtAuthGuard)
  async reorderProjects(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.reorderUserProjects((req as any).user?.email, body.projects);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // ─── Experience ──────────────────────────────────────────────────────────────

  @Put('/update/experience/item')
  @UseGuards(JwtAuthGuard)
  async saveExperienceItem(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.saveUserExperienceItem((req as any).user?.email, body);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/update/experience/:experienceId')
  @UseGuards(JwtAuthGuard)
  async deleteExperience(@Req() req: Request, @Param('experienceId') experienceId: string, @Res() res: Response) {
    try {
      const user = await this.userService.deleteUserExperience((req as any).user?.email, experienceId);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  @Put('/update/experience/order')
  @UseGuards(JwtAuthGuard)
  async reorderExperience(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.reorderUserExperience((req as any).user?.email, body.experience);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // ─── Education ───────────────────────────────────────────────────────────────

  @Put('/update/education/item')
  @UseGuards(JwtAuthGuard)
  async saveEducationItem(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.saveUserEducationItem((req as any).user?.email, body);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/update/education/:educationId')
  @UseGuards(JwtAuthGuard)
  async deleteEducation(@Req() req: Request, @Param('educationId') educationId: string, @Res() res: Response) {
    try {
      const user = await this.userService.deleteUserEducation((req as any).user?.email, educationId);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  @Put('/update/education/order')
  @UseGuards(JwtAuthGuard)
  async reorderEducation(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.reorderUserEducation((req as any).user?.email, body.education);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  // ─── Certificates ─────────────────────────────────────────────────────────

  @Post('/update/certificates/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('file', 1, { storage: multerStorage }))
  async uploadCertificateImage(@UploadedFiles() files: Express.Multer.File[], @Res() res: Response) {
    try {
      if (!files || files.length === 0) return res.status(400).json({ error: 'No file uploaded' });
      const url = await this.userService.uploadCertificateImage(files[0]);
      return res.json({ url });
    } catch (err) { return handleError(res, err); }
  }

  @Put('/update/certificates/item')
  @UseGuards(JwtAuthGuard)
  async saveCertificateItem(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.saveUserCertificateItem((req as any).user?.email, body);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  @Delete('/update/certificates/:certificateId')
  @UseGuards(JwtAuthGuard)
  async deleteCertificate(@Req() req: Request, @Param('certificateId') certificateId: string, @Res() res: Response) {
    try {
      const user = await this.userService.deleteUserCertificate((req as any).user?.email, certificateId);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }

  @Put('/update/certificates/order')
  @UseGuards(JwtAuthGuard)
  async reorderCertificates(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.userService.reorderUserCertificates((req as any).user?.email, body.certificates);
      return res.json(user);
    } catch (err) { return handleError(res, err); }
  }
}
