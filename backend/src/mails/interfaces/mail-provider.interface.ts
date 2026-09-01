import { IMailOptions } from './mail-options.interface';

export const MAIL_PROVIDER = 'MAIL_PROVIDER';

export interface IMailProvider {
  sendMail(options: IMailOptions): Promise<void>;
}
