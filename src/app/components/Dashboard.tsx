// This component is deprecated - use DashboardContent with layout-with-sidebar instead
// Kept for compatibility but should not be used

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
        <h2 className="font-semibold">Deprecated Component</h2>
        <p>This Dashboard component is deprecated. Please use DashboardContent with layout-with-sidebar.</p>
      </div>
    </div>
  );
}