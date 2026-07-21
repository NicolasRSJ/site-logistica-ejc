import React, { useState } from 'react';
import { 
  FileText, Download, Printer, ArrowLeft, Activity, 
  Users, HeartPulse, Truck, FileSpreadsheet, Check, HelpCircle
} from 'lucide-react';
import { Encontrista, User, Task } from '../types';

interface AdminReportsProps {
  encontristas: Encontrista[];
  usuarios: User[];
  tasks: Task[];
}

type ReportType = 'geral' | 'saude' | 'circulos' | 'logistica' | 'motoristas';

export default function AdminReports({ encontristas, usuarios, tasks }: AdminReportsProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  // Helper: Format logistics status for display
  const formatStatus = (status?: 'pending' | 'completed') => {
    return status === 'completed' ? 'CONCLUÍDO' : 'PENDENTE';
  };

  // Helper: Export to CSV (Formatted for Brazilian Excel: UTF-8 BOM + Semicolon)
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => {
        const str = cell === null || cell === undefined ? '' : String(cell);
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Export Geral de Encontristas
  const handleExportGeralCSV = () => {
    const headers = [
      'Nome', 'Telefone', 'Círculo', 'Moita', 'Endereço', 'Complemento', 
      'Mora Com', 'Quem é o Responsável', 'Medicação', 'Deficiência', 'Observações',
      'Sexta Ida', 'Sexta Volta', 'Sábado Ida', 'Sábado Volta', 'Domingo Ida', 'Domingo Volta'
    ];
    
    const rows = encontristas.map(e => [
      e.name,
      e.phone,
      e.circleColor || 'Sem Círculo',
      e.isMoita ? 'SIM' : 'NÃO',
      e.address,
      e.complement || '',
      e.residenceType || 'Não informado',
      e.residenceResponsibleDetails || '',
      e.medication || 'Nenhuma',
      e.disability || 'Nenhuma',
      e.observations || '',
      formatStatus(e.pickup_day1),
      formatStatus(e.dropoff_day1),
      formatStatus(e.pickup_day2),
      formatStatus(e.dropoff_day2),
      formatStatus(e.pickup_day3),
      formatStatus(e.dropoff_day3)
    ]);

    downloadCSV('relatorio_geral_encontristas', headers, rows);
  };

  // 2. Export Saúde e Alertas
  const handleExportSaudeCSV = () => {
    const medicalCases = encontristas.filter(e => 
      (e.medication && e.medication !== 'Nenhuma') || 
      (e.disability && e.disability !== 'Nenhuma') || 
      (e.observations && e.observations.trim() !== '')
    );

    const headers = ['Nome', 'Telefone', 'Círculo', 'Medicação', 'Deficiência', 'Observações / Cuidados'];
    const rows = medicalCases.map(e => [
      e.name,
      e.phone,
      e.circleColor || 'Sem Círculo',
      e.medication || 'Nenhuma',
      e.disability || 'Nenhuma',
      e.observations || ''
    ]);

    downloadCSV('relatorio_saude_e_alertas', headers, rows);
  };

  // 3. Export Círculos
  const handleExportCirculosCSV = () => {
    const headers = ['Círculo', 'Nome', 'Telefone', 'Moita', 'Residência'];
    const sorted = [...encontristas].sort((a, b) => {
      const colorA = a.circleColor || 'Sem Círculo';
      const colorB = b.circleColor || 'Sem Círculo';
      return colorA.localeCompare(colorB);
    });

    const rows = sorted.map(e => [
      e.circleColor || 'Sem Círculo',
      e.name,
      e.phone,
      e.isMoita ? 'SIM' : 'NÃO',
      e.residenceType || 'Não informado'
    ]);

    downloadCSV('relatorio_por_circulos', headers, rows);
  };

  // 4. Export Presença e Logística
  const handleExportLogisticaCSV = () => {
    const headers = [
      'Nome', 'Círculo', 
      'Sexta-Ida', 'Sexta-Volta', 
      'Sábado-Ida', 'Sábado-Volta', 
      'Domingo-Ida', 'Domingo-Volta'
    ];

    const rows = encontristas.map(e => [
      e.name,
      e.circleColor || 'Sem Círculo',
      formatStatus(e.pickup_day1),
      formatStatus(e.dropoff_day1),
      formatStatus(e.pickup_day2),
      formatStatus(e.dropoff_day2),
      formatStatus(e.pickup_day3),
      formatStatus(e.dropoff_day3)
    ]);

    downloadCSV('relatorio_presenca_logistica', headers, rows);
  };

  // 5. Export Motoristas e Rotas
  const handleExportMotoristasCSV = () => {
    const headers = ['Motorista', 'Tipo', 'Telefone', 'E-mail', 'Encontrista Designado', 'Telefone Encontrista', 'Círculo Encontrista'];
    const rows: string[][] = [];

    usuarios.forEach(u => {
      if (u.assignedEncontristas && u.assignedEncontristas.length > 0) {
        u.assignedEncontristas.forEach(encId => {
          const enc = encontristas.find(e => e.id === encId);
          rows.push([
            u.name,
            u.type === 'casal' ? 'Casal' : 'Solteiro',
            u.phone,
            u.email || '',
            enc ? enc.name : encId,
            enc ? enc.phone : '-',
            enc ? (enc.circleColor || 'Sem Círculo') : '-'
          ]);
        });
      } else {
        rows.push([
          u.name,
          u.type === 'casal' ? 'Casal' : 'Solteiro',
          u.phone,
          u.email || '',
          'Nenhum designado',
          '-',
          '-'
        ]);
      }
    });

    downloadCSV('relatorio_atribuicao_motoristas', headers, rows);
  };

  // Trigger Print Screen
  const handlePrint = () => {
    window.print();
  };

  // Pre-calculated stats
  const totalEncontristas = encontristas.length;
  const medicalCasesCount = encontristas.filter(e => 
    (e.medication && e.medication !== 'Nenhuma') || 
    (e.disability && e.disability !== 'Nenhuma') || 
    (e.observations && e.observations.trim() !== '')
  ).length;

  const moitaCount = encontristas.filter(e => e.isMoita).length;

  // Group by circle for calculations
  const circlesMap: { [key: string]: number } = {};
  encontristas.forEach(e => {
    const c = e.circleColor || 'Sem Círculo';
    circlesMap[c] = (circlesMap[c] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic print stylesheet so only the document sheet prints */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          /* Hide app elements */
          body > :not(#printable-report-container) {
            display: none !important;
          }
          #printable-report-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}} />

      {/* Main Panel View */}
      {!selectedReport ? (
        <div className="space-y-4">
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex gap-3">
            <div className="bg-blue-100 text-blue-700 p-2 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Centro de Downloads</h4>
              <p className="text-[11px] text-blue-700/80 mt-0.5 leading-snug">
                Gere e exporte relatórios consolidados do EJC. Os dados são processados e formatados no seu navegador em tempo real e não são armazenados em servidores externos. Ideal para planejamento, saúde e entrega de rotas físicas de logística.
              </p>
            </div>
          </div>

          {/* Grid of Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Relatório Geral */}
            <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between transition gap-4">
              <div className="flex gap-3.5">
                <div className="bg-blue-100 text-blue-700 p-2.5 rounded-xl shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">Relatório Geral de Encontristas</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Lista completa de todos os encontristas cadastrados, com endereços, contatos adicionais, filiação/moradia, restrições médicas e status de transporte diário.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">EXCEL (CSV)</span>
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">PDF / IMPRESSÃO</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleExportGeralCSV}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Download className="h-3 w-3" /> Baixar Excel
                </button>
                <button 
                  onClick={() => setSelectedReport('geral')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Printer className="h-3 w-3" /> Ver & Imprimir
                </button>
              </div>
            </div>

            {/* 2. Alertas de Saúde */}
            <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between transition gap-4">
              <div className="flex gap-3.5">
                <div className="bg-rose-100 text-rose-700 p-2.5 rounded-xl shrink-0">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">Ficha Médica e Cuidados</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Filtra apenas encontristas que utilizam medicação contínua, possuem deficiências ou observações específicas. Ideal para a equipe médica e de apoio.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 font-bold">ALERTA ATIVO</span>
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100">{medicalCasesCount} Casos</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleExportSaudeCSV}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Download className="h-3 w-3" /> Baixar Excel
                </button>
                <button 
                  onClick={() => setSelectedReport('saude')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Printer className="h-3 w-3" /> Ver & Imprimir
                </button>
              </div>
            </div>

            {/* 3. Divisão de Círculos */}
            <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between transition gap-4">
              <div className="flex gap-3.5">
                <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">Grupos de Círculos e Equipes</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Lista ordenada e agrupada de encontristas por cores dos círculos. Exibe indicação de integrantes do Moita para organização interna do evento.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100">Moita: {moitaCount} jovens</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleExportCirculosCSV}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Download className="h-3 w-3" /> Baixar Excel
                </button>
                <button 
                  onClick={() => setSelectedReport('circulos')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Printer className="h-3 w-3" /> Ver & Imprimir
                </button>
              </div>
            </div>

            {/* 4. Lista de Presença / Logística */}
            <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between transition gap-4">
              <div className="flex gap-3.5">
                <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl shrink-0">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">Ficha de Presença e Status de Logística</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Grade com status consolidado de transporte de todos os encontristas. Perfeito para impressão física de controle de entrada e saída.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">Imprimir Checklist</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleExportLogisticaCSV}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Download className="h-3 w-3" /> Baixar Excel
                </button>
                <button 
                  onClick={() => setSelectedReport('logistica')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Printer className="h-3 w-3" /> Ver & Imprimir
                </button>
              </div>
            </div>

            {/* 5. Atribuição de Motoristas */}
            <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between transition gap-4">
              <div className="flex gap-3.5">
                <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">Motoristas e Rotas de Transporte</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Lista organizada por motorista (Buscador), mostrando telefone, se é casado ou solteiro e todos os encontristas que ele está encarregado de buscar.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">Rotas de Viagem</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleExportMotoristasCSV}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Download className="h-3 w-3" /> Baixar Excel
                </button>
                <button 
                  onClick={() => setSelectedReport('motoristas')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Printer className="h-3 w-3" /> Ver & Imprimir
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Report Print / Preview Sheet View */
        <div className="space-y-4">
          {/* Header Action Controls (no-print) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl no-print">
            <button 
              onClick={() => setSelectedReport(null)}
              className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para os Relatórios
            </button>
            <div className="flex gap-2 self-stretch sm:self-auto justify-end">
              <p className="text-[10px] text-slate-500 flex items-center mr-2 italic">
                Dica: Selecione "Salvar como PDF" nas opções de impressão.
              </p>
              <button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
              >
                <Printer className="h-4 w-4" /> Imprimir ou Salvar PDF
              </button>
            </div>
          </div>

          {/* Printable Container Sheet */}
          <div id="printable-report-container" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-full overflow-hidden text-slate-900 font-sans">
            
            {/* Document Title Header */}
            <div className="border-b-2 border-slate-800 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">EJC Regresso Logística</h1>
                <p className="text-xs text-blue-600 font-mono font-bold uppercase tracking-wider mt-0.5">Relatório Oficial de Controle</p>
              </div>
              <div className="text-left sm:text-right font-mono text-[10px] text-slate-500 space-y-0.5">
                <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
                <p>Hora: {new Date().toLocaleTimeString('pt-BR')}</p>
                <p>Status: Consolidado Firebase</p>
              </div>
            </div>

            {/* Render Selected Report Content */}
            {selectedReport === 'geral' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border border-slate-100 bg-slate-50/50 p-4 rounded-2xl gap-3">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Relatório Geral de Encontristas</h2>
                  <span className="bg-slate-200 text-slate-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">{encontristas.length} Registros</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-200 min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300">
                        <th className="p-2 border-r border-slate-200">Nome</th>
                        <th className="p-2 border-r border-slate-200">Círculo</th>
                        <th className="p-2 border-r border-slate-200">Contato</th>
                        <th className="p-2 border-r border-slate-200">Moradia</th>
                        <th className="p-2 border-r border-slate-200">Endereço</th>
                        <th className="p-2">Alertas Médicos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {encontristas.map((e, index) => (
                        <tr key={e.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="p-2 border-r border-slate-200 font-bold">{e.name}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-[10px]">
                            {e.circleColor ? `Círculo ${e.circleColor}` : 'Sem Círculo'} 
                            {e.isMoita && ' (Moita)'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-[11px] font-mono">{e.phone}</td>
                          <td className="p-2 border-r border-slate-200 text-[10px]">
                            {e.residenceType || 'Não informado'}
                            {e.residenceType === 'Responsável' && ` (${e.residenceResponsibleDetails})`}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-[10px] leading-snug">
                            {e.address} {e.complement && `- ${e.complement}`}
                          </td>
                          <td className="p-2 text-[10px] text-slate-600 leading-snug">
                            {e.medication !== 'Nenhuma' && <span className="block font-semibold text-rose-700">💊 Med: {e.medication}</span>}
                            {e.disability !== 'Nenhuma' && <span className="block font-semibold text-amber-700">⚠️ Def: {e.disability}</span>}
                            {e.observations && <span className="block italic text-slate-500">Obs: {e.observations}</span>}
                            {e.medication === 'Nenhuma' && e.disability === 'Nenhuma' && !e.observations && <span className="text-slate-400">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReport === 'saude' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border border-rose-100 bg-rose-50/30 p-4 rounded-2xl gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-rose-850 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 bg-rose-600 rounded-full animate-pulse"></span>
                      Ficha Médica e Casos de Cuidados Especiais
                    </h2>
                    <p className="text-[10px] text-rose-700 mt-0.5">Informações críticas para a equipe de saúde e logística.</p>
                  </div>
                  <span className="bg-rose-100 text-rose-800 font-mono font-bold text-[10px] px-2.5 py-1 rounded-full self-start sm:self-auto">{medicalCasesCount} Casos Identificados</span>
                </div>

                <div className="space-y-4">
                  {encontristas.filter(e => 
                    (e.medication && e.medication !== 'Nenhuma') || 
                    (e.disability && e.disability !== 'Nenhuma') || 
                    (e.observations && e.observations.trim() !== '')
                  ).map(e => (
                    <div key={e.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs print-break-inside-avoid">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-2 mb-3 gap-1">
                        <div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">{e.name}</h3>
                          <p className="text-[10px] text-slate-500">Círculo: <span className="font-bold">{e.circleColor || 'Não informado'}</span> {e.isMoita && ' | Equipe Moita'}</p>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-700">Contatos: {e.phone} {e.additionalPhones && `| ${e.additionalPhones}`}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
                        <div className="bg-rose-50/50 border border-rose-100/60 p-3 rounded-xl">
                          <p className="text-[9px] font-bold text-rose-700 uppercase tracking-wider mb-1">💊 Medicação Contínua</p>
                          <p className="font-semibold text-rose-900">{e.medication || 'Nenhuma'}</p>
                        </div>
                        <div className="bg-amber-50/50 border border-amber-100/60 p-3 rounded-xl">
                          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">⚠️ Deficiências / Cuidados</p>
                          <p className="font-semibold text-amber-900">{e.disability || 'Nenhuma'}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">📝 Observações de Apoio</p>
                          <p className="italic text-slate-800">{e.observations || 'Nenhuma observação registrada'}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {medicalCasesCount === 0 && (
                    <div className="text-center py-12 text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Excelente! Nenhum encontrista necessita de medicação ou cuidados especiais cadastrados.
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedReport === 'circulos' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border border-slate-100 bg-slate-50/50 p-4 rounded-2xl gap-3">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Divisão de Encontristas por Círculos</h2>
                  <span className="text-[10px] font-mono text-slate-500">Separados por grupos de cores</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['Vermelho', 'Azul', 'Amarelo', 'Verde', 'Laranja', 'Roxo', ''].map(color => {
                    const circleMembers = encontristas.filter(e => (e.circleColor || '') === color);
                    if (circleMembers.length === 0 && color !== '') return null;
                    const displayName = color || 'Sem Círculo';

                    return (
                      <div key={color} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs print-break-inside-avoid">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full border border-slate-400/20 ${
                              color === 'Vermelho' ? 'bg-red-500' :
                              color === 'Azul' ? 'bg-blue-500' :
                              color === 'Amarelo' ? 'bg-yellow-400' :
                              color === 'Verde' ? 'bg-green-500' :
                              color === 'Laranja' ? 'bg-orange-500' :
                              color === 'Roxo' ? 'bg-purple-500' : 'bg-slate-300'
                            }`} />
                            <h3 className="text-xs font-extrabold text-slate-800">Círculo {displayName}</h3>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{circleMembers.length} integrantes</span>
                        </div>
                        <div className="p-4 bg-white divide-y divide-slate-100 text-xs">
                          {circleMembers.map(m => (
                            <div key={m.id} className="py-2 flex justify-between items-center gap-2">
                              <div>
                                <span className="font-bold text-slate-800 block">{m.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{m.phone}</span>
                              </div>
                              {m.isMoita && (
                                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md">Equipe Moita</span>
                              )}
                            </div>
                          ))}
                          {circleMembers.length === 0 && (
                            <div className="text-center py-4 text-[10px] text-slate-400 italic">Nenhum integrante designado para esta cor.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedReport === 'logistica' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border border-slate-100 bg-slate-50/50 p-4 rounded-2xl gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Ficha de Presença Geral e Controle de Logística</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">Use para controle manual físico nos dias de encontro.</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">{encontristas.length} Encontristas</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-200 min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-100 text-[9px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300">
                        <th className="p-2 border-r border-slate-200 w-1/4">Nome</th>
                        <th className="p-2 border-r border-slate-200">Círculo</th>
                        <th className="p-2 border-r border-slate-200 text-center">Dia 1 (Sexta)</th>
                        <th className="p-2 border-r border-slate-200 text-center">Dia 2 (Sábado)</th>
                        <th className="p-2 text-center">Dia 3 (Domingo)</th>
                      </tr>
                      <tr className="bg-slate-50 text-[8px] text-slate-500 uppercase font-bold border-b border-slate-200">
                        <th className="p-1 border-r border-slate-200"></th>
                        <th className="p-1 border-r border-slate-200"></th>
                        <th className="p-1 border-r border-slate-200 text-center">Ida [ ] | Volta [ ]</th>
                        <th className="p-1 border-r border-slate-200 text-center">Ida [ ] | Volta [ ]</th>
                        <th className="p-1 text-center">Ida [ ] | Volta [ ]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {encontristas.map((e, index) => (
                        <tr key={e.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="p-2 border-r border-slate-200 font-bold">{e.name}</td>
                          <td className="p-2 border-r border-slate-200 font-medium">{e.circleColor || 'Sem Círculo'}</td>
                          
                          {/* Day 1 Status */}
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[10px]">
                            <div className="flex justify-around items-center gap-2">
                              <span>Ida: <strong className={e.pickup_day1 === 'completed' ? 'text-emerald-600' : 'text-slate-400'}>{formatStatus(e.pickup_day1)}</strong></span>
                              <span className="text-slate-300">|</span>
                              <span>Volta: <strong className={e.dropoff_day1 === 'completed' ? 'text-emerald-600' : 'text-slate-400'}>{formatStatus(e.dropoff_day1)}</strong></span>
                            </div>
                          </td>

                          {/* Day 2 Status */}
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[10px]">
                            <div className="flex justify-around items-center gap-2">
                              <span>Ida: <strong className={e.pickup_day2 === 'completed' ? 'text-emerald-600' : 'text-slate-400'}>{formatStatus(e.pickup_day2)}</strong></span>
                              <span className="text-slate-300">|</span>
                              <span>Volta: <strong className={e.dropoff_day2 === 'completed' ? 'text-emerald-600' : 'text-slate-400'}>{formatStatus(e.dropoff_day2)}</strong></span>
                            </div>
                          </td>

                          {/* Day 3 Status */}
                          <td className="p-2 text-center font-mono text-[10px]">
                            <div className="flex justify-around items-center gap-2">
                              <span>Ida: <strong className={e.pickup_day3 === 'completed' ? 'text-emerald-600' : 'text-slate-400'}>{formatStatus(e.pickup_day3)}</strong></span>
                              <span className="text-slate-300">|</span>
                              <span>Volta: <strong className={e.dropoff_day3 === 'completed' ? 'text-emerald-600' : 'text-slate-400'}>{formatStatus(e.dropoff_day3)}</strong></span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReport === 'motoristas' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border border-slate-100 bg-slate-50/50 p-4 rounded-2xl gap-3">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Atribuição de Rotas e Escalas de Motoristas (Buscadores)</h2>
                  <span className="bg-slate-200 text-slate-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">{usuarios.length} Motoristas Cadastrados</span>
                </div>

                <div className="space-y-6">
                  {usuarios.map(u => {
                    const assignedList = encontristas.filter(e => u.assignedEncontristas?.includes(e.id));
                    
                    return (
                      <div key={u.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs print-break-inside-avoid">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start border-b border-slate-100 pb-3 mb-3 gap-2">
                          <div>
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border inline-block mb-1 ${
                              u.type === 'casal' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-teal-50 text-teal-700 border-teal-100'
                            }`}>
                              {u.type === 'casal' ? '👥 Buscador Casal' : '👤 Buscador Solteiro'}
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-900">{u.name}</h3>
                          </div>
                          <div className="text-xs sm:text-right">
                            <p className="font-semibold text-slate-700">Contato: <span className="font-mono">{u.phone || 'Sem telefone'}</span></p>
                            {u.email && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</p>}
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Encontristas Designados ({assignedList.length})</p>
                          {assignedList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Nenhum encontrista designado para este buscador no momento.</p>
                          ) : (
                            <table className="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-slate-50 text-[9px] font-bold text-slate-600 border-b border-slate-100">
                                  <th className="p-2">Nome Encontrista</th>
                                  <th className="p-2">Telefone</th>
                                  <th className="p-2">Círculo</th>
                                  <th className="p-2">Endereço de Coleta</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {assignedList.map(e => (
                                  <tr key={e.id} className="hover:bg-slate-50/30">
                                    <td className="p-2 font-bold text-slate-800">{e.name}</td>
                                    <td className="p-2 font-mono text-[11px] text-slate-700">{e.phone}</td>
                                    <td className="p-2 font-semibold text-[10px] text-blue-600">{e.circleColor || 'Sem Círculo'}</td>
                                    <td className="p-2 text-[10px] text-slate-500 leading-snug">{e.address} {e.complement && `(${e.complement})`}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document Footer Signature */}
            <div className="border-t border-slate-300 pt-5 mt-8 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <p>DOCUMENTO DE CONTROLE INTERNO DO EJC — NÃO DIVULGAR CREDENCIAIS DE TI</p>
              <p>PÁGINA 1/1</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
