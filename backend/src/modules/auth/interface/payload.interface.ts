export interface IJwtPayload {
  sub: string;
  role: string;
}

export interface IActiveUser {
  userId: string;
  role: string;
}
