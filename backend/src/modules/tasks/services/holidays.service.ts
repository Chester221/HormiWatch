import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Holiday } from '../entities/holiday.entity';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { UpdateHolidayDto } from '../dto/update-holiday.dto';
import { HolidayPageOptionsDto } from '../dto/holiday-page-options.dto';
import { HolidayResponseDto } from '../dto/holiday-response.dto';
import { plainToInstance } from 'class-transformer';
import { PageDto } from '../../../common/pagination/pagination.dto';
import { PageMeta } from '../../../common/pagination/metadata';
import { Brackets } from 'typeorm';

@Injectable()
export class HolidaysService {
  private readonly logger = new Logger(HolidaysService.name);

  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    createHolidayDto: CreateHolidayDto,
  ): Promise<HolidayResponseDto> {
    const { date } = createHolidayDto;

    // Check if holiday already exists for this date
    const existing = await this.holidayRepository.findOne({
      where: { date: new Date(date) },
    });
    if (existing) {
      throw new ConflictException(`Holiday for date ${date} already exists`);
    }

    const holiday = this.holidayRepository.create({
      ...createHolidayDto,
      date: new Date(date), // Ensure correct typing for Entity
    });

    const saved = await this.holidayRepository.save(holiday);
    return plainToInstance(HolidayResponseDto, saved);
  }

  async findAll(
    pageOptionsDto: HolidayPageOptionsDto,
  ): Promise<PageDto<HolidayResponseDto>> {
    const queryBuilder = this.holidayRepository.createQueryBuilder('holiday');

    if (pageOptionsDto.id) {
      queryBuilder.andWhere('holiday.id = :id', { id: pageOptionsDto.id });
    }

    if (pageOptionsDto.date) {
      queryBuilder.andWhere('holiday.date = :date', {
        date: pageOptionsDto.date,
      });
    }

    const searchText = pageOptionsDto.search || pageOptionsDto.q;
    if (searchText) {
      queryBuilder.andWhere('holiday.name LIKE :q', { q: `%${searchText}%` });
    }

    queryBuilder
      .orderBy('holiday.date', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMeta(pageOptionsDto, itemCount);

    return new PageDto(
      plainToInstance(HolidayResponseDto, entities),
      pageMetaDto,
    );
  }

  async update(
    id: string,
    updateHolidayDto: UpdateHolidayDto,
  ): Promise<HolidayResponseDto> {
    const holiday = await this.holidayRepository.findOne({ where: { id } });
    if (!holiday) throw new NotFoundException('Holiday not found');

    if (updateHolidayDto.date) {
      // Check for duplicate if date changes
      const existing = await this.holidayRepository.findOne({
        where: { date: new Date(updateHolidayDto.date) },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Holiday for date ${updateHolidayDto.date} already exists`,
        );
      }
      holiday.date = new Date(updateHolidayDto.date);
    }

    Object.assign(holiday, updateHolidayDto);
    // Handle date assignment again if Object.assign overwrites with string
    if (updateHolidayDto.date) holiday.date = new Date(updateHolidayDto.date);

    const updated = await this.holidayRepository.save(holiday);
    return plainToInstance(HolidayResponseDto, updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.holidayRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Holiday not found');
    }
  }

  async syncWithGoogle(): Promise<any> {
    const apiKey = this.configService.get<string>('TOKEN_API'); // User doc says TOKEN_API
    if (!apiKey) {
      throw new Error(
        'Google Calendar API Token (TOKEN_API) is not configured',
      );
    }

    const calendarId = 'es.ve%23holiday%40group.v.calendar.google.com'; // Venezuelan Holidays
    const year = new Date().getFullYear();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${year}-01-01T00:00:00Z&timeMax=${year}-12-31T23:59:59Z`;

    try {
      // Type the response as any or specific interface if available
      const response = await firstValueFrom(this.httpService.get<any>(url));
      const data = response.data;

      const items = data.items || [];
      const createdHolidays: Holiday[] = [];

      for (const item of items) {
        if (!item.start?.date) continue;

        const dateStr = item.start.date;
        const name = item.summary;
        const dateObj = new Date(dateStr);

        // Check existence
        const existing = await this.holidayRepository.findOne({
          where: { date: dateObj },
        });

        if (!existing) {
          const newHoliday = this.holidayRepository.create({
            name: name,
            date: dateObj,
            description: item.description || 'Imported from Google Calendar',
            isWorkingDay: false, // Holidays are non-working by default
          });
          const saved = await this.holidayRepository.save(newHoliday);
          createdHolidays.push(saved);
        }
      }

      return {
        message: 'Sync completed',
        importedCount: createdHolidays.length,
        totalEventsFound: items.length,
        data: items, // Return raw data as per doc
      };
    } catch (error) {
      this.logger.error('Failed to sync with Google Calendar', error);
      throw new Error(`Failed to sync holidays: ${error.message}`);
    }
  }
}
