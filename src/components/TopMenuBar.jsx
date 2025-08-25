import { useState, useEffect } from 'react';

function TopMenuBar({ 
  currentScreen, 
  onScreenChange, 
  onExport, 
  onBackupExport,
  onUpcomingBreaksExport,
  onReset 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className='w-full bg-gray-900 border-b border-gray-700 px-6 py-3'>
      <div className='max-w-7xl mx-auto flex items-center justify-between'>
        <div className='flex items-center space-x-6'>
          {/* Title */}
          <h1 className='text-xl font-bold text-white'>TableFlow</h1>

          {/* Navigation */}
          <nav className='flex space-x-4'>
            <button
              onClick={() => onScreenChange('tables')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentScreen === 'tables'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Tables
            </button>
            <button
              onClick={() => onScreenChange('history')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentScreen === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        <div className='flex items-center space-x-4'>
          {/* Export */}
          <div className='relative'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium transition-colors flex items-center space-x-2'
            >
              <span>Export</span>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50'>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onExport();
                  }}
                  className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200'
                >
                  Export Excel Timeline
                </button>

                <button
                  onClick={onUpcomingBreaksExport}
                  className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200'
                >
                  Export Breaks Schedule
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onBackupExport();
                  }}
                  className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200'
                >
                  Export Backup Logs
                </button>
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors'
            title='Reset all tables to closed'
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopMenuBar;