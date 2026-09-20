export type Role =
  | "SUPER_ADMIN"
  | "COLLEGE_ADMIN"
  | "PRINCIPAL"
  | "HOD"
  | "FACULTY"
  | "ACCOUNTANT"
  | "LIBRARIAN"
  | "WARDEN"
  | "TRANSPORT_MANAGER"
  | "STUDENT"
  | "PARENT";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hodId?: string; // Reference to Faculty
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  durationYears: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  courseId: string;
  semester: number;
  credits: number;
}

export interface Student {
  id: string;
  userId: string;
  enrollmentNumber: string;
  courseId: string;
  currentSemester: number;
  dateOfAdmission: Date;
}

export interface Faculty {
  id: string;
  userId: string;
  employeeId: string;
  departmentId: string;
  designation: string;
  joiningDate: Date;
}
