import React, { useState, useEffect } from "react";
import { formatDisplayDate, getLocalDateISO } from "../../lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DiaryCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  logsByDate: Record<string, { total: number; solved: number; failed: number }>;
}

export const DiaryCalendar: React.FC<DiaryCalendarProps> = ({
  selectedDate,
  onSelectDate,
  logsByDate,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const [y, m] = (selectedDate || getLocalDateISO()).split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  const todayStr = getLocalDateISO();

  // Sync calendar month view whenever selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      setCurrentMonthDate(new Date(y, m - 1, 1));
    }
  }, [selectedDate]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    const [y, m] = todayStr.split("-").map(Number);
    setCurrentMonthDate(new Date(y, m - 1, 1));
    onSelectDate(todayStr);
  };

  const handleDateClick = (dateStr: string) => {
    const [y, m] = dateStr.split("-").map(Number);
    setCurrentMonthDate(new Date(y, m - 1, 1));
    onSelectDate(dateStr);
  };

  const monthName = currentMonthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate calendar grid days
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Padding for days before start of month
  for (let i = 0; i < firstDayIndex; i++) {
    const prevDate = new Date(year, month, -firstDayIndex + i + 1);
    calendarDays.push({
      dateStr: getLocalDateISO(prevDate),
      dayNum: prevDate.getDate(),
      isCurrentMonth: false,
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    calendarDays.push({
      dateStr: getLocalDateISO(date),
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  return (
    <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-6 backdrop-blur-xl shadow-xl shadow-black/30 space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">{monthName}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            id="diary-calendar-prev-month-btn"
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="diary-calendar-today-btn"
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800/80 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60"
            title="Jump to Today's date"
          >
            Today
          </button>
          <button
            id="diary-calendar-next-month-btn"
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {calendarDays.map((item, index) => {
          const isSelected = item.dateStr === selectedDate;
          const isToday = item.dateStr === todayStr;
          const dayLogInfo = logsByDate[item.dateStr];
          const hasLogs = dayLogInfo && dayLogInfo.total > 0;
          const totalGames = dayLogInfo?.total || 0;

          // Tooltip description
          const tooltipText = `${formatDisplayDate(item.dateStr)}${
            isToday ? " (Today)" : ""
          }${
            hasLogs
              ? `: ${totalGames} game${totalGames === 1 ? "" : "s"} played (${dayLogInfo.solved} won)`
              : ": No games logged"
          }`;

          // GitHub-style activity level colors
          let activityBg = "bg-slate-900/60 border-slate-800/80 text-slate-300";
          if (hasLogs) {
            if (totalGames >= 4) {
              activityBg = "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20";
            } else if (totalGames >= 2) {
              activityBg = "bg-emerald-600/40 border-emerald-500/60 text-emerald-100 shadow-sm";
            } else {
              activityBg = "bg-emerald-500/20 border-emerald-500/40 text-emerald-200";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleDateClick(item.dateStr)}
              title={tooltipText}
              className={`group relative h-12 w-full rounded-xl flex flex-col items-center justify-center text-xs transition-all cursor-pointer border ${
                isSelected
                  ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 z-10 scale-[1.03]"
                  : ""
              } ${
                isToday && !isSelected
                  ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900"
                  : ""
              } ${
                isSelected
                  ? hasLogs
                    ? activityBg
                    : "bg-slate-800 border-white/60 text-white font-bold"
                  : hasLogs
                  ? `${activityBg} hover:brightness-110`
                  : item.isCurrentMonth
                  ? "bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  : "bg-slate-950/20 border-transparent text-slate-600 hover:bg-slate-800/30"
              }`}
            >
              {/* Day Number */}
              <span
                className={`leading-none font-semibold ${
                  isSelected && !hasLogs
                    ? "text-white font-black"
                    : isSelected && totalGames >= 4
                    ? "text-slate-950 font-black"
                    : isToday
                    ? "text-sky-300 font-bold"
                    : hasLogs
                    ? totalGames >= 4
                      ? "text-slate-950 font-black"
                      : "text-emerald-100 font-bold"
                    : item.isCurrentMonth
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {item.dayNum}
              </span>

              {/* Game count badge / visual indicator */}
              {hasLogs && (
                <div className="flex items-center gap-0.5 mt-1">
                  <span
                    className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full leading-tight ${
                      totalGames >= 4
                        ? "bg-slate-950/30 text-slate-950"
                        : "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                    }`}
                  >
                    {totalGames} {totalGames === 1 ? "game" : "games"}
                  </span>
                </div>
              )}

              {/* Today corner marker badge if no logs yet */}
              {isToday && !hasLogs && (
                <span className="text-[8px] font-bold text-sky-400 tracking-tight mt-0.5">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Activity Legend & Selected Date preview footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-500">Activity:</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500">None</span>
            <div className="w-3.5 h-3.5 rounded bg-slate-950/40 border border-slate-800" title="0 games" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/40" title="1 game" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-600/40 border border-emerald-500/60" title="2-3 games" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400" title="4+ games" />
            <span className="text-[10px] text-slate-500">More</span>
          </div>
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-800">
            <div className="w-3.5 h-3.5 rounded border border-sky-400 ring-1 ring-sky-400/40 bg-slate-900" />
            <span className="text-[10px] text-sky-400 font-medium">Today</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Selected:</span>
          <span className="font-bold text-slate-200">{formatDisplayDate(selectedDate)}</span>
        </div>
      </div>
    </div>
  );
};
