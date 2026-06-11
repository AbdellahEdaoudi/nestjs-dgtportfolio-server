import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import { v2 as cloudinary } from 'cloudinary';
import { Contacte, ContacteDocument } from '../schemas/contacte.schema';

@Injectable()
export class ContactsService {
  constructor(@InjectModel(Contacte.name) private contacteModel: Model<ContacteDocument>) {}

  async getContacts(reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    const contacts = await this.contacteModel.find();
    return contacts;
  }

  async getContactById(id: string, reqEmail: string) {
    if (reqEmail !== process.env.EMAIL) throw { status: 403, message: 'Forbidden' };
    const contact = await this.contacteModel.findById(id);
    if (!contact) throw { status: 404, message: 'Contact not found' };
    return contact;
  }

  async createContact(body: any, reqEmail: string) {
    if (body.email !== reqEmail) throw { status: 403, message: 'Forbidden' };
    const contactData = { ...body };
    for (const key in contactData) {
      if (key === 'attachment') continue;
      if (typeof contactData[key] === 'string') {
        contactData[key] = sanitizeHtml(contactData[key]);
      }
    }
    if (contactData.message && contactData.message.length > 500) {
      throw { status: 400, message: 'Message too long' };
    }
    if (contactData.subject && contactData.subject.length > 100) {
      throw { status: 400, message: 'Subject too long' };
    }
    
    if (contactData.attachment) {
      try {
        const uploadResult = await cloudinary.uploader.upload(contactData.attachment, {
          folder: 'support_attachments',
          resource_type: 'auto'
        });
        contactData.attachment = uploadResult.secure_url;
      } catch (uploadError: any) {
        console.error('Cloudinary upload error:', uploadError);
        throw { status: 500, message: 'Failed to upload attachment', error: uploadError.message };
      }
    }
    const newContact = new this.contacteModel(contactData);
    const savedContact = await newContact.save();
    return savedContact;
  }

  async updateContactById(id: string, body: any) {
    const updatedContact = await this.contacteModel.findByIdAndUpdate(id, body, { returnDocument: 'after' });
    if (!updatedContact) throw { status: 404, message: 'Contact not found' };
    return updatedContact;
  }

  async getUserContacts(email: string) {
    if (!email) throw { status: 401, message: 'Unauthorized' };
    return await this.contacteModel.find({ email }).sort({ createdAt: -1 });
  }

  async deleteUserContact(id: string, email: string) {
    if (!email) throw { status: 401, message: 'Unauthorized' };
    const contact = await this.contacteModel.findById(id);
    if (!contact) throw { status: 404, message: 'Contact not found' };
    if (contact.email !== email) throw { status: 403, message: 'Forbidden' };

    // Delete attachment from Cloudinary if exists
    if (contact.attachment) {
      try {
        const urlParts = contact.attachment.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = `support_attachments/${fileWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr: any) {
        console.error('Cloudinary delete error:', cloudErr.message);
      }
    }

    await this.contacteModel.findByIdAndDelete(id);
    return { success: true, message: 'Contact deleted' };
  }
}
