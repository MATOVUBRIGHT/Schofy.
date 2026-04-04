import { useState, useEffect, useCallback } from 'react';
import { userDBManager } from '../lib/database/UserDatabaseManager';
import { useAuth } from '../contexts/AuthContext';

export function useUserDB() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [user]);

  const add = useCallback(async <T extends { id?: string }>(
    storeName: string,
    data: T
  ): Promise<string | null> => {
    if (!user?.id) return null;
    try {
      return await userDBManager.add(user.id, storeName, data);
    } catch (error) {
      console.error(`Failed to add to ${storeName}:`, error);
      return null;
    }
  }, [user]);

  const put = useCallback(async <T extends { id: string }>(
    storeName: string,
    data: T
  ): Promise<string | null> => {
    if (!user?.id) return null;
    try {
      return await userDBManager.put(user.id, storeName, data);
    } catch (error) {
      console.error(`Failed to update ${storeName}:`, error);
      return null;
    }
  }, [user]);

  const get = useCallback(async (
    storeName: string,
    id: string
  ): Promise<any | null> => {
    if (!user?.id) return null;
    try {
      return await userDBManager.get(user.id, storeName, id);
    } catch (error) {
      console.error(`Failed to get from ${storeName}:`, error);
      return null;
    }
  }, [user]);

  const getAll = useCallback(async (
    storeName: string
  ): Promise<any[]> => {
    if (!user?.id) return [];
    try {
      return await userDBManager.getAll(user.id, storeName);
    } catch (error) {
      console.error(`Failed to get all from ${storeName}:`, error);
      return [];
    }
  }, [user]);

  const where = useCallback(async (
    storeName: string,
    indexName: string,
    value: any
  ): Promise<any[]> => {
    if (!user?.id) return [];
    try {
      return await userDBManager.where(user.id, storeName, indexName, value);
    } catch (error) {
      console.error(`Failed to query ${storeName}:`, error);
      return [];
    }
  }, [user]);

  const remove = useCallback(async (
    storeName: string,
    id: string
  ): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      await userDBManager.delete(user.id, storeName, id);
      return true;
    } catch (error) {
      console.error(`Failed to delete from ${storeName}:`, error);
      return false;
    }
  }, [user]);

  const count = useCallback(async (
    storeName: string
  ): Promise<number> => {
    if (!user?.id) return 0;
    try {
      return await userDBManager.count(user.id, storeName);
    } catch (error) {
      console.error(`Failed to count ${storeName}:`, error);
      return 0;
    }
  }, [user]);

  const clear = useCallback(async (
    storeName: string
  ): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      await userDBManager.clear(user.id, storeName);
      return true;
    } catch (error) {
      console.error(`Failed to clear ${storeName}:`, error);
      return false;
    }
  }, [user]);

  return {
    isReady,
    add,
    put,
    get,
    getAll,
    where,
    remove,
    count,
    clear,
  };
}

export function useStudents() {
  const { getAll, where, add, put, remove, isReady } = useUserDB();

  const loadStudents = useCallback(async () => {
    return await getAll('students');
  }, [getAll]);

  const getStudentsByClass = useCallback(async (classId: string) => {
    return await where('students', 'classId', classId);
  }, [where]);

  const getActiveStudents = useCallback(async () => {
    const students = await getAll('students');
    return students.filter((s: any) => s.status === 'active');
  }, [getAll]);

  const addStudent = useCallback(async (student: any) => {
    return await add('students', student);
  }, [add]);

  const updateStudent = useCallback(async (student: any) => {
    return await put('students', student);
  }, [put]);

  const deleteStudent = useCallback(async (id: string) => {
    return await remove('students', id);
  }, [remove]);

  return {
    isReady,
    loadStudents,
    getStudentsByClass,
    getActiveStudents,
    addStudent,
    updateStudent,
    deleteStudent,
  };
}

export function useStaff() {
  const { getAll, add, put, remove, isReady } = useUserDB();

  const loadStaff = useCallback(async () => {
    return await getAll('staff');
  }, [getAll]);

  const getActiveStaff = useCallback(async () => {
    const staff = await getAll('staff');
    return staff.filter((s: any) => s.status === 'active');
  }, [getAll]);

  const addStaff = useCallback(async (staffMember: any) => {
    return await add('staff', staffMember);
  }, [add]);

  const updateStaff = useCallback(async (staffMember: any) => {
    return await put('staff', staffMember);
  }, [put]);

  const deleteStaff = useCallback(async (id: string) => {
    return await remove('staff', id);
  }, [remove]);

  return {
    isReady,
    loadStaff,
    getActiveStaff,
    addStaff,
    updateStaff,
    deleteStaff,
  };
}

export function useClasses() {
  const { getAll, add, put, remove, isReady } = useUserDB();

  const loadClasses = useCallback(async () => {
    return await getAll('classes');
  }, [getAll]);

  const addClass = useCallback(async (classData: any) => {
    return await add('classes', classData);
  }, [add]);

  const updateClass = useCallback(async (classData: any) => {
    return await put('classes', classData);
  }, [put]);

  const deleteClass = useCallback(async (id: string) => {
    return await remove('classes', id);
  }, [remove]);

  return {
    isReady,
    loadClasses,
    addClass,
    updateClass,
    deleteClass,
  };
}

export function useFees() {
  const { getAll, where, add, put, isReady } = useUserDB();

  const loadFees = useCallback(async () => {
    return await getAll('fees');
  }, [getAll]);

  const getFeesByStudent = useCallback(async (studentId: string) => {
    return await where('fees', 'studentId', studentId);
  }, [where]);

  const addFee = useCallback(async (fee: any) => {
    return await add('fees', fee);
  }, [add]);

  const updateFee = useCallback(async (fee: any) => {
    return await put('fees', fee);
  }, [put]);

  return {
    isReady,
    loadFees,
    getFeesByStudent,
    addFee,
    updateFee,
  };
}

export function usePayments() {
  const { getAll, where, add, isReady } = useUserDB();

  const loadPayments = useCallback(async () => {
    return await getAll('payments');
  }, [getAll]);

  const getPaymentsByStudent = useCallback(async (studentId: string) => {
    return await where('payments', 'studentId', studentId);
  }, [where]);

  const addPayment = useCallback(async (payment: any) => {
    return await add('payments', payment);
  }, [add]);

  return {
    isReady,
    loadPayments,
    getPaymentsByStudent,
    addPayment,
  };
}
