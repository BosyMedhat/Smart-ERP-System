// import { useState } from 'react';
// import logo from '../../assets/logo.png';
// import { User, Mail, Phone, Lock, Eye, EyeOff, Building } from 'lucide-react';

// interface SignUpScreenProps {
//   onBackToLogin: () => void;
// }

// export function SignUpScreen({ onBackToLogin }: SignUpScreenProps) {
//   const [showPassword, setShowPassword] = useState(false);

//   const [form, setForm] = useState({
//     username: '',
//     email: '',
//     phone: '',
//     businessName: '',  // اسم النشاط / الشركة
//     companyEmail: '',
//     companyPhone: '',
//     password: '',
//     confirmPassword: '',
//     businessType: '', // نوع النشاط
//     role: 'manager',
//     agree: false,
//   });

//   const [errors, setErrors] = useState<any>({});

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;
//     setForm({
//       ...form,
//       [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
//     });
//     validateField(name, value);
//   };

//   const validateField = (name: string, value: string) => {
//     let error = '';

//     switch (name) {
//       case 'username':
//         if (!value) error = 'اسم المستخدم لا يمكن أن يكون فارغاً';
//         else if (value.length < 3) error = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
//         else if (/^\d+$/.test(value)) error = 'اسم المستخدم لا يمكن أن يكون أرقام فقط';
//         break;

//       case 'email':
//         if (!value) error = 'البريد الإلكتروني لا يمكن أن يكون فارغاً';
//         else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'صيغة البريد الإلكتروني غير صحيحة';
//         break;

//       case 'phone':
//         if (!value) error = 'رقم الهاتف لا يمكن أن يكون فارغاً';
//         else if (!/^\d+$/.test(value)) error = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
//         break;

//       case 'businessName':
//       case 'businessType':
//         if (!value) error = 'هذا الحقل لا يمكن أن يكون فارغاً';
//         else if (/^\d+$/.test(value)) error = 'لا يمكن أن يحتوي على أرقام فقط';
//         else if (/^[^A-Za-z0-9]+$/.test(value)) error = 'لا يمكن أن يحتوي على رموز فقط';
//         break;

//       case 'companyEmail':
//         if (!value) error = 'البريد الإلكتروني للشركة لا يمكن أن يكون فارغاً';
//         else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'صيغة البريد الإلكتروني للشركة غير صحيحة';
//         break;

//       case 'companyPhone':
//         if (!value) error = 'رقم هاتف الشركة لا يمكن أن يكون فارغاً';
//         else if (!/^\d+$/.test(value)) error = 'رقم هاتف الشركة يجب أن يحتوي على أرقام فقط';
//         break;

//       case 'password':
//         if (!value) error = 'كلمة المرور لا يمكن أن تكون فارغة';
//         else if (value.length < 6) error = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
//         else if (/^[A-Za-z]+$/.test(value) || /^\d+$/.test(value) || /^[^A-Za-z0-9]+$/.test(value)) {
//           error = 'كلمة المرور يجب أن تحتوي على مزيج من حروف، أرقام، وربما رموز';
//         }
//         break;

//       case 'confirmPassword':
//         if (value !== form.password) error = 'كلمة المرور وتأكيدها غير متطابقين';
//         break;

//       default:
//         break;
//     }

//     setErrors((prev: any) => ({ ...prev, [name]: error }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     // Validate all fields before submit
//     Object.entries(form).forEach(([key, value]) => validateField(key, value as string));

//     // Check agree
//     if (!form.agree) setErrors((prev: any) => ({ ...prev, agree: 'يجب الموافقة على الشروط والأحكام' }));
    
//     // Submit if no errors
//     const hasErrors = Object.values(errors).some((e) => e);
//     if (!hasErrors && form.agree) {
//       console.log('Signup Data:', form);
//       alert('تم إنشاء الحساب بنجاح');
//       onBackToLogin();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center p-4">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
//         <div className="flex justify-center mb-4">
//           <img src={logo} className="w-20 h-20 object-contain" />
//         </div>

//         <h2 className="text-2xl font-bold text-center text-[#1E293B]">
//           إنشاء حساب جديد
//         </h2>
//         <p className="text-sm text-center text-gray-500 mb-6">
//           أنشئ حسابك للبدء في استخدام النظام
//         </p>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <Input icon={<User size={18} />} name="username" placeholder="اسم المستخدم" value={form.username} onChange={handleChange} error={errors.username} />
//           <Input icon={<Mail size={18} />} name="email" type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={handleChange} error={errors.email} />
//           <Input icon={<Phone size={18} />} name="phone" placeholder="رقم الهاتف" value={form.phone} onChange={handleChange} error={errors.phone} />
//           <Input icon={<Building size={18} />} name="businessName" placeholder="اسم النشاط / الشركة" value={form.businessName} onChange={handleChange} error={errors.businessName} />
//           <Input icon={<Mail size={18} />} name="companyEmail" type="email" placeholder="البريد الإلكتروني للشركة" value={form.companyEmail} onChange={handleChange} error={errors.companyEmail} />
//           <Input icon={<Phone size={18} />} name="companyPhone" placeholder="رقم هاتف الشركة" value={form.companyPhone} onChange={handleChange} error={errors.companyPhone} />
//           <PasswordInput placeholder="كلمة المرور" value={form.password} onChange={(v: string) => setForm({ ...form, password: v })} show={showPassword} toggle={() => setShowPassword(!showPassword)} error={errors.password} />
//           <PasswordInput placeholder="تأكيد كلمة المرور" value={form.confirmPassword} onChange={(v: string) => setForm({ ...form, confirmPassword: v })} show={showPassword} toggle={() => setShowPassword(!showPassword)} error={errors.confirmPassword} />
//           <Input icon={<Building size={18} />} name="businessType" placeholder="نوع النشاط" value={form.businessType} onChange={handleChange} error={errors.businessType} />

//           {/* Role */}
//           {/* <div className="flex gap-4">
//             <label className="flex items-center gap-2">
//               <input type="radio" name="role" value="manager" checked={form.role === 'manager'} onChange={handleChange} />
//               مدير
//             </label>
//             <label className="flex items-center gap-2">
//               <input type="radio" name="role" value="employee" checked={form.role === 'employee'} onChange={handleChange} />
//               موظف
//             </label>
//           </div> */}

//           {/* Terms */}
//           <label className="flex items-center gap-2 text-sm">
//             <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
//             أوافق على الشروط والأحكام
//           </label>
//           {errors.agree && <p className="text-red-500 text-sm">{errors.agree}</p>}

//           <button type="submit" className="w-full bg-[#1E293B] text-white font-bold py-3 rounded-xl">
//             إنشاء حساب
//           </button>

//           <div className="text-center text-sm">
//             لديك حساب بالفعل؟
//             <button type="button" onClick={onBackToLogin} className="text-[#3B82F6] font-bold mr-1">
//               تسجيل الدخول
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// /* Reusable Components */
// function Input({ icon, error, ...props }: any) {
//   return (
//     <div className="relative">
//       <input {...props} className={`w-full px-4 py-3 pr-10 border-2 rounded-xl ${error ? 'border-red-500' : 'border-gray-200'}`} />
//       <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
//       {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//     </div>
//   );
// }

// function PasswordInput({ placeholder, value, onChange, show, toggle, error }: any) {
//   return (
//     <div className="relative">
//       <input type={show ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full px-4 py-3 pr-10 pl-10 border-2 rounded-xl ${error ? 'border-red-500' : 'border-gray-200'}`} />
//       <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={18} /></div>
//       <button type="button" onClick={toggle} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
//       {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//     </div>
//   );
// }






// import { useState } from 'react';
// import logo from '../../assets/logo.png';
// import { User, Mail, Phone, Lock, Building } from 'lucide-react';

// interface SignUpScreenProps {
//   onBackToLogin: () => void;
// }

// export function SignUpScreen({ onBackToLogin }: SignUpScreenProps) {
//   const [form, setForm] = useState({
//     username: '',
//     email: '',
//     phone: '',
//     businessName: '',
//     companyEmail: '',
//     companyPhone: '',
//     password: '',
//     confirmPassword: '',
//     businessType: '',
//     role: 'manager',
//     agree: false,
//   });

//   const [errors, setErrors] = useState<any>({});

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;
//     setForm({
//       ...form,
//       [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
//     });
//     validateField(name, value);
//   };

//   const validateField = (name: string, value: string) => {
//     let error = '';

//     switch (name) {
//       case 'username':
//         if (!value) error = 'اسم المستخدم لا يمكن أن يكون فارغاً';
//         else if (value.length < 3) error = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
//         else if (/^\d+$/.test(value)) error = 'اسم المستخدم لا يمكن أن يكون أرقام فقط';
//         break;

//       case 'email':
//         if (!value) error = 'البريد الإلكتروني لا يمكن أن يكون فارغاً';
//         else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'صيغة البريد الإلكتروني غير صحيحة';
//         break;

//       case 'phone':
//         if (!value) error = 'رقم الهاتف لا يمكن أن يكون فارغاً';
//         else if (!/^\d+$/.test(value)) error = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
//         break;

//       case 'businessName':
//       case 'businessType':
//         if (!value) error = 'هذا الحقل لا يمكن أن يكون فارغاً';
//         else if (/^\d+$/.test(value)) error = 'لا يمكن أن يحتوي على أرقام فقط';
//         else if (/^[^A-Za-z0-9]+$/.test(value)) error = 'لا يمكن أن يحتوي على رموز فقط';
//         break;

//       case 'companyEmail':
//         if (!value) error = 'البريد الإلكتروني للشركة لا يمكن أن يكون فارغاً';
//         else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'صيغة البريد الإلكتروني للشركة غير صحيحة';
//         break;

//       case 'companyPhone':
//         if (!value) error = 'رقم هاتف الشركة لا يمكن أن يكون فارغاً';
//         else if (!/^\d+$/.test(value)) error = 'رقم هاتف الشركة يجب أن يحتوي على أرقام فقط';
//         break;

//       case 'password':
//         if (!value) error = 'كلمة المرور لا يمكن أن تكون فارغة';
//         else if (value.length < 6) error = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
//         else if (/^[A-Za-z]+$/.test(value) || /^\d+$/.test(value) || /^[^A-Za-z0-9]+$/.test(value)) {
//           error = 'كلمة المرور يجب أن تحتوي على مزيج من حروف، أرقام وربما رموز';
//         }
//         break;

//       case 'confirmPassword':
//         if (value !== form.password) error = 'كلمة المرور وتأكيدها غير متطابقين';
//         break;

//       default:
//         break;
//     }

//     setErrors((prev: any) => ({ ...prev, [name]: error }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     Object.entries(form).forEach(([key, value]) => validateField(key, value as string));

//     if (!form.agree) setErrors((prev: any) => ({ ...prev, agree: 'يجب الموافقة على الشروط والأحكام' }));

//     const hasErrors = Object.values(errors).some((e) => e);
//     if (!hasErrors && form.agree) {
//       console.log('Signup Data:', form);
//       alert('تم إنشاء الحساب بنجاح');
//       onBackToLogin();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center p-4">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
//         <div className="flex justify-center mb-4">
//           <img src={logo} className="w-20 h-20 object-contain" />
//         </div>

//         <h2 className="text-2xl font-bold text-center text-[#1E293B]">إنشاء حساب جديد</h2>
//         <p className="text-sm text-center text-gray-500 mb-6">
//           أنشئ حسابك للبدء في استخدام النظام
//         </p>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <Input icon={<User size={18} />} name="username" placeholder="اسم المستخدم" value={form.username} onChange={handleChange} error={errors.username} />
//           <Input icon={<Mail size={18} />} name="email" type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={handleChange} error={errors.email} />
//           <Input icon={<Phone size={18} />} name="phone" placeholder="رقم الهاتف" value={form.phone} onChange={handleChange} error={errors.phone} />
//           <Input icon={<Building size={18} />} name="businessName" placeholder="اسم النشاط / الشركة" value={form.businessName} onChange={handleChange} error={errors.businessName} />
//           <Input icon={<Mail size={18} />} name="companyEmail" type="email" placeholder="البريد الإلكتروني للشركة" value={form.companyEmail} onChange={handleChange} error={errors.companyEmail} />
//           <Input icon={<Phone size={18} />} name="companyPhone" placeholder="رقم هاتف الشركة" value={form.companyPhone} onChange={handleChange} error={errors.companyPhone} />
          
//           {/* Passwords */}
//           <PasswordInput placeholder="كلمة المرور" value={form.password} onChange={(v: string) => setForm({ ...form, password: v })} error={errors.password} />
//           <PasswordInput placeholder="تأكيد كلمة المرور" value={form.confirmPassword} onChange={(v: string) => setForm({ ...form, confirmPassword: v })} error={errors.confirmPassword} />

//           <Input icon={<Building size={18} />} name="businessType" placeholder="نوع النشاط" value={form.businessType} onChange={handleChange} error={errors.businessType} />

//           <label className="flex items-center gap-2 text-sm">
//             <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
//             أوافق على الشروط والأحكام
//           </label>
//           {errors.agree && <p className="text-red-500 text-sm">{errors.agree}</p>}

//           <button type="submit" className="w-full bg-[#1E293B] text-white font-bold py-3 rounded-xl">
//             إنشاء حساب
//           </button>

//           <div className="text-center text-sm">
//             لديك حساب بالفعل؟
//             <button type="button" onClick={onBackToLogin} className="text-[#3B82F6] font-bold mr-1">
//               تسجيل الدخول
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// /* Reusable Components */
// function Input({ icon, error, ...props }: any) {
//   return (
//     <div className="relative">
//       <input {...props} className={`w-full px-4 py-3 pr-10 border-2 rounded-xl ${error ? 'border-red-500' : 'border-gray-200'}`} />
//       <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
//       {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//     </div>
//   );
// }

// function PasswordInput({ placeholder, value, onChange, error }: any) {
//   return (
//     <div className="relative">
//       <input
//         type="password"
//         placeholder={placeholder}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className={`w-full px-4 py-3 pl-10 border-2 rounded-xl ${error ? 'border-red-500' : 'border-gray-200'}`}
//       />
//       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//         <Lock size={18} />
//       </div>
//       {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//     </div>
//   );
// }















import { useState } from 'react';
import logo from '../../assets/logo.png';
import { User, Mail, Phone, Lock, Building } from 'lucide-react';

interface SignUpScreenProps {
  onBackToLogin: () => void;
}

export function SignUpScreen({ onBackToLogin }: SignUpScreenProps) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    businessName: '',
    companyEmail: '',
    companyPhone: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    role: 'manager',
    agree: false,
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'username':
        if (!value) error = 'اسم المستخدم لا يمكن أن يكون فارغاً';
        else if (value.length < 3) error = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
        else if (/^\d+$/.test(value)) error = 'اسم المستخدم لا يمكن أن يكون أرقام فقط';
        break;

      case 'email':
        if (!value) error = 'البريد الإلكتروني لا يمكن أن يكون فارغاً';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'صيغة البريد الإلكتروني غير صحيحة';
        break;

      case 'phone':
        if (!value) error = 'رقم الهاتف لا يمكن أن يكون فارغاً';
        else if (!/^\d+$/.test(value)) error = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
        break;

      case 'businessName':
      case 'businessType':
        if (!value) error = 'هذا الحقل لا يمكن أن يكون فارغاً';
        break;

      case 'companyEmail':
        if (!value) error = 'البريد الإلكتروني للشركة لا يمكن أن يكون فارغاً';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'صيغة البريد الإلكتروني للشركة غير صحيحة';
        break;

      case 'companyPhone':
        if (!value) error = 'رقم هاتف الشركة لا يمكن أن يكون فارغاً';
        else if (!/^\d+$/.test(value)) error = 'رقم هاتف الشركة يجب أن يحتوي على أرقام فقط';
        break;

      // case 'password':
      //   if (!value) error = 'كلمة المرور لا يمكن أن تكون فارغة';
      //   else if (value.length < 6) error = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      //   else if (/^[A-Za-z]+$/.test(value) || /^\d+$/.test(value)) {
      //     error = 'كلمة المرور يجب أن تحتوي على حروف وأرقام';
      //   }
      //   break;



      case 'password':
  if (!value) {
    error = 'كلمة المرور لا يمكن أن تكون فارغة';
  } else if (value.length < 6) {
    error = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  } else if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    error = 'كلمة المرور يجب أن تحتوي على حروف وأرقام';
  }
  break;


      // case 'confirmPassword':
      //   if (value !== form.password) error = 'كلمة المرور وتأكيدها غير متطابقين';
      //   break;



      case 'confirmPassword':
  if (!value) {
    error = 'تأكيد كلمة المرور لا يمكن أن يكون فارغاً';
  } else if (value !== form.password) {
    error = 'كلمة المرور وتأكيدها غير متطابقين';
  }
  break;


      default:
        break;
    }

    setErrors((prev: any) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    Object.entries(form).forEach(([key, value]) => validateField(key, value as string));

    if (!form.agree) setErrors((prev: any) => ({ ...prev, agree: 'يجب الموافقة على الشروط والأحكام' }));

    const hasErrors = Object.values(errors).some((e) => e);
    if (!hasErrors && form.agree) {
      console.log('Signup Data:', form);
      alert('تم إنشاء الحساب بنجاح');
      onBackToLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-4">
          <img src={logo} className="w-20 h-20 object-contain" />
        </div>

        <h2 className="text-2xl font-bold text-center text-[#1E293B]">إنشاء حساب جديد</h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          أنشئ حسابك للبدء في استخدام النظام
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input icon={<User size={18} />} name="username" placeholder="اسم المستخدم" value={form.username} onChange={handleChange} error={errors.username} />
          <Input icon={<Mail size={18} />} name="email" type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={handleChange} error={errors.email} />
          <Input icon={<Phone size={18} />} name="phone" placeholder="رقم الهاتف" value={form.phone} onChange={handleChange} error={errors.phone} />
          <Input icon={<Building size={18} />} name="businessName" placeholder="اسم النشاط / الشركة" value={form.businessName} onChange={handleChange} error={errors.businessName} />
          <Input icon={<Mail size={18} />} name="companyEmail" type="email" placeholder="البريد الإلكتروني للشركة" value={form.companyEmail} onChange={handleChange} error={errors.companyEmail} />
          <Input icon={<Phone size={18} />} name="companyPhone" placeholder="رقم هاتف الشركة" value={form.companyPhone} onChange={handleChange} error={errors.companyPhone} />

          {/* Passwords */}
          <PasswordInput
            placeholder="كلمة المرور"
            value={form.password}
            onChange={(v: string) => setForm({ ...form, password: v })}
            error={errors.password}
          />
          <PasswordInput
            placeholder="تأكيد كلمة المرور"
            value={form.confirmPassword}
            onChange={(v: string) => setForm({ ...form, confirmPassword: v })}
            error={errors.confirmPassword}
          />

          <Input icon={<Building size={18} />} name="businessType" placeholder="نوع النشاط" value={form.businessType} onChange={handleChange} error={errors.businessType} />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
            أوافق على الشروط والأحكام
          </label>
          {errors.agree && <p className="text-red-500 text-sm">{errors.agree}</p>}

          <button type="submit" className="w-full bg-[#1E293B] text-white font-bold py-3 rounded-xl">
            إنشاء حساب
          </button>

          <div className="text-center text-sm">
            لديك حساب بالفعل؟
            <button type="button" onClick={onBackToLogin} className="text-[#3B82F6] font-bold mr-1">
              تسجيل الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Reusable Components */
function Input({ icon, error, ...props }: any) {
  return (
    <div className="relative">
      <input {...props} className={`w-full px-4 py-3 pr-10 border-2 rounded-xl ${error ? 'border-red-500' : 'border-gray-200'}`} />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function PasswordInput({ placeholder, value, onChange, error }: any) {
  return (
    <div className="relative">
      <input
        type="password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 pr-10 pl-4 border-2 rounded-xl ${error ? 'border-red-500' : 'border-gray-200'}`}
      />

      {/* Lock icon on right */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Lock size={18} />
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}


