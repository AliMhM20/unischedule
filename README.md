# 🎓 UniSchedule 
(برنامه‌ریز هوشمند انتخاب واحد و تقویم دانشگاه)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-43.4-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

برنامه **UniSchedule** یک ابزار مدرن، آزاد و متن‌باز (Open-Source) است که با هدف تسهیل، سرعت‌بخشی و بهینه‌سازی فرآیند انتخاب واحد و برنامه‌ریزی تحصیلی برای دانشجویان دانشگاه‌ها طراحی و توسعه یافته است.

---

## ✨ قابلیت‌ها و ویژگی‌های کلیدی (Features)

* **🎨 رابط کاربری مدرن و واکنش‌گرا (Responsive UI):** طراحی بر اساس اصول مدرن UI/UX، پشتیبانی کامل از حالت تاریک (Dark Mode) و روشن (Light Mode)، و امکان تغییر سایز تا ابعاد پنجره موبایل.
* **📥 وارد کردن خودکار دروس از سامانه بهستان (Behestan HTML Import):** امکان استخراج آنی و خودکار لیست دروس از فایل یا کد HTML گزارش ۲۱۲ سامانه بهستان بدون نیاز به تایپ دستی.
* **⚠️ سیستم هوشمند تشخیص تداخلات:**
  * پایش و هشدار تداخل زمانی جلسات کلاسی در طول هفته.
  * پایش و هشدار هم‌پوشانی تاریخ و ساعت امتحانات پایان‌ترم.
* **📑 سناریوسازی چندگانه (Multi-Scenario Plans):** امکان ایجاد، نام‌گذاری و مقایسه چندین برنامه انتخاب واحد مختلف (پلان الف، پلان ب و...) به صورت همزمان.
* **📅 گاه‌شمار گرافیکی امتحانات (Exam Timeline):** نمای تقویمی جذاب جهت مرتب‌سازی و برنامه‌ریزی مطالعاتی امتحانات پایان‌ترم بر اساس تاریخ برگزاری.
* **🖨️ خروجی استاندارد چاپ و PDF:** بهینه‌سازی کامل جهت چاپ خوانا یا خروجی PDF از برنامه کلاسی و امتحانات بدون به‌هم‌ریختگی.
* **⚡ سیستم به‌روزرسانی هوشمند دسکتاپ (Differential Auto-Updater):**
  * مرکز اختصاصی مدیریت آپدیت داخل نسخه دسکتاپ.
  * به‌روزرسانی تفاضلی بر پایه Blockmap (دانلود تنها تغییرات به جای کل فایل نصبی).
  * کنترل کامل فرآیند دریافت (توقف موقت Pause، ادامه Resume و لغو Cancel بدون هدر رفتن حجم قبلی).
  * راه‌اندازی مجدد و اعمال آنی و روان نسخه جدید.
* **🔒 ذخیره‌سازی ایزوله و محلی (Local Persistence):** تمام داده‌های انتخاب واحد و سناریوها به صورت امن و ایزوله روی سیستم کاربر ذخیره شده و هیچ اطلاعاتی به سرورهای خارجی ارسال نمی‌شود.

---

## 💻 راهنمای استفاده و دریافت (How to Use)

شما می‌توانید به دو صورت از **UniSchedule** استفاده کنید:

### ۱. نسخه وب (Web Application)
بدون نیاز به نصب هیچ برنامه‌ای، می‌توانید مستقیماً از طریق مرورگر اینترنت خود از پروژه استفاده نمایید:

👉 **[ورود به نسخه وب UniSchedule](https://alimhm20.github.io/unischedule/)**

> [!TIP]
> تمام قابلیت‌های چیدمان دروس، بهستان و پرینت در نسخه وب کاملاً فعال هستند. (بخش مرکز به‌روزرسانی نرم‌افزار به صورت خودکار مختص نسخه دسکتاپ است).

---

### ۲. نسخه دسکتاپ ویندوز (Windows Desktop Application)
برای استفاده آفلاین، کارایی بالاتر و دریافت خودکار به‌روزرسانی‌ها، نسخه دسکتاپ پیشنهاد می‌شود.

👉 **[دانلود آخرین نسخه از صفحه Releases گیت‌هاب](https://github.com/AliMhM20/unischedule/releases/latest)**

در صفحه Releases، نسخه‌های زیر متناسب با نیاز شما قرار دارند:
* **فایل نصبی استاندارد (`UniSchedule-Setup-x.x.x.exe`):** همراه با ویزارد نصب، ایجاد شورتکات روی دسکتاپ و پشتیبانی کامل از آپدیت تفاضلی خودکار.
* **نسخه پرتابل بدون نیاز به نصب (`UniSchedule-x.x.x.exe`):** اجرای مستقیم تنها با یک کلیک بدون نیاز به مراحل نصب.

---

## 🛠️ راهنمای توسعه و اجرای محلی (Development Guide)

اگر مایل به بررسی سورس‌کد یا توسعه پروژه روی سیستم خود هستید:

### پیش‌نیازها
* **Node.js** نسخه ۲۰ یا بالاتر
* **npm** نسخه ۱۰ یا بالاتر

### مراحل نصب و اجرا:

۱. **کلون کردن مخزن:**
```bash
git clone https://github.com/AliMhM20/unischedule.git
cd unischedule
```

۲. **نصب وابستگی‌ها:**
```bash
npm install
```

۳. **اجرای نسخه تحت وب در محیط توسعه:**
```bash
npm run dev
```
پروژه روی آدرس `http://localhost:3000` در دسترس خواهد بود.

۴. **اجرای نسخه دسکتاپ (Electron) در محیط توسعه:**
```bash
npm run electron:dev
```

۵. **ساخت فایل‌های خروجی و بیلد نصبی ویندوز:**
```bash
npm run electron:build
```
فایل‌های خروجی و نصبی در پوشه `release/` تولید خواهند شد.

---

## 📜 مجوز و کپی‌رایت (License)

این پروژه یک نرم‌افزار آزاد و متن‌باز است و تحت شرایط مجوز **[GNU General Public License v3.0 (GPLv3)](LICENSE)** منتشر شده است.

* شما آزاد هستید که این نرم‌افزار را اجرا کنید، سورس‌کد آن را مطالعه نمایید و آن را مطابق نیازهای خود تغییر دهید.
* هرگونه بازنشر، توزیع مجدد یا نسخه مشتق‌شده از این پروژه **باید نام نویسنده اصلی (Credit) را حفظ کرده و تحت همین مجوز (GPL-3.0) به صورت رایگان و متن‌باز باقی بماند.**

```text
Copyright (C) 2026 Ali Mohamadi <alimhm@aut.ac.ir>
UniSchedule is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License.
```

---

## 🤝 مشارکت و بازخورد (Contributing)

صمیمانه پذیرای نظرات، ایده‌ها، پیشنهادات و گزارش اشکالات شما هستم.
* برای گزارش اشکالات یا درخواست قابلیت‌های جدید: **[ثبت Issue در گیت‌هاب](https://github.com/AliMhM20/unischedule/issues)**
* برای ارسال کد و بهبود پروژه: **ارسال Pull Request**

🌟 اگر این پروژه برایتان کاربردی و مفید بود، با دادن یک **ستاره (Star ⭐)** در بالای صفحه از آن حمایت کنید!

---

## 📬 ارتباط با توسعه‌دهنده (Contact)

* **توسعه‌دهنده:** علی محمدی
* **ایمیل دانشگاهی:** `alimhm@aut.ac.ir`
* **تلگرام پشتیبانی:** [@alimhm_20](https://t.me/alimhm_20)
* **پروفایل گیت‌هاب:** [@AliMhM20](https://github.com/AliMhM20)
