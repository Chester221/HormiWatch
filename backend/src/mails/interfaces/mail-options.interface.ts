export interface IMailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context?: Record<string, any>;
  attachments?: {
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
  }[];
}
