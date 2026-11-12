import React, { useRef, useState } from 'react';
import { PRODUCT_CATEGORIES, ProductCategoryConfig } from '../../data/productCategories';
import { useTheme } from '../../context/ThemeContext';
import {
  Armchair,
  Tv,
  Utensils,
  Droplet,
  Lightbulb,
  Cpu,
  Smartphone,
  Monitor,
  HardDrive,
  Speaker,
  Camera,
  Layers,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

interface ProductCategoryCardsProps {
  selectedCategoryId: string;
  onSelectCategory: (category: ProductCategoryConfig) => void;
  productCountByCategory?: Record<string, number>;
}

export const ProductCategoryCards: React.FC<ProductCategoryCardsProps> = ({
  selectedCategoryId,
  onSelectCategory,
  productCountByCategory = {}
}) => {
  const { theme } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [columnDensity, setColumnDensity] = useState<'3' | '2' | '1' | 'auto'>('auto');

  // Calculates scroll distance based on column layout
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const step = columnDensity === '1' ? 300 : columnDensity === '2' ? 240 : 180;
      scrollContainerRef.current.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const step = columnDensity === '1' ? 300 : columnDensity === '2' ? 240 : 180;
      scrollContainerRef.current.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair':
        return <Armchair className="w-4 h-4 text-emerald-600" />;
      case 'Tv':
        return <Tv className="w-4 h-4 text-sky-600" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-orange-600" />;
      case 'Droplet':
        return <Droplet className="w-4 h-4 text-teal-600" />;
      case 'Lightbulb':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-purple-600" />;
      case 'Smartphone':
        return <Smartphone className="w-4 h-4 text-indigo-600" />;
      case 'Monitor':
        return <Monitor className="w-4 h-4 text-slate-700" />;
      case 'HardDrive':
        return <HardDrive className="w-4 h-4 text-rose-600" />;
      case 'Speaker':
        return <Speaker className="w-4 h-4 text-violet-600" />;
      case 'Camera':
        return <Camera className="w-4 h-4 text-amber-600" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-600" />;
    }
  };

  // CSS Grid column width dynamically adjusts from 3 columns to 1 column on mobile
  const getGridAutoColsClass = () => {
    switch (columnDensity) {
      case '1':
        return 'auto-cols-[calc(100%-8px)] sm:auto-cols-[280px]';
      case '2':
        return 'auto-cols-[calc(50%-6px)] sm:auto-cols-[200px]';
      case '3':
        return 'auto-cols-[calc(33.333%-6px)] sm:auto-cols-[165px]';
      case 'auto':
      default:
        // Responsive CSS grid: 3 columns by default on mobile, smoothly adjustable
        return 'auto-cols-[calc(33.333%-6px)] xs:auto-cols-[calc(33.333%-8px)] sm:auto-cols-[165px] md:auto-cols-[180px]';
    }
  };

  return (
    <div className="mb-10">
      {/* Header with All Departments */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-light text-slate-800 tracking-tight">
              Product Categories
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Select any category to view equipment, parts, tools, and direct order options
          </p>
        </div>
      </div>

      {/* Responsive Grid displaying ALL product category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {PRODUCT_CATEGORIES.map((cat, idx) => {
          const isSelected = selectedCategoryId === cat.id;
          const count = productCountByCategory[cat.id];
          const floatAnim = idx % 2 === 0 ? 'animate-card-float' : 'animate-card-float-alt';

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`group relative flex flex-col bg-white rounded-2xl border transition-all duration-300 overflow-hidden text-left cursor-pointer transform hover:-translate-y-1 focus:outline-hidden h-full ${
                isSelected
                  ? 'ring-2 shadow-md'
                  : `border-slate-200/90 ${cat.borderHover} shadow-2xs hover:shadow-md`
              }`}
              style={{
                borderColor: isSelected ? theme.accentColor : undefined,
                boxShadow: isSelected ? `0 0 0 2px ${theme.accentColor}25` : undefined
              }}
            >
              {/* Animated Category Picture Stage */}
              <div className={`relative w-full h-24 sm:h-28 ${cat.bgTint} overflow-hidden flex items-center justify-center p-2`}>
                {/* Glowing ambient pulse behind the image */}
                <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/70 blur-xs pointer-events-none animate-card-glow" />

                {/* Animated sheen light sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 group-hover:animate-card-sheen transition-opacity" />

                {/* Animated Category Picture */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className={`relative z-10 max-h-20 sm:max-h-24 w-auto object-contain rounded transition-transform duration-300 group-hover:scale-110 drop-shadow-xs ${floatAnim}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                {isSelected && (
                  <div
                    className="absolute top-1.5 left-1.5 z-20 text-white px-2 py-0.5 rounded-md text-[9px] font-light tracking-wider uppercase shadow-xs flex items-center gap-1"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Title & Action */}
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="p-1 rounded-lg bg-slate-50 shrink-0">
                      {getCategoryIcon(cat.iconName)}
                    </div>
                    <h3 className="text-xs sm:text-sm font-light text-slate-900 leading-tight truncate">
                      {cat.name}
                    </h3>
                  </div>

                  <p className="text-[10px] text-slate-500 font-light line-clamp-2 mt-0.5">
                    {cat.tagline}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                  <span
                    className="font-light flex items-center gap-1 truncate transition-colors text-emerald-700 group-hover:translate-x-0.5 transition-transform"
                    style={{ color: isSelected ? theme.accentColor : undefined }}
                  >
                    Explore Products →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
