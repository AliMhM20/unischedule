export interface AnnouncementCategory {
  title: string;
  items: string[];
}

export interface AnnouncementItem {
  id: string;
  version: string;
  badge?: string;
  date: string;
  title: string;
  description: string;
  categories: AnnouncementCategory[];
  telegramChannel?: {
    url: string;
    handle: string;
    label: string;
  };
}

export const LATEST_ANNOUNCEMENT: AnnouncementItem = {
  id: 'v1.4.1-catalog-reload-and-kntu-sessions',
  version: '۱.۴.۱',
  badge: 'به‌روزرسانی جدید 🚀',
  date: 'شهریور ۱۴۰۵',
  title: 'تغییرات و قابلیت‌های نسخه ۱.۴.۱ UniSchedule',
  description: 'در این به‌روزرسانی، قابلیت هوشمند ذخیره‌سازی و بارگذاری مجدد فایل‌های کاتالوگ اضافه شده و موتور پردازش کاتالوگ دانشگاه خواجه‌نصیر ارتقا یافته است:',
  categories: [
    {
      title: 'ذخیره‌سازی و بارگذاری مجدد فایل‌های کاتالوگ',
      items: [
        'امکان بارگذاری مجدد و بازپردازش فایل‌های HTML کاتالوگ تنها با یک کلیک',
        'ذخیره‌سازی خودکار تمامی فایل‌های وارد شده در حافظه امن مرورگر جهت جلوگیری از نیاز به آپلود مجدد',
        'بازنشانی و بازگرداندن دروس حذف‌شده یا پنهان‌شده به حالت اولیه با زدن دکمه بارگذاری مجدد',
        'کارت بازیابی هوشمند در صفحه خالی بانک دروس برای لود مجدد منابع بدون انتخاب فایل از کامپیوتر',
      ],
    },
    {
      title: 'ارتقای موتور پردازش دانشگاه خواجه‌نصیر (KNTU)',
      items: [
        'تشخیص و استخراج دقیق تمام روزها و ساعات برای دروس ۳ واحدی و چند جلسه‌ای در طول هفته',
        'نمایش کامل مکان و زمان‌بندی جلسات مختلف روی کارت‌های درس و جدول هفتگی کلاس‌ها',
      ],
    },
    {
      title: 'پایداری و بهینه‌سازی عملکرد',
      items: [
        'اصلاح ساختار رندرینگ بانک دروس جهت بارگذاری آنی و پایدار',
        'حفظ و همگام‌سازی تنظیمات و انتخاب‌های کاربر بین دفعات باز و بسته کردن برنامه',
      ],
    },
  ],
  telegramChannel: {
    url: 'https://t.me/UniSchedule_aut',
    handle: '@UniSchedule_aut',
    label: 'عضویت در کانال تلگرام UniSchedule',
  },
};
