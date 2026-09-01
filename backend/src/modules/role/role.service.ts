import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Not, Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(
        `A role with the name '${createRoleDto.name}' already exists.`,
      );
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found.`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    if (updateRoleDto.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name, id: Not(id) },
      });

      if (existingRole) {
        throw new ConflictException(
          `A role with the name '${updateRoleDto.name}' already exists.`,
        );
      }
    }
    const updateResult = await this.roleRepository.update(id, updateRoleDto);

    if (updateResult.affected === 0) {
      throw new NotFoundException(`Role with ID '${id}' not found.`);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const deleteResult = await this.roleRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Role with ID '${id}' not found.`);
    }
    return { message: 'Role deleted successfully' };
  }
}
