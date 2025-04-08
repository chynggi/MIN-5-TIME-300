"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }, []);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Generate calendar days
  interface GetDaysInMonthFn {
    (year: number, month: number): number;
  }

  const getDaysInMonth: GetDaysInMonthFn = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  interface GetFirstDayOfMonthFn {
    (year: number, month: number): number;
  }

  const getFirstDayOfMonth: GetFirstDayOfMonthFn = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Adjust for Monday as first day of week
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayAdjusted; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const today = new Date();
      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      days.push(
        <div
          key={day}
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isToday ? "bg-red-400 text-white" : "bg-yellow-200"
          }`}
        >
          <span className="text-xs">{day}</span>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={goToPreviousMonth} className="rounded-full p-1 hover:bg-yellow-200">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold">
          {months[currentMonth]} <span className="text-sm">{currentYear}</span>
        </h2>
        <button onClick={goToNextMonth} className="rounded-full p-1 hover:bg-yellow-200">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-xs font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
    </div>
  )
}

