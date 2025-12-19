import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Medication, MedicationLog } from '../lib/supabase';
import { LogOut, Plus, Edit2, Trash2, Pill } from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MedicationTracker() {
  const { user, signOut } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [medName, setMedName] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function getWeekDates(): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async function loadData() {
    setLoading(true);
    try {
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .order('created_at', { ascending: true });

      const weekDates = getWeekDates();
      const startDate = formatDate(weekDates[0]);
      const endDate = formatDate(weekDates[6]);

      const { data: logsData } = await supabase
        .from('medication_logs')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      setMedications(medsData || []);
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMedication() {
    if (!medName.trim() || !user) return;

    const { error } = await supabase
      .from('medications')
      .insert({ user_id: user.id, name: medName.trim() });

    if (!error) {
      setMedName('');
      setShowAddModal(false);
      loadData();
    }
  }

  async function handleEditMedication() {
    if (!medName.trim() || !editingMed) return;

    const { error } = await supabase
      .from('medications')
      .update({ name: medName.trim(), updated_at: new Date().toISOString() })
      .eq('id', editingMed.id);

    if (!error) {
      setMedName('');
      setEditingMed(null);
      loadData();
    }
  }

  async function handleDeleteMedication(id: string) {
    if (!confirm('Are you sure you want to delete this medication?')) return;

    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id);

    if (!error) {
      loadData();
    }
  }

  async function toggleMedicationLog(medicationId: string, date: Date) {
    if (!user) return;

    const dateStr = formatDate(date);
    const existingLog = logs.find(
      (log) => log.medication_id === medicationId && log.date === dateStr
    );

    if (existingLog) {
      const { error } = await supabase
        .from('medication_logs')
        .update({ taken: !existingLog.taken, updated_at: new Date().toISOString() })
        .eq('id', existingLog.id);

      if (!error) loadData();
    } else {
      const { error } = await supabase
        .from('medication_logs')
        .insert({
          medication_id: medicationId,
          user_id: user.id,
          date: dateStr,
          taken: true,
        });

      if (!error) loadData();
    }
  }

  function isChecked(medicationId: string, date: Date): boolean {
    const dateStr = formatDate(date);
    const log = logs.find(
      (log) => log.medication_id === medicationId && log.date === dateStr
    );
    return log?.taken || false;
  }

  function navigateWeek(direction: number) {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  }

  const weekDates = getWeekDates();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <Pill className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Medication Tracker</h1>
                  <p className="text-blue-100 text-sm">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateWeek(-1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700"
              >
                Previous Week
              </button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                  {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h2>
              </div>
              <button
                onClick={() => navigateWeek(1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700"
              >
                Next Week
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="mb-6 flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add Medication</span>
            </button>

            {medications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Pill className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No medications added yet</p>
                <p className="text-sm">Click "Add Medication" to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Medication</th>
                      {weekDates.map((date, idx) => (
                        <th key={idx} className="text-center py-3 px-2 font-semibold text-gray-700">
                          <div className="text-xs text-gray-500">{DAYS_OF_WEEK[date.getDay()]}</div>
                          <div className="text-sm">{date.getDate()}</div>
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med) => (
                      <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-800">{med.name}</td>
                        {weekDates.map((date, idx) => (
                          <td key={idx} className="text-center py-4 px-2">
                            <input
                              type="checkbox"
                              checked={isChecked(med.id, date)}
                              onChange={() => toggleMedicationLog(med.id, date)}
                              className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingMed(med);
                                setMedName(med.name);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMedication(med.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showAddModal || editingMed) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingMed ? 'Edit Medication' : 'Add Medication'}
            </h2>
            <input
              type="text"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="Medication name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editingMed ? handleEditMedication() : handleAddMedication();
                }
              }}
            />
            <div className="flex space-x-3">
              <button
                onClick={editingMed ? handleEditMedication : handleAddMedication}
                disabled={!medName.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingMed ? 'Save' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMed(null);
                  setMedName('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
