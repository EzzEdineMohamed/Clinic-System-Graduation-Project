# Clinic System — Frontend (Next.js)

الفرونت أند بتاع نظام إدارة العيادة. الباك أند كله على Supabase، والمشروع ده بيكلمه بـ `fetch` بس من ملف واحد: `src/lib/api.ts`.

## التشغيل (على Windows)

1. **فك الـ zip في فولدر عادي**، زي `C:\projects\clinic-system`. مش على الـ Desktop ولا جوه OneDrive أو Google Drive، ومش فوق نسخة قديمة.
2. **ضيف الفولدر لاستثناءات الأنتي فيروس**: Windows Security ← Virus & threat protection ← Manage settings ← Add or remove exclusions ← Folder.
3. افتح الترمينال جوه الفولدر، وسطّب المكتبات، واستنى لحد ما يخلص خالص:
   ```
   npm ci
   ```
   (بيعمل كمان `next typegen` لوحده، فالـ `PageProps` و `LayoutProps` يبقوا معروفين في VS Code على طول)
4. اعمل نسخة من `.env.example` باسم `.env.local`، واملا فيها رابط المشروع والـ Publishable key.
5. شغّل:
   ```
   npm run dev
   ```
   وافتح `http://localhost:3000`.

**لو الزرار فضل على "لحظة…" أو ظهرت errors في الـ Console:** اقفل السيرفر، وامسح `.next`، وشغّل `npm run dev` تاني، واعمل `Ctrl + Shift + R`. ولو فضلت، امسح `node_modules` و `.next` واعمل `npm ci` تاني.

**قبل ما تشغّل:** الباك أند لازم يكون جاهز على Supabase (الجداول والـ endpoints)، و **Confirm email** مقفول من Authentication ← Sign In / Providers ← Email.

## الـ Endpoints اللي المشروع بيستخدمها

| الدالة في `api.ts` | Endpoint |
| --- | --- |
| `api.signup()` | `POST /auth/v1/signup` |
| `api.login()` | `POST /auth/v1/token?grant_type=password` |
| `api.refresh()` | `POST /auth/v1/token?grant_type=refresh_token` |
| `api.logout()` | `POST /auth/v1/logout` |
| `api.me()` | `POST /rest/v1/rpc/get_my_profile` |
| `api.isPhoneRegistered()` | `POST /rest/v1/rpc/is_phone_registered` |
| `api.rpc(name, params, token)` | `POST /rest/v1/rpc/<name>` (للفيتشرز الجاية) |

## شكل المشروع

```
src/types/auth.ts       الـ types والـ interfaces (شكل البيانات)
src/lib/api.ts          الملف الوحيد اللي بيكلم الباك أند (fetch)
src/lib/api-messages.ts رسايل الأخطاء بالعربي
src/lib/session.ts      حفظ التوكنات في cookies
src/lib/auth.ts         requireRole(): حماية كل layout على السيرفر
src/lib/roles.ts        الأدوار وصفحة كل role
src/proxy.ts            قبل أي صفحة: تجديد التوكن + التوجيه حسب الـ role
src/app/(auth)/         صفحات الـ Login والـ Register
src/app/patient|nurse|doctor|admin/   صفحة كل role
src/components/         الـ navbar والـ sidebar والزراير والـ loading
```
