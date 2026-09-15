import { userRepository, UserEntity } from '../repositories/user.repository.js';

export class UserService {
  async getAllUsers(): Promise<UserEntity[]> {
    return userRepository.findAll();
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    return userRepository.findById(id);
  }
}

export const userService = new UserService();
