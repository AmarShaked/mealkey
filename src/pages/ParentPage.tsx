import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Lottie from 'react-lottie';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader as UIDialogHeader,
  DialogTitle as UIDialogTitle,
  DialogDescription as UIDialogDescription,
} from '@/components/ui/dialog';
import { pb, loginParent, signupParent, isAuthenticated, getParentChildren, getStudentMealHistory, createTransaction, updateStudentAllergies, createStudentForParent, updateStudentPin, getStudentByPin, type Student, type DailyLog } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { CreditCard, History, AlertCircle, LogOut } from 'lucide-react';
import { logout } from '@/lib/pocketbase';
import successAnimation from '@/assets/Success.json';

export default function ParentPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [mealHistory, setMealHistory] = useState<DailyLog[]>([]);
  const [allergies, setAllergies] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAllergies, setNewStudentAllergies] = useState('');
  const [isRedeemingPin, setIsRedeemingPin] = useState(false);
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const loadChildren = async () => {
    try {
      const parentModel = pb.authStore.model;
      if (parentModel?.id) {
        const result = await getParentChildren(parentModel.id);
        setChildren(result.items);

        if (result.items.length > 0) {
          // Try to keep the currently selected child after refresh
          if (selectedChild?.id) {
            const stillExists = result.items.find(
              (child) => child.id === selectedChild.id
            );
            if (stillExists) {
              await selectChild(stillExists);
              return;
            }
          }

          // Fallback: select first child only if none selected yet
          if (!selectedChild) {
            await selectChild(result.items[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading children:', err);
    }
  };

  const selectChild = async (child: Student) => {
    setSelectedChild(child);
    setAllergies(child.allergies || '');
    
    try {
      const history = await getStudentMealHistory(child.id!);
      setMealHistory(history.items);
    } catch (err) {
      console.error('Error loading meal history:', err);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    // Load children once on mount when already authenticated.
    loadChildren();
    // We intentionally don't include `loadChildren` to avoid re-running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await loginParent(email, password);
        setAuthenticated(true);
        await loadChildren();
      } else {
        await signupParent(email, password, passwordConfirm);
        setIsLogin(true);
        setError('חשבון נוצר בהצלחה! נא להתחבר.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'שגיאה באימות');
      } else {
        setError('שגיאה באימות');
      }
    }
  };

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedChild) return;

    try {
      const amount = parseInt(paymentAmount);
      const parentModel = pb.authStore.model;
      if (!parentModel?.id) {
        toast.error('שגיאת אימות, נא להתחבר מחדש.');
        return;
      }

      const parentId = parentModel.id;

      await createTransaction(parentId, selectedChild.id!, amount);
      setPaymentAmount('');
      await loadChildren();
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error('שגיאה בעיבוד תשלום');
    }
  };

  const handleAlternativePayment = async () => {
    if (!selectedChild) return;

    try {
      const amount = parseInt(paymentAmount);
      if (!amount || amount <= 0) {
        toast.error('נא להזין מספר ארוחות תקין.');
        return;
      }

      const parentModel = pb.authStore.model;
      if (!parentModel?.id) {
        toast.error('שגיאת אימות, נא להתחבר מחדש.');
        return;
      }

      const parentId = parentModel.id;

      await createTransaction(parentId, selectedChild.id!, amount);

      setPaymentAmount('');
      await loadChildren();
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Error processing alternative payment:', err);
      toast.error('שגיאה בעיבוד תשלום');
    }
  };

  const generateUniquePin = async (): Promise<string> => {
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const pin = String(1000 + Math.floor(Math.random() * 9000));
      const existing = await getStudentByPin(pin);
      if (!existing) return pin;
    }
    return String(Date.now()).slice(-4);
  };

  const handleUpdateAllergies = async () => {
    if (!selectedChild) return;

    try {
      await updateStudentAllergies(selectedChild.id!, allergies);
      toast.success('הגבלות עודכנו בהצלחה!');
      await loadChildren();
    } catch (err) {
      console.error('Error updating allergies:', err);
      toast.error('שגיאה בעדכון הגבלות');
    }
  };

  const handleRedeemNewPin = async () => {
    if (!selectedChild) return;
    setIsRedeemingPin(true);
    try {
      const newPin = await generateUniquePin();
      await updateStudentPin(selectedChild.id!, newPin);
      setSelectedChild((prev) => (prev ? { ...prev, pin: newPin } : null));
      toast.success('קוד חדש נוצר בהצלחה! שמרו אותו במקום בטוח.');
      await loadChildren();
    } catch (err) {
      console.error('Error redeeming PIN:', err);
      toast.error('שגיאה ביצירת קוד חדש');
    } finally {
      setIsRedeemingPin(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const parentModel = pb.authStore.model;
      if (!parentModel?.id) {
        toast.error('שגיאת אימות, נא להתחבר מחדש.');
        return;
      }

      const parentId = parentModel.id;
      const pin = await generateUniquePin();

      await createStudentForParent(
        newStudentName.trim(),
        pin,
        newStudentAllergies.trim(),
        parentId
      );

      toast.success('תלמיד נרשם בהצלחה! הקוד הסודי יוצג בכרטיס הקוד.');
      setNewStudentName('');
      setNewStudentAllergies('');
      await loadChildren();
    } catch (err) {
      console.error('Error creating student:', err);
      toast.error('שגיאה בהרשמת תלמיד חדש');
    }
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setChildren([]);
    setSelectedChild(null);
  };

  // Aggregated stats for widgets
  const totalChildren = children.length;
  const totalMealsRemaining = children.reduce(
    (sum, child) => sum + (child.balance || 0),
    0
  );
  const lowBalanceThreshold = 5;
  const lowBalanceCount = children.filter(
    (child) => (child.balance || 0) <= lowBalanceThreshold
  ).length;
  const maxBalance =
    children.length > 0
      ? Math.max(...children.map((c) => c.balance || 0))
      : 0;

  const successLottieOptions = {
    loop: false,
    autoplay: true,
    animationData: successAnimation,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              {isLogin ? 'התחברות הורים' : 'הרשמה'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin ? 'הזן את פרטי ההתחברות שלך' : 'צור חשבון חדש'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">אימייל</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">סיסמה</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">אימות סיסמה</label>
                  <Input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full">
                {isLogin ? 'התחבר' : 'הירשם'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:underline"
            >
              {isLogin ? 'אין לך חשבון? הירשם' : 'יש לך חשבון? התחבר'}
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center md:text-right">
            פורטל הורים
          </h1>
          <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:justify-end">
            <Button
              variant="default"
              onClick={() => setShowNewStudentForm((prev) => !prev)}
            >
              {showNewStudentForm ? 'בטל הוספת תלמיד' : 'הוסף תלמיד חדש'}
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="ml-2 h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>

        {/* Summary widgets */}
        {children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total meals widget */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  סך כל הארוחות הזמינות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-teal-600">
                    {totalMealsRemaining}
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalChildren} תלמידים מחוברים
                  </div>
                </div>
                <div className="mt-4 h-2 w-full rounded-full bg-teal-50 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all"
                    style={{
                      width: `${
                        Math.min(
                          100,
                          totalMealsRemaining / Math.max(1, totalChildren * 30)
                        ) * 100
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  מבוסס על ממוצע של 30 ארוחות לחודש לתלמיד.
                </p>
              </CardContent>
            </Card>

            {/* Low balance widget */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  תלמידים עם יתרה נמוכה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-amber-600">
                    {lowBalanceCount}
                  </div>
                  <div className="text-xs text-gray-500">
                    מתחת ל-{lowBalanceThreshold} ארוחות
                  </div>
                </div>
                <div className="mt-4 h-2 w-full rounded-full bg-amber-50 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{
                      width: `${
                        totalChildren > 0
                          ? (lowBalanceCount / totalChildren) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  מומלץ לטעון יתרה עבור תלמידים אלו בקרוב.
                </p>
              </CardContent>
            </Card>

            {/* Per-child mini chart */}
            <Card >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  השוואת יתרות בין תלמידים
                </CardTitle>
                <CardDescription className="text-xs">
                  כל עמודה מייצגת תלמיד אחד
                </CardDescription>
              </CardHeader>
              <CardContent >
                <div className="flex items-end justify-between gap-1 h-24">
                  {children.map((child) => {
                    const heightPercent =
                      maxBalance > 0
                        ? ((child.balance || 0) / maxBalance) * 100
                        : 0;
                    return (
                      <div
                        key={child.id}
                        className="flex-1 flex flex-col items-center h-full"
                      >
                        <div className="relative w-5 bg-gray-100 rounded h-full overflow-hidden">
                          <div
                            className={`absolute bottom-0 left-0 right-0 rounded ${
                              child.id === selectedChild?.id
                                ? 'bg-teal-500'
                                : 'bg-gray-400'
                            }`}
                            style={{ height: `${heightPercent || 5}%` }}
                          />
                        </div>
                        <span className="mt-1 text-[10px] text-gray-600 truncate max-w-full">
                          {child.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showNewStudentForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>רישום תלמיד חדש</CardTitle>
              <CardDescription>הוסף ילד חדש לחשבון ההורה</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreateStudent}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    שם התלמיד
                  </label>
                  <Input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="שם מלא"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    אלרגיות (אופציונלי)
                  </label>
                  <Input
                    type="text"
                    value={newStudentAllergies}
                    onChange={(e) => setNewStudentAllergies(e.target.value)}
                    placeholder="למשל: גלוטן, בוטנים"
                  />
                </div>
                <div>
                  <Button type="submit" className="w-full mt-6">
                    הוסף תלמיד
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Child Selector */}
        {children.length > 0 && (
          <div className="mb-6 flex gap-2">
            {children.map((child) => (
              <Button
                key={child.id}
                onClick={() => selectChild(child)}
                variant={selectedChild?.id === child.id ? 'default' : 'outline'}
              >
                {child.name}
              </Button>
            ))}
          </div>
        )}

        {selectedChild ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle>יתרת ארוחות</CardTitle>
                <CardDescription>{selectedChild.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-4">
                <div>
                  <div className="text-5xl font-bold text-center text-teal-600">
                    {selectedChild.balance}
                  </div>
                  <p className="text-center text-gray-600 mt-2">ארוחות נותרות</p>
                </div>
                {/* Payment Dialog */}
                <div className="mt-6 flex w-full justify-center md:justify-start">
              <Dialog
                open={isPaymentDialogOpen}
                onOpenChange={(open) => {
                  setIsPaymentDialogOpen(open);
                  if (open) {
                    setPaymentSuccess(false);
                    setPaymentAmount('');
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => setIsPaymentDialogOpen(true)}
                  >
                    <CreditCard className="ml-2 h-5 w-5" />
                    טעינת יתרה
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {paymentSuccess ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                      <Lottie
                        options={successLottieOptions}
                        height={180}
                        width={180}
                        isClickToPauseDisabled
                      />
                      <p className="text-lg font-semibold text-gray-800">
                        התשלום התקבל בהצלחה!
                      </p>
                    </div>
                  ) : (
                    <>
                      <UIDialogHeader>
                        <UIDialogTitle className="flex items-center justify-between">
                          <span>טעינת יתרה</span>
                          <span className="text-sm text-gray-500">
                            {selectedChild.name}
                          </span>
                        </UIDialogTitle>
                        <UIDialogDescription>
                          רכישת חבילת ארוחות עבור התלמיד הנבחר.
                        </UIDialogDescription>
                      </UIDialogHeader>
                      <form onSubmit={handlePayment} className="space-y-4 mt-2">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            מספר ארוחות
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Button
                              type="button"
                              variant={paymentAmount === '10' ? 'default' : 'outline'}
                              onClick={() => setPaymentAmount('10')}
                              className="w-full"
                            >
                              10
                            </Button>
                            <Button
                              type="button"
                              variant={paymentAmount === '30' ? 'default' : 'outline'}
                              onClick={() => setPaymentAmount('30')}
                              className="w-full"
                            >
                              חודשי (30)
                            </Button>
                            <Button
                              type="button"
                              variant={paymentAmount === '150' ? 'default' : 'outline'}
                              onClick={() => setPaymentAmount('150')}
                              className="w-full"
                            >
                              שנתי (150)
                            </Button>
                            <Input
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="ערך פתוח"
                              min="1"
                            />
                          </div>
                        </div>

                        <Button type="submit" className="w-full">
                          תשלום בכרטיס אשראי
                        </Button>
                        <div className="flex flex-col gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleAlternativePayment()}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <span>תשלום באמצעות PayBox</span>
                              <img
                                src="paybox.png"
                                alt="PayBox"
                                className="h-5 w-auto"
                              />
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleAlternativePayment()}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <span>תשלום באמצעות Bit</span>
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Bit-logo2024.png"
                                alt="Bit"
                                className="h-5 w-auto"
                              />
                            </span>
                          </Button>
                        </div>
                      </form>
                    </>
                  )}
                </DialogContent>
              </Dialog>
                </div>
              </CardContent>
            </Card>


          


            {/* PIN Card */}
            <Card>
              <CardHeader>
                <CardTitle>קוד תלמיד (PIN)</CardTitle>
                <CardDescription>{selectedChild.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-3xl font-mono tracking-widest text-gray-800 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-6 py-3">
                    {selectedChild.pin}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    הקוד משמש את התלמיד במכשיר הקיוסק. שמרו עליו חסוי.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleRedeemNewPin}
                    disabled={isRedeemingPin}
                  >
                    {isRedeemingPin ? 'מייצר קוד...' : 'קבל קוד חדש'}
                  </Button>
                  <p className="text-xs text-gray-400 text-center">
                    אם איבדתם את הקוד, תוכלו ליצור קוד חדש כאן.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Allergy Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="ml-2 h-5 w-5" />
                  הגבלות רפואיות ואלרגיות
                </CardTitle>
                <CardDescription>עדכן מידע רפואי חשוב</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">אלרגיות והגבלות</label>
                  <Input
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="למשל: גלוטן, בוטנים, חלב"
                  />
                </div>
                <Button onClick={handleUpdateAllergies} className="w-full">
                  עדכן הגבלות
                </Button>
              </CardContent>
            </Card>

            {/* Meal History */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="ml-2 h-5 w-5" />
                  היסטוריית ארוחות
                </CardTitle>
                <CardDescription>30 הימים האחרונים</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mealHistory.length > 0 ? (
                    mealHistory.map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{selectedChild.name || 'ארוחה'}</span>
                        </div>
                        <div className="flex flex-col items-end text-gray-600">
                          <span>
                            {new Date(log.date).toLocaleDateString('he-IL')}
                          </span>
                          <span className="text-xs">
                            {new Date(log.updated ?? log.date).toLocaleTimeString(
                              'he-IL',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">אין היסטוריה</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
        showNewStudentForm ? null :<Card>
            <CardContent className="p-12 text-center space-y-4">
              <p className="text-gray-600">
                לא נמצאו ילדים רשומים בחשבון זה.
              </p>
              <Button
                onClick={() => setShowNewStudentForm(true)}
                className="mt-2"
              >
                הוסף תלמיד ראשון
              </Button>
            </CardContent>
          </Card>     
        )}
      </div>
    </div>
  );
}
