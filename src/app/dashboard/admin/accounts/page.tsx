"use client";

import { useEffect, useState } from "react";

import {
  approveAccessRequest,
  createAccount,
  createMembership,
  createUser,
  fetchAdminBootstrap,
  rejectAccessRequest,
  updateMembershipRole,
} from "@/lib/saas/service";
import type { AccessRequest, Account, MembershipDetail, MembershipRole, User } from "@/lib/saas/types";

const membershipRoles: MembershipRole[] = [
  "account_owner",
  "security_admin",
  "developer",
  "operations_lead",
  "reviewer",
  "viewer",
  "client_admin",
  "client_member",
  "client_viewer",
  "super_admin",
  "sce_operator",
];

const card: React.CSSProperties = {
  background: "rgba(10,12,18,0.92)",
  border: "1px solid rgba(212,175,55,0.12)",
  borderRadius: 12,
  padding: 18,
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [memberships, setMemberships] = useState<MembershipDetail[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const bootstrap = await fetchAdminBootstrap();
      setAccounts(bootstrap.accounts);
      setUsers(bootstrap.users);
      setMemberships(bootstrap.memberships);
      setRequests(bootstrap.accessRequests);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  return (
    <div style={{ padding: "24px 20px 32px", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(212,175,55,0.72)" }}>
          ADMIN / ACCOUNTS
        </div>
        <h1 style={{ margin: "10px 0 8px", fontSize: 32, color: "#E2E8F0" }}>
          SaaS Foundation v1 Controls
        </h1>
        <p style={{ margin: 0, color: "rgba(203,213,225,0.72)", maxWidth: 760, lineHeight: 1.6 }}>
          Create accounts, users, and memberships manually, then review incoming access requests in
          the same operator UI.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        <CreateAccountCard onCreated={loadAll} />
        <CreateUserCard onCreated={loadAll} />
        <CreateMembershipCard accounts={accounts} users={users} onCreated={loadAll} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        <section style={card}>
          <SectionTitle title={`Accounts (${accounts.length})`} />
          <SimpleTable
            loading={loading}
            headers={["Name", "Slug", "Type", "Status"]}
            rows={accounts.map((account) => [account.name, account.slug, account.accountType, account.status])}
          />
        </section>
        <section style={card}>
          <SectionTitle title={`Users (${users.length})`} />
          <SimpleTable
            loading={loading}
            headers={["Name", "Email", "Status"]}
            rows={users.map((user) => [user.name, user.email, user.status])}
          />
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 16 }}>
        <section style={card}>
          <SectionTitle title={`Memberships (${memberships.length})`} />
          <MembershipTable
            loading={loading}
            memberships={memberships}
            onChanged={loadAll}
          />
        </section>
        <section style={card}>
          <SectionTitle title={`Access Requests (${requests.length})`} />
          <div style={{ display: "grid", gap: 10 }}>
            {loading ? (
              <div style={{ color: "rgba(148,163,184,0.72)" }}>Loading…</div>
            ) : requests.length === 0 ? (
              <div style={{ color: "rgba(148,163,184,0.72)" }}>No access requests yet.</div>
            ) : (
              requests.map((request) => (
                <AccessRequestRow
                  key={request.id}
                  request={request}
                  accounts={accounts}
                  onChanged={loadAll}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 12, fontSize: 12, letterSpacing: "0.14em", color: "rgba(212,175,55,0.7)" }}>
      {title}
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
  loading,
}: {
  headers: string[];
  rows: string[][];
  loading: boolean;
}) {
  if (loading) {
    return <div style={{ color: "rgba(148,163,184,0.72)" }}>Loading…</div>;
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              style={{
                textAlign: "left",
                fontSize: 11,
                color: "rgba(148,163,184,0.75)",
                paddingBottom: 8,
                borderBottom: "1px solid rgba(212,175,55,0.1)",
              }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.join("-")}-${index}`}>
            {row.map((cell) => (
              <td
                key={cell}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(212,175,55,0.06)",
                  fontSize: 13,
                  color: "#E2E8F0",
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CreateAccountCard({ onCreated }: { onCreated: () => Promise<void> }) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createAccount({
      name: String(data.get("name") || ""),
      slug: String(data.get("slug") || "") || undefined,
      accountType: String(data.get("accountType") || "client") as Account["accountType"],
      status: String(data.get("status") || "active") as Account["status"],
    });
    event.currentTarget.reset();
    await onCreated();
  }

  return (
    <form onSubmit={handleSubmit} style={card}>
      <SectionTitle title="Create Account" />
      <StackField label="Name" name="name" required />
      <StackField label="Slug" name="slug" />
      <SelectField label="Type" name="accountType" options={["client", "internal", "demo"]} />
      <SelectField label="Status" name="status" options={["active", "pending", "suspended"]} />
      <SubmitButton label="Create Account" />
    </form>
  );
}

function CreateUserCard({ onCreated }: { onCreated: () => Promise<void> }) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createUser({
      email: String(data.get("email") || ""),
      name: String(data.get("name") || ""),
      status: String(data.get("status") || "invited") as User["status"],
    });
    event.currentTarget.reset();
    await onCreated();
  }

  return (
    <form onSubmit={handleSubmit} style={card}>
      <SectionTitle title="Create User" />
      <StackField label="Name" name="name" required />
      <StackField label="Email" name="email" type="email" required />
      <SelectField label="Status" name="status" options={["active", "invited", "disabled"]} />
      <SubmitButton label="Create User" />
    </form>
  );
}

function CreateMembershipCard({
  accounts,
  users,
  onCreated,
}: {
  accounts: Account[];
  users: User[];
  onCreated: () => Promise<void>;
}) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createMembership({
      accountId: String(data.get("accountId") || ""),
      userId: String(data.get("userId") || ""),
      role: String(data.get("role") || "client_viewer") as MembershipRole,
    });
    event.currentTarget.reset();
    await onCreated();
  }

  return (
    <form onSubmit={handleSubmit} style={card}>
      <SectionTitle title="Create Membership" />
      <SelectField
        label="Account"
        name="accountId"
        options={accounts.map((account) => ({ value: account.id, label: account.name }))}
      />
      <SelectField
        label="User"
        name="userId"
        options={users.map((user) => ({ value: user.id, label: `${user.name} · ${user.email}` }))}
      />
      <SelectField
        label="Role"
        name="role"
        options={membershipRoles}
      />
      <SubmitButton label="Create Membership" />
    </form>
  );
}

function MembershipTable({
  memberships,
  loading,
  onChanged,
}: {
  memberships: MembershipDetail[];
  loading: boolean;
  onChanged: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string>("");

  async function handleRoleChange(membershipId: string, role: MembershipRole) {
    setBusyId(membershipId);
    try {
      await updateMembershipRole(membershipId, role);
      await onChanged();
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return <div style={{ color: "rgba(148,163,184,0.72)" }}>Loading...</div>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["User", "Account", "Role"].map((header) => (
            <th
              key={header}
              style={{
                textAlign: "left",
                fontSize: 11,
                color: "rgba(148,163,184,0.75)",
                paddingBottom: 8,
                borderBottom: "1px solid rgba(212,175,55,0.1)",
              }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {memberships.map((item) => (
          <tr key={item.membership.id}>
            <td style={tableCellStyle}>{item.user.email}</td>
            <td style={tableCellStyle}>{item.account.name}</td>
            <td style={tableCellStyle}>
              <select
                value={item.membership.role}
                disabled={busyId === item.membership.id}
                onChange={(event) => handleRoleChange(item.membership.id, event.target.value as MembershipRole)}
                style={{ ...fieldStyle, padding: "7px 9px", maxWidth: 190 }}
              >
                {membershipRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AccessRequestRow({
  request,
  accounts,
  onChanged,
}: {
  request: AccessRequest;
  accounts: Account[];
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handleApprove() {
    setBusy(true);
    try {
      const existing = accounts.find(
        (account) => account.name.toLowerCase() === request.organization.toLowerCase(),
      );
      await approveAccessRequest(request.id, {
        accountId: existing?.id,
        role: "client_admin",
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await rejectAccessRequest(request.id, { note: "Rejected from operator UI" });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid rgba(212,175,55,0.1)",
        borderRadius: 10,
        padding: 12,
        background: "rgba(15,23,42,0.45)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, color: "#E2E8F0", fontWeight: 600 }}>
            {request.name} · {request.organization}
          </div>
          <div style={{ fontSize: 12, color: "rgba(148,163,184,0.8)", marginTop: 4 }}>
            {request.email}
            {request.roleTitle ? ` · ${request.roleTitle}` : ""}
          </div>
          {request.useCase && (
            <div style={{ fontSize: 12, color: "rgba(203,213,225,0.75)", marginTop: 6 }}>
              {request.useCase}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: request.status === "pending" ? "#F5E7A1" : "#CBD5E1" }}>
          {request.status}
        </div>
      </div>
      {request.status === "pending" ? (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={handleApprove} disabled={busy} style={actionButton("#22C55E", busy)}>
            Approve
          </button>
          <button onClick={handleReject} disabled={busy} style={actionButton("#EF4444", busy)}>
            Reject
          </button>
        </div>
      ) : request.reviewNote ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "rgba(148,163,184,0.76)" }}>
          {request.reviewNote}
        </div>
      ) : null}
    </div>
  );
}

function StackField({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: "#CBD5E1" }}>{label}</span>
      <input name={name} type={type} required={required} style={fieldStyle} />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[] | { value: string; label: string }[];
}) {
  const normalized = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
  return (
    <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: "#CBD5E1" }}>{label}</span>
      <select name={name} style={fieldStyle}>
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      style={{
        marginTop: 6,
        border: "none",
        borderRadius: 10,
        background: "#D4AF37",
        color: "#111827",
        padding: "10px 12px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.22)",
  background: "rgba(15,23,42,0.74)",
  color: "#E2E8F0",
  padding: "10px 12px",
};

const tableCellStyle: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: "1px solid rgba(212,175,55,0.06)",
  fontSize: 13,
  color: "#E2E8F0",
};

function actionButton(color: string, disabled: boolean): React.CSSProperties {
  return {
    border: `1px solid ${color}40`,
    background: `${color}16`,
    color,
    borderRadius: 8,
    padding: "8px 12px",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}
