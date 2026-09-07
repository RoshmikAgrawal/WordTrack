import React from "react";
import { CategoryItem } from "../../types";
import { CATEGORY_COLOR_PALETTES, getCategoryBadgeStyle } from "../../lib/utils";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  categories?: CategoryItem[];
  availableCategoryNames?: string[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categories = [],
  availableCategoryNames = [],
}) => {
  // Collect all unique categories to show in filter
  const categoryList = React.useMemo(() => {
    const list = ["All Games"];
    // Add configured custom categories
    categories.forEach((c) => {
      if (!list.includes(c.name)) list.push(c.name);
    });
    // Add any game categories that may exist
    availableCategoryNames.forEach((name) => {
      if (name && !list.includes(name)) list.push(name);
    });
    return list;
  }, [categories, availableCategoryNames]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categoryList.map((cat) => {
        const isSelected = selectedCategory === cat;
        const count = cat === "All Games" ? categoryCounts["all"] : categoryCounts[cat] || 0;
        const badgeStyle = cat === "All Games" ? null : getCategoryBadgeStyle(cat, categories);

        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isSelected
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold border border-emerald-400/50"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            {badgeStyle && (
              <span
                className={`w-2 h-2 rounded-full ${badgeStyle.dot} shrink-0`}
              />
            )}
            <span>{cat}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? "bg-slate-950/30 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
