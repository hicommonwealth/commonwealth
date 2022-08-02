require('dotenv').config();

export const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

export const JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';
