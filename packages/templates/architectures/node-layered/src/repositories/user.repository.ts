export interface UserEntity {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export class UserRepository {
  private users: UserEntity[] = [
    {
      id: '1',
      email: 'admin@{{projectName}}.dev',
      name: 'System Administrator',
      createdAt: new Date(),
    },
  ];

  async findAll(): Promise<UserEntity[]> {
    return this.users;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) || null;
  }
}

export const userRepository = new UserRepository();
