function ResetConfirmModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-900 rounded-lg p-6 max-w-md mx-4'>
        <h3 className='text-xl font-bold text-white mb-4'>Confirm Reset</h3>
        <p className='text-gray-300 mb-6'>
          This will permanently:
          <br />• Close all open tables
          <br />• Clear all table states
          <br />• Delete today's gaming day Logs
          <br /><br />
          This action cannot be undone. Are you sure?
        </p>
        <div className='flex space-x-4'>
          <button
            onClick={onConfirm}
            className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium'
          >
            Yes, Reset Everything
          </button>
          <button
            onClick={onCancel}
            className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetConfirmModal;