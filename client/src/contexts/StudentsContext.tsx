import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Student } from '@schofy/shared';
import { userDBManager } from '../lib/database/UserDatabaseManager';
import { useAuth } from './AuthContext';

interface StudentsContextType {
  students: Student[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setIsInitialized(false);
      setAllStudents([]);
      return;
    }

    if (user?.id) {
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
      setAllStudents([]);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user?.id || !isInitialized) {
      setAllStudents([]);
      return;
    }

    const loadStudents = async () => {
      try {
        const data = await userDBManager.getAll(user.id, 'students');
        setAllStudents(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load students:', err);
        setError('Failed to load students');
        setAllStudents([]);
      }
    };

    loadStudents();

    const interval = setInterval(loadStudents, 3000);
    return () => clearInterval(interval);
  }, [user, isInitialized, refreshKey]);

  useEffect(() => {
    const handleStudentsUpdated = () => {
      setRefreshKey(k => k + 1);
    };
    const handleDataRefresh = () => {
      setRefreshKey(k => k + 1);
    };
    
    window.addEventListener('studentsUpdated', handleStudentsUpdated);
    window.addEventListener('dataRefresh', handleDataRefresh);
    
    return () => {
      window.removeEventListener('studentsUpdated', handleStudentsUpdated);
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const loading = authLoading || !isInitialized;

  const sortedStudents = useMemo(() => {
    return [...allStudents].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [allStudents]);

  return (
    <StudentsContext.Provider value={{ students: sortedStudents, loading, error, refresh }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
}

export function useActiveStudents() {
  const { students } = useStudents();
  return students.filter(s => s.status === 'active');
}

export function useCompletedStudents() {
  const { students } = useStudents();
  return students.filter(s => s.status === 'completed' || s.status === 'graduated');
}

export function useInactiveStudents() {
  const { students } = useStudents();
  return students.filter(s => s.status === 'inactive');
}
