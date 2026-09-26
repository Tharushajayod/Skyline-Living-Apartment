import { useState, type ReactNode } from 'react';

interface TabsProps {
  tabs: { label: string; content: ReactNode; badge?: number }[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
}

export default function Tabs({ tabs, defaultIndex = 0, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultIndex);

  const handleTabChange = (i: number) => {
    setActive(i);
    onChange?.(i);
  };

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-navy-100 overflow-x-auto no-scrollbar">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => handleTabChange(i)}
            className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              active === i ? 'text-primary-600' : 'text-navy-400 hover:text-navy-700'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-2 inline-flex items-center justify-center text-xs bg-navy-100 text-navy-600 rounded-full px-2 py-0.5">
                {tab.badge}
              </span>
            )}
            {active === i && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-6 animate-fade-in">{tabs[active]?.content}</div>
    </div>
  );
}
