import LayoutWithSidebar from "../layout-with-sidebar";

export default function PlantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}