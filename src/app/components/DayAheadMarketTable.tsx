import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { fetchExchangeData, ExchangeHourData, formatDateForApi } from '../api/kafkaApi';

const countries = ['AL', 'AT', 'CZ', 'DE', 'HR', 'HU', 'MK', 'RO', 'RS', 'SI', 'SK', 'XK'];

interface DayAheadMarketTableProps {
  date: Date;
}

export function DayAheadMarketTable({ date }: DayAheadMarketTableProps) {
  const [marketPrices, setMarketPrices] = useState<ExchangeHourData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatDateForApi(date);
        const res = await fetchExchangeData(dateStr);
        if (mounted) {
          setMarketPrices(res.data || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch exchange prices');
          setMarketPrices([]);
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

  const exportToCSV = () => {
    const headers = ['Time', ...countries];
    const rows = marketPrices.map(row => [
      row.time,
      ...countries.map(country => row[country])
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-prices-${formatDateForApi(date)}.csv`;
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
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={loading || marketPrices.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[300px] text-red-500">
            {error}
          </div>
        ) : marketPrices.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No exchange market data available for this date.
          </div>
        ) : (
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
                  {countries.map((country) => {
                    const val = row[country];
                    const numVal = typeof val === 'number' ? Number(val.toFixed(2)) : val;
                    return (
                      <td key={country} className="px-4 py-3 text-center text-sm text-gray-700 border-r">
                        {numVal ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}