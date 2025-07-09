import MapaPiaui from './components/MapaPiaui';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Mapa dos Municípios do Piauí
        </h1>
        <MapaPiaui />
      </div>
    </div>
  );
}

export default App; 