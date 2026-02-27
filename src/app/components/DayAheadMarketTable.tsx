import { Download } from 'lucide-react';
import { Button } from './ui/button';

interface MarketPriceData {
  time: string;
  AL: number;
  AT: number;
  CZ: number;
  DE: number;
  HR: number;
  HU: number;
  MK: number;
  RO: number;
  RS: number;
  SI: number;
  SK: number;
  XK: number;
}

// Function to generate mock data based on date
const generateMarketPrices = (date: Date): MarketPriceData[] => {
  const seed = date.getTime();
  const random = (min: number, max: number, hour: number, country: number) => {
    const x = Math.sin(seed + hour * 100 + country * 1000) * 10000;
    return Number((min + ((x - Math.floor(x)) * (max - min))).toFixed(1));
  };

  return Array.from({ length: 24 }, (_, hour) => ({
    time: `${String(hour).padStart(2, '0')}-${String(hour + 1).padStart(2, '0')}`,
    AL: random(0, 140, hour, 1),
    AT: random(60, 110, hour, 2),
    CZ: random(55, 105, hour, 3),
    DE: random(50, 100, hour, 4),
    HR: random(60, 110, hour, 5),
    HU: random(55, 110, hour, 6),
    MK: random(0, 80, hour, 7),
    RO: random(0, 110, hour, 8),
    RS: random(0, 120, hour, 9),
    SI: random(60, 110, hour, 10),
    SK: random(55, 105, hour, 11),
    XK: random(0, 140, hour, 12),
  }));
};

const countries = ['AL', 'AT', 'CZ', 'DE', 'HR', 'HU', 'MK', 'RO', 'RS', 'SI', 'SK', 'XK'];

interface DayAheadMarketTableProps {
  date: Date;
}

export function DayAheadMarketTable({ date }: DayAheadMarketTableProps) {
  const marketPrices = generateMarketPrices(date);

  const exportToCSV = () => {
    const headers = ['Time', ...countries];
    const rows = marketPrices.map(row => [
      row.time,
      ...countries.map(country => row[country as keyof Omit<MarketPriceData, 'time'>])
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-prices-${date.toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Day Ahead Market Prices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Data for {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r sticky left-0 bg-gray-50 z-10">
                Time
              </th>
              {countries.map((country) => (
                <th key={country} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r min-w-[70px]">
                  {country}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {marketPrices.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-green-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900 border-r sticky left-0 bg-white z-10">
                  {row.time}
                </td>
                {countries.map((country) => (
                  <td key={country} className="px-4 py-3 text-center text-sm text-gray-700 border-r">
                    {row[country as keyof Omit<MarketPriceData, 'time'>]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}