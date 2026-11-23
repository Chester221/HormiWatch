import { Module } from '@nestjs/common';

import { CustomersModule } from '../customers/customers.module';
import { ProjectsModule } from '../projects/projects.module';
import { ServicesModule } from '../services/services.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';

@Module({
  imports: [
    ProjectsModule,
    TasksModule,
    CustomersModule,
    UsersModule,
    ServicesModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
