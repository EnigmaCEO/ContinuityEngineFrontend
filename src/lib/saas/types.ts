export type AccountType = "internal" | "client" | "demo";
export type AccountStatus = "active" | "pending" | "suspended";
export type UserStatus = "active" | "invited" | "disabled";
export type MembershipRole =
  | "super_admin"
  | "sce_operator"
  | "client_admin"
  | "client_member"
  | "client_viewer";
export type AccessRequestStatus = "pending" | "approved" | "rejected";

export interface Account {
  id: string;
  name: string;
  slug: string;
  accountType: AccountType;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface Membership {
  id: string;
  accountId: string;
  userId: string;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipDetail {
  membership: Membership;
  account: Account;
  user: User;
}

export interface SaasPermissions {
  isGlobalAdmin: boolean;
  isSceOperator: boolean;
  canViewGlobalModules: boolean;
  canManageSources: boolean;
  canManageAccounts: boolean;
}

export interface SaasMeResponse {
  user: User;
  activeAccount?: Account | null;
  memberships: MembershipDetail[];
  permissions: SaasPermissions;
  currentRole?: MembershipRole | null;
  sessionMode: string;
  sessionToken?: string | null;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  organization: string;
  roleTitle?: string | null;
  useCase?: string | null;
  status: AccessRequestStatus;
  reviewNote?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  linkedAccountId?: string | null;
  linkedUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}
