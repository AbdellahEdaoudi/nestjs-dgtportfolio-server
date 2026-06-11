<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  <h1>DGT Portfolio — Enterprise Backend</h1>
  <p>A fully-featured, production-ready REST API built with NestJS, powering the DGT Portfolio platform with scalable and robust architecture.</p>

  <div>
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/JWT-Black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
    <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
    <img src="https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal" />
  </div>
</div>

---

## 🚀 Overview

This repository contains the backend service for **DGT Portfolio**, engineered with [NestJS](https://nestjs.com) to deliver high performance, modularity, and enterprise-grade maintainability. It seamlessly handles complex business logic including user management, portfolio generation, subscription processing via PayPal, DNS verification for custom domains, and media management through Cloudinary.

## ✨ Key Features

- **Modular Architecture**: Clean, domain-driven design separating concerns into logical modules.
- **Robust Authentication**: JWT-based stateless authentication ensuring secure API access.
- **Subscription Engine**: Deep integration with PayPal for recurring billing and lifecycle webhooks.
- **Media Management**: Direct integration with Cloudinary for scalable image uploads and optimizations.
- **Custom Domains**: Built-in DNS verification to allow users to map their own domains.
- **Admin Dashboard API**: Comprehensive endpoints for platform administration, metrics, and user management.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Core Framework** | NestJS | Scalable Node.js framework leveraging TypeScript. |
| **Database** | MongoDB / Mongoose | NoSQL document database with strong schema validation. |
| **Authentication** | JWT (JSON Web Tokens) | Secure, stateless request authorization. |
| **Media Storage** | Cloudinary | Cloud-based media management. |
| **Payments** | PayPal REST API | Handling subscriptions and one-time payments. |
| **Emails** | Nodemailer | Reliable SMTP transactional email delivery. |

---

## 📂 Project Architecture

```mermaid
graph TD;
    Client-->|REST API / JWT|Controller;
    Controller-->Service;
    Service-->|Mongoose|MongoDB;
    Service-->|API|Cloudinary;
    Service-->|API/Webhooks|PayPal;
```

### Directory Structure

```text
src/
├── admin/             # Platform administration & analytics
├── common/            # Shared guards, interceptors, and services
├── contacts/          # Support ticketing & messaging
├── custom-domain/     # DNS verification and domain mapping
├── database/          # Database configuration and connection management
├── general/           # Publicly accessible utility endpoints
├── links/             # User portfolio link management
├── paypal/            # Payment processing and plan management
├── promo/             # Promotional codes logic
├── schemas/           # Mongoose data models
├── subscription/      # User subscription lifecycles
├── user/              # User profiles, portfolios, and settings
└── webhook/           # Asynchronous event handlers (e.g., PayPal webhooks)
```

---

## 🚦 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas)

### Installation & Setup

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the project root:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<db>
   
   # Security
   NEXTAUTH_SECRET=your_super_secret_jwt_key
   
   # External Services
   CLOUDINARY_CLOUD_NAME=name
   CLOUDINARY_API_KEY=key
   CLOUDINARY_API_SECRET=secret
   
   PAYPAL_CLIENT_ID=client_id
   PAYPAL_CLIENT_SECRET=secret
   PAYPAL_MODE=sandbox
   
   # SMTP Email
   EMAIL_USER=admin@example.com
   EMAIL_PASS=smtp_password
   
   # Server Settings
   PORT=9999
   BACKEND_URL=http://localhost:9999
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

3. **Run the Application**
   ```bash
   # Development mode with Hot-Reload
   npm run start:dev
   
   # Production build
   npm run build
   npm run start:prod
   ```

---

## 🔒 Security & Authentication

The API enforces security through **JWT Auth Guards**. 
Include the token in your request headers for protected routes:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
```

---

<div align="center">
  <p>Engineered with precision for the DGT Portfolio Ecosystem.</p>
</div>
