import React from 'react';

// Man Head Icon (Short hair)
export const ManHeadIcon: React.FC<{ className?: string }> = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10a5 5 0 0 1 10 0v2a5 5 0 0 1-10 0v-2z" />
    <path d="M7 9c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
    <path d="M4 21v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1" />
  </svg>
);

// Woman Head Icon (Long hair)
export const WomanHeadIcon: React.FC<{ className?: string }> = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10a4 4 0 0 1 8 0v2a4 4 0 0 1-8 0v-2z" />
    <path d="M6 10c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5v6c0 1.5-.7 2.5-2 2.5s-1.5-1-1.5-2.5" />
    <path d="M6 10v6c0 1.5.7 2.5 2 2.5s1.5-1 1.5-2.5" />
    <path d="M4 21v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
  </svg>
);

interface GenderBadgeProps {
  gender?: 'mixed' | 'men' | 'women';
  size?: 'sm' | 'xs';
}

export const GenderBadge: React.FC<GenderBadgeProps> = ({ gender, size = 'sm' }) => {
  if (!gender) return null;

  const textSize = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';
  const iconSize = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (gender === 'mixed') {
    return (
      <span 
        className={`${textSize} font-bold text-slate-800 dark:text-slate-200 bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-pink-500/15 dark:from-blue-500/25 dark:via-purple-500/25 dark:to-pink-500/25 rounded-md border border-purple-200/80 dark:border-purple-800/50 flex items-center gap-1.5 shadow-2xs shrink-0`}
        title="جنسیت: مختلط"
      >
        <span className="flex items-center -space-x-1 rtl:space-x-reverse">
          <ManHeadIcon className={`${iconSize} text-blue-600 dark:text-blue-400`} />
          <WomanHeadIcon className={`${iconSize} text-pink-600 dark:text-pink-400`} />
        </span>
        <span>مختلط</span>
      </span>
    );
  }

  if (gender === 'men') {
    return (
      <span 
        className={`${textSize} font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 rounded-md border border-blue-200 dark:border-blue-800/40 flex items-center gap-1 shadow-2xs shrink-0`}
        title="جنسیت: آقایان"
      >
        <ManHeadIcon className={`${iconSize} text-blue-600 dark:text-blue-400`} />
        <span>آقایان</span>
      </span>
    );
  }

  if (gender === 'women') {
    return (
      <span 
        className={`${textSize} font-bold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/40 rounded-md border border-pink-200 dark:border-pink-800/40 flex items-center gap-1 shadow-2xs shrink-0`}
        title="جنسیت: بانوان"
      >
        <WomanHeadIcon className={`${iconSize} text-pink-600 dark:text-pink-400`} />
        <span>بانوان</span>
      </span>
    );
  }

  return null;
};
