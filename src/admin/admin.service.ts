import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Links, LinksDocument } from '../schemas/links.schema';
import { Contacte, ContacteDocument } from '../schemas/contacte.schema';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';
import { Promocode, PromocodeDocument } from '../schemas/promocode.schema';
import { EmailService } from '../common/services/email.service';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Links.name) private linksModel: Model<LinksDocument>,
    @InjectModel(Contacte.name) private contacteModel: Model<ContacteDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Promocode.name) private promocodeModel: Model<PromocodeDocument>,
    private readonly emailService: EmailService,
  ) {}

  async getDataApp(reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) return { success: false, message: 'data count 0' };
    const [users, links, contacts, subscription, promoCodes] = await Promise.all([
      this.userModel.find().collation({ locale: 'en', strength: 1 }).sort({ fullname: 1 }).select('about fullname email username country category createdAt urlimage theme').lean(),
      this.linksModel.find().select('-__v').lean(),
      this.contacteModel.find().select('-__v').lean(),
      this.subscriptionModel.find().select('-__v').lean(),
      this.promocodeModel.find().select('-__v').lean(),
    ]);
    return { success: true, users, links, contacts, subscription, promoCodes };
  }

  async deleteUserById(id: string, reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) throw { status: 404, message: 'User not found' };
    await this.linksModel.deleteMany({ useremail: deletedUser.email });
    await this.contacteModel.deleteMany({ email: deletedUser.email });
    return { message: 'User and all associated data deleted successfully' };
  }

  async deleteContactById(id: string, reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    const contact = await this.contacteModel.findById(id);
    if (!contact) throw { status: 404, message: 'Contact not found' };
    if (contact.attachment) {
      const publicId = contact.attachment.split('/').pop()!.split('.')[0];
      if (publicId) await cloudinary.uploader.destroy(`support_attachments/${publicId}`);
    }
    const deletedContact = await this.contacteModel.findByIdAndDelete(id);
    return { message: 'Contact deleted successfully', deletedContact };
  }

  async deleteLinkById(id: string, reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    const deletedLink = await this.linksModel.findByIdAndDelete(id);
    if (!deletedLink) throw { status: 404, message: 'Link not found' };
    return { message: 'Link deleted successfully' };
  }

  async deletePromoById(id: string, reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    const deletedPromo = await this.promocodeModel.findByIdAndDelete(id);
    if (!deletedPromo) throw { status: 404, message: 'Promo code not found' };
    return { message: 'Promo code deleted successfully' };
  }

  async sendTrialExpiredEmails(users: any[], reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    if (!users || !Array.isArray(users)) throw { status: 400, message: 'Invalid users list' };

    let count = 0;
    for (const u of users) {
      if (!u.email) continue;
      const emailContent = this.emailService.trialExpiredTemplate(u.fullname || u.username);
      await this.emailService.sendEmail(u.email, 'Your Free Trial Has Ended - Special Gift Inside!', emailContent);
      await new Promise(resolve => setTimeout(resolve, 1000));
      count++;
    }
    return { message: `Emails sent to ${count} users successfully` };
  }

  async sendBulkEmails(body: any, reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    const { email, emails, subject, content } = body;
    let recipients: string[] = [];

    if (emails && Array.isArray(emails)) recipients = emails;
    else if (email && typeof email === 'string') recipients = [email];
    else throw { status: 400, message: 'Invalid recipients' };

    if (!content) throw { status: 400, message: 'Content is required' };

    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        await this.emailService.sendEmail(recipient, subject || 'DGT Portfolio', content);
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${recipient}:`, err);
        failedCount++;
      }
    }
    return { success: true, message: `Processed ${recipients.length} emails. Sent: ${successCount}, Failed: ${failedCount}`, sentCount: successCount, failedCount: failedCount };
  }

  async getCloudinaryImages(query: any, reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    const { next_cursor, folder } = query;

    let folders: any[] = [];
    let resources: any[] = [];
    let next_cursor_res: any = null;

    if (!next_cursor || next_cursor === 'undefined' || next_cursor === 'null') {
      try {
        if (folder) {
          const foldersRes = await cloudinary.api.sub_folders(folder);
          folders = foldersRes.folders;
        } else {
          const rootFolders = await cloudinary.api.root_folders();
          folders = rootFolders.folders;
        }
      } catch (err: any) { console.error('Folder fetch error:', err.message); }
    }

    const options: any = { type: 'upload', max_results: 50, prefix: folder ? folder + '/' : undefined };
    if (next_cursor && next_cursor !== 'null' && next_cursor !== 'undefined') options.next_cursor = next_cursor;

    const result = await cloudinary.api.resources(options);
    resources = result.resources;
    next_cursor_res = result.next_cursor;
    return { folders, resources, next_cursor: next_cursor_res };
  }

  async deleteCloudinaryImage(public_id: string, reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    if (!public_id) throw { status: 400, message: 'Public ID is required' };
    const result = await cloudinary.uploader.destroy(public_id);
    if (result.result === 'ok') return { message: 'Image deleted successfully', public_id };
    else throw { status: 400, message: 'Failed to delete image', result };
  }
}
