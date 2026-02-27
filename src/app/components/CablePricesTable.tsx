import { useState } from 'react';
import { Download } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface CablePriceData {
  border: string;
  prices: number[];
}

// Function to generate mock data based on date
const generateCablePrices = (date: Date): CablePriceData[] => {
  const seed = date.getTime();
  const random = (min: number, max: number, index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return min + ((x - Math.floor(x)) * (max - min));
  };

  return [
    { border: 'ALGR', prices: Array.from({ length: 24 }, (_, i) => Number(random(0, 50, i * 1).toFixed(2))) },
    { border: 'ALME', prices: Array.from({ length: 24 }, (_, i) => Number(random(0, 5, i * 2).toFixed(2))) },
    { border: 'BAHR', prices: Array.from({ length: 24 }, (_, i) => Number(random(0, 5, i * 3).toFixed(2))) },
    { border: 'BAME', prices: Array.from({ length: 24 }, (_, i) => Number(random(0, 1, i * 4).toFixed(2))) },
    { border: 'GRAL', prices: Array.from({ length: 24 }, () => 0) },
    { border: 'GRMK', prices: Array.from({ length: 24 }, (_, i) => Number(random(0, 7, i * 5).toFixed(2))) },
    { border: 'GRTR', prices: Array.from({ length: 24 }, (_, i) => Number(random(0, 8, i * 6).toFixed(2))) },
    { border: 'HRBA', prices: Array.from({ length: 24 }, () => 0) },
    { border: 'MEAL', prices: Array.from({ length: 24 }, (_, i) => Number(random(0, 2, i * 7).toFixed(2))) },
    { border: 'MEBA', prices: Array.from({ length: 24 }, (_, i) => Number(random(0, 1, i * 8).toFixed(2))) },
  ];
};

interface CablePricesTableProps {
  date: Date;
}

export function CablePricesTable({ date }: CablePricesTableProps) {
  const [filterText, setFilterText] = useState('');
  const cablePrices = generateCablePrices(date);
  
  const filteredData = cablePrices.filter(item => 
    item.border.toLowerCase().includes(filterText.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Border', ...Array.from({ length: 24 }, (_, i) => `Hour ${i + 1}`)];
    const rows = filteredData.map(row => [row.border, ...row.prices]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cable-prices-${date.toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Cable Prices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Data for {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <Input
          type="text"
          placeholder="Search by border..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r sticky left-0 bg-gray-50 z-10">
                Border
              </th>
              {Array.from({ length: 24 }, (_, i) => (
                <th key={i + 1} className="px-3 py-3 text-center text-sm font-semibold text-gray-700 border-r min-w-[60px]">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-blue-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900 border-r sticky left-0 bg-white z-10">
                  {row.border}
                </td>
                {row.prices.map((price, priceIdx) => (
                  <td key={priceIdx} className="px-3 py-3 text-center text-sm text-gray-700 border-r">
                    {price}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          Showing {filteredData.length} of {cablePrices.length} borders
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            Previous
          </Button>
          <Button variant="ghost" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}