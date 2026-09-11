import '@fastify/jwt';

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: string;
  isAdmin: boolean;
  tokenVersion: number;
};

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}
