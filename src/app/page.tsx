import DashboardLayout from './layout-with-sidebar';
import DashboardContent from './components/DashboardContent';

export default function Home() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
