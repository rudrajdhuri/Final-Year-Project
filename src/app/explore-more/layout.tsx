import LayoutWithSidebar from "../layout-with-sidebar";

export default function ExploreMoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}
