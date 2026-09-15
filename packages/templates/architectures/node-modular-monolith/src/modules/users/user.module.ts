import { Router } from 'express';

export interface UserDTO {
  id: string;
  name: string;
  module: 'users';
}

export function createUsersModule(): Router {
  const router = Router();
  router.get('/', (req, res) => {
    res.json({
      module: 'users-bounded-context',
      data: [{ id: 'u1', name: 'Domain User', module: 'users' }],
    });
  });
  return router;
}
