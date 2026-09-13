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
  id: 'v1.6.0-sbu-support-smart-gap-replacement-donation',
  version: '۱.۶.۰',
  badge: 'به‌روزرسانی جدید 🚀',
  date: 'شهریور ۱۴۰۵',
  title: 'تغییرات و قابلیت‌های جدید نسخه ۱.۶.۰ UniSchedule',
  description: 'در این به‌روزرسانی دانشگاه شهید بهشتی به سامانه اضافه شد، قابلیت تعویض هوشمند درس از جدول پیاده‌سازی شد و امکان حمایت مالی (دونیت) اضافه گردید:',
  categories: [
    {
      title: 'پشتیبانی از دانشگاه شهید بهشتی (SBU)',
      items: [
        'پشتیبانی کامل از هر دو گزارش ۱۰۲ و ۲۱۲ سامانه بهستان دانشگاه شهید بهشتی برای استخراج دروس',
        'راهنمای تصویری گام‌به‌گام و اختصاصی به همراه نکات مهم بارگذاری برای دانشجویان شهید بهشتی',
      ],
    },
    {
      title: 'ارتقای سیستم انتخاب از بانک دروسِ جدول هفتگی',
      items: [
        'امکان کلیک مستقیم روی درس‌های ثبت‌شده در جدول هفتگی جهت باز شدن بانک دروس با فیلتر همان بازه زمانی (جهت مقایسه و تعویض آسان دروس)',
      ],
    },
    {
      title: 'دکمه بازنشانی تمام فیلترها در بانک دروس',
      items: [
        'اضافه شدن دکمه کاربردی «بازنشانی فیلترها» که در صورت فعال بودن هر یک از فیلترها فعال شده و با یک کلیک وضعیت را به حالت اولیه برمی‌گرداند',
      ],
    },
    {
      title: 'سیستم حمایت مالی و دونیت (رِیمیت)',
      items: [
        'اضافه شدن درگاه حمایت‌مالی با اتصال مستقیم به درگاه امن رِیمیت جهت حمایت دانشجویان از تداوم توسعه پروژه رایگان UniSchedule',
      ],
    },
  ],
  telegramChannel: {
    url: 'https://t.me/UniSchedule_aut',
    handle: '@UniSchedule_aut',
    label: 'عضویت در کانال تلگرام UniSchedule',
  },
};
