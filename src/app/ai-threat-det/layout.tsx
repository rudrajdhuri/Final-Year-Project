import LayoutWithSidebar from '../layout-with-sidebar';

export default function AnimalDetectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}
