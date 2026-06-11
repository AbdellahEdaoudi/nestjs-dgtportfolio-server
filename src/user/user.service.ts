import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import * as fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { User, UserDocument } from '../schemas/user.schema';
import { Links, LinksDocument } from '../schemas/links.schema';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';
import { EmailService } from '../common/services/email.service';

const WHITELIST = [
  'adam.carter.dev@gmail.com',
  'abdellahedaoudi80@gmail.com',
  'soondiss8@gmail.com',
  'dgt.portfolio.ma@gmail.com',
  'edaoudicontact@gmail.com',
];

const capitalizeWords = (str: string) =>
  str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ');

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Links.name) private linksModel: Model<LinksDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    private readonly emailService: EmailService,
  ) {}

  private async processImageUpload(file: Express.Multer.File, email: string): Promise<string> {
    if (file.size > 200 * 1024) {
      try { fs.unlinkSync(file.path); } catch {}
      const err: any = new Error('Image size must not exceed 200KB');
      err.status = 400;
      throw err;
    }
    const up = await cloudinary.uploader.upload(file.path, { folder: 'User_Images' });
    const currentUser = await this.userModel.findOne({ email });
    if (currentUser?.urlimage) {
      try {
        const urlParts = currentUser.urlimage.split('/');
        const versionIndex = urlParts.findIndex(p => p.startsWith('v') && !isNaN(Number(p.substring(1))));
        if (versionIndex !== -1) {
          const publicIdWithExt = urlParts.slice(versionIndex + 1).join('/');
          const publicId = publicIdWithExt.split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } else {
          const publicId = currentUser.urlimage.split('/').pop()!.split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }
    return up.secure_url;
  }

  async getUsers() {
    return this.userModel.find().select('-__v');
  }

  async createUser(userData: any, reqUserEmail: string) {
    if (userData.email !== reqUserEmail) throw { status: 403, message: 'Forbidden' };

    for (const key in userData) {
      if (typeof userData[key] === 'string') userData[key] = sanitizeHtml(userData[key]);
    }
    if (userData.fullname) {
      const words = userData.fullname.trim().split(/\s+/);
      userData.fullname = words.length > 2 ? words.slice(0, 2).join(' ') : words.join(' ');
      if (userData.fullname.length > 20) userData.fullname = userData.fullname.substring(0, 20);
      userData.fullname = capitalizeWords(userData.fullname);
    }
    if (userData.username) {
      if (userData.username.length > 20) userData.username = userData.username.substring(0, 20);
      userData.username = userData.username.replace(/[.\s/]/g, '').toLowerCase();
    }

    const existingUser = await this.userModel.findOne({ email: userData.email });
    if (existingUser) return { status: 200, data: { message: 'User already exists', user: existingUser } };

    const newUser = await this.userModel.create(userData);
    try {
      const emailContent = this.emailService.welcomeTemplate(newUser.username || newUser.fullname);
      await this.emailService.sendEmail(newUser.email, 'Welcome to DGT Portfolio!', emailContent);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }
    return { status: 201, data: newUser };
  }

  async updateUserByEmail(email: string, reqEmail: string, body: any, file?: Express.Multer.File) {
    if (email !== reqEmail) throw { status: 403, message: 'Forbidden' };

    const userData: any = { ...body };
    delete userData.email;

    for (const key in userData) {
      if (typeof userData[key] === 'string') userData[key] = sanitizeHtml(userData[key]);
    }

    if (userData.fullname) {
      const words = userData.fullname.trim().split(/\s+/);
      userData.fullname = words.length > 2 ? words.slice(0, 2).join(' ') : words.join(' ');
      if (userData.fullname.length > 20) userData.fullname = userData.fullname.substring(0, 20);
      userData.fullname = userData.fullname.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    if (userData.username) {
      userData.username = userData.username.replace(/\s/g, '').toLowerCase().substring(0, 20);
      const existingUser = await this.userModel.findOne({ username: userData.username });
      if (existingUser && existingUser.email !== email) throw { status: 400, message: 'Username already exists' };
    }

    const parseIfJson = (value: any) => {
      try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return value; }
    };

    userData.languages = parseIfJson(userData.languages);
    userData.services = parseIfJson(userData.services);
    userData.skills = parseIfJson(userData.skills);
    userData.education = parseIfJson(userData.education);
    userData.experience = parseIfJson(userData.experience);
    userData.projects = parseIfJson(userData.projects);

    if (file) {
      const result = await cloudinary.uploader.upload(file.path);
      userData.urlimage = result.secure_url;
    }

    const updatedUser = await this.userModel.findOneAndUpdate({ email }, userData, { new: true, runValidators: true });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserInfo(email: string, body: any) {
    const allowedFields = ['fullname', 'username', 'phoneNumber', 'country', 'category', 'displayEmail'];
    const userData: any = {};
    allowedFields.forEach((f) => {
      if (body[f]) {
        let val = sanitizeHtml(body[f].trim());
        userData[f] = val.substring(0, 100);
      }
    });
    if (userData.fullname) userData.fullname = userData.fullname.substring(0, 50);
    if (userData.username) {
      userData.username = userData.username.replace(/[.\s]/g, '').toLowerCase().substring(0, 30);
      const existingUser = await this.userModel.findOne({ username: userData.username });
      if (existingUser && existingUser.email !== email) throw { status: 400, message: 'Username already exists' };
    }
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: userData }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserImage(email: string, file?: Express.Multer.File) {
    let urlimage: string;
    const DEFAULT_IMAGE = 'https://res.cloudinary.com/dssrnghtr/image/upload/v1761258566/dgmlr4uuim5swutkp6a8.png';

    if (!file) {
      urlimage = DEFAULT_IMAGE;
      const currentUser = await this.userModel.findOne({ email });
      if (currentUser?.urlimage && currentUser.urlimage !== urlimage) {
        try {
          const urlParts = currentUser.urlimage.split('/');
          const versionIndex = urlParts.findIndex(p => p.startsWith('v') && !isNaN(Number(p.substring(1))));
          if (versionIndex !== -1) {
            const publicIdWithExt = urlParts.slice(versionIndex + 1).join('/');
            const publicId = publicIdWithExt.split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } else {
            const publicId = currentUser.urlimage.split('/').pop()!.split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) { console.error('Error deleting old image:', err); }
      }
    } else {
      urlimage = await this.processImageUpload(file, email);
    }

    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { urlimage } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserAbout(email: string, about: any) {
    if (typeof about !== 'string') throw { status: 400, message: "Invalid 'about' field" };
    about = sanitizeHtml(about.trim()).substring(0, 500);
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { about } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserBgColor(email: string, bgcolorp: any) {
    if (typeof bgcolorp !== 'string') throw { status: 400, message: "Invalid 'bgcolorp' field" };
    bgcolorp = sanitizeHtml(bgcolorp.trim()).substring(0, 50);
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { bgcolorp } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserLanguages(email: string, languages: any) {
    if (typeof languages === 'string') {
      try { languages = JSON.parse(languages); } catch { throw { status: 400, message: "Invalid 'languages' format" }; }
    }
    if (!Array.isArray(languages)) throw { status: 400, message: "'languages' must be an array" };
    if (languages.length > 10) throw { status: 400, message: 'Maximum 10 languages allowed' };
    languages = languages.map((l: any) => typeof l === 'string' ? l.trim().substring(0, 50) : '').filter((l: string) => l);
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { languages } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserServices(email: string, services: any) {
    if (typeof services === 'string') {
      try { services = JSON.parse(services); } catch { throw { status: 400, message: "Invalid 'services' format" }; }
    }
    if (!Array.isArray(services)) throw { status: 400, message: "'services' must be an array" };
    if (services.length > 10) throw { status: 400, message: 'Maximum 10 services allowed' };
    services = services.map((s: any) => typeof s === 'string' ? s.trim().substring(0, 150) : '').filter((s: string) => s);
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { services } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserSkills(email: string, skills: any) {
    if (typeof skills === 'string') {
      try { skills = JSON.parse(skills); } catch { throw { status: 400, message: "Invalid 'skills' format" }; }
    }
    if (!Array.isArray(skills)) throw { status: 400, message: "'skills' must be an array" };
    if (skills.length > 10) throw { status: 400, message: 'Maximum 10 skills allowed' };
    skills = skills.map((s: any) => typeof s === 'string' ? s.trim().substring(0, 130) : '').filter((s: string) => s);
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { skills } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserSocials(email: string, socials: any) {
    if (!socials || typeof socials !== 'object') throw { status: 400, message: "'socials' must be an object" };
    const sanitizedSocials: any = {};
    for (const key in socials) {
      if (typeof socials[key] === 'string') sanitizedSocials[key] = sanitizeHtml(socials[key].trim()).substring(0, 500);
    }
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { socials: sanitizedSocials } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserTheme(email: string, theme: any) {
    if (theme === undefined || typeof theme !== 'number') throw { status: 400, message: "'theme' must be a number" };
    const themeStr = String(theme).trim().substring(0, 20);
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { theme: themeStr } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserDisplayLanguage(email: string, displayLanguage: any) {
    if (!displayLanguage || typeof displayLanguage !== 'string') throw { status: 400, message: "'displayLanguage' must be a string" };
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { displayLanguage } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async upUserSectionOrder(email: string, sectionOrder: any) {
    if (!sectionOrder || !Array.isArray(sectionOrder)) throw { status: 400, message: "'sectionOrder' must be an array" };
    sectionOrder = sectionOrder.filter((item: any) => typeof item === 'string');
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $set: { sectionOrder } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found' };
    return updatedUser;
  }

  async getUserByEmail(email: string, reqEmail: string) {
    if (email !== reqEmail) throw { status: 403, message: 'Forbidden' };
    const user = await this.userModel.findOne({ email }).select('-updatedAt -createdAt -__v').lean();
    if (!user) throw { status: 404, message: 'User not found' };
    return user;
  }

  async getUserByUsername(username: string) {
    const user = await this.userModel.findOne({ username }).select('-__v');
    if (!user) throw { status: 404, message: 'User not found' };

    const createdAt = new Date((user as any).createdAt);
    const sevenDaysLater = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isWithin7Days = sevenDaysLater > new Date();

    if (WHITELIST.includes(user.email) || isWithin7Days) {
      const links = await this.linksModel.find({ useremail: user.email }).select('namelink link');
      return { status: 200, data: { user, links, note: 'User is whitelisted or within trial period, subscription check skipped.' } };
    }

    const subscription = await this.subscriptionModel.findOne({ userEmail: user.email });
    if (!subscription) throw { status: 404, message: 'No subscription found for this user', extra: { email: user.email } };
    if (subscription.status !== 'ACTIVE') throw { status: 403, message: 'Your subscription is not active. Please renew or subscribe.' };

    const links = await this.linksModel.find({ useremail: user.email }).select('namelink link');
    return { status: 200, data: { user, links } };
  }

  async getUserByCustomDomain(customDomain: string) {
    const user = await this.userModel.findOne({ customDomainVerified: true, customDomain }).select('-__v');
    if (!user) throw { status: 404, message: 'User not found' };

    const createdAt = new Date((user as any).createdAt);
    const isWithin7Days = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) > new Date();

    if (WHITELIST.includes(user.email) || isWithin7Days) {
      const links = await this.linksModel.find({ useremail: user.email }).select('namelink link');
      return { status: 200, data: { user, links, note: 'User is whitelisted or within trial period, subscription check skipped.' } };
    }

    const subscription = await this.subscriptionModel.findOne({ userEmail: user.email });
    if (!subscription) throw { status: 404, message: 'No subscription found for this user', extra: { email: user.email } };
    if (subscription.status !== 'ACTIVE') throw { status: 403, message: 'Your subscription is not active. Please renew or subscribe.' };

    const links = await this.linksModel.find({ useremail: user.email }).select('namelink link');
    return { status: 200, data: { user, links } };
  }

  async getUserByUsernameMeta(username: string) {
    const user = await this.userModel.findOne({ username }).select('fullname username email phoneNumber urlimage about category socials skills displayLanguage');
    if (!user) throw { status: 404, message: 'User not found' };
    return { status: true, user };
  }

  async getUserByCustomDomainMeta(customDomain: string) {
    const user = await this.userModel.findOne({ customDomainVerified: true, customDomain }).select('fullname username email phoneNumber urlimage about category socials skills displayLanguage');
    if (!user) throw { status: 404, message: 'User not found' };
    return { status: true, user };
  }

  async getActiveUsernames() {
    const allUsers = await this.userModel.find({ username: { $exists: true, $ne: '' } }).select('username customDomain customDomainVerified').lean();
    const usernames = allUsers.map((u) => u.username);
    const customDomains = allUsers.filter((u) => u.customDomain && u.customDomainVerified).map((u) => ({ username: u.username, customDomain: u.customDomain }));
    return { usernames, customDomains };
  }

  // ─── Sub-entity: Projects ───────────────────────────────────────────────────
  async saveUserProjectItem(email: string, item: any) {
    const techs = Array.isArray(item.technologies)
      ? item.technologies.map((t: any) => (typeof t === 'string' ? t.trim().substring(0, 20) : '')).filter(Boolean)
      : [];
    const projectObj: any = {
      title: item.title ? item.title.trim().substring(0, 100) : '',
      description: item.description ? item.description.trim().substring(0, 2000) : '',
      link: item.link ? item.link.trim().substring(0, 1000) : '',
      image: item.image ? item.image.trim().substring(0, 1000) : '',
      technologies: techs,
      startDate: item.startDate ? item.startDate.trim().substring(0, 20) : '',
      endDate: item.endDate ? item.endDate.trim().substring(0, 20) : '',
    };

    if (item._id) {
      projectObj._id = item._id;
      const updatedUser = await this.userModel.findOneAndUpdate({ email, 'projects._id': item._id }, { $set: { 'projects.$': projectObj } }, { returnDocument: 'after' });
      if (!updatedUser) throw { status: 404, message: 'User or Project not found' };
      return updatedUser;
    } else {
      const user = await this.userModel.findOne({ email });
      if (!user) throw { status: 404, message: 'User not found' };
      if (user.projects && user.projects.length >= 10) throw { status: 400, message: 'Maximum limit of 10 projects reached' };
      user.projects.push(projectObj);
      await user.save();
      return user;
    }
  }

  async deleteUserProject(email: string, projectId: string) {
    if (!Types.ObjectId.isValid(projectId)) throw { status: 400, message: 'Invalid project ID' };
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $pull: { projects: { _id: new Types.ObjectId(projectId) } } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found or project not found' };
    return updatedUser;
  }

  async reorderUserProjects(email: string, projects: any[]) {
    if (!Array.isArray(projects)) throw { status: 400, message: 'Projects must be an array' };
    const user = await this.userModel.findOne({ email });
    if (!user) throw { status: 404, message: 'User not found' };
    const orderMap = new Map<string, number>();
    projects.forEach((p, i) => { if (p._id) orderMap.set(p._id.toString(), i); });
    user.projects.sort((a: any, b: any) => {
      const ia = orderMap.has(a._id.toString()) ? orderMap.get(a._id.toString())! : 9999;
      const ib = orderMap.has(b._id.toString()) ? orderMap.get(b._id.toString())! : 9999;
      return ia - ib;
    });
    await user.save();
    return user;
  }

  // ─── Sub-entity: Experience ─────────────────────────────────────────────────
  async saveUserExperienceItem(email: string, item: any) {
    const expObj: any = {
      company: item.company ? item.company.trim().substring(0, 100) : '',
      role: item.role ? item.role.trim().substring(0, 100) : '',
      description: item.description ? item.description.trim().substring(0, 2000) : '',
      startDate: item.startDate ? item.startDate.trim().substring(0, 20) : '',
      endDate: item.endDate ? item.endDate.trim().substring(0, 20) : '',
    };
    if (item._id) {
      expObj._id = item._id;
      const updatedUser = await this.userModel.findOneAndUpdate({ email, 'experience._id': item._id }, { $set: { 'experience.$': expObj } }, { returnDocument: 'after' });
      if (!updatedUser) throw { status: 404, message: 'User or Experience not found' };
      return updatedUser;
    } else {
      const user = await this.userModel.findOne({ email });
      if (!user) throw { status: 404, message: 'User not found' };
      if (user.experience && user.experience.length >= 10) throw { status: 400, message: 'Maximum limit of 10 experience items reached' };
      user.experience.push(expObj);
      await user.save();
      return user;
    }
  }

  async deleteUserExperience(email: string, experienceId: string) {
    if (!Types.ObjectId.isValid(experienceId)) throw { status: 400, message: 'Invalid experience ID' };
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $pull: { experience: { _id: new Types.ObjectId(experienceId) } } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found or experience not found' };
    return updatedUser;
  }

  async reorderUserExperience(email: string, experience: any[]) {
    if (!Array.isArray(experience)) throw { status: 400, message: 'Experience must be an array' };
    const user = await this.userModel.findOne({ email });
    if (!user) throw { status: 404, message: 'User not found' };
    const orderMap = new Map<string, number>();
    experience.forEach((e, i) => { if (e._id) orderMap.set(e._id.toString(), i); });
    user.experience.sort((a: any, b: any) => {
      const ia = orderMap.has(a._id.toString()) ? orderMap.get(a._id.toString())! : 9999;
      const ib = orderMap.has(b._id.toString()) ? orderMap.get(b._id.toString())! : 9999;
      return ia - ib;
    });
    await user.save();
    return user;
  }

  // ─── Sub-entity: Education ──────────────────────────────────────────────────
  async saveUserEducationItem(email: string, item: any) {
    const eduObj: any = {
      school: item.school ? item.school.trim().substring(0, 100) : '',
      degree: item.degree ? item.degree.trim().substring(0, 100) : '',
      field: item.field ? item.field.trim().substring(0, 100) : '',
      startYear: item.startYear ? item.startYear.trim().substring(0, 20) : '',
      endYear: item.endYear ? item.endYear.trim().substring(0, 20) : '',
    };
    if (item._id) {
      eduObj._id = item._id;
      const updatedUser = await this.userModel.findOneAndUpdate({ email, 'education._id': item._id }, { $set: { 'education.$': eduObj } }, { returnDocument: 'after' });
      if (!updatedUser) throw { status: 404, message: 'User or Education item not found' };
      return updatedUser;
    } else {
      const user = await this.userModel.findOne({ email });
      if (!user) throw { status: 404, message: 'User not found' };
      if (user.education && user.education.length >= 10) throw { status: 400, message: 'Maximum limit of 10 education items reached' };
      user.education.push(eduObj);
      await user.save();
      return user;
    }
  }

  async deleteUserEducation(email: string, educationId: string) {
    if (!Types.ObjectId.isValid(educationId)) throw { status: 400, message: 'Invalid education ID' };
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $pull: { education: { _id: new Types.ObjectId(educationId) } } }, { returnDocument: 'after' });
    if (!updatedUser) throw { status: 404, message: 'User not found or education item not found' };
    return updatedUser;
  }

  async reorderUserEducation(email: string, education: any[]) {
    if (!Array.isArray(education)) throw { status: 400, message: 'Education must be an array' };
    const user = await this.userModel.findOne({ email });
    if (!user) throw { status: 404, message: 'User not found' };
    const orderMap = new Map<string, number>();
    education.forEach((e, i) => { if (e._id) orderMap.set(e._id.toString(), i); });
    user.education.sort((a: any, b: any) => {
      const ia = orderMap.has(a._id.toString()) ? orderMap.get(a._id.toString())! : 9999;
      const ib = orderMap.has(b._id.toString()) ? orderMap.get(b._id.toString())! : 9999;
      return ia - ib;
    });
    await user.save();
    return user;
  }

  // ─── Sub-entity: Certificates ───────────────────────────────────────────────
  async uploadCertificateImage(file: Express.Multer.File) {
    if (file.size > 2 * 1024 * 1024) {
      try { fs.unlinkSync(file.path); } catch {}
      throw { status: 400, message: 'File size exceeds 2MB' };
    }
    const result = await cloudinary.uploader.upload(file.path, { folder: 'certificates' });
    try { fs.unlinkSync(file.path); } catch {}
    return result.secure_url;
  }

  async saveUserCertificateItem(email: string, item: any) {
    const certObj: any = {
      title: item.title ? item.title.trim().substring(0, 100) : '',
      description: item.description ? item.description.trim().substring(0, 200) : '',
      cfimage: item.cfimage ? item.cfimage.trim().substring(0, 1000) : '',
    };
    if (item._id) {
      certObj._id = item._id;
      const user = await this.userModel.findOne({ email });
      if (!user) throw { status: 404, message: 'User not found' };
      const oldCert = (user.certificates as any[]).find((c: any) => c._id?.toString() === item._id);
      if (oldCert?.cfimage && oldCert.cfimage !== certObj.cfimage) {
        try {
          const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
          const match = oldCert.cfimage.match(regex);
          if (match?.[1]) await cloudinary.uploader.destroy(match[1]);
        } catch (err) { console.error('Error deleting old image:', err); }
      }
      const updatedUser = await this.userModel.findOneAndUpdate({ email, 'certificates._id': item._id }, { $set: { 'certificates.$': certObj } }, { returnDocument: 'after' });
      if (!updatedUser) throw { status: 404, message: 'User or Certificate not found' };
      return updatedUser;
    } else {
      const user = await this.userModel.findOne({ email });
      if (!user) throw { status: 404, message: 'User not found' };
      if (user.certificates && user.certificates.length >= 10) throw { status: 400, message: 'Maximum limit of 10 certificates reached' };
      user.certificates.push(certObj);
      await user.save();
      return user;
    }
  }

  async deleteUserCertificate(email: string, certificateId: string) {
    if (!Types.ObjectId.isValid(certificateId)) throw { status: 400, message: 'Invalid certificate ID' };
    const user = await this.userModel.findOne({ email });
    if (!user) throw { status: 404, message: 'User not found' };
    const certificate = (user.certificates as any[]).find((c: any) => c._id?.toString() === certificateId);
    if (certificate?.cfimage) {
      try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
        const match = certificate.cfimage.match(regex);
        if (match?.[1]) await cloudinary.uploader.destroy(match[1]);
      } catch (err) { console.error('Error deleting image from Cloudinary:', err); }
    }
    const updatedUser = await this.userModel.findOneAndUpdate({ email }, { $pull: { certificates: { _id: new Types.ObjectId(certificateId) } } }, { returnDocument: 'after' });
    return updatedUser;
  }

  async reorderUserCertificates(email: string, certificates: any[]) {
    if (!Array.isArray(certificates)) throw { status: 400, message: 'Certificates must be an array' };
    const user = await this.userModel.findOne({ email });
    if (!user) throw { status: 404, message: 'User not found' };
    const orderMap = new Map<string, number>();
    certificates.forEach((c, i) => { if (c._id) orderMap.set(c._id.toString(), i); });
    user.certificates.sort((a: any, b: any) => {
      const ia = orderMap.has(a._id.toString()) ? orderMap.get(a._id.toString())! : 9999;
      const ib = orderMap.has(b._id.toString()) ? orderMap.get(b._id.toString())! : 9999;
      return ia - ib;
    });
    await user.save();
    return user;
  }
}
