---
description: Global development rules for generating code for the Vishvakarma Hub platform.
applyTo: "**"
---

# Vishvakarma Hub – Copilot Development Instructions

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

The project is a **full-scale startup creation and public funding platform** called **Vishvakarma Hub**.

Tagline: **From Idea to Innovation.**

The platform allows:
- innovators to submit ideas
- startups to launch campaigns
- the public to support innovations
- founders to manage projects
- admins to moderate the platform

All generated code must follow **production-grade standards** and must be **fully functional end-to-end**.

---

# 1. No Mock Data Policy

Never generate mock data, placeholder content, or fake datasets.

Forbidden examples:

```javascript
const startups = [
  { name: "AI Startup", funding: 50000 }
];

All data must come from:

PostgreSQL database

backend APIs

real authentication

Frontend must always fetch real data using API requests.

2. Full End-to-End Implementation

All features must function completely from:

Frontend → Backend → Database.

Every feature must include:

UI

API endpoint

database interaction

validation

error handling

Example flow:

User signup
→ stored in database
→ login via JWT
→ access dashboard.

No partially implemented features.

3. Platform Core Features

The platform must support the following modules.

Public Website:

homepage

explore startups

startup detail page

categories

how it works

Authentication:

signup

login

email verification

password reset

JWT authentication

Startup System:

idea submission

campaign creation

funding goal

reward tiers

Contribution System:

payments via Razorpay or Stripe

funding progress tracking

contribution history

Dashboards:

user dashboard

startup founder dashboard

admin panel

Notifications:

campaign updates

milestone updates

supporter alerts

4. Navigation Rules

All pages must be connected through working navigation.

Required routes:

/
explore
/startup/[id]
/submit-idea
/login
/signup
/dashboard
/startup-dashboard
/admin

Header and footer navigation must be implemented.

5. Backend Architecture

Use modular architecture.

Recommended stack:

Frontend:
Next.js
React
TailwindCSS

Backend:
Node.js
NestJS or Express

Database:
PostgreSQL

Cache:
Redis

File storage:
AWS S3

Payments:
Razorpay
Stripe

6. API Design Rules

All APIs must follow RESTful design.

Example structure:

/api/auth
/api/users
/api/startups
/api/campaigns
/api/contributions
/api/admin

Example endpoints:

POST /api/auth/signup
POST /api/auth/login
GET /api/startups
POST /api/startups
POST /api/campaigns
POST /api/contributions

All APIs must include validation and error handling.

7. Database Requirements

All application data must be stored in PostgreSQL.

Required tables include:

users
startups
campaigns
contributions
documents
notifications
comments
milestones

Database schema must support relationships and indexing.

8. Authentication and Authorization

Authentication must use JWT tokens.

Protected routes include:

/dashboard
/startup-dashboard
/admin

Passwords must be hashed using bcrypt.

9. Payment Integration

Contribution payments must use real payment gateways.

Supported gateways:

Razorpay

Stripe

Payment flow:

User selects contribution
→ payment gateway checkout
→ webhook verification
→ contribution stored in database
→ campaign funding updated.

No simulated payments.

10. File Uploads

All uploaded files must be stored in cloud storage.

Use:

AWS S3.

Supported uploads:

startup logos

pitch decks

founder documents

product images

11. Security Rules

All generated code must follow security best practices.

Required:

bcrypt password hashing

input validation

rate limiting

CORS configuration

CSRF protection

HTTPS support

12. Responsive UI

Frontend must be responsive.

Support:

desktop

tablet

mobile

Use TailwindCSS responsive utilities.

13. Error Handling

All APIs must handle errors correctly.

Standard responses:

400 Bad Request
401 Unauthorized
404 Not Found
500 Server Error

Frontend must display user-friendly error messages.

14. Performance Optimization

Implement:

Redis caching

database indexing

lazy loading

optimized images

15. Logging

Backend must include logging for:

API requests

authentication

payments

errors

Use a logging library such as Winston.

16. Testing

Generate automated tests for:

authentication

API endpoints

campaign creation

contributions

Testing frameworks:

Jest
Supertest

17. Deployment Targets

Frontend deployment:

Vercel

Backend deployment:

AWS EC2

Database:

AWS RDS

File storage:

AWS S3

18. Code Quality

Generated code must follow:

modular architecture

reusable components

clean folder structure

descriptive variable names

comments where necessary

19. Environment Configuration

All sensitive values must use environment variables.

Examples:

DATABASE_URL
JWT_SECRET
RAZORPAY_KEY
STRIPE_SECRET
AWS_ACCESS_KEY

20. Final Requirement

The system must function as a complete production-ready startup funding platform.

Full workflow must work:

User signup
→ idea submission
→ startup campaign creation
→ public contributions
→ funding progress tracking
→ startup updates
→ admin moderation.

Incomplete or placeholder implementations are not allowed.