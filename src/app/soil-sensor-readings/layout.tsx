import DashboardLayout from '../layout-with-sidebar';

export default function SoilLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
