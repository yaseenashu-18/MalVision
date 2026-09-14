import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface CapabilityCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badgeStyleClass: string;
  delayClass?: string;
  onClick?: () => void;
}

export const CapabilityCard: React.FC<CapabilityCardProps> = ({
  title,
  description,
  icon: Icon,
  badgeStyleClass,
  delayClass = '',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-start space-x-3.5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer select-none ${delayClass}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${badgeStyleClass}`}>
        <Icon className="w-5 h-5 stroke-[1.5]" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
          {title}
        </h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};
