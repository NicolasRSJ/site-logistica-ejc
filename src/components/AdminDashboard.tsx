import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Plus, Trash2, Edit2, Search, Check, X, 
  User as UserIcon, Shield, ClipboardList, Clock, Sparkles, Heart, 
  AlertTriangle, RefreshCw, Car, Circle, MapPin, Phone, HelpCircle,
  PlusCircle, BookOpen, CheckSquare, Square
} from 'lucide-react';
import { 
  collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, firebaseConfig } from '../firebase';
import { User, Encontrista, Task } from '../types';
import { getCircleColorStyles } from './Dashboard';

const getSecondaryAuth = () => {
  const apps = getApps();
  const secondaryApp = apps.find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
  return getAuth(secondaryApp);
};

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type AdminTab = 'encontristas' | 'usuarios' | 'tarefas';

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('encontristas');
  const [encontristas, setEncontristas] = useState<Encontrista[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals States
  const [isEncModalOpen, setIsEncModalOpen] = useState(false);
  const [editingEnc, setEditingEnc] = useState<Encontrista | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Custom confirmation modal state to bypass blocked native window.confirm in iframe
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Form States - Encontrista
  const [encName, setEncName] = useState('');
  const [encPhone, setEncPhone] = useState('');
  const [encMedication, setEncMedication] = useState('Nenhuma');
  const [encDisability, setEncDisability] = useState('Nenhuma');
  const [encObs, setEncObs] = useState('');
  const [encAddress, setEncAddress] = useState('');
  const [encComplement, setEncComplement] = useState('');
  const [encAddPhones, setEncAddPhones] = useState('');
  const [encIsMoita, setEncIsMoita] = useState(false);
  const [encCircleColor, setEncCircleColor] = useState('');

  // Form States - User/Buscador
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [userType, setUserType] = useState<'solteiro' | 'casal'>('solteiro');
  const [userAssignedEnc, setUserAssignedEnc] = useState<string[]>([]);
  const [userPassword, setUserPassword] = useState('');

  // Form States - Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('all');
  const [taskStatus, setTaskStatus] = useState<'pending' | 'completed'>('pending');

  const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 4000);
  };

  const fetchData = async () => {
    setSyncing(true);
    try {
      // 1. Fetch Encontristas
      const encSnap = await getDocs(collection(db, 'encontristas'));
      const encList: Encontrista[] = [];
      encSnap.forEach(d => {
        const data = d.data();
        encList.push({
          id: d.id,
          name: data.name || '',
          phone: data.phone || '',
          medication: data.medication || 'Nenhuma',
          disability: data.disability || 'Nenhuma',
          observations: data.observations || '',
          address: data.address || '',
          complement: data.complement || '',
          additionalPhones: data.additionalPhones || '',
          isMoita: !!data.isMoita,
          circleColor: data.circleColor || '',
          pickup_day1: data.pickup_day1,
          dropoff_day1: data.dropoff_day1,
          pickup_day2: data.pickup_day2,
          dropoff_day2: data.dropoff_day2,
          pickup_day3: data.pickup_day3,
          dropoff_day3: data.dropoff_day3,
        });
      });
      setEncontristas(encList);

      // 2. Fetch Users
      const userSnap = await getDocs(collection(db, 'users'));
      const userList: User[] = [];
      userSnap.forEach(d => {
        const data = d.data();
        userList.push({
          id: d.id,
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          assignedEncontristas: data.assignedEncontristas || [],
          role: data.role || 'user',
          type: data.type || 'solteiro',
          password: data.password || ''
        });
      });
      setUsuarios(userList);

      // 3. Fetch Tasks
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
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      setTasks(taskList);

    } catch (e) {
      console.error(e);
      showNotification('Erro ao carregar os dados de Firebase.', 'error');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  // --- CRUD ENCONTRISTA ---
  const handleOpenAddEnc = () => {
    setEditingEnc(null);
    setEncName('');
    setEncPhone('');
    setEncMedication('Nenhuma');
    setEncDisability('Nenhuma');
    setEncObs('');
    setEncAddress('');
    setEncComplement('');
    setEncAddPhones('');
    setEncIsMoita(false);
    setEncCircleColor('');
    setIsEncModalOpen(true);
  };

  const handleOpenEditEnc = (enc: Encontrista) => {
    setEditingEnc(enc);
    setEncName(enc.name);
    setEncPhone(enc.phone);
    setEncMedication(enc.medication);
    setEncDisability(enc.disability);
    setEncObs(enc.observations);
    setEncAddress(enc.address);
    setEncComplement(enc.complement);
    setEncAddPhones(enc.additionalPhones);
    setEncIsMoita(!!enc.isMoita);
    setEncCircleColor(enc.circleColor || '');
    setIsEncModalOpen(true);
  };

  const handleSaveEnc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encName || !encPhone || !encAddress) {
      showNotification('Preencha os campos obrigatórios (Nome, Telefone e Endereço).', 'error');
      return;
    }

    try {
      const payload: Omit<Encontrista, 'id'> = {
        name: encName.trim(),
        phone: encPhone.trim(),
        medication: encMedication.trim() || 'Nenhuma',
        disability: encDisability.trim() || 'Nenhuma',
        observations: encObs.trim(),
        address: encAddress.trim(),
        complement: encComplement.trim(),
        additionalPhones: encAddPhones.trim(),
        isMoita: encIsMoita,
        circleColor: encCircleColor.trim()
      };

      if (editingEnc) {
        // Update
        const docRef = doc(db, 'encontristas', editingEnc.id);
        await updateDoc(docRef, payload);
        showNotification('Encontrista atualizado com sucesso!');
      } else {
        // Create custom ID or auto generated
        const newId = 'enc_' + Date.now();
        const docRef = doc(db, 'encontristas', newId);
        await setDoc(docRef, payload);
        showNotification('Encontrista cadastrado com sucesso!');
      }
      setIsEncModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao salvar encontrista.', 'error');
    }
  };

  const handleDeleteEnc = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Remover Encontrista',
      message: 'Tem certeza de que deseja remover este encontrista do sistema? Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'encontristas', id));
          showNotification('Encontrista removido.');
          fetchData();
        } catch (e) {
          console.error(e);
          showNotification('Erro ao excluir encontrista.', 'error');
        }
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- CRUD USER / BUSCADOR ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserPhone('');
    setUserEmail('');
    setUserRole('user');
    setUserType('solteiro');
    setUserAssignedEnc([]);
    setUserPassword('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserPhone(u.phone);
    setUserEmail(u.email || '');
    setUserRole(u.role || 'user');
    setUserType(u.type || 'solteiro');
    setUserAssignedEnc(u.assignedEncontristas || []);
    setUserPassword(u.password || '');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName) {
      showNotification('Preencha o Nome do responsável.', 'error');
      return;
    }

    if (userRole === 'admin') {
      if (!userEmail.trim()) {
        showNotification('Administradores precisam de um E-mail cadastrado.', 'error');
        return;
      }
      if (!userPassword.trim()) {
        showNotification('Administradores precisam de uma Senha de acesso.', 'error');
        return;
      }
      if (userPassword.trim().length < 6) {
        showNotification('A senha do administrador deve ter pelo menos 6 caracteres.', 'error');
        return;
      }
    }

    try {
      const payload: Omit<User, 'id'> = {
        name: userName.trim(),
        phone: userPhone.trim().replace(/\D/g, ''),
        email: userEmail.trim(),
        role: userRole,
        type: userType,
        assignedEncontristas: userAssignedEnc,
        password: userPassword.trim()
      };

      if (userRole === 'admin' && userEmail.trim() && userPassword.trim()) {
        try {
          const secAuth = getSecondaryAuth();
          const credential = await createUserWithEmailAndPassword(secAuth, userEmail.trim(), userPassword.trim());
          await updateProfile(credential.user, {
            displayName: userName.trim()
          });
        } catch (authErr: any) {
          console.warn("Could not register secondary Auth user (may already exist):", authErr);
        }
      }

      if (editingUser) {
        const docRef = doc(db, 'users', editingUser.id);
        await updateDoc(docRef, payload);
        showNotification('Usuário atualizado com sucesso!');
      } else {
        const newId = 'user_' + Date.now();
        const docRef = doc(db, 'users', newId);
        await setDoc(docRef, payload);
        showNotification('Novo usuário adicionado com sucesso!');
      }
      setIsUserModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao salvar usuário.', 'error');
    }
  };

  const handleDeleteUser = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Remover Usuário',
      message: 'Tem certeza de que deseja remover este usuário? Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', id));
          showNotification('Usuário removido com sucesso!');
          fetchData();
        } catch (e) {
          console.error(e);
          showNotification('Erro ao excluir usuário.', 'error');
        }
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleAssignedEnc = (encId: string) => {
    setUserAssignedEnc(prev => 
      prev.includes(encId) 
        ? prev.filter(id => id !== encId) 
        : [...prev, encId]
    );
  };

  // --- CRUD TAREFAS ---
  const handleOpenAddTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskAssignedTo('all');
    setTaskStatus('pending');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (t: Task) => {
    setEditingTask(t);
    setTaskTitle(t.title);
    setTaskDesc(t.description || '');
    setTaskAssignedTo(t.assignedTo);
    setTaskStatus(t.status);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) {
      showNotification('Preencha o título da tarefa.', 'error');
      return;
    }

    try {
      const payload = {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assignedTo: taskAssignedTo,
        status: taskStatus,
        createdAt: editingTask?.createdAt || new Date().toISOString()
      };

      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), payload);
        showNotification('Tarefa atualizada com sucesso!');
      } else {
        const newId = 'task_' + Date.now();
        await setDoc(doc(db, 'tasks', newId), payload);
        showNotification('Tarefa criada com sucesso!');
      }
      setIsTaskModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao salvar tarefa.', 'error');
    }
  };

  const handleDeleteTask = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Excluir Tarefa',
      message: 'Tem certeza de que deseja excluir esta tarefa? Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'tasks', id));
          showNotification('Tarefa removida.');
          fetchData();
        } catch (e) {
          console.error(e);
          showNotification('Erro ao excluir tarefa.', 'error');
        }
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleTaskStatusDirect = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
      showNotification(`Tarefa marcada como ${newStatus === 'completed' ? 'concluída' : 'pendente'}`);
      fetchData();
    } catch (e) {
      console.error(e);
      showNotification('Erro ao alterar status da tarefa.', 'error');
    }
  };

  // Filters
  const filteredEncontristas = encontristas.filter(enc => 
    enc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enc.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (enc.circleColor && enc.circleColor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsuarios = usuarios.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone.includes(searchTerm)
  );

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header Banner */}
      <header className="bg-slate-900 text-white shrink-0 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display leading-none">Painel Administrativo</h1>
              <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">EJC Regresso Logística</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{user.name}</p>
              <p className="text-[9px] text-slate-400 font-mono tracking-wide">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold font-display transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Encontristas</span>
              <span className="text-xl font-bold text-slate-800">{encontristas.length}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl shrink-0">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Buscadores</span>
              <span className="text-xl font-bold text-slate-800">{usuarios.length}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tarefas</span>
              <span className="text-xl font-bold text-slate-800">
                {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Equipe Moita</span>
              <span className="text-xl font-bold text-slate-800">
                {encontristas.filter(e => e.isMoita).length}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Status / Notifications bar */}
        {notif && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3.5 rounded-xl border flex items-center gap-2 ${
              notif.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-red-50 border-red-100 text-red-800'
            }`}
          >
            {notif.type === 'success' ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />}
            <span className="text-xs font-semibold">{notif.message}</span>
          </motion.div>
        )}

        {/* Content Card with Tab Navigation */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          
          {/* Tab Switcher & Search Bar Header */}
          <div className="border-b border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            
            {/* Nav Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl self-start">
              <button
                onClick={() => { setActiveTab('encontristas'); setSearchTerm(''); }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'encontristas' 
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📋 Encontristas
              </button>
              <button
                onClick={() => { setActiveTab('usuarios'); setSearchTerm(''); }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'usuarios' 
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👥 Usuários / Motoristas
              </button>
              <button
                onClick={() => { setActiveTab('tarefas'); setSearchTerm(''); }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'tarefas' 
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📝 Tarefas ({tasks.length})
              </button>
            </div>

            {/* Controls Side */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 md:w-60">
                <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-400 m-auto" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Reload Button */}
              <button
                onClick={fetchData}
                disabled={syncing}
                className="bg-slate-100 hover:bg-slate-200 active:scale-95 p-2 rounded-xl border border-slate-200/60 text-slate-600 transition shrink-0 cursor-pointer"
                title="Sincronizar com Firebase"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              </button>

              {/* Add New Button */}
              {activeTab === 'encontristas' && (
                <button
                  onClick={handleOpenAddEnc}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo Encontrista</span>
                </button>
              )}

              {activeTab === 'usuarios' && (
                <button
                  onClick={handleOpenAddUser}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo Usuário</span>
                </button>
              )}

              {activeTab === 'tarefas' && (
                <button
                  onClick={handleOpenAddTask}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nova Tarefa</span>
                </button>
              )}
            </div>
          </div>

          {/* Table / List Container */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="h-8 w-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3" />
                <span className="text-xs text-slate-500 font-semibold">Buscando informações em tempo real...</span>
              </div>
            ) : (
              <div>
                
                {/* 1. ENCONTRISTAS TAB */}
                {activeTab === 'encontristas' && (
                  <div className="overflow-x-auto">
                    {filteredEncontristas.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-medium">
                        Nenhum encontrista encontrado.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="pb-3 pl-1">Nome / Círculo</th>
                            <th className="pb-3">Contato / Telefone</th>
                            <th className="pb-3">Endereço de Busca</th>
                            <th className="pb-3">Saúde / Obs</th>
                            <th className="pb-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredEncontristas.map(enc => (
                            <tr key={enc.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3.5 pl-1">
                                <div className="font-bold text-slate-800 text-xs sm:text-sm">{enc.name}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  {enc.circleColor ? (() => {
                                    const styles = getCircleColorStyles(enc.circleColor);
                                    return styles ? (
                                      <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${styles.bg}`}>
                                        <span className={`h-1 w-1 rounded-full ${styles.dot}`} />
                                        Círculo {enc.circleColor}
                                      </span>
                                    ) : null;
                                  })() : (
                                    <span className="text-[8px] text-slate-400">Sem círculo definido</span>
                                  )}

                                  {enc.isMoita && (
                                    <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-indigo-100 shrink-0">
                                      🌱 Equipe Moita
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5">
                                <div className="text-xs font-semibold text-slate-700">{enc.phone}</div>
                                {enc.additionalPhones && (
                                  <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs" title={enc.additionalPhones}>
                                    Adic: {enc.additionalPhones}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5">
                                <div className="text-xs text-slate-600 max-w-xs truncate" title={enc.address}>
                                  {enc.address}
                                </div>
                                {enc.complement && (
                                  <div className="text-[10px] text-slate-400 italic">
                                    Comp: {enc.complement}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 text-xs">
                                <div className="flex flex-col gap-0.5">
                                  {enc.medication !== 'Nenhuma' && (
                                    <span className="text-red-600 font-semibold flex items-center gap-1 text-[10px]">
                                      💊 {enc.medication}
                                    </span>
                                  )}
                                  {enc.disability !== 'Nenhuma' && (
                                    <span className="text-amber-600 font-semibold flex items-center gap-1 text-[10px]">
                                      ⚠️ {enc.disability}
                                    </span>
                                  )}
                                  {enc.observations && (
                                    <span className="text-slate-500 italic text-[10px] truncate max-w-[150px]" title={enc.observations}>
                                      Obs: {enc.observations}
                                    </span>
                                  )}
                                  {enc.medication === 'Nenhuma' && enc.disability === 'Nenhuma' && !enc.observations && (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditEnc(enc)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition active:scale-95 cursor-pointer"
                                    title="Editar encontrista"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEnc(enc.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border border-red-100 transition active:scale-95 cursor-pointer"
                                    title="Excluir encontrista"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* 2. USERS TAB */}
                {activeTab === 'usuarios' && (
                  <div className="overflow-x-auto">
                    {filteredUsuarios.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-medium">
                        Nenhum usuário cadastrado.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="pb-3 pl-1">Nome / Tipo</th>
                            <th className="pb-3">Contato / Telefone</th>
                            <th className="pb-3">Permissão</th>
                            <th className="pb-3">Encontristas Designados</th>
                            <th className="pb-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredUsuarios.map(u => {
                            const isDriverCouple = u.type === 'casal';
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3.5 pl-1">
                                  <div className="font-bold text-slate-850 text-xs sm:text-sm">{u.name}</div>
                                  <div className="mt-1">
                                    <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${
                                      isDriverCouple 
                                        ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                        : 'bg-teal-50 text-teal-700 border-teal-100'
                                    }`}>
                                      {isDriverCouple ? '👥 Buscador Casado' : '👤 Buscador Solteiro'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5">
                                  <div className="text-xs font-semibold text-slate-700">{u.phone || 'Sem telefone'}</div>
                                  {u.email && (
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{u.email}</div>
                                  )}
                                </td>
                                <td className="py-3.5">
                                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    u.role === 'admin' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {u.role === 'admin' ? 'Administrador' : 'Motorista'}
                                  </span>
                                </td>
                                <td className="py-3.5">
                                  <div className="text-xs text-slate-700">
                                    {u.assignedEncontristas && u.assignedEncontristas.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 max-w-sm">
                                        {u.assignedEncontristas.map(id => {
                                          const encName = encontristas.find(e => e.id === id)?.name || id;
                                          return (
                                            <span key={id} className="bg-slate-100 text-slate-800 text-[9px] font-medium px-2 py-0.5 rounded-md truncate max-w-[120px]" title={encName}>
                                              {encName}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">Nenhum encontrista designado</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditUser(u)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition active:scale-95 cursor-pointer"
                                      title="Editar motorista / usuário"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border border-red-100 transition active:scale-95 cursor-pointer"
                                      title="Remover motorista"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* 3. TAREFAS TAB */}
                {activeTab === 'tarefas' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Cadastre e acompanhe as obrigações da equipe. Os motoristas e administradores poderão visualizar ou concluir tarefas.
                    </p>
                    
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-medium">
                        Nenhuma tarefa cadastrada.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTasks.map(task => {
                          const isDone = task.status === 'completed';
                          return (
                            <motion.div 
                              key={task.id} 
                              layout
                              className={`p-4 rounded-2xl border flex gap-3 transition ${
                                isDone 
                                  ? 'bg-slate-50/50 border-slate-200 text-slate-500' 
                                  : 'bg-white border-slate-200 hover:shadow-xs text-slate-800'
                              }`}
                            >
                              <button 
                                onClick={() => handleToggleTaskStatusDirect(task)}
                                className="mt-0.5 shrink-0 hover:scale-115 transition"
                                title={isDone ? "Marcar como pendente" : "Marcar como concluída"}
                              >
                                {isDone ? (
                                  <CheckSquare className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-slate-300" />
                                )}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-xs sm:text-sm font-bold leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-850'}`}>
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    {task.description}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                  {/* Assignment tag */}
                                  <span className="text-[8px] font-bold font-mono tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    {task.assignedTo === 'all' ? '📢 Todos os Motoristas' : (() => {
                                      const u = usuarios.find(us => us.id === task.assignedTo);
                                      return u ? `👤 ${u.name}` : '👤 Individual';
                                    })()}
                                  </span>
                                  
                                  {/* Created Timestamp */}
                                  <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                                    <Clock className="h-2.5 w-2.5" />
                                    {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-col gap-1.5 justify-center">
                                <button
                                  onClick={() => handleOpenEditTask(task)}
                                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-100 transition active:scale-95 cursor-pointer"
                                  title="Editar tarefa"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg border border-red-50 transition active:scale-95 cursor-pointer"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-[10px] text-slate-400 font-mono tracking-wider py-8 uppercase shrink-0">
        2026 © Nicolas Rodrigues
      </footer>

      {/* --- MODALS IMPLEMENTATION --- */}

      {/* 1. ENCONTRISTA ADD/EDIT MODAL */}
      <AnimatePresence>
        {isEncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col my-8"
            >
              <div className="bg-slate-50 border-b border-slate-150 p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">
                    {editingEnc ? 'Editar Encontrista' : 'Adicionar Encontrista'}
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Ficha de Dados do Encontro</p>
                </div>
                <button 
                  onClick={() => setIsEncModalOpen(false)}
                  className="bg-slate-200/50 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEnc} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      value={encName}
                      onChange={(e) => setEncName(e.target.value)}
                      placeholder="Ex: Pedro Henrique Silva"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone Principal *</label>
                    <input 
                      type="text" 
                      value={encPhone}
                      onChange={(e) => setEncPhone(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Círculo */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cor do Círculo</label>
                    <select
                      value={encCircleColor}
                      onChange={(e) => setEncCircleColor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                    >
                      <option value="">Nenhum círculo</option>
                      <option value="Vermelho">Vermelho</option>
                      <option value="Azul">Azul</option>
                      <option value="Amarelo">Amarelo</option>
                      <option value="Verde">Verde</option>
                      <option value="Laranja">Laranja</option>
                      <option value="Roxo">Roxo</option>
                      <option value="Rosa">Rosa</option>
                      <option value="Marrom">Marrom</option>
                    </select>
                  </div>
                </div>

                {/* Equipe Moita */}
                <div className="flex items-center gap-2.5 bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="isMoitaCheck"
                    checked={encIsMoita}
                    onChange={(e) => setEncIsMoita(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="isMoitaCheck" className="text-xs font-bold text-indigo-950 flex items-center gap-1 cursor-pointer">
                      🌱 Jovem da Equipe Escondida (Moita)
                    </label>
                    <p className="text-[10px] text-indigo-500/80 leading-snug">Se ativado, este encontrista receberá o indicativo especial e orientações especiais da equipe disfarçada.</p>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço Completo *</label>
                  <input 
                    type="text" 
                    value={encAddress}
                    onChange={(e) => setEncAddress(e.target.value)}
                    placeholder="Ex: Rua Augusta, 1000 - Consolação"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Complemento */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Complemento</label>
                    <input 
                      type="text" 
                      value={encComplement}
                      onChange={(e) => setEncComplement(e.target.value)}
                      placeholder="Ex: Apto 42B / Bloco C"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Telefones adicionais */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contatos dos Responsáveis</label>
                    <input 
                      type="text" 
                      value={encAddPhones}
                      onChange={(e) => setEncAddPhones(e.target.value)}
                      placeholder="Ex: Mãe (Marta): 1199999-9999"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Medicação */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicação contínua / Cuidados</label>
                    <input 
                      type="text" 
                      value={encMedication}
                      onChange={(e) => setEncMedication(e.target.value)}
                      placeholder="Nenhuma"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none text-red-600"
                    />
                  </div>

                  {/* Deficiência */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Restrição Alimentar ou Deficiência</label>
                    <input 
                      type="text" 
                      value={encDisability}
                      onChange={(e) => setEncDisability(e.target.value)}
                      placeholder="Nenhuma"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none text-amber-600"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observações da Logística</label>
                  <textarea 
                    value={encObs}
                    onChange={(e) => setEncObs(e.target.value)}
                    placeholder="E.g. Levar casaco preto que ela esqueceu."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsEncModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-2.5 px-4 text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Salvar Dados
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. USER/MOTORISTA ADD/EDIT MODAL */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col my-8"
            >
              <div className="bg-slate-50 border-b border-slate-150 p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">
                    {editingUser ? 'Editar Usuário/Buscador' : 'Adicionar Usuário/Buscador'}
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Controle de Motoristas da Equipe</p>
                </div>
                <button 
                  onClick={() => setIsUserModalOpen(false)}
                  className="bg-slate-200/50 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                
                {/* Nome */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ex: Tio João Silva"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Telefone */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Celular / Telefone *</label>
                    <input 
                      type="text" 
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="Ex: 11999999999"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                    />
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail (Administrativo)</label>
                    <input 
                      type="email" 
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Ex: joao@ejc.com"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipo de Buscador: Solteiro ou Casal */}
                  <div>
                    <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Estado Civil (Solteiro/Casal)
                    </label>
                    <select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value as 'solteiro' | 'casal')}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none"
                    >
                      <option value="solteiro">👤 Buscador Solteiro(a)</option>
                      <option value="casal">👥 Buscador Casado</option>
                    </select>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo / Nível de Acesso</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as 'admin' | 'user')}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                    >
                      <option value="user">🚗 Motorista da Logística</option>
                      <option value="admin">🛡️ Coordenador / Administrador</option>
                    </select>
                  </div>
                </div>

                {userRole === 'admin' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Senha de Acesso do Administrador *</label>
                    <input 
                      type="password" 
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                    />
                  </div>
                )}

                {/* Assing Encontristas Section */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designar Encontristas para Busca</label>
                  <p className="text-[10px] text-slate-400 leading-snug">Selecione quais encontristas serão de responsabilidade de busca e entrega deste motorista/casal:</p>
                  
                  <div className="border border-slate-200 rounded-2xl bg-slate-50 p-3 max-h-48 overflow-y-auto space-y-2">
                    {encontristas.length === 0 ? (
                      <div className="text-[10px] text-slate-400 italic">Nenhum encontrista cadastrado ainda no sistema.</div>
                    ) : (
                      encontristas.map(enc => {
                        const isChecked = userAssignedEnc.includes(enc.id);
                        return (
                          <div 
                            key={enc.id}
                            onClick={() => handleToggleAssignedEnc(enc.id)}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                              isChecked 
                                ? 'bg-blue-50/50 border-blue-200 text-blue-950 font-semibold' 
                                : 'bg-white border-slate-150 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0">{isChecked ? '✓' : ''}</span>
                              <span className="truncate">{enc.name}</span>
                            </div>
                            {enc.circleColor && (
                              <span className="text-[8px] font-mono border rounded px-1 shrink-0 uppercase">
                                {enc.circleColor}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-2.5 px-4 text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Salvar Dados
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. TASK ADD/EDIT MODAL */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col my-8"
            >
              <div className="bg-slate-50 border-b border-slate-150 p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">
                    {editingTask ? 'Editar Tarefa de Equipe' : 'Nova Tarefa de Equipe'}
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Logística do Encontro</p>
                </div>
                <button 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="bg-slate-200/50 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="p-6 space-y-4">
                
                {/* Título */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Título / Obrigação *</label>
                  <input 
                    type="text" 
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ex: Buscar mensagens do saco de choro na casa da mãe"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold focus:outline-none"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição Detalhada / Instruções</label>
                  <textarea 
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Dica: Indique o endereço ou nome dos pais se necessário."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Destinatário */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designado Para</label>
                    <select
                      value={taskAssignedTo}
                      onChange={(e) => setTaskAssignedTo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                    >
                      <option value="all">📢 Todos os Motoristas</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Inicial</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value as 'pending' | 'completed')}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                    >
                      <option value="pending">⏳ Pendente</option>
                      <option value="completed">✓ Concluída</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-2.5 px-4 text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Salvar Tarefa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CUSTOM CONFIRMATION DELETE DIALOG */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden flex flex-col"
            >
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">
                    {deleteConfirm.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {deleteConfirm.message}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-2 px-4 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={deleteConfirm.onConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 px-5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
