import { userDBManager } from '../lib/database/UserDatabaseManager';
import { FeeStructure, Fee, FeeCategory } from '@schofy/shared';
import { v4 as uuidv4 } from 'uuid';

export interface FeeStructureWithTotal extends FeeStructure {
  totalAmount: number;
}

export async function getFeeStructuresByClass(userId: string, classId: string, term?: string, year?: string): Promise<FeeStructure[]> {
  const structures = await userDBManager.getAll(userId, 'feeStructures');
  
  return structures.filter((s: FeeStructure) => {
    if (s.classId !== classId) return false;
    if (term && s.term !== term) return false;
    if (year && s.year !== year) return false;
    return true;
  });
}

export async function getAllFeeStructures(userId: string, term?: string, year?: string): Promise<FeeStructure[]> {
  const structures = await userDBManager.getAll(userId, 'feeStructures');
  
  return structures.filter((s: FeeStructure) => {
    if (term && s.term !== term) return false;
    if (year && s.year !== year) return false;
    return true;
  });
}

export async function createFeeStructure(
  userId: string,
  classId: string,
  name: string,
  category: FeeCategory,
  amount: number,
  term: string,
  year: string,
  isRequired: boolean = true,
  description?: string
): Promise<FeeStructure> {
  const structure: FeeStructure = {
    id: uuidv4(),
    classId,
    name,
    category,
    amount,
    isRequired,
    term,
    year,
    description,
    createdAt: new Date().toISOString(),
  };

  await userDBManager.add(userId, 'feeStructures', structure);
  return structure;
}

export async function updateFeeStructure(userId: string, id: string, updates: Partial<FeeStructure>): Promise<void> {
  const existing = await userDBManager.get(userId, 'feeStructures', id);
  if (existing) {
    await userDBManager.put(userId, 'feeStructures', {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function deleteFeeStructure(userId: string, id: string): Promise<void> {
  await userDBManager.delete(userId, 'feeStructures', id);
}

export async function bulkCreateFeeStructures(
  userId: string,
  classId: string,
  structures: Omit<FeeStructure, 'id' | 'classId' | 'createdAt' | 'updatedAt'>[]
): Promise<FeeStructure[]> {
  const now = new Date().toISOString();
  const newStructures: FeeStructure[] = structures.map(s => ({
    ...s,
    id: uuidv4(),
    classId,
    createdAt: now,
  }));

  for (const structure of newStructures) {
    await userDBManager.add(userId, 'feeStructures', structure);
  }
  return newStructures;
}

export async function copyFeeStructuresToClass(
  userId: string,
  fromClassId: string,
  toClassId: string,
  term: string,
  year: string
): Promise<FeeStructure[]> {
  const sourceStructures = await getFeeStructuresByClass(userId, fromClassId, term, year);
  
  const newStructures: FeeStructure[] = sourceStructures.map(s => ({
    ...s,
    id: uuidv4(),
    classId: toClassId,
    term,
    year,
    createdAt: new Date().toISOString(),
    updatedAt: undefined,
  }));

  for (const structure of newStructures) {
    await userDBManager.add(userId, 'feeStructures', structure);
  }

  return newStructures;
}

export async function generateInvoicesFromStructure(
  userId: string,
  classId: string,
  term: string,
  year: string
): Promise<{ fees: Fee[]; studentsCount: number }> {
  const structures = await getFeeStructuresByClass(userId, classId, term, year);
  
  if (structures.length === 0) {
    return { fees: [], studentsCount: 0 };
  }

  const students = await userDBManager.getAll(userId, 'students');
  const activeStudents = students.filter((s: any) => s.classId === classId && s.status !== 'completed' && s.status !== 'graduated');

  if (activeStudents.length === 0) {
    return { fees: [], studentsCount: 0 };
  }

  const now = new Date().toISOString();
  const fees: Fee[] = [];

  for (const student of activeStudents) {
    for (const structure of structures) {
      if (structure.isRequired || structure.category === FeeCategory.TUITION || structure.category === FeeCategory.BOARDING) {
        fees.push({
          id: uuidv4(),
          studentId: student.id,
          classId,
          description: structure.name,
          amount: structure.amount,
          term,
          year,
          createdAt: now,
        });
      }
    }
  }

  for (const fee of fees) {
    await userDBManager.add(userId, 'fees', fee);
  }

  return { fees, studentsCount: activeStudents.length };
}

export async function getClassFeeSummary(userId: string, classId: string, term: string, year: string): Promise<{
  structures: FeeStructure[];
  totalPerStudent: number;
  requiredTotal: number;
  optionalTotal: number;
  studentCount: number;
}> {
  const structures = await getFeeStructuresByClass(userId, classId, term, year);
  const students = await userDBManager.getAll(userId, 'students');
  const activeStudents = students.filter((s: any) => s.classId === classId && s.status !== 'completed' && s.status !== 'graduated');

  const requiredTotal = structures.filter(s => s.isRequired).reduce((sum, s) => sum + s.amount, 0);
  const optionalTotal = structures.filter(s => !s.isRequired).reduce((sum, s) => sum + s.amount, 0);
  const totalPerStudent = requiredTotal + optionalTotal;

  return {
    structures,
    totalPerStudent,
    requiredTotal,
    optionalTotal,
    studentCount: activeStudents.length,
  };
}

export function getCategoryLabel(category: FeeCategory): string {
  const labels: Record<FeeCategory, string> = {
    [FeeCategory.TUITION]: 'Tuition',
    [FeeCategory.BOARDING]: 'Boarding',
    [FeeCategory.EXAM]: 'Examination',
    [FeeCategory.REGISTRATION]: 'Registration',
    [FeeCategory.UNIFORM]: 'Uniform',
    [FeeCategory.BOOKS]: 'Books & Materials',
    [FeeCategory.TRANSPORT]: 'Transport',
    [FeeCategory.ACTIVITY]: 'Activity Fee',
    [FeeCategory.OTHER]: 'Other',
  };
  return labels[category] || category;
}

export function getCategoryColor(category: FeeCategory): string {
  const colors: Record<FeeCategory, string> = {
    [FeeCategory.TUITION]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    [FeeCategory.BOARDING]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    [FeeCategory.EXAM]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    [FeeCategory.REGISTRATION]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    [FeeCategory.UNIFORM]: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    [FeeCategory.BOOKS]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    [FeeCategory.TRANSPORT]: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    [FeeCategory.ACTIVITY]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    [FeeCategory.OTHER]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  };
  return colors[category] || colors[FeeCategory.OTHER];
}
