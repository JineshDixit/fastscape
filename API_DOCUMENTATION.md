# JWT Authentication API Documentation

## Overview

This API implements a secure JWT-based authentication system with access and refresh tokens following industry best practices.

## Security Features

- **Dual Token System**: Separate access and refresh tokens
- **Token Rotation**: Refresh tokens are rotated on each use
- **Rate Limiting**: Protection against brute force attacks
- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Comprehensive validation for all endpoints
- **Token Revocation**: Ability to logout from single or all devices

## Environment Variables

```env
# Server
PORT=3000

# JWT Configuration
JWT_ACCESS_SECRET="aB3$kL9#mN2@pQ7*rS5&tU8!vW1%xY4^zA6+bC0-dE9~fG2"
JWT_REFRESH_SECRET="zY8*wX5#vU2@tS9&rQ6!pN3%mL0^kJ7+iH4-gF1~eD8$cB5"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# Database
DATABASE_HOST="localhost"
DATABASE_NAME="fastscape-uat"
DATABASE_USERNAME="postgres"
DATABASE_PASSWORD="admin@root"
DATABASE_PORT=5432

# CORS
FRONTEND_URL="http://localhost:3000"
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### 1. Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "nationality": "American",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "homeAddress": "123 Main St, City, Country"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "nationality": "American"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "accessTokenExpiresAt": "2024-01-01T12:15:00.000Z",
      "refreshTokenExpiresAt": "2024-01-08T12:00:00.000Z"
    }
  }
}
```

#### 2. Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "nationality": "American"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "accessTokenExpiresAt": "2024-01-01T12:15:00.000Z",
      "refreshTokenExpiresAt": "2024-01-08T12:00:00.000Z"
    }
  }
}
```

#### 3. Refresh Token
```http
POST /auth/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "accessTokenExpiresAt": "2024-01-01T12:15:00.000Z",
    "refreshTokenExpiresAt": "2024-01-08T12:00:00.000Z"
  }
}
```

#### 4. Logout
```http
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 5. Logout All Devices
```http
POST /auth/logout-all
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

### User Endpoints

#### 1. Get User Profile
```http
GET /users/profile
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "nationality": "American",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "homeAddress": "123 Main St, City, Country",
    "isBlocked": false,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Health Check

#### Health Status
```http
GET /health
```

**Response (200):**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Refresh token endpoint**: 10 requests per 15 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per IP

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Invalid or expired access token"
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```

## Security Considerations

1. **Token Storage**: Store refresh tokens securely (httpOnly cookies recommended for web apps)
2. **HTTPS**: Always use HTTPS in production
3. **Token Rotation**: Refresh tokens are automatically rotated on each use
4. **Revocation**: Tokens can be revoked by logging out
5. **Expiration**: Short-lived access tokens (15 minutes) with longer refresh tokens (7 days)

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `fullName` (VARCHAR)
- `dateOfBirth` (DATE)
- `nationality` (VARCHAR)
- `email` (VARCHAR, Unique)
- `phone` (VARCHAR)
- `passwordHash` (TEXT)
- `homeAddress` (TEXT)
- `isBlocked` (BOOLEAN)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### Refresh Tokens Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `token` (TEXT, Unique)
- `expiresAt` (TIMESTAMP)
- `isRevoked` (BOOLEAN)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.development`

3. Run database migrations (ensure PostgreSQL is running)

4. Start the development server:
```bash
npm run dev
```

## Testing the API

You can test the API using tools like Postman, curl, or any HTTP client. Start with the health check endpoint to ensure the server is running, then proceed with user registration and authentication flows.