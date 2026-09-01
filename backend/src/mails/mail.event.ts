export class EmailEvent {
  constructor(
    public readonly to: string,
    public readonly subject: string,
    public readonly template: string,
    public readonly context: any,
    public readonly attachments?: {
      filename: string;
      content: Buffer;
      contentType?: string;
    }[],
  ) {}
}
