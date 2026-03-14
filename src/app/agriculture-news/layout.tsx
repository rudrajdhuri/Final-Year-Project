import LayoutWithSidebar from "../layout-with-sidebar";

export default function AgricultureNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}