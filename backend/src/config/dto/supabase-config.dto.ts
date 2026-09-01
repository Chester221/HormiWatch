import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SupabaseConfig {
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false }) // 'require_tld: false' allows localhost URLs
  url: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  bucket: string;

  @IsString()
  @IsNotEmpty()
  jwtSecret: string;
}
