export class ProjectAssignedEvent {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly projectName: string,
    public readonly projectDescription: string,
    public readonly projectId: string,
    public readonly startDate?: string,
    public readonly poolHours?: number,
  ) {}
}
