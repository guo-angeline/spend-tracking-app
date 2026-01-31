import React from 'react';

interface MonthSelectorProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export default function MonthSelector({ selectedDate, onDateChange }: MonthSelectorProps) {
    const handlePreviousMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() - 1);
        onDateChange(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + 1);
        onDateChange(newDate);
    };

    const formattedDate = selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const isNextMonthDisabled = () => {
        const now = new Date();
        return selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
    };

    return (
        <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-1">
            <button
                onClick={handlePreviousMonth}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
                aria-label="Previous month"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900 min-w-[120px] text-center select-none">
                {formattedDate}
            </span>
            <button
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled()}
                className={`p-2 rounded-md transition-colors ${isNextMonthDisabled()
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                aria-label="Next month"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
    );
}
