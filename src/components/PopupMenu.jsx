import { useState } from "react";
import TimeSelector from "./TimeSelector";

function PopupMenu({ isOpen, onClose, tableNumber, status, position }) {
    if (!isOpen) return null;

    const [showTimeSelector, setShowTimeSelector] = useState(false);

    const popupStyle = {
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '10px'
    };

    if (showTimeSelector) {
        return (
            <div style={popupStyle} className="z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-64" onClick={(e) => e.stopPropagation()}>
                    <TimeSelector
                        onSelectTime={(time) => {
                            console.log('Opening table at:', time);
                            setShowTimeSelector(false);
                            onClose();
                        }}
                        onCancel={() => setShowTimeSelector(false)}
                    />
                </div>
            </div>
        )
    }

    return (
        <div style={popupStyle} className="z-50">
            <div
                className="bg-white p-4 rounded-lg shadow-lg w-64"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold">Table {tableNumber}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                {/* Status Display */}
                <p className="mb-2 text-sm">Current status: <span className="font-semibold">{status}</span></p>

                {/* Action buttons */}
                <div className="mt-3 space-y-2">
                    <button 
                        className="w-full py-1 px-3 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={() => setShowTimeSelector(true)}
                    >
                        Set to Open
                    </button>
                    <button className="w-full py-1 px-3 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
                        Set to Break
                    </button>
                    <button className="w-full py-1 px-3 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                        Set to Closed
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PopupMenu;