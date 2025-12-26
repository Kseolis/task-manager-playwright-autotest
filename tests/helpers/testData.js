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

export const generateUserData = () => {
  const ts = Date.now()
  return {
    email: `test${ts}@example.com`,
    firstName: 'Test',
    lastName: 'User',
  }
}

export const generateEditedUserData = () => {
  const ts = Date.now()
  return {
    email: `edited${ts}@example.com`,
    firstName: 'Edited',
    lastName: 'Name',
  }
}

export const generateStatusData = () => {
  const ts = Date.now()
  return {
    name: `Test Status ${ts}`,
    slug: `test-status-${ts}`,
  }
}

export const generateEditedStatusData = () => {
  const ts = Date.now()
  return {
    name: `Edited Status ${ts}`,
    slug: `edited-status-${ts}`,
  }
}

export const generateLabelData = () => {
  const ts = Date.now()
  return {
    name: `Test Label ${ts}`,
  }
}

export const generateEditedLabelData = () => {
  const ts = Date.now()
  return {
    name: `Edited Label ${ts}`,
  }
}

export const generateTaskData = () => {
  const ts = Date.now()
  return {
    title: `Test Task ${ts}`,
    content: `Description ${ts}`,
  }
}

export const generateEditedTaskData = () => {
  const ts = Date.now()
  return {
    title: `Edited Task ${ts}`,
    content: `Edited description ${ts}`,
  }
}
