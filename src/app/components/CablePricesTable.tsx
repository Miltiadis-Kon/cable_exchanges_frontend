import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { fetchCableData, CableRecord, formatDateForApi } from '../api/kafkaApi';

interface CablePricesTableProps {
  date: Date;
}

export function CablePricesTable({ date }: CablePricesTableProps) {
  const [filterText, setFilterText] = useState('');
  const [cablePrices, setCablePrices] = useState<CableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatDateForApi(date);
        const res = await fetchCableData(dateStr);
        if (mounted) {
          // Sometimes data might be empty if there's no Kafka message for that date
          setCablePrices(res.data || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch cable prices');
          setCablePrices([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [date]);

  const filteredData = cablePrices.filter(item =>
    item.border.toLowerCase().includes(filterText.toLowerCase())
  );

  // Helper to get prices for all 24 hours safely
  const get24HourPrices = (record: CableRecord) => {
    return Array.from({ length: 24 }, (_, i) => {
      // Find the price for the specific hour. The times dictionary from Kafka 
      // might have keys like "1", "01", "01-02", etc.
      // We assume they match hour numbers for now, or you can adjust the logic.
      // Let's try direct map (assuming 1-24 or 0-23 keys)
      // Usually they are 1-based "1", "2" ... "24" in typical EU auction data
      const val = record.times[String(i + 1)] ?? record.times[String(i)] ?? 0;
      return typeof val === 'number' ? Number(val.toFixed(2)) : val;
    });
  };

  const exportToCSV = () => {
    const headers = ['Border', ...Array.from({ length: 24 }, (_, i) => `Hour ${i + 1}`)];
    const rows = filteredData.map(row => [row.border, ...get24HourPrices(row)]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cable-prices-${formatDateForApi(date)}.csv`;
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
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={loading || cablePrices.length === 0}>
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
          disabled={loading}
        />
      </div>

      <div className="overflow-x-auto min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[300px] text-red-500">
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No cable data available for this date.
          </div>
        ) : (
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
              {filteredData.map((row, idx) => {
                const prices = get24HourPrices(row);
                return (
                  <tr key={idx} className="border-b hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 border-r sticky left-0 bg-white z-10">
                      {row.border}
                    </td>
                    {prices.map((price, priceIdx) => (
                      <td key={priceIdx} className="px-3 py-3 text-center text-sm text-gray-700 border-r">
                        {price}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          Showing {filteredData.length} of {cablePrices.length} borders
        </p>
      </div>
    </div>
  );
}