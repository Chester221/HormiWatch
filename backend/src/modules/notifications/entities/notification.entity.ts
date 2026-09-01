import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'notification_preferences' })
export class NotificationPreference extends BaseUuidEntity {
  @Column({ name: 'email_active', default: true })
  emailActive: boolean;

  @Column({ name: 'whatsapp_active', default: false })
  whatsappActive: boolean;

  //   @OneToOne(() => User)
  //   @JoinColumn()
  //   usuario: User;
}
