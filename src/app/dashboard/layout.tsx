import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/layout/RightPanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#080a0e",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {children}
      </div>
      <RightPanel />
    </div>
  );
}
