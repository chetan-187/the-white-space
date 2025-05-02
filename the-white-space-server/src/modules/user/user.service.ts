import { User } from './user.types';
import { generateUserName } from './user.utils';

let users: Record<string, User> = {};

export const UserService = {
  addUser(userId: string): User {
    const user = {
      id: userId,
      name: generateUserName(),
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
    users[userId] = user;
    return user;
  },

  removeUser(userId: string) {
    delete users[userId];
  },

  getUsers() {
    return users;
  },

  isUserExists(userId: string) {
    return users[userId];
  }
};
