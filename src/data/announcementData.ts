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
  id: 'v1.5.0-new-universities-timetable-preview-and-sharing',
  version: '۱.۵.۰',
  badge: 'به‌روزرسانی بزرگ 🚀',
  date: 'شهریور ۱۴۰۵',
  title: 'تغییرات و قابلیت‌های نسخه ۱.۵.۰ UniSchedule',
  description: 'در این به‌روزرسانی دانشگاه‌های جدیدی به سامانه اضافه شدند، امکان اشتراک‌گذاری سریع برنامه فراهم شد و تجربه کاربری در بانک دروس ارتقا یافت:',
  categories: [
    {
      title: 'پشتیبانی از دانشگاه‌های جدید',
      items: [
        'پشتیبانی کامل از سامانه بهستان دانشگاه صنعتی اصفهان (IUT) برای استفاده از بانک دروس',
        'پشتیبانی کامل از سامانه بهستان دانشگاه صنعتی نوشیروانی بابل (NIT) برای استفاده از بانک دروس',
        'ارتقای سیستم تشخیص هوشمند و خودکار دانشگاه هنگام بارگذاری فایل بدون ایجاد خطای تشخیصی',
      ],
    },
    {
      title: 'اشتراک‌گذاری آسان برنامه درسی',
      items: [
        'امکان ارسال مستقیم و اشتراک‌گذاری برنامه هفتگی از طریق لینک فشرده اینترنتی و کد برنامه برای دوستان',
        'امکان دریافت و بارگذاری سریع برنامه‌های اشتراک‌گذاشته‌شده بدون نیاز به ثبت دستی تک‌تک دروس',
      ],
    },
    {
      title: 'پیش‌نمایش جدول هفتگی و یادداشت دروس در بانک دروس',
      items: [
        'اضافه شدن تب‌بار دوگانه (فهرست دروس و جدول هفتگی) در بالای بانک دروس برای جابجایی راحت‌تر بین بانک دروس و جدول هفتگی',
        'اضافه شدن دکمه «انتخاب از بانک دروس» به جدول هفتگی برای پیدا کردن راحت‌تر دروس درون ساعت‌های خالی جدول',
        'اضافه شدن امکان مشاهده یادداشت‌ها و نمایش بج اختصاصی یادداشت روی کارت‌های دروس',
      ],
    },
  ],
  telegramChannel: {
    url: 'https://t.me/UniSchedule_aut',
    handle: '@UniSchedule_aut',
    label: 'عضویت در کانال تلگرام UniSchedule',
  },
};
