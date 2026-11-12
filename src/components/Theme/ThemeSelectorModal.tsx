import React from 'react';
import { useTheme, THEME_CONFIGS, ThemeId } from '../../context/ThemeContext';
import { X, Check, Palette, Sparkles } from 'lucide-react';

export const ThemeSelectorModal: React.FC = () => {
  const { activeThemeId, setTheme, isThemeModalOpen, setIsThemeModalOpen } = useTheme();

  if (!isThemeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-4.5 shadow-xl border border-slate-200 relative my-4">
        <button
          type="button"
          onClick={() => setIsThemeModalOpen(false)}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Personalize App Theme
            </h3>
            <p className="text-[10px] text-slate-500 font-light">
              Choose your preferred visual palette. Updates instantly.
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {(Object.keys(THEME_CONFIGS) as ThemeId[]).map((id) => {
            const config = THEME_CONFIGS[id];
            const isSelected = activeThemeId === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTheme(id);
                }}
                className={`w-full p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-300 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Multi-shade color preview swatch */}
                  <div
                    className="w-8 h-7 rounded-lg shadow-inner border border-slate-200/80 shrink-0"
                    style={{ background: config.previewGradient }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {config.name}
                      </span>
                      {id === 'multi-shade' && (
                        <span className="px-1 py-0.2 rounded bg-teal-100 text-teal-800 text-[8px] font-medium shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-light truncate">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-teal-600 text-white shadow-2xs' : 'border border-slate-300 text-transparent'
                  }`}
                >
                  <Check className="w-2.5 h-2.5" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-light">
            <Sparkles className="w-3 h-3 text-teal-500" />
            <span>Theme auto-saves</span>
          </span>
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(false)}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
