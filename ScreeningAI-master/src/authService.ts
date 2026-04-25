import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from './types';
import { emailService } from './emailService';
import { getNextSequence, getResetTokensCollection, getUsersCollection } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
}

export class AuthService {
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const usersCollection = await getUsersCollection();
      const existingUser = await usersCollection.findOne({ email: data.email });
      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user
      const user: User = {
        id: await getNextSequence("users"),
        email: data.email,
        password: hashedPassword,
        name: data.name,
        createdAt: new Date()
      };

      await usersCollection.insertOne(user);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      };

      return { success: true, user: authUser, token };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user
      const usersCollection = await getUsersCollection();
      const user = await usersCollection.findOne({ email: data.email }) as User | null;
      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      };

      return { success: true, user: authUser, token };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      const usersCollection = await getUsersCollection();
      const user = await usersCollection.findOne({ id: decoded.userId }) as User | null;
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      };
    } catch (error) {
      return null;
    }
  }

  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ email }) as User | null;
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: 'If that email exists, a password reset link has been sent.'
      };
    }

    const token = crypto.randomUUID();
    const resetTokensCollection = await getResetTokensCollection();
    await resetTokensCollection.insertOne({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    try {
      await emailService.sendPasswordResetEmail(email, token);
      return {
        success: true,
        message: 'Password reset link sent to your email.'
      };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // For development, still return success but log the token
      console.log(`\n=== DEVELOPMENT: PASSWORD RESET TOKEN ===`);
      console.log(`Email: ${email}`);
      console.log(`Token: ${token}`);
      console.log(`Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password?token=${token}`);
      console.log(`=======================================\n`);
      return {
        success: true,
        message: 'Password reset link generated. Check server logs for the reset URL.'
      };
    }
  }

  static async resetPassword(token: string, password: string): Promise<AuthResponse> {
    const resetTokensCollection = await getResetTokensCollection();
    const resetEntry = await resetTokensCollection.findOne({ token }) as { userId: number; expiresAt: Date } | null;
    if (!resetEntry || resetEntry.expiresAt < new Date()) {
      return { success: false, message: 'Invalid or expired reset token' };
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ id: resetEntry.userId }) as User | null;
    if (!user) {
      return { success: false, message: 'Invalid reset token' };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await usersCollection.updateOne({ id: resetEntry.userId }, { $set: { password: hashedPassword } });
    await resetTokensCollection.deleteOne({ token });

    return {
      success: true,
      message: 'Password updated successfully'
    };
  }

  static async updatePassword(userId: number, password: string): Promise<boolean> {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ id: userId });
    if (!user) return false;

    const hashed = await bcrypt.hash(password, 12);
    await usersCollection.updateOne({ id: userId }, { $set: { password: hashed } });
    return true;
  }

  static async getUserById(id: number): Promise<AuthUser | null> {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ id }) as User | null;
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
  }
}