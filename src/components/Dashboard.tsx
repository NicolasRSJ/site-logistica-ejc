import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Car, CheckCircle2, Circle, MapPin, 
  ChevronRight, Sparkles, Heart, AlertTriangle, RefreshCw, Clock,
  CheckSquare, Square, ClipboardList
} from 'lucide-react';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Encontrista, Task } from '../types';
import EncontristaDetail from './EncontristaDetail';
import AdminDashboard from './AdminDashboard';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type TabType = 'all' | 'pending' | 'completed';

export const getCircleColorStyles = (colorName?: string) => {
  if (!colorName) return null;
  const lower = colorName.toLowerCase();
  if (lower.includes('vermelh')) return { bg: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' };
  if (lower.includes('azul')) return { bg: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' };
  if (lower.includes('amarel')) return { bg: 'bg-amber-50 text-amber-750 border-amber-200', dot: 'bg-yellow-400' };
  if (lower.includes('verd')) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' };
  if (lower.includes('laranj')) return { bg: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' };
  if (lower.includes('rox') || lower.includes('violet')) return { bg: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-500' };
  if (lower.includes('rosa')) return { bg: 'bg-pink-50 text-pink-700 border-pink-100', dot: 'bg-pink-500' };
  if (lower.includes('marrom') || lower.includes('castanh')) return { bg: 'bg-amber-900/10 text-amber-900 border-amber-900/20', dot: 'bg-amber-800' };
  return { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  if (user.role === 'admin' && user.loginMethod === 'email') {
    return <AdminDashboard user={user} onLogout={onLogout} />;
  }

  const [encontristas, setEncontristas] = useState<Encontrista[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEncontrista, setSelectedEncontrista] = useState<Encontrista | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [syncing, setSyncing] = useState(false);
  const [activeDay, setActiveDay] = useState<number>(1);

  // Normalizes name to determine driver type
  const getBuscadorType = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('tio') || lower.includes('tia') || lower.includes('casal') || lower.includes('&') || lower.includes(' e ')) {
      return 'Buscador Casado';
    }
    return 'Buscador Solteiro(a)';
  };

  // Helper to read day-specific status
  const getStatusForActiveDay = (enc: Encontrista, day: number) => {
    if (day === 1) {
      const p = enc.pickup_day1 || 'pending';
      const d = enc.dropoff_day1 || 'pending';
      return (p === 'completed' && d === 'completed') ? 'completed' : 'pending';
    }
    if (day === 2) {
      const p = enc.pickup_day2 || 'pending';
      const d = enc.dropoff_day2 || 'pending';
      return (p === 'completed' && d === 'completed') ? 'completed' : 'pending';
    }
    if (day === 3) {
      const p = enc.pickup_day3 || 'pending';
      const d = enc.dropoff_day3 || 'pending';
      return (p === 'completed' && d === 'completed') ? 'completed' : 'pending';
    }
    return 'pending';
  };

  // Fetch assigned encontristas for this user
  const fetchEncontristas = async () => {
    setLoading(true);
    try {
      // First refresh the current user's state to check for any updates
      const userRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userRef);
      let assignedIds = user.assignedEncontristas;
      if (userSnap.exists()) {
        assignedIds = userSnap.data().assignedEncontristas || [];
      }

      if (assignedIds.length === 0) {
        setEncontristas([]);
        setLoading(false);
        return;
      }

      // Fetch all encontristas documents
      const list: Encontrista[] = [];
      for (const id of assignedIds) {
        const docRef = doc(db, 'encontristas', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const p1 = data.pickup_day1 || (data.status_day1 === 'completed' || data.status === 'completed' ? 'completed' : 'pending');
          const d1 = data.dropoff_day1 || (data.status_day1 === 'completed' || data.status === 'completed' ? 'completed' : 'pending');
          const p2 = data.pickup_day2 || (data.status_day2 === 'completed' || data.status === 'completed' ? 'completed' : 'pending');
          const d2 = data.dropoff_day2 || (data.status_day2 === 'completed' || data.status === 'completed' ? 'completed' : 'pending');
          const p3 = data.pickup_day3 || (data.status_day3 === 'completed' || data.status === 'completed' ? 'completed' : 'pending');
          const d3 = data.dropoff_day3 || (data.status_day3 === 'completed' || data.status === 'completed' ? 'completed' : 'pending');

          list.push({
            id: docSnap.id,
            name: data.name,
            phone: data.phone,
            medication: data.medication,
            disability: data.disability,
            observations: data.observations,
            address: data.address,
            complement: data.complement,
            additionalPhones: data.additionalPhones,
            status: data.status || 'pending',
            status_day1: data.status_day1 || data.status || 'pending',
            status_day2: data.status_day2 || data.status || 'pending',
            status_day3: data.status_day3 || data.status || 'pending',
            pickup_day1: p1,
            dropoff_day1: d1,
            pickup_day2: p2,
            dropoff_day2: d2,
            pickup_day3: p3,
            dropoff_day3: d3,
            isMoita: !!data.isMoita,
            circleColor: data.circleColor || '',
          });
        }
      }
      setEncontristas(list);

      // Fetch tasks assigned to this user or all
      try {
        const taskSnap = await getDocs(collection(db, 'tasks'));
        const taskList: Task[] = [];
        taskSnap.forEach(d => {
          const data = d.data();
          taskList.push({
            id: d.id,
            title: data.title || '',
            description: data.description || '',
            status: data.status || 'pending',
            assignedTo: data.assignedTo || 'all',
            createdAt: data.createdAt || ''
          });
        });
        const myTasks = taskList.filter(t => t.assignedTo === 'all' || t.assignedTo === user.id);
        setTasks(myTasks);
      } catch (taskErr) {
        console.error("Error loading tasks:", taskErr);
      }
    } catch (err) {
      console.error("Error loading encontristas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  useEffect(() => {
    fetchEncontristas();
  }, [user]);

  // Handle marking an encontrista's phase as completed/pending
  const handleToggleStatus = async (encontristaId: string, phase: 'pickup' | 'dropoff') => {
    setSyncing(true);
    try {
      const target = encontristas.find(e => e.id === encontristaId);
      if (!target) return;

      const fieldKey = phase === 'pickup' ? `pickup_day${activeDay}` : `dropoff_day${activeDay}`;
      const currentVal = (target as any)[fieldKey] || 'pending';
      const newVal = currentVal === 'completed' ? 'pending' : 'completed';

      const updateData: any = {};
      updateData[fieldKey] = newVal;

      // Calculate the day-specific summary status (status_dayX) and fallback general status
      const otherPhase = phase === 'pickup' ? 'dropoff' : 'pickup';
      const otherFieldKey = `${otherPhase}_day${activeDay}`;
      const otherVal = (target as any)[otherFieldKey] || 'pending';
      const dayCompleted = newVal === 'completed' && otherVal === 'completed';

      const statusField = `status_day${activeDay}`;
      updateData[statusField] = dayCompleted ? 'completed' : 'pending';
      updateData.status = dayCompleted ? 'completed' : 'pending';
      
      // Update in Firestore
      const docRef = doc(db, 'encontristas', encontristaId);
      await updateDoc(docRef, updateData);

      // Update in local state
      setEncontristas(prev => prev.map(e => {
        if (e.id === encontristaId) {
          return { 
            ...e, 
            [fieldKey]: newVal,
            [statusField]: dayCompleted ? 'completed' : 'pending',
            status: dayCompleted ? 'completed' : 'pending'
          } as Encontrista;
        }
        return e;
      }));

      // Update selected modal if it's currently open
      if (selectedEncontrista && selectedEncontrista.id === encontristaId) {
        setSelectedEncontrista(prev => {
          if (!prev) return null;
          return { 
            ...prev, 
            [fieldKey]: newVal,
            [statusField]: dayCompleted ? 'completed' : 'pending',
            status: dayCompleted ? 'completed' : 'pending'
          } as Encontrista;
        });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Filter encontristas based on active tab
  const filteredList = encontristas.filter(e => {
    const currentDayStatus = getStatusForActiveDay(e, activeDay);
    if (activeTab === 'pending') return currentDayStatus === 'pending';
    if (activeTab === 'completed') return currentDayStatus === 'completed';
    return true;
  });

  // Calculate statistics
  const totalCount = encontristas.length;
  const completedCount = encontristas.filter(e => getStatusForActiveDay(e, activeDay) === 'completed').length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 font-sans flex flex-col select-none pb-12">
      
      {/* Header Panel */}
      <div className="bg-white border-b border-slate-200 px-6 pt-6 pb-6 shadow-sm relative overflow-hidden shrink-0">
        
        {/* Top level row */}
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-md shadow-blue-100">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Buscador EJC</span>
                <span className="inline-flex bg-slate-100 text-slate-600 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                  {getBuscadorType(user.name)}
                </span>
              </div>
              <h2 className="text-sm font-bold font-display text-slate-800 leading-tight mt-0.5">
                {user.name}
              </h2>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 rounded-xl transition cursor-pointer border border-slate-200"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Day Selector Tabs */}
        <div className="mt-5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Dia do Encontro</span>
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {[
              { day: 1, label: '1º Dia', desc: 'Sexta-Feira' },
              { day: 2, label: '2º Dias', desc: 'Sábado' },
              { day: 3, label: '3º Dia', desc: 'Domingo' }
            ].map((d) => (
              <button
                key={d.day}
                onClick={() => {
                  setActiveDay(d.day);
                }}
                className={`py-2 rounded-lg text-center cursor-pointer transition duration-150 ${
                  activeDay === d.day
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="block text-xs font-bold leading-tight">{d.label}</span>
                <span className={`block text-[8px] font-medium leading-none mt-0.5 ${activeDay === d.day ? 'text-blue-100' : 'text-slate-400'}`}>
                  {d.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Logistics Guide Banner */}
        <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex gap-3 items-start">
          <div className="bg-blue-50 text-blue-600 p-2 rounded-lg shrink-0 mt-0.5">
            <Clock className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Horários e Regras de Logística</span>
            {activeDay === 1 && (
              <>
                <p className="text-xs font-bold text-slate-800 mt-0.5">19:00 às 21:00 (Sexta)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Os jovens devem ser buscados em casa (antes das 19:00) e levados de volta ao final (após 21:00).
                </p>
              </>
            )}
            {activeDay === 2 && (
              <>
                <p className="text-xs font-bold text-slate-800 mt-0.5">07:00 às 20:00 (Sábado)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Os jovens devem ser buscados em casa (antes das 07:00) e levados de volta ao final (após 20:00).
                </p>
              </>
            )}
            {activeDay === 3 && (
              <>
                <p className="text-xs font-bold text-slate-800 mt-0.5">07:00 às 22:00 (Domingo)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Os jovens devem ser buscados em casa (antes das 07:00) e levados de volta ao final do encontro (após 22:00).
                </p>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Journey Progress Card */}
        <div className="relative mt-5 bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 shadow-inner">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Progresso do Dia</span>
              <span className="text-lg font-bold font-display mt-0.5 block text-slate-800">
                {completedCount} <span className="text-slate-500 text-xs font-normal">de {totalCount} jovens entregues</span>
              </span>
            </div>
            <div className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
              {progressPercent}% concluído
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-200 rounded-full mt-3.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>

          <div className="flex justify-between items-center mt-2.5 text-[9px] font-bold text-slate-400 uppercase font-mono">
            <span>Pendente: {pendingCount}</span>
            <span>Concluído: {completedCount}</span>
          </div>
        </div>
      </div>

      {/* Quick Sync Button */}
      <div className="px-6 -mt-3.5 flex justify-end relative z-10">
        <button
          onClick={fetchEncontristas}
          disabled={loading || syncing}
          className="flex items-center gap-1.5 bg-white text-slate-700 font-bold text-xs px-4 py-2.5 rounded-full shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 text-slate-500 ${loading || syncing ? 'animate-spin' : ''}`} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 mt-5 max-w-lg w-full mx-auto">
        
        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 mb-5 border border-slate-200/60">
          {(['all', 'pending', 'completed'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'all' && `Todos (${totalCount})`}
              {tab === 'pending' && (activeDay === 3 ? `Pendente Busca (${pendingCount})` : `Pendente Retorno (${pendingCount})`)}
              {tab === 'completed' && (activeDay === 3 ? `Buscados (${completedCount})` : `Entregues (${completedCount})`)}
            </button>
          ))}
        </div>

        {/* List of Encontristas */}
        <div className="space-y-3.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="h-8 w-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-slate-500">Buscando do Firebase...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 border border-slate-200 text-center flex flex-col items-center shadow-sm"
            >
              <div className="bg-blue-50 p-4 rounded-full mb-3 text-blue-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Nenhum jovem na lista</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                {activeTab === 'all' 
                  ? 'Você não possui nenhum encontrista atribuído sob sua responsabilidade.'
                  : activeTab === 'pending'
                  ? (activeDay === 3 ? 'Parabéns! Todos os jovens foram buscados com sucesso.' : 'Parabéns! Todos os jovens já foram levados em segurança para casa.')
                  : 'Nenhum encontrista foi marcado como concluído neste dia ainda.'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredList.map((enc, idx) => {
                const hasMedication = enc.medication && enc.medication !== 'Nenhuma';
                const hasDisability = enc.disability && enc.disability !== 'Nrunning' && enc.disability !== 'Nenhuma';
                const currentDayStatus = getStatusForActiveDay(enc, activeDay);

                const pStatus = (activeDay === 1 ? enc.pickup_day1 : (activeDay === 2 ? enc.pickup_day2 : enc.pickup_day3)) || 'pending';
                const dStatus = (activeDay === 1 ? enc.dropoff_day1 : (activeDay === 2 ? enc.dropoff_day2 : 'pending')) || 'pending';

                return (
                  <motion.div
                    key={enc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    onClick={() => setSelectedEncontrista(enc)}
                    className={`bg-white rounded-2xl p-4 border transition duration-200 active:scale-[0.99] flex items-center justify-between gap-2 shadow-sm hover:shadow-md cursor-pointer ${
                      currentDayStatus === 'completed'
                        ? 'border-emerald-200 bg-emerald-50/10 opacity-80'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Phase Status Toggles */}
                    <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {activeDay === 3 ? (
                        <button
                          onClick={() => handleToggleStatus(enc.id, 'pickup')}
                          className={`flex items-center gap-1.5 text-[9px] font-bold transition px-2 py-1.5 border rounded-lg cursor-pointer ${
                            pStatus === 'completed'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
                          }`}
                        >
                          {pStatus === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-100/50 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                          )}
                          <span className="uppercase tracking-wider">Busca</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleStatus(enc.id, 'pickup')}
                            className={`flex items-center gap-1.5 text-[9px] font-bold transition px-2 py-1.5 border rounded-lg cursor-pointer ${
                              pStatus === 'completed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
                            }`}
                          >
                            {pStatus === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-100/50 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                            )}
                            <span className="uppercase tracking-wider">Busca</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(enc.id, 'dropoff')}
                            className={`flex items-center gap-1.5 text-[9px] font-bold transition px-2 py-1.5 border rounded-lg cursor-pointer ${
                              dStatus === 'completed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
                            }`}
                          >
                            {dStatus === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-100/50 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                            )}
                            <span className="uppercase tracking-wider">Levar</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Encontrista Text Details */}
                    <div className="flex-1 min-w-0 px-1">
                      <h4 className="text-sm font-bold text-slate-850 truncate leading-tight">
                        {enc.name}
                      </h4>
                      
                      {/* Short Address */}
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate flex items-center gap-1 font-medium">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                        {enc.address}
                      </p>

                      {/* Badges */}
                      {(hasMedication || hasDisability || enc.isMoita || enc.circleColor) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {enc.circleColor && (() => {
                            const styles = getCircleColorStyles(enc.circleColor);
                            return styles ? (
                              <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${styles.bg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} />
                                Círculo: {enc.circleColor}
                              </span>
                            ) : null;
                          })()}
                          {enc.isMoita && (
                            <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-indigo-100 shrink-0">
                              🌱 Equipe Moita
                            </span>
                          )}
                          {hasMedication && (
                            <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-red-100 shrink-0">
                              <Heart className="h-2 w-2 fill-red-500 text-red-500" /> Medicação
                            </span>
                          )}
                          {hasDisability && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-amber-100 shrink-0">
                              <AlertTriangle className="h-2 w-2 text-amber-500" /> Cuidados
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Direction Chevron */}
                    <div className="text-slate-300 shrink-0">
                      <ChevronRight className="h-5 w-5" />
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Driver Tasks Section */}
        {tasks.length > 0 && (
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <ClipboardList className="h-4 w-4 text-blue-600" /> Minhas Obrigações / Tarefas
            </p>
            <div className="space-y-3">
              {tasks.map(task => {
                const isCompleted = task.status === 'completed';
                return (
                  <div 
                    key={task.id}
                    className="flex gap-2.5 items-start text-xs border border-slate-50 p-2.5 rounded-xl hover:bg-slate-50/50 transition"
                  >
                    <button 
                      onClick={() => handleToggleTaskStatus(task)}
                      className="shrink-0 text-slate-400 hover:text-blue-600 active:scale-95 transition cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckSquare className="h-4.5 w-4.5 text-blue-600" />
                      ) : (
                        <Square className="h-4.5 w-4.5 text-slate-300" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold leading-tight ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className={`text-[11px] mt-0.5 leading-normal ${isCompleted ? 'text-slate-400/80' : 'text-slate-500'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Useful info card */}
        <div className="mt-8 bg-blue-50/40 border border-blue-100/60 rounded-2xl p-5 text-slate-700 space-y-3.5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> Dicas da Logística
          </p>
          
          <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
            {/* Dynamic Day-Specific Warning */}
            <div className="bg-white/80 rounded-xl p-3 border border-blue-100/40 space-y-1">
              <span className="text-[9px] font-bold text-blue-700 uppercase tracking-widest block">Instrução do Dia</span>
              <ul className="list-disc pl-4 space-y-1">
                {activeDay === 3 ? (
                  <>
                    <li>Hoje (Domingo) a logística consiste APENAS em buscar os jovens em suas casas e trazê-los para o encontro antes das 07:00.</li>
                    <li>Garanta que os encontristas tragam seus pertences completos, pois o encerramento será direto com as famílias.</li>
                  </>
                ) : (
                  <>
                    <li>Antes de sair da paróquia, confirme se todos os jovens estão com seus pertences e casacos no veículo.</li>
                    <li>Qualquer intercorrência na viagem ou atraso, faça contato direto com o telefone cadastrado da família.</li>
                  </>
                )}
                <li>Clique em "Iniciar Rota" na ficha do encontrista para abrir o GPS direto no Google Maps.</li>
              </ul>
            </div>

            {/* General Rules & Responsibilities */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Diretrizes e Compromissos</span>
              <ul className="list-disc pl-4 space-y-2">
                <li><strong className="text-slate-800">Horários de Chegada:</strong> Garanta que os jovens cheguem ao local nos horários estipulados: a partir das <strong className="text-slate-800">19h15</strong> na sexta-feira e às <strong className="text-slate-800">07h15</strong> no sábado e domingo.</li>
                <li><strong className="text-slate-800">Entrada Oficial:</strong> Utilize estritamente o local de entrada definido para preservar a dinâmica das equipes.</li>
                <li><strong className="text-slate-800">Transporte de "Moitas":</strong> Responsabilize-se pelo transporte de ida e de volta dos "moitas" (jovens que dão suporte externo disfarçados) nos dias necessários.</li>
                <li><strong className="text-slate-800">Aviso aos Responsáveis:</strong> Informe expressamente a responsabilidade e o compromisso com o horário para buscar o jovem para os responsáveis.</li>
                <li><strong className="text-slate-800">Recepção Festiva:</strong> Sugira aos responsáveis que preparem uma recepção festiva na extensão de suas casas.</li>
                <li><strong className="text-slate-800">Mensagens de Boa Noite:</strong> Confeccione e fixe as mensagens padrão de boa noite nas casas dos encontristas, seguindo o modelo estipulado e utilizando as cartolinas disponibilizadas pelo movimento.</li>
                <li><strong className="text-slate-800">Sacos de Choro:</strong> Responsabilize-se pela confecção, montagem e entrega dos sacos de choro aos respectivos encontristas no domingo <strong className="text-blue-700">até as 14:00</strong>.</li>
                <li><strong className="text-slate-800">Disponibilidade:</strong> Mantenha-se em estado de plantão durante todo o encontro.</li>
                <li><strong className="text-slate-800">Contingência de Equipe:</strong> Em caso de insuficiência de pessoal, informe imediatamente à Coordenação Geral.</li>
                <li><strong className="text-slate-800">Avarias no Local:</strong> Havendo quebra ou avaria do material ou das dependências do local, comunique à Coordenação Geral para as devidas providências.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400 font-mono tracking-wider mt-12 uppercase shrink-0">
        2026 © Nicolas Rodrigues
      </div>

      {/* Encontrista Modal Detail Drawer */}
      <AnimatePresence>
        {selectedEncontrista && (
          <EncontristaDetail
            encontrista={selectedEncontrista}
            onClose={() => setSelectedEncontrista(null)}
            onToggleStatus={handleToggleStatus}
            activeDay={activeDay}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
