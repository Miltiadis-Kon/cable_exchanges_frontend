import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { CablePricesTable } from './components/CablePricesTable';
import { DayAheadMarketTable } from './components/DayAheadMarketTable';
import { PnLTable } from './components/PnLTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from './components/ui/popover';
import { Button } from './components/ui/button';
import { Calendar } from './components/ui/calendar';

export default function App() {
  const [date, setDate] = useState<Date>(new Date(2026, 1, 28)); // February 28, 2026

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Power Market Preview
              </h1>
              <p className="text-gray-600">
                Cable and exchange prices for the European power market
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Selected Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(date, 'MMM dd, yyyy')}
                </p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal shadow-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <Tabs defaultValue="cable" className="w-full">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="cable" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Cable Prices
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Day Ahead Market
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cable" className="mt-6">
            <CablePricesTable date={date} />
          </TabsContent>
          
          <TabsContent value="market" className="mt-6 space-y-6">
            <DayAheadMarketTable date={date} />
            <PnLTable date={date} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}