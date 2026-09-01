import { registerAs } from '@nestjs/config';

export default registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL as string,
  key: process.env.SUPABASE_KEY as string,
  bucket: process.env.SUPABASE_BUCKET as string,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
}));
