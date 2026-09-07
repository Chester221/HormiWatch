import { Exclude, Expose } from 'class-transformer';

export class ProfileResponseDto {
  @Exclude()
  id: string;

  @Exclude()
  user: any;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deleteAt: Date;

  @Expose()
  name: string;

  @Expose()
  lastName: string;

  @Expose()
  phone: string;

  @Expose()
  idCard: string;

  @Expose()
  position: string;

  @Expose()
  deparment: string;

  @Expose()
  profilePicture: string;
}
