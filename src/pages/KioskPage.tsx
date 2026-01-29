import { useState, useRef, useEffect } from 'react';
import { XCircle, ScanFace } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getStudentByPin, updateStudentBalance, createDailyLog } from '@/lib/pocketbase';
import Lottie from 'react-lottie';
import burgerAnimation from '@/assets/Burger.json';

export default function KioskPage() {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'scanning'>('idle');
  const [message, setMessage] = useState('');
  const [studentName, setStudentName] = useState('');
  const [visibleDigits, setVisibleDigits] = useState<boolean[]>([false, false, false, false]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const burgerOptions = {
    loop: false,
    autoplay: true,
    animationData: burgerAnimation,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Show the digit briefly
      const index = pin.length;
      const newVisible = [...visibleDigits];
      newVisible[index] = true;
      setVisibleDigits(newVisible);
      
      // Hide after 1 second
      setTimeout(() => {
        setVisibleDigits(prev => {
          const updated = [...prev];
          updated[index] = false;
          return updated;
        });
      }, 250);
      
      // Auto-submit when 4th digit is entered
      if (newPin.length === 4) {
        setTimeout(() => {
          handleSubmit(newPin);
        }, 300); // Small delay to show the 4th digit
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setStatus('idle');
    setMessage('');
    setStudentName('');
    setVisibleDigits([false, false, false, false]);
  };

  const handleSubmit = async (pinValue: string = pin) => {
    if (pinValue.length !== 4) {
      setStatus('error');
      setMessage('קוד שגוי');
      setTimeout(handleClear, 2000);
      return;
    }

    try {
      const student = await getStudentByPin(pinValue);
      
      if (!student) {
        setStatus('error');
        setMessage('קוד שגוי');
        setTimeout(handleClear, 2000);
        return;
      }

      if (student.balance <= 0) {
        setStatus('error');
        setMessage('אין יתרה');
        setTimeout(handleClear, 2000);
        return;
      }

      // Deduct meal from balance
      await updateStudentBalance(student.id!, student.balance - 1);
      
      // Log the meal
      await createDailyLog(student.id!);

      setStatus('success');
      setStudentName(student.name);
      setMessage(`בתיאבון ${student.name}!`);
      
      setTimeout(handleClear, 3000);
    } catch (error) {
      console.error('Error processing PIN:', error);
      setStatus('error');
      setMessage('שגיאה בעיבוד');
      setTimeout(handleClear, 2000);
    }
  };

  const handleFaceID = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Start scanning
      setStatus('scanning');
      setMessage('מזהה פנים...');
      
      // Simulate face recognition after 2 seconds
      setTimeout(async () => {
        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Mock successful recognition - using first student for demo
        setStatus('success');
        setStudentName('עמית');
        setMessage('בתיאבון עמית!');
        
        setTimeout(handleClear, 3000);
      }, 2000);
      
    } catch (error) {
      console.error('Camera access error:', error);
      setStatus('error');
      setMessage('שגיאה בגישה למצלמה');
      setTimeout(handleClear, 2000);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white">
        <CardContent className="p-8">
          {status === 'idle' ? <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
             ברוכות הבאות 🍽️
            </h1>
            <p className="text-gray-500">הזיני קוד אישי להמשך</p>
          </div> : null}

          {status === 'idle' && (
            <>
              {/* PIN Display - 4 Squares */}
              <div className="flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].reverse().map((index) => (
                  <div
                    key={index}
                    className="size-32 rounded-xl border-2 border-gray-300 bg-white flex items-center justify-center text-5xl font-bold text-gray-800 shadow-sm"
                  >
                    {pin[index] ? (visibleDigits[index] ? pin[index] : '•') : ''}
                  </div>
                ))}
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinInput(num.toString())}
                    className="text-5xl font-semibold py-8 px-8 rounded-xl bg-white border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  className="text-5xl font-semibold py-5 px-8 rounded-xl bg-white border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 text-red-600 transition-all active:scale-95"
                >
                  נקה
                </button>
                <button
                  onClick={() => handlePinInput('0')}
                  className="text-5xl font-semibold py-8 px-8 rounded-xl bg-white border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={handleFaceID}
                  className="text-5xl flex items-center justify-center font-semibold py-5 px-8 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all active:scale-95 shadow-md"
                >
                  <ScanFace className="size-16" />
                </button>
              </div>
            </>
          )}

          {/* Face Scanning State */}
          {status === 'scanning' && (
            <div className="relative">
              {/* Camera Video */}
              <div className="relative rounded-2xl overflow-hidden mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-96 object-cover"
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Face Frame */}
                  <div className="relative w-64 h-80">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-teal-500"></div>
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-teal-500"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-teal-500"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-teal-500"></div>
                    
                    {/* Scanning Line */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute w-full h-1 bg-teal-500 shadow-lg shadow-teal-500/50 animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center gap-3 text-teal-600 text-xl font-semibold">
                  <div className="animate-spin h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full"></div>
                  {message}
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
              <div>
                <Lottie
                  options={burgerOptions}
                  height={200}
                  width={200}
                  isClickToPauseDisabled
                />
              </div>
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                {message}
              </h2>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <h2 className="text-5xl font-bold text-red-600">
                {message}
              </h2>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
