import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChange,
  placeholder = "Search games by title, rules, or categories...",
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
        <Search className="w-4 h-4" />
      </div>
      <input
        id="browse-search-input"
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
      />
      {query && (
        <button
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
