import LayoutWithSidebar from '../layout-with-sidebar';
export default function BotControlLayout({ children }: { children: React.ReactNode }) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}