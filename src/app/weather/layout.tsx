import LayoutWithSidebar from "../layout-with-sidebar";

export default function WeatherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}
