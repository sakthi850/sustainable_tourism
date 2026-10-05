import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { signToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = asyncHandler(async (req, res: Response) => {
  const { name, email, password } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) throw new ApiError(400, 'Name is required.');
  if (!email || !EMAIL_RE.test(email)) throw new ApiError(400, 'A valid email is required.');
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with that email already exists.');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash, role: 'USER' });

  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');

  const user = await User.findOne({ email: String(email).toLowerCase() });
  // Same generic message whether the email doesn't exist or the password is wrong —
  // never reveal which one, that leaks which emails are registered.
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid email or password.');

  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authenticated.');
  const user = await User.findById(req.user.userId).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found.');
  // Same shape as register/login's user object ({id, name, email, role}) — the raw Mongoose
  // document uses _id, which would silently break any frontend code expecting user.id.
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});
