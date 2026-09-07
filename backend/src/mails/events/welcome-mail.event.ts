export class WelcomeMailEvent {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly lastName: string,
    public readonly year: string, // Or number, but template uses it as var
  ) {}
}
