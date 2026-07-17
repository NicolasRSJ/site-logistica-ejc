import React from 'react';
import { motion } from 'motion/react';
import { 
  X, MapPin, Phone, HeartPulse, ShieldAlert, FileText, 
  Share2, Compass, PhoneCall, CheckCircle, Clock 
} from 'lucide-react';
import { Encontrista } from '../types';
import { getCircleColorStyles } from './Dashboard';

interface EncontristaDetailProps {
  encontrista: Encontrista;
  onClose: () => void;
  onToggleStatus: (id: string, phase: 'pickup' | 'dropoff') => void;
  activeDay: number;
}

export default function EncontristaDetail({ encontrista, onClose, onToggleStatus, activeDay }: EncontristaDetailProps) {
  
  // Create the Google Maps navigation URLs
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${encontrista.address} ${encontrista.complement || ''}`)}`;
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${encontrista.address} ${encontrista.complement || ''}`)}`;

  // Share coordinates/text easily
  const handleShare = () => {
    const text = `*EJC Regresso - Dados do Encontrista*\n\n` +
      `👤 *Nome:* ${encontrista.name}\n` +
      `📞 *Contato:* ${encontrista.phone}\n` +
      `🌈 *Círculo:* ${encontrista.circleColor || 'Não informado'}\n` +
      `🌱 *Equipe Moita:* ${encontrista.isMoita ? 'Sim' : 'Não'}\n` +
      `📍 *Endereço:* ${encontrista.address} ${encontrista.complement ? `(${encontrista.complement})` : ''}\n` +
      `💊 *Medicação:* ${encontrista.medication || 'Nenhuma'}\n` +
      `⚠️ *Deficiência:* ${encontrista.disability || 'Nenhuma'}\n` +
      `📝 *Obs:* ${encontrista.observations || 'Nenhuma'}\n` +
      `📱 *Contatos Adicionais:* ${encontrista.additionalPhones || 'Nenhum'}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Dados do Encontrista',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Dados copiados para a área de transferência!');
    }
  };

  const hasSpecialConditions = 
    (encontrista.medication && encontrista.medication !== 'Nenhuma') || 
    (encontrista.disability && encontrista.disability !== 'Nenhuma');

  // Determine status for this day
  const pickupStatus = (activeDay === 1 ? encontrista.pickup_day1 : (activeDay === 2 ? encontrista.pickup_day2 : encontrista.pickup_day3)) || 'pending';
  const dropoffStatus = (activeDay === 1 ? encontrista.dropoff_day1 : (activeDay === 2 ? encontrista.dropoff_day2 : encontrista.dropoff_day3)) || 'pending';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="bg-white text-slate-800 w-full max-w-lg rounded-t-[32px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200 border-b-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for drag indicator */}
        <div className="w-full flex justify-center py-3 bg-slate-50 border-b border-slate-200/50">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>
 
        {/* Content Area */}
        <div className="overflow-y-auto px-6 pb-8 pt-5 flex-1 space-y-6">
          
          {/* Title and Close */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <>
                  {pickupStatus === 'completed' ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle className="h-3 w-3" /> Busca Concluída
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                      <Clock className="h-3 w-3 animate-pulse" /> Busca Pendente
                    </span>
                  )}
                  {dropoffStatus === 'completed' ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle className="h-3 w-3" /> Retorno Concluído
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                      <Clock className="h-3 w-3 animate-pulse" /> Retorno Pendente
                    </span>
                  )}
                </>
              </div>
              <h2 className="text-lg font-bold font-display text-slate-850 leading-tight">
                {encontrista.name}
              </h2>
              {(encontrista.circleColor || encontrista.isMoita) && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {encontrista.circleColor && (() => {
                    const styles = getCircleColorStyles(encontrista.circleColor);
                    return styles ? (
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${styles.bg}`}>
                        <span className={`h-2 w-2 rounded-full shrink-0 ${styles.dot}`} />
                        Círculo {encontrista.circleColor}
                      </span>
                    ) : null;
                  })()}
                  {encontrista.isMoita && (
                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                      🌱 Equipe Moita
                    </span>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-full text-slate-500 transition cursor-pointer border border-slate-200/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
 
          {/* Action Call & Navigation Panel */}
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`tel:${encontrista.phone.replace(/\D/g, '')}`}
              className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 py-3 px-4 rounded-xl font-bold text-xs transition cursor-pointer text-center"
            >
              <PhoneCall className="h-4 w-4 text-slate-500" />
              <span>Ligar p/ Jovem</span>
            </a>
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 py-3 px-4 rounded-xl font-bold text-xs transition cursor-pointer text-center"
            >
              <Share2 className="h-4 w-4 text-slate-500" />
              <span>Compartilhar</span>
            </button>
          </div>
 
          {/* Map/Location Section */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 shadow-inner">
            <div className="flex gap-3 items-start">
              <div className="bg-blue-600 p-2.5 rounded-xl shrink-0 mt-0.5 shadow-sm shadow-blue-100">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Endereço de Entrega</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5 leading-snug">
                  {encontrista.address}
                </p>
                {encontrista.complement && (
                  <p className="text-[10px] text-blue-700 font-bold mt-1.5 bg-blue-50/80 inline-block px-2.5 py-0.5 rounded-lg border border-blue-100/50">
                    Complemento: {encontrista.complement}
                  </p>
                )}
              </div>
            </div>
 
            {/* Maps Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1.5">
              <a 
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Compass className="h-3.5 w-3.5 text-slate-400" />
                Ver no Mapa
              </a>
              <a 
                href={routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <MapPin className="h-3.5 w-3.5" />
                Iniciar Rota
              </a>
            </div>
          </div>
 
          {/* Attention / Health Alerts */}
          {hasSpecialConditions && (
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center gap-2 text-red-800">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-600" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-red-700">Atenção Médica / Cuidados</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5 text-slate-800 text-xs">
                {encontrista.medication && encontrista.medication !== 'Nenhuma' && (
                  <div className="bg-white p-3 rounded-xl border border-red-100/60 shadow-sm">
                    <span className="font-bold text-red-600 block mb-0.5">💊 Medicação em Uso:</span>
                    <p className="font-medium text-slate-700">{encontrista.medication}</p>
                  </div>
                )}
                
                {encontrista.disability && encontrista.disability !== 'Nenhuma' && (
                  <div className="bg-white p-3 rounded-xl border border-red-100/60 shadow-sm">
                    <span className="font-bold text-red-600 block mb-0.5">⚠️ Condição / Deficiência:</span>
                    <p className="font-medium text-slate-700">{encontrista.disability}</p>
                  </div>
                )}
              </div>
            </div>
          )}
 
          {/* Secondary Details */}
          <div className="space-y-4">
            {/* Additional Contacts */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/60">
              <div className="flex gap-2.5 items-center text-slate-400 mb-2">
                <Phone className="h-4 w-4" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Contatos Adicionais / Família</span>
              </div>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed whitespace-pre-line">
                {encontrista.additionalPhones || 'Nenhum outro contato registrado.'}
              </p>
            </div>
 
            {/* Observations */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/60">
              <div className="flex gap-2.5 items-center text-slate-400 mb-2">
                <FileText className="h-4 w-4" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Observações Importantes</span>
              </div>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                {encontrista.observations || 'Nenhuma observação cadastrada para este encontrista.'}
              </p>
            </div>
          </div>
 
        </div>
 
        {/* Footer / Toggle Delivery Status */}
        <div className="bg-slate-50 px-6 py-4.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-slate-400 font-mono">
            ID: {encontrista.id}
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-1 justify-end">
            <>
              <button
                onClick={() => onToggleStatus(encontrista.id, 'pickup')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border ${
                  pickupStatus === 'completed'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                }`}
              >
                {pickupStatus === 'completed' ? 'Busca Pendente' : 'Confirmar Busca'}
              </button>
              <button
                onClick={() => onToggleStatus(encontrista.id, 'dropoff')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border ${
                  dropoffStatus === 'completed'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                }`}
              >
                {dropoffStatus === 'completed' ? 'Retorno Pendente' : 'Confirmar Retorno'}
              </button>
            </>
          </div>
        </div>
 
      </motion.div>
    </motion.div>
  );
}
