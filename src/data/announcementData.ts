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
  id: 'v1.4.2-gender-filter-time-range-and-confirm-modals',
  version: '۱.۴.۲',
  badge: 'به‌روزرسانی جدید 🚀',
  date: 'شهریور ۱۴۰۵',
  title: 'تغییرات و قابلیت‌های نسخه ۱.۴.۲ UniSchedule',
  description: 'در این به‌روزرسانی، ابزارهای فیلترینگ بانک دروس ارتقا یافته، سرعت برنامه افزایش یافته و تجربه کاربری در محیط دسکتاپ ویندوز بهبود پیدا کرده است:',
  categories: [
    {
      title: 'فیلترهای پیشرفته و هوشمند بانک دروس',
      items: [
        'تفکیک خودکار جنسیت کلاس‌ها (مختلط، آقایان، بانوان) همراه با برچسب‌های رنگی اختصاصی',
        'امکان فیلتر کردن دروس بر اساس بازه ساعت دلخواه شروع و پایان کلاس',
        'هایلایت رنگی کادر فیلترهای فعال و اضافه شدن دکمه ضربدر برای پاکسازی سریع کادر جستجو',
      ],
    },
    {
      title: 'ارتقای عملکرد و مدیریت تداخل‌ها',
      items: [
        'حذف خودکار سطرهای تکراری فایل دانشگاه هنگام بارگذاری اولیه و جلوگیری از افت سرعت و لگ',
        'نمایش برچسب هشدار در صورت ثبت گروه موازی دیگری از همان درس در برنامه',
        'جایگزینی یکپارچه و دقیق دروس متداخل بدون باقی‌ماندن درس قبلی در جدول',
      ],
    },
    {
      title: 'پنجره‌های اختصاصی و پایداری نسخه دسکتاپ',
      items: [
        'طراحی پنجره‌های مدرن تایید و هشدار هماهنگ با تم دارک‌مود و فونت فارسی',
        'رفع کامل مشکل از کار افتادن دکمه‌ها و کلیک‌ها در نسخه ویندوز',
      ],
    },
  ],
  telegramChannel: {
    url: 'https://t.me/UniSchedule_aut',
    handle: '@UniSchedule_aut',
    label: 'عضویت در کانال تلگرام UniSchedule',
  },
};
