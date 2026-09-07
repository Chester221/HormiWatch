import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export class CreateAuditDto {
  @ApiProperty({ enum: AuditAction, example: AuditAction.CREATE })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({ example: 'Task' })
  @IsString()
  affectedEntity: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiProperty({ example: { status: 'pending' }, required: false })
  @IsObject()
  @IsOptional()
  oldValues?: Record<string, any>;

  @ApiProperty({ example: { status: 'completed' }, required: false })
  @IsObject()
  @IsOptional()
  newValues?: Record<string, any>;
}
