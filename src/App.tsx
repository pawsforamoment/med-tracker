import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import MedicationTracker from './components/MedicationTracker';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return user ? <MedicationTracker /> : <Auth />;
}

export default App;
