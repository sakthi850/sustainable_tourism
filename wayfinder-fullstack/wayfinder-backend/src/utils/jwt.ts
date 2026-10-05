import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail loudly rather than silently signing tokens with an empty/guessable secret.
    throw new Error('JWT_SECRET is not set — add it to your .env file before starting the server.');
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
