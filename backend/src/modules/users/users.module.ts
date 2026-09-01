import { Module } from '@nestjs/common';
import { HashingModule } from '../../common/hashing/hashing.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { RoleModule } from '../role/role.module';
import { Profile } from './entities/profile.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Role]),
    RoleModule,
    StorageModule,
    HashingModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
