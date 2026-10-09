import { Sidebar } from "@/components/layout/Sidebar";
import { PipGuide } from "@/components/mascot/PipGuide";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <PipGuide />
      <main className="min-w-0 lg:pl-64">{children}</main>
    </div>
  );
}
