import type { MembershipRole, SaasMeResponse, SaasPermissions } from "./types";

export const VIEW_AS_STORAGE_KEY = "sce_view_as_role";

export const viewAsRoles: MembershipRole[] = [
  "super_admin",
  "sce_operator",
  "account_owner",
  "security_admin",
  "developer",
  "operations_lead",
  "reviewer",
  "viewer",
  "client_admin",
  "client_member",
  "client_viewer",
];

const accountManagerRoles: MembershipRole[] = ["super_admin", "sce_operator", "account_owner", "security_admin", "client_admin"];
const projectManagerRoles: MembershipRole[] = ["super_admin", "sce_operator", "account_owner", "security_admin", "client_admin"];
const assetEditorRoles: MembershipRole[] = [
  "super_admin",
  "sce_operator",
  "account_owner",
  "security_admin",
  "developer",
  "operations_lead",
  "client_admin",
  "client_member",
];
const scanRoles: MembershipRole[] = ["super_admin", "sce_operator", "account_owner", "security_admin", "client_admin", "client_member"];
const controlGeneratorRoles: MembershipRole[] = ["super_admin", "sce_operator", "account_owner", "security_admin", "client_admin"];
const evidenceSubmitterRoles: MembershipRole[] = [
  "super_admin",
  "sce_operator",
  "account_owner",
  "security_admin",
  "developer",
  "operations_lead",
  "client_admin",
  "client_member",
];
const controlVerifierRoles: MembershipRole[] = ["super_admin", "sce_operator", "account_owner", "reviewer", "client_admin"];

export function isViewAsAdmin(role: MembershipRole | null | undefined): boolean {
  return role === "super_admin" || role === "sce_operator";
}

export function isViewAsRole(value: string | null | undefined): value is MembershipRole {
  return viewAsRoles.includes(value as MembershipRole);
}

export function permissionsForRole(role: MembershipRole | null | undefined): SaasPermissions {
  const effectiveRole = role ?? null;
  const isGlobalAdmin = effectiveRole === "super_admin";
  const isSceOperator = effectiveRole === "sce_operator";
  const isInternalAdmin = isGlobalAdmin || isSceOperator;

  return {
    isGlobalAdmin,
    isSceOperator,
    canViewGlobalModules: isInternalAdmin,
    canManageSources: isInternalAdmin,
    canManageAccounts: isInternalAdmin,
    canManageAccount: accountManagerRoles.includes(effectiveRole as MembershipRole),
    canManageProjects: projectManagerRoles.includes(effectiveRole as MembershipRole),
    canEditAssets: assetEditorRoles.includes(effectiveRole as MembershipRole),
    canRunScans: scanRoles.includes(effectiveRole as MembershipRole),
    canGenerateControls: controlGeneratorRoles.includes(effectiveRole as MembershipRole),
    canSubmitEvidence: evidenceSubmitterRoles.includes(effectiveRole as MembershipRole),
    canVerifyControls: controlVerifierRoles.includes(effectiveRole as MembershipRole),
    canViewOnly: effectiveRole === "viewer" || effectiveRole === "client_viewer",
  };
}

export function withEffectiveRole(me: SaasMeResponse, previewRole: MembershipRole | null): SaasMeResponse {
  const realRole = me.realRole ?? me.currentRole ?? null;
  const safePreviewRole = isViewAsAdmin(realRole) ? previewRole : null;
  const effectiveRole = safePreviewRole ?? realRole;

  return {
    ...me,
    realRole,
    effectiveRole,
    previewRole: safePreviewRole,
    isPreviewingRole: safePreviewRole !== null,
    currentRole: effectiveRole,
    permissions: safePreviewRole ? permissionsForRole(effectiveRole) : me.permissions,
  };
}
