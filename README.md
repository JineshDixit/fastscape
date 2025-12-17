# 🚗 Fastscape Backend API

A secure, scalable, and production-ready RESTful API for a car rental platform built with Node.js, TypeScript, Express, and PostgreSQL.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2.1-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue.svg)](https://www.postgresql.org/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with dual token system (access + refresh tokens)
- **Token rotation** for enhanced security
- **Multi-device logout** capability
- **Password hashing** with bcrypt (12 salt rounds)
- **Account blocking** mechanism
- **Rate limiting** to prevent brute force attacks

### 👤 User Management
- User registration with comprehensive validation
- Profile management (view, update, delete)
- Email verification and sanitization
- Age verification (18+ requirement)
- Strong password policy enforcement

### 🚙 Vehicle Management
- Browse available vehicles with advanced filtering
- Search vehicles by make, model, type, etc.
- Date-based availability checking
- Price range filtering
- Vehicle details with media gallery

### 📅 Booking System
- Create bookings with conflict detection
- Real-time availability checking
- Booking management (view, update, cancel)
- **Transaction support** to prevent race conditions
- **Row-level locking** for concurrent booking attempts
- Booking history tracking

### 🛡️ Security Features
- **OWASP Top 10** compliance
- **XSS protection** through input sanitization
- **SQL injection prevention** via ORM
- **CSRF protection** with stateless tokens
- **Security headers** (CSP, HSTS, X-Frame-Options, etc.)
- **Parameter pollution prevention**
- **Comprehensive input validation**

### 🔧 Additional Features
- Automatic token cleanup (background jobs)
- Global error handling with production-safe messages
- Comprehensive logging
- CORS configuration
- Request size limits
- Database connection pooling

## 🛠️ Tech Stack

### Core
- **Runtime**: Node.js 14+
- **Language**: TypeScript 5.9.3
- **Framework**: Express 5.2.1
- **Database**: PostgreSQL
- **ORM**: Sequelize 6.37.7

### Security
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit
- **Security Headers**: Custom middleware

### Development
- **Code Quality**: ESLint, Prettier
- **Process Manager**: nodemon
- **Environment**: dotenv
- **Build Tool**: TypeScript Compiler

## 🏗️ Architecture

This project follows the **MVC (Model-View-Controller)** pattern with a clean separation of concerns:

```
Request → Middleware → Controller → Service → Model → Database
   ↓          ↓           ↓           ↓         ↓         ↓
Response ← Error Handler ← HTTP ← Business ← ORM ← PostgreSQL
```

### Layer Responsibilities

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain pure business logic
- **Models**: Define database schema and ORM
- **Middleware**: Handle cross-cutting concerns (auth, validation, security)
- **Utils**: Provide reusable helper functions

## 🚀 Getting Started

### Prerequisites

- Node.js 14 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rental-car-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.development .env
   ```
   
   Update the `.env` file with your configuration (see [Environment Variables](#-environment-variables))

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb rental-car-db
   
   # Run migrations (if available)
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

### Quick Test

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Expected response:
# {
#   "success": true,
#   "message": "API is healthy",
#   "timestamp": "2025-12-17T..."
# }
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "nationality": "American",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "homeAddress": "123 Main St"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout All Devices
```http
POST /auth/logout-all
Authorization: Bearer <access-token>
```

### User Endpoints

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <access-token>
```

#### Update Profile
```http
PUT /users/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "fullName": "John Updated",
  "phone": "+1234567891"
}
```

#### Delete Account
```http
DELETE /users/profile
Authorization: Bearer <access-token>
```

### Vehicle Endpoints

#### Get Available Vehicles
```http
GET /vehicles?startDate=2025-01-01&endDate=2025-01-07&bodyType=SUV&minPrice=50&maxPrice=200
```

#### Search Vehicles
```http
GET /vehicles/search?query=BMW
```

#### Get Vehicle Details
```http
GET /vehicles/:vehicleId
```

### Booking Endpoints

#### Create Booking
```http
POST /bookings
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "vehicleId": "uuid",
  "startDatetime": "2025-01-01T10:00:00Z",
  "endDatetime": "2025-01-07T10:00:00Z",
  "pickupLocation": "Airport Terminal 1",
  "dropoffLocation": "Downtown Office"
}
```

#### Get User Bookings
```http
GET /bookings
Authorization: Bearer <access-token>
```

#### Get Booking Details
```http
GET /bookings/:bookingId
Authorization: Bearer <access-token>
```

#### Update Booking
```http
PUT /bookings/:bookingId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "pickupLocation": "New Location"
}
```

#### Cancel Booking
```http
DELETE /bookings/:bookingId
Authorization: Bearer <access-token>
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🔒 Security

This project implements enterprise-grade security measures:

### Authentication Security
- **JWT dual token system** (access: 15min, refresh: 7 days)
- **Token rotation** on each refresh
- **Token revocation** through database tracking
- **bcrypt password hashing** (12 salt rounds)

### Input Security
- **Express-validator** for all inputs
- **XSS prevention** through HTML encoding
- **SQL injection prevention** via Sequelize ORM
- **Email sanitization** and normalization
- **Strong password policy** enforcement

### Rate Limiting
- Authentication endpoints: **5 attempts per 15 minutes**
- Token refresh: **10 attempts per 15 minutes**
- General API: **100 requests per 15 minutes**

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

### Additional Security
- **Transaction support** for critical operations
- **Row-level locking** for concurrent operations
- **Global error handler** with production-safe messages
- **Automatic token cleanup** (hourly)
- **CORS configuration**
- **Request size limits** (10MB)

**Security Score: 9.5/10** - See [FINAL_SECURITY_AUDIT.md](./FINAL_SECURITY_AUDIT.md) for details

## 📁 Project Structure

```
rental-car-backend/
├── src/
│   ├── controller/              # HTTP request handlers
│   │   ├── auth/
│   │   │   └── auth.controller.ts
│   │   ├── user/
│   │   │   └── User.controller.ts
│   │   ├── booking/
│   │   │   └── booking.controller.ts
│   │   └── vehicle/
│   │       └── vehicle.controller.ts
│   │
│   ├── services/                # Business logic layer
│   │   ├── auth/
│   │   │   └── auth.service.ts
│   │   ├── user/
│   │   │   └── user.service.ts
│   │   ├── booking/
│   │   │   └── booking.service.ts
│   │   ├── vehicle/
│   │   │   └── vehicle.service.ts
│   │   ├── middleware/
│   │   │   ├── authenticateUser.ts
│   │   │   ├── validation.ts
│   │   │   ├── security.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── errorHandler.ts
│   │   └── cleanup/
│   │       └── tokenCleanup.service.ts
│   │
│   ├── common/
│   │   ├── models/              # Database models (Sequelize)
│   │   │   ├── user.model.ts
│   │   │   ├── refreshToken.model.ts
│   │   │   ├── vehicle.model.ts
│   │   │   ├── booking.model.ts
│   │   │   └── index.ts
│   │   ├── types/               # TypeScript interfaces
│   │   │   ├── authTypes.ts
│   │   │   ├── userTypes.ts
│   │   │   ├── jwtTypes.ts
│   │   │   └── expressTypes.ts
│   │   └── enum/                # Enumerations
│   │       └── dbEnums.ts
│   │
│   ├── routes/                  # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── vehicle.routes.ts
│   │   ├── booking.routes.ts
│   │   └── index.ts
│   │
│   ├── config/                  # Configuration files
│   │   ├── database/
│   │   │   └── dbConfig.ts
│   │   ├── env/
│   │   │   └── envConfig.ts
│   │   └── passport/
│   │       └── index.ts
│   │
│   ├── utils/                   # Utility functions
│   │   ├── jwt.utils.ts
│   │   ├── password.utils.ts
│   │   └── security.utils.ts
│   │
│   └── server.ts                # Application entry point
│
├── .env.development             # Development environment variables
├── .env.production              # Production environment variables
├── .eslintrc                    # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
│
└── Documentation/
    ├── API_DOCUMENTATION.md
    ├── SECURITY_AUDIT.md
    ├── ARCHITECTURE_RESTRUCTURE.md
    ├── FINAL_SECURITY_AUDIT.md
    ├── FINAL_PROJECT_STATUS.md
    └── QUICK_START_GUIDE.md
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_ACCESS_SECRET=your-strong-access-secret-here
JWT_REFRESH_SECRET=your-strong-refresh-secret-here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Database Configuration
DATABASE_HOST=localhost
DATABASE_NAME=rental-car-db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-db-password
DATABASE_PORT=5432

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Security Notes
- **Never commit** `.env` files to version control
- Use **strong, unique secrets** for JWT tokens (minimum 32 characters)
- Change default database credentials
- Use different secrets for development and production

## 📜 Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server

# Code Quality
npm run pretty       # Format code with Prettier
npm run lint         # Run ESLint (if configured)

# Database
npm run migrate      # Run database migrations (if configured)
npm run seed         # Seed database (if configured)
```

## 🧪 Testing

### Manual Testing

Use the provided `test-auth.http` file with the REST Client extension in VS Code:

1. Install REST Client extension
2. Open `test-auth.http`
3. Click "Send Request" above each request

### Automated Testing (Recommended)

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Testing Checklist

- [ ] User registration with valid data
- [ ] User registration with invalid data
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials
- [ ] Token refresh flow
- [ ] Protected route access with valid token
- [ ] Protected route access without token
- [ ] Rate limiting verification
- [ ] Booking creation and conflict detection
- [ ] Vehicle search and filtering

## 🚀 Deployment

### Prerequisites

- Node.js 14+ installed on server
- PostgreSQL database
- SSL certificate for HTTPS
- Environment variables configured

### Deployment Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export PORT=3000
   # ... other variables
   ```

3. **Start the application**
   ```bash
   npm start
   ```

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server.js --name rental-car-api

# Monitor
pm2 monit

# View logs
pm2 logs rental-car-api

# Restart
pm2 restart rental-car-api
```

### Docker Deployment

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build image
docker build -t rental-car-api .

# Run container
docker run -p 3000:3000 --env-file .env.production rental-car-api
```

### Production Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database SSL enabled
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented
- [ ] Error tracking (e.g., Sentry)
- [ ] Performance monitoring (e.g., New Relic)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### Pull Request Guidelines

- Describe your changes clearly
- Reference related issues
- Ensure all tests pass
- Update documentation if needed
- Follow the existing code style

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Nishchay**

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- Sequelize team for the robust ORM
- TypeScript team for type safety
- All contributors and supporters

## 📞 Support

For support, email support@example.com or open an issue in the repository.

---

**Built with ❤️ using Node.js, TypeScript, and Express**

**Status**: ✅ Production Ready | **Security**: 🛡️ Enterprise Grade | **Architecture**: 🏗️ Clean MVC