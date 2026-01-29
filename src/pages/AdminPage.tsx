import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayLogs, getMealsPurchasedThisMonth, getAllStudents, pb, type DailyLog } from '@/lib/pocketbase';
import { TrendingUp, Users, Sparkles, Egg, Milk, Candy, Leaf, Bean, Wheat, CircleDot, Nut, AlertCircle } from 'lucide-react';

const ALLERGY_PRESETS: { value: string; label: string; Icon: React.ComponentType<React.SVGAttributes<SVGSVGElement>> }[] = [
  { value: 'ביצים', label: 'ביצים', Icon: Egg },
  { value: 'חלב', label: 'חלב', Icon: Milk },
  { value: 'סוכר', label: 'סוכר', Icon: Candy },
  { value: 'תירס', label: 'תירס', Icon: Leaf },
  { value: 'סויה', label: 'סויה', Icon: Bean },
  { value: 'גלוטן', label: 'גלוטן', Icon: Wheat },
  { value: 'בוטנים', label: 'בוטנים', Icon: CircleDot },
  { value: 'אגוזים', label: 'אגוזים', Icon: Nut },
];

function parseAllergies(str: string): string[] {
  return str
    .split(/[,،\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
import {
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export default function AdminPage() {
  const [, setTodayLogs] = useState<DailyLog[]>([]);
  const [liveFeed, setLiveFeed] = useState<Array<{ id: string; name: string; time: string }>>([]);
  const [stats, setStats] = useState({
    mealsServed: 0,
    mealsPurchasedThisMonth: 0,
    predictedLoad: 0,
  });
  const [allergyCounts, setAllergyCounts] = useState<Record<string, number>>({});
  // Mock: weekly meals purchased this month + previous month total for comparison
  const mealsChartData = [
    { label: 'שבוע 1', meals: 52, month: 'החודש' },
    { label: 'שבוע 2', meals: 23, month: 'החודש' },
    { label: 'שבוע 3', meals: 61, month: 'החודש' },
    { label: 'שבוע 4', meals: 79, month: 'החודש' },
    { label: 'שבוע 5', meals: 25, month: 'החודש' },
    { label: 'שבוע 6', meals: 90, month: 'החודש' },
    { label: 'שבוע 7', meals: 80, month: 'החודש' },
    { label: 'שבוע 8', meals: 100, month: 'החודש' },
    { label: 'שבוע 9', meals: 200, month: 'החודש' },
    { label: 'שבוע 10', meals: 110, month: 'החודש' },
    { label: 'שבוע 11', meals: 115, month: 'החודש' },
    { label: 'שבוע 12', meals: 120, month: 'החודש' },
  ];

  const weekdayHeatmap = [
    { key: 'sun', label: 'ראשון', value: 85 },
    { key: 'mon', label: 'שני', value: 92 },
    { key: 'tue', label: 'שלישי', value: 75 },
    { key: 'wed', label: 'רביעי', value: 60 },
    { key: 'thu', label: 'חמישי', value: 40 },
  ];

  const loadData = async () => {
    try {
      const [logs, mealsPurchasedThisMonth, studentsResult] = await Promise.all([
        getTodayLogs(),
        getMealsPurchasedThisMonth(),
        getAllStudents(),
      ]);
      setTodayLogs(logs.items);

      setStats({
        mealsServed: logs.items.length,
        mealsPurchasedThisMonth,
        predictedLoad: Math.min(95, 70 + logs.items.length / 2),
      });

      const counts: Record<string, number> = {};
      for (const student of studentsResult.items) {
        const allergies = parseAllergies(student.allergies || '');
        for (const a of allergies) {
          counts[a] = (counts[a] ?? 0) + 1;
        }
      }
      setAllergyCounts(counts);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const addToLiveFeed = (record: DailyLog) => {
    const newEntry = {
      id: record.id ?? `${Date.now()}`,
      name: record.expand?.student_id?.name || 'תלמיד',
      time: new Date().toLocaleTimeString('he-IL'),
    };
    setLiveFeed((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    
    // Subscribe to real-time updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pb.collection('mealkey_daily_logs').subscribe('*', (e: any) => {
      if (e.action === 'create') {
        loadData();
        addToLiveFeed(e.record);
      }
    }, {expand: 'student_id'});

    return () => {
      pb.collection('mealkey_daily_logs').unsubscribe();
    };
  }, []);



  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">לוח בקרה מנהלים</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ארוחות שהוגשו היום</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-dusty-denim-500">{stats.mealsServed}</div>
              <p className="text-xs text-muted-foreground mt-2">ארוחות סה״כ</p>
            </CardContent>
          </Card>

          <Card className='pb-0'>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ארוחות שנרכשו החודש</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-0 h-full w-full">
              <div className="pr-6">
              <div className="text-4xl font-bold text-dusty-denim-500">{stats.mealsPurchasedThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-2">ארוחות סה״כ</p>
              </div>
              <div className="w-full self-center">
              <div className="h-[50px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={mealsChartData}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >

          
                    <Area
                      type="monotone"
                      dataKey="meals"
                      stroke="oklch(59.27% 0.099 246.94)"
                      fill="oklch(83.78% 0.039 245.83)"
                      strokeWidth={2}
                      dot={{ fill: 'white', r: 3 }}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
         
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">עומס חדר אוכל</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">{stats.predictedLoad}%</div>
              <p className="text-xs text-muted-foreground mt-2">עומס צפוי</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                              {/* Heatmap by weekday */}
                              <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="ml-2 h-5 w-5" />
                עומס לפי ימים (א׳–ה׳)
              </CardTitle>
              <CardDescription>איזה יום בשבוע הוא &quot;חם&quot; יותר</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between gap-2">
                {weekdayHeatmap.map((day) => (
                  <div
                    key={day.key}
                    className="flex flex-col items-center flex-1 gap-2"
                  >
                    <div className="w-full bg-gray-100 rounded-full h-20 overflow-hidden flex items-end">
                      <div
                        className={`w-full rounded-full transition-all ${
                          day.value > 80
                            ? 'bg-red-300'
                            : day.value > 60
                            ? 'bg-orange-300'
                            : 'bg-green-300'
                        }`}
                        style={{ height: `${day.value}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {day.label}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {day.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Allergy counts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="ml-2 h-5 w-5" />
                אלרגיות - מספר תלמידים
              </CardTitle>
              <CardDescription>כמה תלמידים רשומים עם כל אלרגיה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ALLERGY_PRESETS
                .filter(({ value }) => !!allergyCounts[value])
                .map(({ value, label, Icon }) => {
                  const count = allergyCounts[value] ?? 0;
                  return (
                    <div
                      key={value}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center  text-sandy-brown-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{label}</p>
                        <p className="text-sm text-muted-foreground">{count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Live Feed */}
          <Card className="row-span-2">
            <CardHeader>
              <CardTitle>פיד חי - כניסות תלמידים</CardTitle>
              <CardDescription>עדכונים בזמן אמת</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {liveFeed.length > 0 ? (
                  liveFeed.map((entry, index) => (
                    <div
                      key={entry.id + index}
                      className="flex items-center justify-between p-3 bg-gradient-to-l from-green-50 to-transparent border-r-4 border-green-500 rounded animate-in slide-in-from-right"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-xs text-gray-500">נכנס לחדר אוכל</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{entry.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>אין כניסות עדיין</p>
                    <p className="text-sm">הכניסות יופיעו כאן בזמן אמת</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


                    {/* AI Insights */}
                    <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                
                עומס צפוי

                <div className="bg-sandy-brown-50 rounded-lg p-2 flex items-center px-2 py-0.5 gap-2 text-sandy-brown-500 text-base">
                  AI
                  <Sparkles className="size-4 text-sandy-brown-500" />
                </div>
              </CardTitle>
              <CardDescription>חיזוי עומס לפי שעה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simple bar chart */}
                {[
                  { hour: '12:00', load: 90 },
                  { hour: '12:30', load: 95 },
                  { hour: '13:00', load: 75 },
                  { hour: '13:30', load: 45 },
                  { hour: '14:00', load: 20 },
                ].map((item) => (
                  <div key={item.hour} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-16">{item.hour}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.load > 80 ? 'bg-red-300' : item.load > 60 ? 'bg-orange-300' : 'bg-green-300'
                        }`}
                        style={{ width: `${item.load}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12">{item.load}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}
