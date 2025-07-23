import Table from './components/Table';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          TableFlow - Poker Table Break Tracker
        </h1>
        <Table tableNumber="3301" status="open" />
        <Table tableNumber="3302" status="on-break" />
        <Table tableNumber="3303" status="closed" />
      </div>
    </div>
  )
}

export default App
