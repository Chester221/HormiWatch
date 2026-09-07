export class ProjectUnassignedEvent {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly projectName: string,
    public readonly projectId: string,
  ) {}
}
