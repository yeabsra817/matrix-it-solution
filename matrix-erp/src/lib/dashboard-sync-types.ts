export type SyncedStaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  blockedAt?: Date | null;
  mustChangePwd?: boolean;
};

export type SyncedBasicUser = {
  id: string;
  fullName: string;
  email: string;
  blockedAt?: Date | null;
};

export type SyncedTeacherLink = {
  id: string;
  name: string;
  email: string;
  className: string;
};

export type SyncedClassmate = {
  id: string;
  name: string;
  className: string;
};

export type SyncedMarkRow = {
  id: string;
  subject: string;
  period: string;
  totalScore: number;
};

export type SyncedStudentProfile = {
  name: string;
  email: string;
  gradeBand: string;
  grade: string;
  classes: string[];
};

export type SyncedParentChild = {
  id: string;
  name: string;
  grade: string;
  classes: string[];
  teachers: SyncedTeacherLink[];
  marks: SyncedMarkRow[];
};

export type SyncedTeacherClass = {
  id: string;
  name: string;
  grade: string;
  gradeBand: string;
  subjects: string[];
  students: Array<{ id: string; name: string; email: string }>;
  parents: Array<{ id: string; name: string; email: string; childName: string }>;
};

export type AdminDashboardSync = {
  syncedAt: string;
  scope: "hr" | "admin";
  staff: SyncedStaffUser[];
  students: SyncedBasicUser[];
  parents: SyncedBasicUser[];
  teachers: Array<{ id: string; fullName: string; email: string }>;
  counts: {
    staff: number;
    students: number;
    parents: number;
    teachers: number;
  };
};

export type TeacherDashboardSync = {
  syncedAt: string;
  scope: "teacher";
  classes: SyncedTeacherClass[];
};

export type StudentDashboardSync = {
  syncedAt: string;
  scope: "student";
  profile: SyncedStudentProfile | null;
  teachers: SyncedTeacherLink[];
  classmates: SyncedClassmate[];
  marks: SyncedMarkRow[];
};

export type ParentDashboardSync = {
  syncedAt: string;
  scope: "parent";
  children: SyncedParentChild[];
};

export type StaffListDashboardSync = {
  syncedAt: string;
  scope: "staff-list";
  staff: Array<{ id: string; fullName: string; email: string; role: string }>;
};

export type DashboardSyncResult =
  | AdminDashboardSync
  | TeacherDashboardSync
  | StudentDashboardSync
  | ParentDashboardSync
  | StaffListDashboardSync;

export function isAdminSync(data: DashboardSyncResult): data is AdminDashboardSync {
  return data.scope === "hr" || data.scope === "admin";
}

export function isTeacherSync(data: DashboardSyncResult): data is TeacherDashboardSync {
  return data.scope === "teacher";
}

export function isStudentSync(data: DashboardSyncResult): data is StudentDashboardSync {
  return data.scope === "student";
}

export function isParentSync(data: DashboardSyncResult): data is ParentDashboardSync {
  return data.scope === "parent";
}

export function isStaffListSync(data: DashboardSyncResult): data is StaffListDashboardSync {
  return data.scope === "staff-list";
}
