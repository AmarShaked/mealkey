import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayLogs, pb, type DailyLog } from '@/lib/pocketbase';
import { TrendingUp, DollarSign, Users, AlertTriangle } from 'lucide-react';

export default function AdminPage() {
  const [, setTodayLogs] = useState<DailyLog[]>([]);
  const [liveFeed, setLiveFeed] = useState<Array<{ id?: string; name: string; time: string }>>([]);
  const [stats, setStats] = useState({
    mealsServed: 0,
    revenue: 0,
    predictedLoad: 0,
  });
  const weekdayHeatmap = [
    { key: 'sun', label: 'ראשון', value: 85 },
    { key: 'mon', label: 'שני', value: 92 },
    { key: 'tue', label: 'שלישי', value: 75 },
    { key: 'wed', label: 'רביעי', value: 60 },
    { key: 'thu', label: 'חמישי', value: 40 },
  ];

  const loadData = async () => {
    try {
      const logs = await getTodayLogs();
      setTodayLogs(logs.items);
      
      // Calculate stats
      setStats({
        mealsServed: logs.items.length,
        revenue: logs.items.length * 25, // 25 ILS per meal
        predictedLoad: Math.min(95, 70 + logs.items.length / 2),
      });
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const addToLiveFeed = (record: DailyLog) => {
    const newEntry = {
      id: record.id,
      name: record.expand?.student_id?.name || 'תלמיד',
      time: new Date().toLocaleTimeString('he-IL'),
    };
    setLiveFeed((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
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
              <div className="text-4xl font-bold text-blue-600">{stats.mealsServed}</div>
              <p className="text-xs text-muted-foreground mt-2">ארוחות סה״כ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">הכנסות היום</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">₪{stats.revenue}</div>
              <p className="text-xs text-muted-foreground mt-2">סכום כולל</p>
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
                            ? 'bg-red-500'
                            : day.value > 60
                            ? 'bg-orange-500'
                            : 'bg-green-500'
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
              <CardTitle className="flex items-center">
                <TrendingUp className="ml-2 h-5 w-5" />
                תובנות AI - עומס צפוי
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
                          item.load > 80 ? 'bg-red-500' : item.load > 60 ? 'bg-orange-500' : 'bg-green-500'
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
