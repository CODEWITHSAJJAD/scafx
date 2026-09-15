import { useState } from 'react';
import { UserModel } from '../models/user.model';

export function useUserViewModel() {
  const [user, setUser] = useState<UserModel>({
    id: '1',
    name: 'Lead Developer',
    role: 'Architect',
  });

  const updateRole = (newRole: string) => {
    setUser((prev) => ({ ...prev, role: newRole }));
  };

  return {
    user,
    updateRole,
  };
}
