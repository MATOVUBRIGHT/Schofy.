import { useAuth } from '../contexts/AuthContext';

export function useCurrentSchoolId() {
  const { schoolId } = useAuth();
  return schoolId;
}
