import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop() fullname: string;
  @Prop({ type: String, unique: true, required: true }) email: string;
  @Prop() username: string;
  @Prop() phoneNumber: string;
  @Prop() country: string;
  @Prop() category: string;
  @Prop() urlimage: string;
  @Prop() displayEmail: string;
  @Prop() bgcolorp: string;
  @Prop() about: string;
  @Prop([String]) languages: string[];
  @Prop([String]) services: string[];
  @Prop([String]) skills: string[];

  @Prop({
    type: [
      {
        school: String,
        degree: String,
        field: String,
        startYear: String,
        endYear: String,
      },
    ],
  })
  education: {
    _id?: any;
    school: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }[];

  @Prop({
    type: [
      {
        company: String,
        role: String,
        description: String,
        startDate: String,
        endDate: String,
      },
    ],
  })
  experience: {
    _id?: any;
    company: string;
    role: string;
    description: string;
    startDate: string;
    endDate: string;
  }[];

  @Prop({
    type: [
      {
        title: String,
        description: String,
        link: String,
        image: String,
        technologies: [String],
        startDate: String,
        endDate: String,
      },
    ],
  })
  projects: {
    _id?: any;
    title: string;
    description: string;
    link: string;
    image: string;
    technologies: string[];
    startDate: string;
    endDate: string;
  }[];

  @Prop({
    type: [
      {
        title: String,
        description: String,
        cfimage: String,
      },
    ],
  })
  certificates: {
    _id?: any;
    title: string;
    description: string;
    cfimage: string;
  }[];

  @Prop({
    type: {
      github: String,
      linkedin: String,
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
      telegram: String,
      snapchat: String,
      whatsapp: String,
      tiktok: String,
      reddit: String,
      twitch: String,
    },
  })
  socials: {
    github?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    telegram?: string;
    snapchat?: string;
    whatsapp?: string;
    tiktok?: string;
    reddit?: string;
    twitch?: string;
  };

  @Prop({
    type: [String],
    default: [
      'services',
      'experience',
      'skills',
      'projects',
      'education',
      'certificates',
      'languages',
    ],
  })
  sectionOrder: string[];

  @Prop() theme: number;

  @Prop({ type: String, default: 'en' })
  displayLanguage: string;

  @Prop({ type: String, unique: true, sparse: true })
  customDomain: string;

  @Prop({ type: Boolean, default: false })
  customDomainVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
