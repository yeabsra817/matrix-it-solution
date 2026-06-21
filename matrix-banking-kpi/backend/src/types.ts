export type UserRole =
  | 'SUPER_ADMIN'
  | 'DIRECTOR_DEPOSIT_MOBILIZATION'
  | 'DISTRICT_MANAGER'
  | 'BRANCH_MANAGER'
  | 'CUSTOMER_SERVICE_MANAGER'
  | 'CUSTOMER_SERVICE_OFFICER'
  | 'CASHIER'
  | 'CONTROLLER'
  | 'CREDIT_RELATIONSHIP_MANAGER';

export type KpiType =
  | 'DEPOSIT_MOBILIZATION'
  | 'NEW_ACCOUNTS'
  | 'MOBILE_BANKING'
  | 'CARD_BANKING'
  | 'QR_BANKING';

export type EntryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  bankId: string | null;
  districtId: string | null;
  branchId: string | null;
}

export interface User {
  id: string;
  bank_id: string | null;
  district_id: string | null;
  branch_id: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  must_change_password: boolean;
  created_at: Date;
}

export const STAFF_ROLES: UserRole[] = [
  'CUSTOMER_SERVICE_MANAGER',
  'CUSTOMER_SERVICE_OFFICER',
  'CASHIER',
  'CONTROLLER',
  'CREDIT_RELATIONSHIP_MANAGER',
];

export const MANAGER_ROLES: UserRole[] = [
  'BRANCH_MANAGER',
  'DISTRICT_MANAGER',
  'DIRECTOR_DEPOSIT_MOBILIZATION',
];

export const KPI_TYPES: KpiType[] = [
  'DEPOSIT_MOBILIZATION',
  'NEW_ACCOUNTS',
  'MOBILE_BANKING',
  'CARD_BANKING',
  'QR_BANKING',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  DIRECTOR_DEPOSIT_MOBILIZATION: 'Director Deposit Mobilization',
  DISTRICT_MANAGER: 'District Manager',
  BRANCH_MANAGER: 'Branch Manager',
  CUSTOMER_SERVICE_MANAGER: 'Customer Service Manager',
  CUSTOMER_SERVICE_OFFICER: 'Customer Service Officer',
  CASHIER: 'Cashier',
  CONTROLLER: 'Controller',
  CREDIT_RELATIONSHIP_MANAGER: 'Credit Relationship Manager',
};

export const KPI_LABELS: Record<KpiType, string> = {
  DEPOSIT_MOBILIZATION: 'Deposit Mobilization',
  NEW_ACCOUNTS: 'New Accounts',
  MOBILE_BANKING: 'Mobile Banking',
  CARD_BANKING: 'Card Banking',
  QR_BANKING: 'QR Banking',
};

export const USER_CREATOR_ROLES: UserRole[] = ['BRANCH_MANAGER', 'DISTRICT_MANAGER'];

export const BRANCH_ASSIGNABLE_ROLES: UserRole[] = [
  'CUSTOMER_SERVICE_MANAGER',
  'CUSTOMER_SERVICE_OFFICER',
  'CASHIER',
  'CONTROLLER',
  'CREDIT_RELATIONSHIP_MANAGER',
];

export const DISTRICT_ASSIGNABLE_ROLES: UserRole[] = [
  'BRANCH_MANAGER',
  ...BRANCH_ASSIGNABLE_ROLES,
];

export const SUPER_ADMIN_CREATABLE_ROLES: UserRole[] = [
  'DISTRICT_MANAGER',
  'DIRECTOR_DEPOSIT_MOBILIZATION',
];

export const PERFORMANCE_VIEW_ROLES: UserRole[] = [
  'DIRECTOR_DEPOSIT_MOBILIZATION',
  'DISTRICT_MANAGER',
  'BRANCH_MANAGER',
  ...STAFF_ROLES,
];
