import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap cursor-pointer";

  const variants = {
    primary:
      "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-950/40 border border-emerald-500/30",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/60 shadow-sm",
    outline:
      "bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700",
    danger:
      "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30",
    ghost:
      "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "emerald" | "indigo" | "amber" | "rose" | "purple" | "slate" | "cyan";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "slate",
  size = "sm",
  className,
}) => {
  const variants = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    slate: "bg-slate-800 text-slate-300 border-slate-700",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 rounded-md",
    md: "text-xs px-2.5 py-1 rounded-lg",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}> = ({ children, className, id, onClick }) => (
  <div
    id={id}
    onClick={onClick}
    className={cn(
      "bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 backdrop-blur-sm transition-all duration-200",
      className
    )}
  >
    {children}
  </div>
);

export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
> = ({ label, error, className, id, ...props }) => (
  <div className="w-full space-y-1.5">
    {label && (
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </label>
    )}
    <input
      id={id}
      className={cn(
        "w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors",
        error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
  </div>
);

export const Progress: React.FC<{
  value: number;
  max?: number;
  className?: string;
  color?: string;
}> = ({ value, max = 100, className, color = "bg-emerald-500" }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full h-2.5 bg-slate-800 rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full transition-all duration-500 rounded-full", color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
