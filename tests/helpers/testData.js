export const testUsers = {
  valid: {
    login: 'testuser',
    password: 'testpassword',
  },
  admin: {
    login: 'admin',
    password: '12345',
  },
  user1: {
    login: 'user1',
    password: 'pass1',
  },
  user2: {
    login: 'user2',
    password: 'pass2',
  },
}

export function generateUserData() {
  return {
    email: `test${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
  }
}

export function generateEditedUserData() {
  return {
    email: `edited${Date.now()}@example.com`,
    firstName: 'Edited',
    lastName: 'Name',
  }
}
