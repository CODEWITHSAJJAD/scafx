import { Request, Response } from 'express';
import { userService } from '../services/user.service.js';

export async function getUsersHandler(req: Request, res: Response): Promise<void> {
  const users = await userService.getAllUsers();
  res.json({ success: true, data: users });
}

export async function getUserByIdHandler(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
}
