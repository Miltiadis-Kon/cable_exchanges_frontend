import { useState, useMemo } from 'react';
import { Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface PnLData {
  time: string;
  [key: string]: number | string;
}

// Function to generate mock PnL data based on date
const generatePnLData = (date: Date): PnLData[] => {
  const seed = date.getTime();
  const random = (min: number, max: number, hour: number, border: number) => {
    const x = Math.sin(seed + hour * 50 + border * 500) * 10000;
    return Number((min + ((x - Math.floor(x)) * (max - min))).toFixed(1));
  };

  return Array.from({ length: 24 }, (_, hour) => {
    const data: PnLData = {
      time: `${String(hour).padStart(2, '0')}-${String(hour + 1).padStart(2, '0')}`,
      ALGR: random(500, 3500, hour, 1),
      ALME: random(-600, -100, hour, 2),
      BAHR: random(200, 1300, hour, 3),
      BAME: random(50, 220, hour, 4),
      GRAL: 0,
      GRMK: random(200, 850, hour, 5),
      GRTR: random(-350, -50, hour, 6),
      HRBA: 0,
      MEAL: random(100, 550, hour, 7),
      MEBA: random(60, 290, hour, 8),
    };
    return data;
  });
};

const borders = ['ALGR', 'ALME', 'BAHR', 'BAME', 'GRAL', 'GRMK', 'GRTR', 'HRBA', 'MEAL', 'MEBA'];

type SortDirection = 'asc' | 'desc' | null;

interface PnLTableProps {
  date: Date;
}

export function PnLTable({ date }: PnLTableProps) {
  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const pnlData = generatePnLData(date);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = pnlData;

    // Filter by search text (searches in time column)
    if (searchText) {
      filtered = pnlData.filter(row =>
        row.time.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Sort data
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn] as number;
        const bVal = b[sortColumn] as number;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [pnlData, searchText, sortColumn, sortDirection]);

  const getCellColor = (value: number) => {
    if (value > 2000) return 'bg-green-100 text-green-800 font-medium';
    if (value > 1000) return 'bg-green-50 text-green-700';
    if (value > 0) return 'text-green-600';
    if (value < -200) return 'bg-red-100 text-red-800 font-medium';
    if (value < 0) return 'bg-red-50 text-red-700';
    return 'text-gray-500';
  };

  const exportToCSV = () => {
    const headers = ['Time', ...borders];
    const rows = filteredAndSortedData.map(row => [
      row.time,
      ...borders.map(border => row[border])
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnl-${date.toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4 text-blue-600" />;
    return <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="w-full bg-white rounded-lg border shadow-sm mt-6">
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profit & Loss (PnL) by Flow</h2>
            <p className="text-sm text-gray-600 mt-1">
              Flow earnings for {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Input
          type="text"
          placeholder="Search by time period (e.g., 08, 14-15)..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r sticky left-0 bg-gray-50 z-10">
                Time
              </th>
              {borders.map((border) => (
                <th
                  key={border}
                  className={`px-4 py-3 text-center text-sm font-semibold border-r cursor-pointer hover:bg-gray-100 transition-colors min-w-[90px] ${border === 'TOTAL' ? 'bg-blue-100' : 'text-gray-700'
                    }`}
                  onClick={() => handleSort(border)}
                >
                  <div className="flex items-center justify-center gap-1">
                    {border}
                    {getSortIcon(border)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-purple-50/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900 border-r sticky left-0 bg-white z-10">
                  {row.time}
                </td>
                {borders.map((border) => {
                  const value = row[border] as number;
                  return (
                    <td
                      key={border}
                      className={`px-4 py-3 text-center text-sm border-r ${getCellColor(value)} ${border === 'TOTAL' ? 'font-semibold bg-blue-50' : ''
                        }`}
                    >
                      {value >= 0 ? '+' : ''}{value.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedData.length} of {pnlData.length} time periods
        </p>
        <p className="text-sm text-gray-500">
          Click column headers to sort
        </p>
      </div>
    </div>
  );
}
