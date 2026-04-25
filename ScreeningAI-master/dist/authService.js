"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const emailService_1 = require("./emailService");
const db_1 = require("./db");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
class AuthService {
    static async register(data) {
        try {
            // Check if user already exists
            const usersCollection = await (0, db_1.getUsersCollection)();
            const existingUser = await usersCollection.findOne({ email: data.email });
            if (existingUser) {
                return { success: false, message: 'User already exists' };
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
            // Create user
            const user = {
                id: await (0, db_1.getNextSequence)("users"),
                email: data.email,
                password: hashedPassword,
                name: data.name,
                createdAt: new Date()
            };
            await usersCollection.insertOne(user);
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            const authUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            };
            return { success: true, user: authUser, token };
        }
        catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed' };
        }
    }
    static async login(data) {
        try {
            // Find user
            const usersCollection = await (0, db_1.getUsersCollection)();
            const user = await usersCollection.findOne({ email: data.email });
            if (!user) {
                return { success: false, message: 'Invalid credentials' };
            }
            // Verify password
            const isValidPassword = await bcryptjs_1.default.compare(data.password, user.password);
            if (!isValidPassword) {
                return { success: false, message: 'Invalid credentials' };
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            const authUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            };
            return { success: true, user: authUser, token };
        }
        catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed' };
        }
    }
    static async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const usersCollection = await (0, db_1.getUsersCollection)();
            const user = await usersCollection.findOne({ id: decoded.userId });
            if (!user)
                return null;
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            };
        }
        catch (error) {
            return null;
        }
    }
    static async requestPasswordReset(email) {
        const usersCollection = await (0, db_1.getUsersCollection)();
        const user = await usersCollection.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not for security
            return {
                success: true,
                message: 'If that email exists, a password reset link has been sent.'
            };
        }
        const token = crypto_1.default.randomUUID();
        const resetTokensCollection = await (0, db_1.getResetTokensCollection)();
        await resetTokensCollection.insertOne({
            token,
            userId: user.id,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
        try {
            await emailService_1.emailService.sendPasswordResetEmail(email, token);
            return {
                success: true,
                message: 'Password reset link sent to your email.'
            };
        }
        catch (error) {
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
    static async resetPassword(token, password) {
        const resetTokensCollection = await (0, db_1.getResetTokensCollection)();
        const resetEntry = await resetTokensCollection.findOne({ token });
        if (!resetEntry || resetEntry.expiresAt < new Date()) {
            return { success: false, message: 'Invalid or expired reset token' };
        }
        const usersCollection = await (0, db_1.getUsersCollection)();
        const user = await usersCollection.findOne({ id: resetEntry.userId });
        if (!user) {
            return { success: false, message: 'Invalid reset token' };
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        await usersCollection.updateOne({ id: resetEntry.userId }, { $set: { password: hashedPassword } });
        await resetTokensCollection.deleteOne({ token });
        return {
            success: true,
            message: 'Password updated successfully'
        };
    }
    static async updatePassword(userId, password) {
        const usersCollection = await (0, db_1.getUsersCollection)();
        const user = await usersCollection.findOne({ id: userId });
        if (!user)
            return false;
        const hashed = await bcryptjs_1.default.hash(password, 12);
        await usersCollection.updateOne({ id: userId }, { $set: { password: hashed } });
        return true;
    }
    static async getUserById(id) {
        const usersCollection = await (0, db_1.getUsersCollection)();
        const user = await usersCollection.findOne({ id });
        if (!user)
            return null;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        };
    }
}
exports.AuthService = AuthService;
