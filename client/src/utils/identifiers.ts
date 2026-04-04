import { db } from '../db/database';

function nextSequentialId(prefix: 'ADM' | 'EMP', existingValues: string[]) {
  const year = new Date().getFullYear();
  const matcher = new RegExp(`^${prefix}\\/${year}\\/(\\d+)$`);

  const highestSequence = existingValues.reduce((max, value) => {
    const match = value.match(matcher);
    if (!match) {
      return max;
    }

    return Math.max(max, Number.parseInt(match[1], 10));
  }, 0);

  return `${prefix}/${year}/${String(highestSequence + 1).padStart(4, '0')}`;
}

export async function getNextAdmissionNo(excludeStudentRecordId?: string) {
  const students = await db.students.toArray();
  const existingValues = students
    .filter((student) => student.id !== excludeStudentRecordId)
    .flatMap((student) => [student.admissionNo, student.studentId].filter(Boolean) as string[]);

  return nextSequentialId('ADM', existingValues);
}

export async function getNextEmployeeId(excludeStaffRecordId?: string) {
  const staff = await db.staff.toArray();
  const existingValues = staff
    .filter((staffMember) => staffMember.id !== excludeStaffRecordId)
    .map((staffMember) => staffMember.employeeId)
    .filter(Boolean);

  return nextSequentialId('EMP', existingValues);
}
