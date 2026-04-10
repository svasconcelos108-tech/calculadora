/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Calculator, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  Printer,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  calculateSeverance, 
  CalculationInput, 
  CalculationResult, 
  VinculoType, 
  EnteType 
} from './lib/calculator';
import { cn, formatCurrency, formatDate } from './lib/utils';

export default function App() {
  const [input, setInput] = useState<CalculationInput>({
    vinculo: 'estatutario',
    ente: 'federal',
    dataAdmissao: '',
    dataDesligamento: '',
    ultimaRemuneracao: 0,
    mediaRemuneracao: 0,
    feriasVencidas: false,
    feriasGozadasPeriodos: 0,
    licencasNaoGozadasDias: 0,
    adicionalInsalubridade: 0,
    adicionalPericulosidade: 0,
    adicionalTempoServico: 0,
    temFGTS: false,
    outrasVerbas: []
  });

  const [showResult, setShowResult] = useState(false);

  const result = useMemo(() => {
    if (!input.dataAdmissao || !input.dataDesligamento || input.ultimaRemuneracao <= 0) return null;
    return calculateSeverance(input);
  }, [input]);

  const handleAddVerba = () => {
    setInput(prev => ({
      ...prev,
      outrasVerbas: [...prev.outrasVerbas, { nome: '', valor: 0, justificativa: '' }]
    }));
  };

  const handleRemoveVerba = (index: number) => {
    setInput(prev => ({
      ...prev,
      outrasVerbas: prev.outrasVerbas.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateVerba = (index: number, field: string, value: string | number) => {
    setInput(prev => ({
      ...prev,
      outrasVerbas: prev.outrasVerbas.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
  };

  return (
    <div className="min-h-screen bg-legal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-legal-800 text-white rounded-2xl mb-4 shadow-lg">
            <Scale size={32} />
          </div>
          <h1 className="text-3xl font-bold text-legal-900 tracking-tight">
            Calculadora de Rescisão de Servidor Público
          </h1>
          <p className="mt-2 text-legal-500 max-w-2xl mx-auto">
            Sistema especializado para advogados. Cálculos baseados na Lei 8.112/90, CLT e jurisprudência dos tribunais superiores.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-7 space-y-6">
            <section className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-legal-100">
                <User className="text-legal-600" size={20} />
                <h2 className="text-lg font-semibold text-legal-800">Dados do Vínculo</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Tipo de Vínculo</label>
                  <select 
                    className="input-field"
                    value={input.vinculo}
                    onChange={(e) => setInput({...input, vinculo: e.target.value as VinculoType, temFGTS: e.target.value === 'celetista'})}
                  >
                    <option value="estatutario">Estatutário</option>
                    <option value="celetista">Celetista (CLT)</option>
                    <option value="temporario">Temporário</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Esfera Governamental</label>
                  <select 
                    className="input-field"
                    value={input.ente}
                    onChange={(e) => setInput({...input, ente: e.target.value as EnteType})}
                  >
                    <option value="federal">Federal</option>
                    <option value="estadual">Estadual</option>
                    <option value="municipal">Municipal</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Data de Admissão</label>
                  <input 
                    type="date" 
                    className="input-field"
                    value={input.dataAdmissao}
                    onChange={(e) => setInput({...input, dataAdmissao: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label-text">Data de Desligamento</label>
                  <input 
                    type="date" 
                    className="input-field"
                    value={input.dataDesligamento}
                    onChange={(e) => setInput({...input, dataDesligamento: e.target.value})}
                  />
                </div>
              </div>
            </section>

            <section className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-legal-100">
                <DollarSign className="text-legal-600" size={20} />
                <h2 className="text-lg font-semibold text-legal-800">Remuneração e Adicionais</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Última Remuneração (Bruta)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="0,00"
                    value={input.ultimaRemuneracao || ''}
                    onChange={(e) => setInput({...input, ultimaRemuneracao: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="label-text">Adicional de Tempo de Serviço</label>
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="0,00"
                    value={input.adicionalTempoServico || ''}
                    onChange={(e) => setInput({...input, adicionalTempoServico: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="label-text">Adicional de Insalubridade</label>
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="0,00"
                    value={input.adicionalInsalubridade || ''}
                    onChange={(e) => setInput({...input, adicionalInsalubridade: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="label-text">Adicional de Periculosidade</label>
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="0,00"
                    value={input.adicionalPericulosidade || ''}
                    onChange={(e) => setInput({...input, adicionalPericulosidade: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </section>

            <section className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-legal-100">
                <Calendar className="text-legal-600" size={20} />
                <h2 className="text-lg font-semibold text-legal-800">Férias e Licenças</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-legal-50 rounded-lg border border-legal-100">
                  <input 
                    type="checkbox" 
                    id="feriasVencidas"
                    className="w-4 h-4 text-legal-800 rounded focus:ring-legal-500"
                    checked={input.feriasVencidas}
                    onChange={(e) => setInput({...input, feriasVencidas: e.target.checked})}
                  />
                  <label htmlFor="feriasVencidas" className="text-sm font-medium text-legal-700">
                    Possui 1 período de férias vencidas não gozadas?
                  </label>
                </div>

                <div>
                  <label className="label-text">Dias de Licença-Prêmio/Capacitação não gozados</label>
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="Ex: 90"
                    value={input.licencasNaoGozadasDias || ''}
                    onChange={(e) => setInput({...input, licencasNaoGozadasDias: parseInt(e.target.value) || 0})}
                  />
                  <p className="mt-1 text-[10px] text-legal-500 italic">
                    * Conversão em pecúnia permitida na rescisão/aposentadoria para evitar enriquecimento ilícito.
                  </p>
                </div>
              </div>
            </section>

            <section className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-legal-100">
                <div className="flex items-center gap-2">
                  <Plus className="text-legal-600" size={20} />
                  <h2 className="text-lg font-semibold text-legal-800">Verbas Personalizadas</h2>
                </div>
                <button 
                  onClick={handleAddVerba}
                  className="text-xs font-bold text-legal-800 hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> ADICIONAR
                </button>
              </div>
              
              <div className="space-y-4">
                {input.outrasVerbas.map((v, idx) => (
                  <div key={idx} className="p-4 bg-legal-50 rounded-lg border border-legal-100 space-y-3 relative">
                    <button 
                      onClick={() => handleRemoveVerba(idx)}
                      className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="label-text">Nome da Verba</label>
                        <input 
                          className="input-field"
                          value={v.nome}
                          onChange={(e) => handleUpdateVerba(idx, 'nome', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label-text">Valor (R$)</label>
                        <input 
                          type="number"
                          className="input-field"
                          value={v.valor || ''}
                          onChange={(e) => handleUpdateVerba(idx, 'valor', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label-text">Justificativa Jurídica</label>
                      <textarea 
                        className="input-field h-20 resize-none"
                        value={v.justificativa}
                        onChange={(e) => handleUpdateVerba(idx, 'justificativa', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                {input.outrasVerbas.length === 0 && (
                  <p className="text-center text-sm text-legal-400 py-4 italic">
                    Nenhuma verba extra adicionada.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              {!result ? (
                <div className="glass-panel p-12 text-center">
                  <Calculator className="mx-auto text-legal-200 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-legal-800">Aguardando Dados</h3>
                  <p className="text-sm text-legal-500 mt-2">
                    Preencha as datas e a remuneração para visualizar o cálculo em tempo real.
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Total Card */}
                  <div className="bg-legal-800 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <FileText size={120} />
                    </div>
                    <p className="text-legal-300 text-sm font-medium uppercase tracking-widest">Total da Rescisão</p>
                    <h2 className="text-4xl font-bold mt-2">{formatCurrency(result.total)}</h2>
                    <div className="mt-6 flex items-center gap-4 text-xs text-legal-300 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-green-400" />
                        Cálculo Verificado
                      </div>
                      <div className="flex items-center gap-1">
                        <Scale size={14} className="text-gold-600" />
                        Base Jurídica Aplicada
                      </div>
                    </div>
                  </div>

                  {/* Verbas List */}
                  <div className="glass-panel overflow-hidden">
                    <div className="p-4 bg-legal-50 border-b border-legal-100 flex justify-between items-center">
                      <h3 className="font-semibold text-legal-800">Detalhamento das Verbas</h3>
                      <button 
                        onClick={() => window.print()}
                        className="text-legal-600 hover:text-legal-900"
                      >
                        <Printer size={18} />
                      </button>
                    </div>
                    <div className="divide-y divide-legal-100 max-h-[500px] overflow-y-auto">
                      {result.verbas.map((v, idx) => (
                        <div key={idx} className="p-4 hover:bg-legal-50 transition-colors group">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-legal-800">{v.nome}</h4>
                            <span className="text-sm font-mono font-bold text-legal-900">{formatCurrency(v.valor)}</span>
                          </div>
                          <p className="text-[11px] text-legal-500 mb-2">{v.descricao}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-legal-100 text-legal-600 rounded text-[10px] font-mono">
                              Fórmula: {v.formula}
                            </span>
                            <span className="px-2 py-0.5 bg-gold-600/10 text-gold-700 rounded text-[10px] font-medium flex items-center gap-1">
                              <Scale size={10} /> {v.fundamentacao}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observations */}
                  <div className="glass-panel p-6 border-l-4 border-gold-600">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="text-gold-700" size={18} />
                      <h3 className="font-semibold text-legal-800">Observações Jurídicas</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.observacoes.map((obs, idx) => (
                        <li key={idx} className="text-xs text-legal-600 flex gap-2">
                          <ChevronRight size={14} className="text-gold-600 shrink-0" />
                          {obs}
                        </li>
                      ))}
                      <li className="text-[10px] text-legal-400 mt-4 italic">
                        * Este demonstrativo é uma ferramenta de auxílio e não substitui o parecer jurídico formal. Verifique legislações locais específicas.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-legal-200 text-center text-legal-400 text-xs">
          <p>© 2026 Sistema de Cálculos Jurídicos - Especializado em Direito Administrativo</p>
          <p className="mt-1">Desenvolvido para profissionais do Direito.</p>
        </footer>
      </div>
    </div>
  );
}
