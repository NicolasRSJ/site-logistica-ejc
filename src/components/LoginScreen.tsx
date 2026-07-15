import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, ArrowRight, Car, AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalizes phone string to digits only
  const normalizePhone = (str: string) => {
    return str.replace(/\D/g, '');
  };

  // Format phone input as (XX) XXXXX-XXXX as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    let formatted = '';
    
    if (rawValue.length > 0) {
      formatted += `(${rawValue.substring(0, 2)}`;
    }
    if (rawValue.length > 2) {
      formatted += `) ${rawValue.substring(2, 7)}`;
    }
    if (rawValue.length > 7) {
      formatted += `-${rawValue.substring(7, 11)}`;
    }
    
    if (rawValue.length <= 11) {
      setPhoneInput(formatted || rawValue);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanPhone = normalizePhone(phoneInput);
    if (cleanPhone.length < 10) {
      setError('Por favor, insira um número de telefone válido com DDD (ex: 11999999999).');
      setIsLoading(false);
      return;
    }

    try {
      // Query users collection in Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let foundUser: User | null = null;

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const userCleanPhone = normalizePhone(data.phone || '');
        if (userCleanPhone === cleanPhone) {
          foundUser = {
            id: doc.id,
            name: data.name,
            phone: data.phone,
            assignedEncontristas: data.assignedEncontristas || []
          };
        }
      });

      if (foundUser) {
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(foundUser!);
        }, 800);
      } else {
        setError('Telefone não cadastrado como motorista/buscador do EJC. Verifique o número e tente novamente.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar ao servidor. Verifique a conexão e tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 font-sans overflow-hidden px-4 py-6 select-none">
      
      {/* App Header */}
      <div className="flex flex-col items-center mt-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative bg-blue-600 p-4 rounded-2xl shadow-md shadow-blue-200 mb-4"
        >
          <Car className="h-10 w-10 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-50 animate-pulse" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold font-display tracking-tight text-slate-800 text-center px-4"
        >
          Logística Equipe Externa 40º EJC.
        </motion.h1>
      </div>

      {/* Main Form Box */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto my-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm"
        >
          <h2 className="text-base font-bold font-display text-slate-800 mb-1">Acesso do Buscador</h2>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Informe o seu número de celular cadastrado no Firebase para carregar as informações e rotas dos seus encontristas.
          </p>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Celular (com DDD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phoneInput}
                  onChange={handlePhoneChange}
                  disabled={isLoading}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 text-sm font-semibold transition duration-200 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2.5 items-start text-red-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span className="text-xs leading-relaxed font-medium">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !phoneInput}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl py-3 px-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verificar Telefone</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400 font-mono tracking-wider mt-4 uppercase">
        2026 © Nicolas Rodrigues
      </div>
    </div>
  );
}
