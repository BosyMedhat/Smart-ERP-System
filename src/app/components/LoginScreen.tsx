// import { useState } from 'react';
// import logo from '../../assets/logo.png';
// import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

// interface LoginScreenProps {
//   onLogin: () => void;
//   onGoToSignUp: () => void;
// }

// export function LoginScreen({ onLogin, onGoToSignUp }: LoginScreenProps) {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);

//   const [step, setStep] = useState<'login' | 'email' | 'code' | 'newPassword'>('login');

//   const [email, setEmail] = useState('');
//   const [code, setCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   // Error states
//   const [usernameError, setUsernameError] = useState('');
//   const [passwordError, setPasswordError] = useState('');
//   const [emailError, setEmailError] = useState('');
//   const [codeError, setCodeError] = useState('');
//   const [newPasswordError, setNewPasswordError] = useState('');
//   const [confirmPasswordError, setConfirmPasswordError] = useState('');

//   const validateUsername = () => {
//     if (username.length < 3) {
//       setUsernameError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
//       return false;
//     }
//     if (/^\d+$/.test(username)) {
//       setUsernameError('اسم المستخدم لا يمكن أن يحتوي على أرقام فقط');
//       return false;
//     }
//     setUsernameError('');
//     return true;
//   };

//   const validatePassword = () => {
//     if (!password) {
//       setPasswordError('كلمة المرور لا يمكن أن تكون فارغة');
//       return false;
//     }
//     setPasswordError('');
//     return true;
//   };

//   const validateEmail = () => {
//     if (!email) {
//       setEmailError('البريد الإلكتروني لا يمكن أن يكون فارغاً');
//       return false;
//     }
//     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailPattern.test(email)) {
//       setEmailError('صيغة البريد الإلكتروني غير صحيحة');
//       return false;
//     }
//     setEmailError('');
//     return true;
//   };

//   const validateCode = () => {
//     if (!code) {
//       setCodeError('الرمز لا يمكن أن يكون فارغاً');
//       return false;
//     }
//     setCodeError('');
//     return true;
//   };

//   const validateNewPassword = () => {
//     if (!newPassword) {
//       setNewPasswordError('كلمة المرور الجديدة لا يمكن أن تكون فارغة');
//       return false;
//     }
//     setNewPasswordError('');
//     return true;
//   };

//   const validateConfirmPassword = () => {
//     if (!confirmPassword) {
//       setConfirmPasswordError('تأكيد كلمة المرور لا يمكن أن يكون فارغاً');
//       return false;
//     }
//     if (confirmPassword !== newPassword) {
//       setConfirmPasswordError('كلمة المرور وتأكيدها غير متطابقين');
//       return false;
//     }
//     setConfirmPasswordError('');
//     return true;
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     const isUsernameValid = validateUsername();
//     const isPasswordValid = validatePassword();
//     if (isUsernameValid && isPasswordValid) {
//       onLogin();
//     }
//   };

//   return (
//     <div className="min-h-screen w-full bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center p-4">
//       <div className="relative w-full max-w-md">
//         <div className="bg-white rounded-2xl shadow-2xl p-8">

//           {/* Brand Section */}
//           {step === 'login' && (
//             <div className="flex items-center justify-center mb-4 gap-2">
//               <div className="w-24 h-24">
//                 <img src={logo} alt="Smart ERP Logo" className="w-full h-full object-contain" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-[#1E293B]">SMART ERP</h1>
//                 <p className="text-gray-600 text-sm">نظام إدارة الأعمال المتكامل</p>
//               </div>
//             </div>
//           )}

//           {/* Login Form */}
//           {step === 'login' && (
//             <form onSubmit={handleSubmit} className="space-y-5">

//               <div>
//                 <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     onBlur={validateUsername}
//                     className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl"
//                     placeholder="أدخل اسم المستخدم"
//                     required
//                   />
//                   <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//                 </div>
//                 {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     onBlur={validatePassword}
//                     className="w-full px-4 py-3 pr-12 pl-12 border-2 border-gray-200 rounded-xl"
//                     placeholder="أدخل كلمة المرور"
//                     required
//                   />
//                   <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
//                   >
//                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//                 {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
//               </div>

//               <div className="flex items-center justify-between">
//                 <label className="flex items-center gap-2 text-sm">
//                   <input
//                     type="checkbox"
//                     checked={rememberMe}
//                     onChange={(e) => setRememberMe(e.target.checked)}
//                   />
//                   تذكرني
//                 </label>

//                 <button
//                   type="button"
//                   className="text-sm text-[#3B82F6]"
//                   onClick={() => setStep('email')}
//                 >
//                   نسيت كلمة المرور؟
//                 </button>
//               </div>

//               <button
//                 type="submit"
//                 className="w-full bg-[#1E293B] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
//               >
//                 <LogIn size={20} />
//                 تسجيل الدخول
//               </button>

//               {/* Sign Up */}
//               <div className="flex justify-center items-center gap-1 text-sm text-gray-600">
//                 <span>ليس لديك حساب؟</span>
//                 <button
//                   type="button"
//                   className="text-[#3B82F6] font-bold hover:underline"
//                   onClick={onGoToSignUp}
//                 >
//                   تسجيل جديد
//                 </button>
//               </div>

//             </form>
//           )}

//           {/* Email */}
//           {step === 'email' && (
//             <div className="space-y-5">
//               <h2 className="text-xl font-bold text-center">إعادة تعيين كلمة المرور</h2>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 onBlur={validateEmail}
//                 placeholder="أدخل بريدك الإلكتروني"
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
//               />
//               {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
//               <button
//                 className="w-full bg-[#1E293B] text-white font-bold py-3.5 rounded-xl"
//                 onClick={() => {
//                   if (validateEmail()) setStep('code');
//                 }}
//               >
//                 إرسال
//               </button>
//             </div>
//           )}

//           {/* Code */}
//           {step === 'code' && (
//             <div className="space-y-5">
//               <h2 className="text-xl font-bold text-center">التحقق من الرمز</h2>
//               <input
//                 type="text"
//                 value={code}
//                 onChange={(e) => setCode(e.target.value)}
//                 onBlur={validateCode}
//                 placeholder="أدخل الرمز"
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
//               />
//               {codeError && <p className="text-red-500 text-sm">{codeError}</p>}
//               <button
//                 className="w-full bg-[#1E293B] text-white font-bold py-3.5 rounded-xl"
//                 onClick={() => {
//                   if (validateCode()) setStep('newPassword');
//                 }}
//               >
//                 متابعة
//               </button>
//             </div>
//           )}

//           {/* New Password */}
//           {step === 'newPassword' && (
//             <div className="space-y-5">
//               <input
//                 type="password"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//                 onBlur={validateNewPassword}
//                 placeholder="كلمة المرور الجديدة"
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
//               />
//               {newPasswordError && <p className="text-red-500 text-sm">{newPasswordError}</p>}

//               <input
//                 type="password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 onBlur={validateConfirmPassword}
//                 placeholder="تأكيد كلمة المرور"
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
//               />
//               {confirmPasswordError && <p className="text-red-500 text-sm">{confirmPasswordError}</p>}

//               <button
//                 className="w-full bg-[#1E293B] text-white font-bold py-3.5 rounded-xl"
//                 onClick={() => {
//                   if (validateNewPassword() && validateConfirmPassword()) setStep('login');
//                 }}
//               >
//                 تأكيد
//               </button>
//             </div>
//           )}

//         </div>
//       </div>
//     </div>
//   );
// }



import { useState } from 'react';
import logo from '../../assets/logo.png';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  onGoToSignUp: () => void;
}

export function LoginScreen({ onLogin, onGoToSignUp }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [step, setStep] = useState<'login' | 'email' | 'code' | 'newPassword'>('login');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error states
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Username validation
  const validateUsername = () => {
    if (username.length < 3) {
      setUsernameError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return false;
    }
    if (/^\d+$/.test(username)) {
      setUsernameError('اسم المستخدم لا يمكن أن يحتوي على أرقام فقط');
      return false;
    }
    setUsernameError('');
    return true;
  };

  // Password validation (login password)
  const validatePassword = () => {
    if (!password) {
      setPasswordError('كلمة المرور لا يمكن أن تكون فارغة');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setPasswordError('كلمة المرور يجب أن تحتوي على حروف وأرقام');
      return false;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      setPasswordError('كلمة المرور لا يجب أن تحتوي على رموز أو علامات خاصة');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Email validation
  const validateEmail = () => {
    if (!email) {
      setEmailError('البريد الإلكتروني لا يمكن أن يكون فارغاً');
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setEmailError('صيغة البريد الإلكتروني غير صحيحة');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Code validation
  const validateCode = () => {
    if (!code) {
      setCodeError('الرمز لا يمكن أن يكون فارغاً');
      return false;
    }
    setCodeError('');
    return true;
  };

  // New password validation
  const validateNewPassword = () => {
    if (!newPassword) {
      setNewPasswordError('كلمة المرور الجديدة لا يمكن أن تكون فارغة');
      return false;
    }
    if (newPassword.length < 6) {
      setNewPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setNewPasswordError('كلمة المرور يجب أن تحتوي على حروف وأرقام');
      return false;
    }
    if (/[^A-Za-z0-9]/.test(newPassword)) {
      setNewPasswordError('كلمة المرور لا يجب أن تحتوي على رموز أو علامات خاصة');
      return false;
    }
    setNewPasswordError('');
    return true;
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('تأكيد كلمة المرور لا يمكن أن يكون فارغاً');
      return false;
    }
    if (confirmPassword !== newPassword) {
      setConfirmPasswordError('كلمة المرور وتأكيدها غير متطابقين');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    if (isUsernameValid && isPasswordValid) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Brand Section */}
          {step === 'login' && (
            <div className="flex items-center justify-center mb-4 gap-2">
              <div className="w-24 h-24">
                <img src={logo} alt="Smart ERP Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E293B]">SMART ERP</h1>
                <p className="text-gray-600 text-sm">نظام إدارة الأعمال المتكامل</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          {step === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={validateUsername}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl"
                    placeholder="أدخل اسم المستخدم"
                    required
                  />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={validatePassword}
                    className="w-full px-4 py-3 pr-12 pl-12 border-2 border-gray-200 rounded-xl"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  تذكرني
                </label>

                <button
                  type="button"
                  className="text-sm text-[#3B82F6]"
                  onClick={() => setStep('email')}
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1E293B] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                تسجيل الدخول
              </button>

              {/* Sign Up */}
              <div className="flex justify-center items-center gap-1 text-sm text-gray-600">

                <button
                  type="button"
                  className="text-[#3B82F6] font-bold hover:underline"
                  onClick={onGoToSignUp}
                >
                  تسجيل جديد
                </button>
            <span>ليس لديك حساب؟</span>
              </div>

            </form>
          )}

          {/* Email */}
          {step === 'email' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-center">إعادة تعيين كلمة المرور</h2>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validateEmail}
                placeholder="أدخل بريدك الإلكتروني"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
              <button
                className="w-full bg-[#1E293B] text-white font-bold py-3.5 rounded-xl"
                onClick={() => {
                  if (validateEmail()) setStep('code');
                }}
              >
                إرسال
              </button>
            </div>
          )}

          {/* Code */}
          {step === 'code' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-center">التحقق من الرمز</h2>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onBlur={validateCode}
                placeholder="أدخل الرمز"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
              />
              {codeError && <p className="text-red-500 text-sm">{codeError}</p>}
              <button
                className="w-full bg-[#1E293B] text-white font-bold py-3.5 rounded-xl"
                onClick={() => {
                  if (validateCode()) setStep('newPassword');
                }}
              >
                متابعة
              </button>
            </div>
          )}

          {/* New Password */}
          {step === 'newPassword' && (
            <div className="space-y-5">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={validateNewPassword}
                placeholder="كلمة المرور الجديدة"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
              />
              {newPasswordError && <p className="text-red-500 text-sm">{newPasswordError}</p>}

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={validateConfirmPassword}
                placeholder="تأكيد كلمة المرور"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
              />
              {confirmPasswordError && <p className="text-red-500 text-sm">{confirmPasswordError}</p>}

              <button
                className="w-full bg-[#1E293B] text-white font-bold py-3.5 rounded-xl"
                onClick={() => {
                  if (validateNewPassword() && validateConfirmPassword()) setStep('login');
                }}
              >
                تأكيد
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}





