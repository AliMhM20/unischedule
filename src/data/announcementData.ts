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
  id: 'v1.6.1-patch-starred-courses-print-fixes',
  version: '۱.۶.۱',
  badge: 'پچ جدید 🛠️',
  date: 'شهریور ۱۴۰۵',
  title: 'پچ جدید ۱.۶.۱ UniSchedule و رفع باگ‌های گزارش‌شده',
  description: 'در این به‌روزرسانی دو مورد از باگ‌های گزارش‌شده برطرف شد، سیستم پرینت برنامه بازطراحی گردید و قابلیت کاربردی «ستاره‌دار کردن دروس» اضافه شد:',
  categories: [
    {
      title: 'قابلیت ستاره‌دار کردن دروس (دروس برگزیده و اولویت‌دار)',
      items: [
        'امکان ستاره‌دار کردن دروسی که اهمیت بیشتری نسبت به باقی دروس دارند در سراسر سامانه (بانک دروس، جدول هفتگی، سایدبار و تقویم امتحانات)',
        'اضافه شدن گزینه «دروس ستاره‌دار» به فیلتر انتخاب وضعیت دروس در بانک دانشگاه جهت تفکیک و دسترسی بسیار سریع‌تر',
      ],
    },
    {
      title: 'تحول اساسی در سیستم پرینت و خروجی برنامه دانشجو',
      items: [
        'تغییر بزرگ در سیستم پرینت گرفتن از برنامه هفتگی با بازطراحی رابط کاربری و بهبود تجربه کاربری',
        'امکانات و تنظیمات بیشتر شامل پیش‌نمایش زنده، تغییر چیدمان (افقی/عمودی)، تم‌های رنگی و سیاه‌وسفید اداری، درج مشخصات دانشجو و دانشگاه، و خروجی برداری باکیفیت وکتور در PDF',
      ],
    },
    {
      title: 'رفع باگ‌های گزارش‌شده و بهبود پایداری',
      items: [
        'رفع مشکل بیرون‌زدگی و به‌هم‌ریختگی کادر فیلتر زمان کلاس، داخل بانک دروس',
        'اصلاح نحوه نمایش و فونت کد دروس و شماره گروه‌ها مطابق استاندارد (کد درس_کد گروه)',
      ],
    },
  ],
  telegramChannel: {
    url: 'https://t.me/UniSchedule_aut',
    handle: '@UniSchedule_aut',
    label: 'عضویت در کانال تلگرام UniSchedule',
  },
};
