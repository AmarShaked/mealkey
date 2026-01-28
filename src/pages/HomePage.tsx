import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Baby, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">MealKey 🍽️</h1>
          <p className="text-lg text-gray-600">מערכת ניהול חדר אוכל חכמה</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/kiosk" className="transform transition-all hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-xl border-2 border-gray-100 hover:border-teal-500 transition-all bg-white">
              <CardHeader>
                <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-teal-100 flex items-center justify-center">
                  <Baby className="h-10 w-10 text-teal-600" />
                </div>
                <CardTitle className="text-center text-2xl">קיוסק תלמידים</CardTitle>
                <CardDescription className="text-center text-gray-600">
                  כניסה מהירה עם קוד PIN
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-500">
                  מערכת ידידותית לילדים לבדיקת כניסה מהירה
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/parent" className="transform transition-all hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-xl border-2 border-gray-100 hover:border-teal-500 transition-all bg-white">
              <CardHeader>
                <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle className="text-center text-2xl">פורטל הורים</CardTitle>
                <CardDescription className="text-center text-gray-600">
                  ניהול יתרה והגבלות רפואיות
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-500">
                  עקוב אחר יתרה, צפה בהיסטוריה וטען ארוחות
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin" className="transform transition-all hover:scale-105">
            <Card className="h-full cursor-pointer hover:shadow-xl border-2 border-gray-100 hover:border-teal-500 transition-all bg-white">
              <CardHeader>
                <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-purple-600" />
                </div>
                <CardTitle className="text-center text-2xl">ניהול מערכת</CardTitle>
                <CardDescription className="text-center text-gray-600">
                  לוח בקרה וסטטיסטיקות
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-500">
                  תובנות AI, פיד חי וניהול מלאי
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm space-y-1">
          <p>מערכת חכמה לניהול חדר אוכל בית ספרי</p>
          <p>Built with React, Vite, Tailwind & PocketBase</p>
        </div>
      </div>
    </div>
  );
}
