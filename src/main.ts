import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { json, urlencoded } from 'express';

async function bootstrap() {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB successfully connected!');
  });

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // needed for PayPal webhook raw body access
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // CORS — same allowed origins as the Express server
  const allowedOrigins = [
    'https://dgtportfolio.vercel.app',
    'https://dgtportfolio.com',
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Global middleware
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 9999);
  console.log(`Server running on port ${process.env.PORT ?? 9999}`);
}
bootstrap();
