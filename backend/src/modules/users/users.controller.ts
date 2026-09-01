import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { SkipAuth } from '../auth/decorator/skipAuth.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserPageOptionsDto } from './dto/user-page-options.dto';
import { PageDto } from '../../common/pagination/pagination.dto';
import { Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiOkResponse({ type: UserResponseDto })
  @UseInterceptors(FileInterceptor('profilePicture'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ) {
    const savedUser = await this.usersService.create(
      createUserDto,
      profilePicture,
    );
    return plainToInstance(UserResponseDto, savedUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiOkResponse({ type: PageDto })
  async findAll(
    @Query() pageOptionsDto: UserPageOptionsDto,
  ): Promise<PageDto<UserResponseDto>> {
    return this.usersService.findAll(pageOptionsDto);
  }

  @Get('managers')
  @ApiOperation({ summary: 'Get list of available managers' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findManagers(): Promise<UserResponseDto[]> {
    const managers = await this.usersService.findManagers();
    return plainToInstance(UserResponseDto, managers);
  }

  @Get('technicians')
  @ApiOperation({ summary: 'Get list of available technicians' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findTechnicians(): Promise<UserResponseDto[]> {
    const technicians = await this.usersService.findTechnicians();
    return plainToInstance(UserResponseDto, technicians);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiOkResponse({ type: UserResponseDto })
  @UseInterceptors(FileInterceptor('profilePicture'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, profilePicture);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete a user (removes from auth.users and profiles)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.usersService.remove(id);
  }
}