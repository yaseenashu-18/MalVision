import React, { useState, useEffect } from 'react';
import { CapabilityCard } from './CapabilityCard';
import { FileText, Link as LinkIcon, Image as ImageIcon, FileSpreadsheet, FileStack, Hash, Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ScannerTabId } from '../types';

interface HeroProps {
  onScanSelect: (tab: ScannerTabId) => void;
  onSeeHowItWorks: () => void;
}

interface CapabilityItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badgeStyleClass: string;
  tab: ScannerTabId;
}

const initialCards: CapabilityItem[] = [
  { id: 'files', title: 'Files', description: 'Scan any file for suspicious threats.', icon: FileText, badgeStyleClass: 'bg-pastel-purple', tab: 'file-scan' },
  { id: 'links', title: 'Links', description: 'Check URLs and links before you click.', icon: LinkIcon, badgeStyleClass: 'bg-pastel-green', tab: 'url-scan' },
  { id: 'pdfs', title: 'PDFs', description: 'Inspect PDFs for hidden content and risks.', icon: FileSpreadsheet, badgeStyleClass: 'bg-pastel-orange', tab: 'pdf-inspector' },
  { id: 'images', title: 'Images', description: 'Scan images like JPG, PNG and JPEG for threats.', icon: ImageIcon, badgeStyleClass: 'bg-pastel-blue', tab: 'file-scan' },
  { id: 'documents', title: 'Documents', description: 'Scan DOC, DOCX, PPT, TXT and more.', icon: FileStack, badgeStyleClass: 'bg-pastel-pink', tab: 'file-scan' },
  { id: 'hashes', title: 'Hashes', description: 'Analyze file hashes and match threat intelligence.', icon: Hash, badgeStyleClass: 'bg-pastel-teal', tab: 'hash-analysis' }
];

const slotClasses = [
  'top-0 right-12 sm:right-28 max-w-[260px] animate-float-slow',
  'top-[105px] left-0 max-w-[250px]',
  'top-[135px] right-0 max-w-[250px]',
  'top-[230px] right-14 sm:right-24 max-w-[250px] animate-float-delayed',
  'top-[340px] left-0 max-w-[250px]',
  'top-[355px] right-0 max-w-[250px]'
];

export const Hero: React.FC<HeroProps> = ({ onScanSelect, onSeeHowItWorks }) => {
  const [cards, setCards] = useState<CapabilityItem[]>(initialCards);

  // Shuffle card positions on page load / refresh
  useEffect(() => {
    const shuffled = [...initialCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-6 pt-12 pb-6 sm:pb-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      {/* Left Column: Headline, Subtitle, CTA */}
      <div className="lg:col-span-6 space-y-8">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
          See the risk<br />
          before<br />
          you open it.
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed">
          MalVision scans files, links, PDFs and hashes using advanced threat detection to help you inspect suspicious content before opening it.
        </p>

        <div>
          <button
            onClick={onSeeHowItWorks}
            className="inline-flex items-center space-x-3 px-6 py-3.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium text-sm hover:opacity-90 transition cursor-pointer shadow-md active:scale-95"
          >
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </span>
            <span>See how it works</span>
          </button>
        </div>
      </div>

      {/* Right Column: Dynamically Randomized Capability Cards */}
      {/* Desktop Floating Layout */}
      <div className="hidden lg:block lg:col-span-6 min-h-[480px] sm:min-h-[520px] relative select-none">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className={`absolute z-10 ${slotClasses[idx]}`}
          >
            <CapabilityCard
              title={card.title}
              description={card.description}
              icon={card.icon}
              badgeStyleClass={card.badgeStyleClass}
              onClick={() => onScanSelect(card.tab)}
            />
          </div>
        ))}
      </div>

      {/* Mobile Grid Layout - Clean, Stacked, and Organised */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full pt-4">
        {cards.map((card) => (
          <CapabilityCard
            key={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
            badgeStyleClass={card.badgeStyleClass}
            onClick={() => onScanSelect(card.tab)}
          />
        ))}
      </div>
    </section>
  );
};
