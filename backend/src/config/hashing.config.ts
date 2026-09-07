import { registerAs } from '@nestjs/config';

export default registerAs('hashing', () => ({
  pepper: process.env.HASH_PEPPER || 'default_secret_pepper',
}));
