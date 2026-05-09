import bcrypt from 'bcryptjs';
import type { AuthUser } from './types';

const users: AuthUser[] = [
  { id: '1', email: 'admin@example.com', role: 'admin', passwordHash: bcrypt.hashSync('Password123!', 10) },
  { id: '2', email: 'developer@example.com', role: 'developer', passwordHash: bcrypt.hashSync('Password123!', 10) },
  { id: '3', email: 'user@example.com', role: 'user', passwordHash: bcrypt.hashSync('Password123!', 10) }
];

export async function findUserByEmail(email: string) {
  return users.find((user) => user.email === email) || null;
}

export async function findUserById(id: string) {
  return users.find((user) => user.id === id) || null;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
