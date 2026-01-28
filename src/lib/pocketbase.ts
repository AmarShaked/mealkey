import PocketBase from 'pocketbase';

// Initialize PocketBase client
export const pb = new PocketBase('https://pastacalc.fly.dev');

// TypeScript types for collections
export interface Student {
  id?: string;
  name: string;
  pin: string;
  balance: number;
  allergies: string;
  parent_id: string;
  created?: string;
  updated?: string;
}

export interface Transaction {
  id?: string;
  parent_id: string;
  amount: number;
  date: string;
  created?: string;
  updated?: string;
}

export interface DailyLog {
  id?: string;
  student_id: string;
  date: string;
  status: 'eaten';
  created?: string;
  updated?: string;
  expand?: {
    student_id: Student;
  };
}

// Auth helpers
export const loginParent = async (email: string, password: string) => {
  return await pb.collection('mealkey_parents').authWithPassword(email, password);
};

export const signupParent = async (email: string, password: string, passwordConfirm: string) => {
  const data = {
    email,
    password,
    passwordConfirm,
    emailVisibility: true,
  };
  return await pb.collection('mealkey_parents').create(data);
};

export const logout = () => {
  pb.authStore.clear();
};

export const isAuthenticated = () => {
  return pb.authStore.isValid;
};

// Student operations
export const getStudentByPin = async (pin: string): Promise<Student | null> => {
  try {
    const records = await pb.collection('mealkey_students').getList<Student>(1, 1, {
      filter: `pin = "${pin}"`,
    });
    return records.items[0] || null;
  } catch (error) {
    console.error('Error fetching student:', error);
    return null;
  }
};

export const createStudentForParent = async (
  name: string,
  pin: string,
  allergies: string,
  parentId: string
) => {
  const data: Student = {
    name,
    pin,
    allergies,
    parent_id: parentId,
    balance: 0,
  };

  return await pb.collection('mealkey_students').create(data);
};

export const updateStudentBalance = async (studentId: string, newBalance: number) => {
  return await pb.collection('mealkey_students').update(studentId, { balance: newBalance });
};

export const updateStudentAllergies = async (studentId: string, allergies: string) => {
  return await pb.collection('mealkey_students').update(studentId, { allergies });
};

// Transaction operations
export const createTransaction = async (
  parentId: string,
  studentId: string,
  amount: number
) => {
  // create transaction record
  const data: Transaction = {
    parent_id: parentId,
    amount,
    date: new Date().toISOString(),
  };
  const transaction = await pb.collection('mealkey_transactions').create(data);

  // increment the student's balance by the purchased amount
  const student = await pb.collection('mealkey_students').getOne<Student>(studentId);
  const newBalance = (student.balance || 0) + amount;
  await updateStudentBalance(studentId, newBalance);

  return transaction;
};

// Daily log operations
export const createDailyLog = async (studentId: string) => {
  const data: DailyLog = {
    student_id: studentId,
    date: new Date().toISOString().split('T')[0],
    status: 'eaten',
  };
  return await pb.collection('mealkey_daily_logs').create(data);
};

export const getTodayLogs = async () => {
  return await pb.collection('mealkey_daily_logs').getList<DailyLog>(1, 50, {
    filter: `date >= @todayStart && created <= @todayEnd`,
    expand: 'student_id',
    sort: '-created',
  });
};

// Get student's meal history
export const getStudentMealHistory = async (studentId: string, limit = 30) => {
  return await pb.collection('mealkey_daily_logs').getList<DailyLog>(1, limit, {
    filter: `student_id = "${studentId}"`,
    sort: '-updated',
  });
};

// Get children for parent
export const getParentChildren = async (parentId: string) => {
  return await pb.collection('mealkey_students').getList<Student>(1, 50, {
    filter: `parent_id = "${parentId}"`,
  });
};
