import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    householdId: user.householdId,
  };
}

export async function signup(req, res) {
  const { name, email, password } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase(), password: hashed },
  });

  res.status(201).json({ token: signToken(user), user: safeUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  res.status(200).json({ token: signToken(user), user: safeUser(user) });
}
