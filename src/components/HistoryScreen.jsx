import { getCurrentGamingDay, getGamingDayString } from '../services/gamingDayService';

function HistoryScreen({ historyData, onDeleteSession }) {
    const gamingDay = getCurrentGamingDay();

    const formatDateTime = (date) => {
        if (!date) return 'Still Open';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    return (
        <div className='max-w-6xl mx-auto'>
        <div className='bg-gray-900 rounded-lg p-6'>
            <h2 className='text-2xl font-bold text-white mb-6'>
            Table History - Gaming Day: {getGamingDayString()}
            </h2>

            {historyData.length === 0 ? (
            <div className='text-gray-400 text-center py-8'>
                No table activity found for this gaming day.
            </div>
            ) : (
            <div className='overflow-x-auto'>
                <table className='w-full text-white'>
                <thead>
                    <tr className='border-b border-gray-700'>
                    <th className='text-left py-3 px-4'>Table</th>
                    <th className='text-left py-3 px-4'>Status</th>
                    <th className='text-left py-3 px-4'>Break Type</th>
                    <th className='text-left py-3 px-4'>Opened At</th>
                    <th className='text-left py-3 px-4'>Closed At</th>
                    <th className='text-left py-3 px-4'>Duration</th>
                    <th className='text-left py-3 px-4'>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {historyData.map((item, index) => (
                    <tr key={index} className='border-b border-gray-800 hover:bg-gray-800'>
                        <td className='py-3 px-4 font-semibold'>{item.tableNumber}</td>
                        <td className='py-3 px-4'>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.status === 'Open'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}>
                            {item.status}
                        </span>
                        </td>
                        <td className='py-3 px-4 text-gray-300'>{item.breakType}</td>
                        <td className='py-3 px-4 text-gray-300'>{formatDateTime(item.openTime)}</td>
                        <td className='py-3 px-4 text-gray-300'>
                        {formatDateTime(item.closeTime)}
                        </td>
                        <td className='py-3 px-4 text-gray-300'>
                        {item.duration ||
                            `${Math.round((new Date().getTime() - item.openTime.getTime()) / (1000 * 60))} minutes`}
                        </td>
                        <td className='py-3 px-4'>
                        {item.isCompleteSession && (
                            <button
                            onClick={() => onDeleteSession(item.sessionId)}
                            className='px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors'
                            title='Delete this session'
                            >
                            Delete
                            </button>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>
        </div>
    );
}

export default HistoryScreen;