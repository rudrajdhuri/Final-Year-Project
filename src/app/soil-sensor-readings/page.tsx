import SoilCard from '../components/SoilCard';

export const metadata = {
  title: 'Soil Sensor Readings',
  description: 'Live soil sensor measurements (moisture, temperature, pH)'
};

export default function Page() {
  return (
    <div className="p-6">
  <h1 className="text-2xl font-semibold mb-6 text-black">Soil Sensor Readings</h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Spread the main soil readings postcard */}
        <div>
          <SoilCard />
        </div>

        {/* Sensor info moved down */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-medium mb-2 text-gray-900">Sensor Info</h2>
            <div className="text-sm text-gray-600">Model: SoilNode-01</div>
            <div className="text-sm text-gray-600">Battery: 86%</div>
            <div className="text-sm text-gray-600">Last Sync: a few seconds ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}
