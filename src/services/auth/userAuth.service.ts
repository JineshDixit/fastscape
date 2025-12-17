import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import { User, RefreshToken } from '../../models';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse 
} from '../../common/types/authTypes';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.utils';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';

/**
 * Registers a new user
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise resolving to void
 *
 * Request body must contain the following fields:
 * - `fullName`: User full name
 * - `dateOfBirth`: User date of birth (ISO string)
 * - `nationality`: User nationality
 * - `email`: User email
 * - `phone`: User phone number
 * - `password`: User password
 * - `homeAddress`: User home address (optional)
 *
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 * - `data`: Object containing user data and tokens
 *
 * User data will contain the following fields:
 * - `id`: User ID
 * - `fullName`: User full name
 * - `email`: User email
 * - `phone`: User phone number
 * - `nationality`: User nationality
 *
 * Tokens will contain the following fields:
 * - `accessToken`: Access token
 * - `refreshToken`: Refresh token
 * - `accessTokenExpiresAt`: Expiration date of the access token
 * - `refreshTokenExpiresAt`: Expiration date of the refresh token
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, dateOfBirth, nationality, email: rawEmail, phone, password, homeAddress } = req.body as RegisterRequest;
    const email = sanitizeEmail(rawEmail);

    // Validate required fields
    if (!fullName || !dateOfBirth || !nationality || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
      email,
      phone,
      passwordHash,
      homeAddress,
      isBlocked: false,
    });

    // Generate tokens
    const tokenPair = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token in database
    await RefreshToken.create({
      userId: user.id,
      token: tokenPair.refreshToken,
      expiresAt: tokenPair.refreshTokenExpiresAt,
      isRevoked: false,
    });

    const response: AuthResponse = {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        nationality: user.nationality,
      },
      tokens: tokenPair,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: response,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Login user and generate new access and refresh tokens
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise resolving to void
 * 
 * Request body must contain the following fields:
 * - `email`: User email
 * - `password`: User password
 * 
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 * - `data`: Object containing user data and tokens
 * 
 * User data will contain the following fields:
 * - `id`: User ID
 * - `fullName`: User full name
 * - `email`: User email
 * - `phone`: User phone number
 * - `nationality`: User nationality
 * 
 * Tokens will contain the following fields:
 * - `accessToken`: Access token
 * - `refreshToken`: Refresh token
 * - `accessTokenExpiresAt`: Expiration date of the access token
 * - `refreshTokenExpiresAt`: Expiration date of the refresh token
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, password } = req.body as LoginRequest;
    const email = sanitizeEmail(rawEmail);

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if user is blocked
    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact support.',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Revoke existing refresh tokens for security
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: user.id, isRevoked: false } }
    );

    // Generate new tokens
    const tokenPair = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    // Store new refresh token
    await RefreshToken.create({
      userId: user.id,
      token: tokenPair.refreshToken,
      expiresAt: tokenPair.refreshTokenExpiresAt,
      isRevoked: false,
    });

    const response: AuthResponse = {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        nationality: user.nationality,
      },
      tokens: tokenPair,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: response,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Refresh access and refresh tokens
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise resolving to void
 * 
 * Request body must contain the following fields:
 * - `refreshToken`: Refresh token
 * 
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 * - `data`: Object containing new access and refresh tokens
 * 
 * Tokens will contain the following fields:
 * - `accessToken`: Access token
 * - `refreshToken`: Refresh token
 * - `accessTokenExpiresAt`: Expiration date of the access token
 * - `refreshTokenExpiresAt`: Expiration date of the refresh token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as RefreshTokenRequest;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    // Check if refresh token exists in database and is not revoked
    const storedToken = await RefreshToken.findOne({
      where: {
        token,
        userId: decoded.userId,
        isRevoked: false,
      },
    });

    if (!storedToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not found or revoked',
      });
      return;
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Mark as revoked
      await storedToken.update({ isRevoked: true });
      res.status(401).json({
        success: false,
        message: 'Refresh token expired',
      });
      return;
    }

    // Get user details
    const user = await User.findByPk(decoded.userId);
    if (!user || user.isBlocked) {
      res.status(401).json({
        success: false,
        message: 'User not found or blocked',
      });
      return;
    }

    // Revoke old refresh token
    await storedToken.update({ isRevoked: true });

    // Generate new token pair
    const newTokenPair = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    // Store new refresh token
    await RefreshToken.create({
      userId: user.id,
      token: newTokenPair.refreshToken,
      expiresAt: newTokenPair.refreshTokenExpiresAt,
      isRevoked: false,
    });

    const response: RefreshTokenResponse = newTokenPair;

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: response,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Logout user and revoke the refresh token
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise resolving to void
 * 
 * Request body must contain the following fields:
 * - `refreshToken`: Refresh token
 * 
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 */
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as RefreshTokenRequest;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    // Revoke the refresh token
    await RefreshToken.update(
      { isRevoked: true },
      { where: { token, isRevoked: false } }
    );

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Logout user from all devices
 * 
 * Revokes all refresh tokens for the user and logs them out from all devices
 * 
 * @param {AuthenticatedRequest} req - Express request object with user authentication
 * @param {Response} res - Express response object
 * 
 * @returns {Promise<void>} - Promise resolving to void
 * 
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 */
export const logoutAllDevices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Revoke all refresh tokens for the user
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId, isRevoked: false } }
    );

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};