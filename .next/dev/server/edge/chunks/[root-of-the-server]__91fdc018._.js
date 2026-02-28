(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__91fdc018._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/config.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultLocale",
    ()=>defaultLocale,
    "locales",
    ()=>locales
]);
const locales = [
    'en',
    'ar'
];
const defaultLocale = 'en';
}),
"[project]/messages/ar.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"navigation":{"activeBookings":"الحجوزات النشطة","bookingHistory":"سجل الحجوزات","login":"تسجيل الدخول","myAccount":"حسابي","logout":"تسجيل الخروج"},"hero":{"rentACar":"استئجار سيارة"},"carSearch":{"from":"من","to":"إلى","pickupDate":"تاريخ الاستلام","dropDate":"تاريخ التسليم","selfDrive":"قيادة ذاتية","sameAsPickup":"نفس عنوان الاستلام","searchRides":"ابحث عن السيارات","tripType":"محلي"},"carFilter":{"exploreFleet":"استكشف الأسطول حسب الفئات","byBodyTypes":"حسب نوع الهيكل","byBrands":"حسب العلامة التجارية","loading":"جاري التحميل...","error":"خطأ في تحميل الفلاتر","retry":"أعد المحاولة","noData":"لا توجد بيانات متاحة"},"auth":{"email":"البريد الإلكتروني","password":"كلمة المرور","confirmPassword":"تأكيد كلمة المرور","fullName":"الاسم الكامل","phone":"الهاتف","code":"الرمز","dateOfBirth":"تاريخ الميلاد","nationality":"الجنسية","forgotPassword":"نسيت كلمة المرور؟","register":"التسجيل","alreadyHaveAccount":"هل لديك حساب بالفعل؟","dontHaveAccount":"ليس لديك حساب؟","signUp":"إنشاء حساب","sendOTP":"إرسال رمز التحقق","verifyOTP":"تحقق من الرمز","resetPassword":"إعادة تعيين كلمة المرور","enterEmail":"أدخل بريدك الإلكتروني","enterOTP":"أدخل رمز التحقق","newPassword":"كلمة مرور جديدة","login":"تسجيل الدخول","loading":"جاري التحميل..."},"footer":{"aboutUs":"من نحن","privacyPolicy":"سياسة الخصوصية","availableCars":"السيارات المتاحة","refundPolicy":"سياسة الاسترداد","contactUs":"اتصل بنا","terms":"الشروط والأحكام","rights":"جميع الحقوق محفوظة"},"common":{"loading":"جاري التحميل...","error":"خطأ","success":"نجح","cancel":"إلغاء","save":"حفظ","delete":"حذف","edit":"تعديل","close":"إغلاق","submit":"إرسال"},"validation":{"required":"هذا الحقل مطلوب","emailInvalid":"عنوان البريد الإلكتروني غير صحيح","passwordMin":"يجب أن تكون كلمة المرور 8 أحرف على الأقل","passwordMismatch":"كلمات المرور غير متطابقة","phoneInvalid":"رقم الهاتف غير صحيح","minLength":"يجب أن يكون {min} أحرف على الأقل","pickupAddressMin":"يجب أن يكون عنوان الاستلام 3 أحرف على الأقل","dropAddressMin":"يجب أن يكون عنوان التسليم 3 أحرف على الأقل","pickupDateFuture":"يجب أن يكون تاريخ الاستلام اليوم أو لاحقاً","dropDateAfterPickup":"يجب أن يكون تاريخ التسليم مساوياً أو بعد تاريخ الاستلام"},"home":{"rentCar":"إستأجر سيارة","exploreFleet":"استكشف فئات الأسطول","luxury":"للفخامة","brands":"العلامات التجارية التي نعمل معها","easyRide":{"title":"الحصول على توصيلة سهل. سهل جداً.","step1":"اختر سيارتك","step1Desc":"اختر سيارة تناسب رحلتك وميزانيتك.","step2":"تأكيد فوري","step2Desc":"شاهد السعر النهائي مقدماً - بدون مفاجآت.","step3":"استرخ واستمتع","step3Desc":"سائقون معتمدون يوصلونك في الوقت المحدد."},"whyChoose":{"title":"لماذا تختارنا","driverTitle":"توافر سائق محترف","driverDesc":"هل تحتاج إلى سائق؟ يضمن محترفونا المدربون تجربة سفر آمنة وسلسة وخالية من التوتر.","deliveryTitle":"خدمة توصيل سريعة","deliveryDesc":"احصل على سيارتك المستأجرة إلى موقعك بسرعة وكفاءة - لا انتظار غير ضروري.","supportTitle":"فريق دعم موثوق","supportDesc":"خبراء الدعم لدينا متاحون على مدار الساعة لمساعدتك في الحجوزات أو المشكلات أو الطلبات الخاصة."},"partnerships":{"subtitle":"مبني على شراكات طويلة الأمد","title":"قيادة النجاح للشركات الرائدة في جميع أنحاء العالم","desc":"فاست سكيب كانت شريك التنقل الموثوق للمنظمات في جميع أنحاء العالم لأكثر من عقد، مقدمة حلول نقل موثوقة وقابلة للتطوير وفعالة.","statsVehicles":"مركبة","statsStates":"ولاية"}},"carList":{"title":"استكشف الأسطول حسب الفئات","explore":"استكشف","viewDetails":"عرض التفاصيل"}});}),
"[project]/messages/en.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"navigation":{"activeBookings":"Active Bookings","bookingHistory":"Booking History","login":"Login","myAccount":"My Account","logout":"Logout"},"hero":{"rentACar":"Rent a car"},"carSearch":{"from":"From","to":"To","pickupDate":"Pickup Date","dropDate":"DropOff Date","selfDrive":"Self Drive","sameAsPickup":"Same as Pickup Address","searchRides":"Search the Rides","tripType":"Domestic"},"carFilter":{"exploreFleet":"Explore the Fleet By Categories","byBodyTypes":"By Body Types","byBrands":"By Brands","loading":"Loading filters...","error":"Error loading filters","retry":"Retry","noData":"No filter data available"},"auth":{"email":"Email","password":"Password","confirmPassword":"Confirm Password","fullName":"Full Name","phone":"Phone","code":"Code","dateOfBirth":"Date of Birth","nationality":"Nationality","forgotPassword":"Forgot Password?","register":"Register","alreadyHaveAccount":"Already have an account?","dontHaveAccount":"Don't have an account?","signUp":"Sign Up","sendOTP":"Send OTP","verifyOTP":"Verify OTP","resetPassword":"Reset Password","enterEmail":"Enter your email","enterOTP":"Enter OTP","newPassword":"New Password","login":"Login","loading":"Loading..."},"footer":{"aboutUs":"About Us","privacyPolicy":"Privacy Policy","availableCars":"Available Cars","refundPolicy":"Refund Policy","contactUs":"Contact Us","terms":"Terms & Conditions","rights":"All rights reserved"},"common":{"loading":"Loading...","error":"Error","success":"Success","cancel":"Cancel","save":"Save","delete":"Delete","edit":"Edit","close":"Close","submit":"Submit"},"validation":{"required":"This field is required","emailInvalid":"Invalid email address","passwordMin":"Password must be at least 8 characters","passwordMismatch":"Passwords do not match","phoneInvalid":"Invalid phone number","minLength":"Must be at least {min} characters long","pickupAddressMin":"Pickup address must be at least 3 characters long","dropAddressMin":"Drop address must be at least 3 characters long","pickupDateFuture":"Pickup date must be today or later","dropDateAfterPickup":"Drop date must be same as or after pickup date"},"home":{"rentCar":"Rent a car","exploreFleet":"Explore Fleet Categories","luxury":"For the Luxury","brands":"Brands We Work with","easyRide":{"title":"Getting a ride is easy. Really easy.","step1":"Choose your ride","step1Desc":"Select a car that fits your trip and budget.","step2":"Confirm instantly","step2Desc":"See final pricing upfront—no surprises.","step3":"Sit back & relax","step3Desc":"Verified drivers get you there on time."},"whyChoose":{"title":"Why Choose Us","driverTitle":"Professional Driver Availability","driverDesc":"Need a driver? Our trained professionals ensure a safe, smooth, and stress-free travel experience.","deliveryTitle":"Fast Delivery Service","deliveryDesc":"Get your rental car delivered to your location quickly and efficiently—no unnecessary waiting.","supportTitle":"Reliable Support Team","supportDesc":"Our support specialists are available around the clock to assist you with bookings, issues, or special requests."},"partnerships":{"subtitle":"Built on long-term partnerships","title":"Driving success for leading companies worldwide","desc":"Fastscape has been the trusted mobility partner for organizations across the globe for over a decade, delivering reliable, scalable, and efficient transportation solutions.","statsVehicles":"Vehicles","statsStates":"States"}},"carList":{"title":"Explore the Fleet By Categories","explore":"Explore","viewDetails":"View Details"}});}),
"[project]/i18n.ts [middleware-edge] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "localeDirections",
    ()=>localeDirections
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$server$2f$react$2d$server$2f$getRequestConfig$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__default__as__getRequestConfig$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/server/react-server/getRequestConfig.js [middleware-edge] (ecmascript) <export default as getRequestConfig>");
var __TURBOPACK__imported__module__$5b$project$5d2f$config$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/config.ts [middleware-edge] (ecmascript)");
;
;
;
const localeDirections = {
    en: 'ltr',
    ar: 'rtl'
};
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$server$2f$react$2d$server$2f$getRequestConfig$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__default__as__getRequestConfig$3e$__["getRequestConfig"])(async ({ requestLocale })=>{
    let locale = await requestLocale;
    // Validate that the incoming `locale` parameter is valid
    if (!locale || !__TURBOPACK__imported__module__$5b$project$5d2f$config$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["locales"].includes(locale)) {
        locale = __TURBOPACK__imported__module__$5b$project$5d2f$config$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["defaultLocale"];
    }
    return {
        locale,
        messages: (await __turbopack_context__.f({
            "./messages/ar.json": {
                id: ()=>"[project]/messages/ar.json (json)",
                module: ()=>Promise.resolve().then(()=>__turbopack_context__.i("[project]/messages/ar.json (json)"))
            },
            "./messages/en.json": {
                id: ()=>"[project]/messages/en.json (json)",
                module: ()=>Promise.resolve().then(()=>__turbopack_context__.i("[project]/messages/en.json (json)"))
            }
        }).import(`./messages/${locale}.json`)).default
    };
});
}),
"[project]/routing.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Link",
    ()=>Link,
    "getPathname",
    ()=>getPathname,
    "redirect",
    ()=>redirect,
    "routing",
    ()=>routing,
    "usePathname",
    ()=>usePathname,
    "useRouter",
    ()=>useRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$routing$2f$defineRouting$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__default__as__defineRouting$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/routing/defineRouting.js [middleware-edge] (ecmascript) <export default as defineRouting>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$navigation$2f$react$2d$server$2f$createNavigation$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__default__as__createNavigation$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/navigation/react-server/createNavigation.js [middleware-edge] (ecmascript) <export default as createNavigation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$config$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/config.ts [middleware-edge] (ecmascript)");
;
;
;
const routing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$routing$2f$defineRouting$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__default__as__defineRouting$3e$__["defineRouting"])({
    locales: __TURBOPACK__imported__module__$5b$project$5d2f$config$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["locales"],
    defaultLocale: __TURBOPACK__imported__module__$5b$project$5d2f$config$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["defaultLocale"],
    localePrefix: 'always'
});
const { Link, redirect, usePathname, useRouter, getPathname } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$navigation$2f$react$2d$server$2f$createNavigation$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__default__as__createNavigation$3e$__["createNavigation"])(routing);
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$middleware$2f$middleware$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/middleware/middleware.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$routing$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/routing.ts [middleware-edge] (ecmascript)");
;
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$middleware$2f$middleware$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"])(__TURBOPACK__imported__module__$5b$project$5d2f$routing$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["routing"]);
const config = {
    // Match only internationalized pathnames
    matcher: [
        '/',
        '/(ar|en)/:path*'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__91fdc018._.js.map