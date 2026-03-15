import LayoutWithSidebar from '../layout-with-sidebar';

export default function AiChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}