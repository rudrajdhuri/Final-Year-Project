import LayoutWithSidebar from "../layout-with-sidebar";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}