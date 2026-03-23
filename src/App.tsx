/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Shield, 
  Car, 
  User, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Building2, 
  Download, 
  Copy, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  Info,
  Clock,
  MapPin,
  Wrench,
  AlertTriangle,
  Check,
  Settings,
  Plus,
  Trash2,
  LayoutDashboard,
  FileText,
  HelpCircle,
  ShieldCheck,
  X
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Plan {
  id: string;
  name: string;
  details: string;
}

interface Company {
  id: string;
  name: string;
  plans: Plan[];
}

interface QuoteData {
  clientName: string;
  birthDate: string;
  vehicleModel: string;
  usageType: string;
  fipeValue: string;
  planId: string;
  premiumValue: string;
  paymentMethod: string;
  companyId: string;
}

const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'suhai',
    name: 'Suhai Seguradora',
    plans: [
      { id: 'suhai-1', name: 'Furto e Roubo + Assistência 24h', details: 'Cobertura exclusiva para Furto e Roubo com assistência completa 24h.' },
      { id: 'suhai-2', name: 'Furto e Roubo + PT Colisão', details: 'Furto, Roubo e Perda Total por Colisão ou Acidentes da Natureza.' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'gerador' | 'configuracoes'>('gerador');
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('insurance_companies');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANIES;
  });

  const [data, setData] = useState<QuoteData>({
    clientName: '',
    birthDate: '',
    vehicleModel: '',
    usageType: 'Particular',
    fipeValue: '',
    planId: '',
    premiumValue: '',
    paymentMethod: '',
    companyId: '',
  });

  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({ name: '', planName: '', planDetails: '' });

  useEffect(() => {
    localStorage.setItem('insurance_companies', JSON.stringify(companies));
  }, [companies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const selectedCompany = companies.find(c => c.id === data.companyId);
  const selectedPlan = selectedCompany?.plans.find(p => p.id === data.planId);

  const addCompany = () => {
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = () => {
    if (newCompanyData.name && newCompanyData.planName && newCompanyData.planDetails) {
      const companyId = Date.now().toString();
      const planId = (Date.now() + 1).toString();
      setCompanies(prev => [...prev, {
        id: companyId,
        name: newCompanyData.name,
        plans: [{ id: planId, name: newCompanyData.planName, details: newCompanyData.planDetails }]
      }]);
      setIsCompanyModalOpen(false);
      setNewCompanyData({ name: '', planName: '', planDetails: '' });
    } else {
      alert('Por favor, preencha todos os campos.');
    }
  };

  const removeCompany = (id: string) => {
    if (confirm('Deseja remover esta seguradora e todos os seus planos?')) {
      setCompanies(prev => prev.filter(c => c.id !== id));
    }
  };

  const addPlan = (companyId: string) => {
    const name = prompt('Nome do Plano:');
    const details = prompt('Detalhes do Plano:');
    if (name && details) {
      setCompanies(prev => prev.map(c => {
        if (c.id === companyId) {
          return { ...c, plans: [...c.plans, { id: Date.now().toString(), name, details }] };
        }
        return c;
      }));
    }
  };

  const removePlan = (companyId: string, planId: string) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        return { ...c, plans: c.plans.filter(p => p.id !== planId) };
      }
      return c;
    }));
  };

  const generateProfessionalText = async () => {
    if (!selectedCompany || !selectedPlan) return;
    setIsGenerating(true);
    try {
      const prompt = `
        Aja como um corretor de seguros de elite. Crie uma mensagem de WhatsApp profissional e persuasiva para o cliente ${data.clientName}.
        Dados da cotação:
        - Veículo: ${data.vehicleModel}
        - Valor FIPE: R$ ${data.fipeValue}
        - Seguradora: ${selectedCompany.name}
        - Plano: ${selectedPlan.name}
        - Detalhes: ${selectedPlan.details}
        - Valor do Seguro: R$ ${data.premiumValue}
        - Forma de Pagamento: ${data.paymentMethod}

        Instruções Críticas:
        1. A mensagem deve ser clara, usar emojis de forma profissional, destacar os benefícios e passar segurança. 
        2. Foque em como o cliente estará protegido. 
        3. Explique brevemente que Furto é quando levam o carro sem violência e Roubo é quando há abordagem.
        4. NÃO mencione "Perda Total" ou "PT" se o plano for apenas de Roubo e Furto (sem colisão). Isso gera dúvidas.
        5. Se o plano incluir Colisão ou Perda Total explicitamente, explique que ele recebe 100% da FIPE se o conserto superar 75% do valor do carro.
        6. NÃO destaque o valor total do investimento (R$ ${data.premiumValue}). Foque na forma de pagamento e parcelas (${data.paymentMethod}) para não assustar o cliente.
        7. Termine com uma chamada para ação amigável.
        8. Responda apenas com o texto da mensagem.
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setGeneratedText(response.text || '');
      setShowPreview(true);
    } catch (error) {
      console.error("Erro ao gerar texto:", error);
      setGeneratedText(`Olá ${data.clientName}! 👋\n\nPreparei a melhor proposta para o seu ${data.vehicleModel}. 🚗\n\n🛡️ *Plano:* ${selectedPlan.name}\n🏢 *Seguradora:* ${selectedCompany.name}\n📝 *Coberturas:* ${selectedPlan.details}\n💰 *FIPE:* R$ ${data.fipeValue}\n\n💳 *Investimento:* R$ ${data.premiumValue}\n🏦 *Pagamento:* ${data.paymentMethod}\n\nSua tranquilidade é nossa prioridade!`);
      setShowPreview(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = useCallback(() => {
    if (previewRef.current === null) return;
    toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `cotacao-${data.clientName.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error('Erro ao baixar imagem:', err));
  }, [previewRef, data.clientName]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    alert('Texto copiado!');
  };

  const isRouboFurtoOnly = selectedPlan && (selectedPlan.name.toLowerCase().includes('roubo') || selectedPlan.name.toLowerCase().includes('furto')) && !selectedPlan.name.toLowerCase().includes('colisão');
  const hasPT = !isRouboFurtoOnly && (selectedPlan?.name.toLowerCase().includes('pt') || selectedPlan?.details.toLowerCase().includes('perda total') || selectedPlan?.details.toLowerCase().includes('colisão'));

  const PreviewContent = () => (
    <div 
      id="quote-preview"
      className="w-full bg-slate-950 relative flex flex-col text-white"
      style={{ width: '400px', minHeight: '550px' }}
    >
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-900/20 rounded-full -ml-24 -mb-24 blur-3xl" />
      
      {/* Header */}
      <div className="p-8 pb-4 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full inline-block mb-3 shadow-lg shadow-blue-900/20">
              Proposta Consultiva
            </div>
            <h4 className="text-3xl font-black text-white leading-tight">
              Proteção <br />
              <span className="text-blue-500 italic">Automotiva</span>
            </h4>
          </div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 pb-8 flex-grow space-y-5 relative z-10">
        {/* Vehicle Info */}
        <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
            <Car className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Veículo Segurado</p>
            <p className="text-lg font-bold text-slate-100">{data.vehicleModel || 'Modelo do Veículo'}</p>
          </div>
        </div>

        {/* Plan Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Plano Selecionado</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          
          <div className="bg-blue-950/20 p-4 rounded-2xl border border-blue-900/30">
            <h5 className="text-lg font-black text-blue-400 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              {selectedPlan?.name || 'Escolha um Plano'}
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedPlan?.details || 'Selecione uma seguradora e plano nas configurações.'}
            </p>
          </div>
        </div>

        {/* Explanations Section - Professional & Illustrative */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex gap-3 items-start">
            <div className="p-2 bg-slate-800 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-100 uppercase mb-0.5">Furto vs Roubo</p>
              <p className="text-[9px] text-slate-400 leading-tight">
                <span className="text-blue-400 font-bold">Furto:</span> Levam o bem sem você perceber. <br />
                <span className="text-blue-400 font-bold">Roubo:</span> Há abordagem, ameaça ou violência.
              </p>
            </div>
          </div>

          {hasPT && (
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex gap-3 items-start">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Wrench className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-100 uppercase mb-0.5">Perda Total (PT)</p>
                <p className="text-[9px] text-slate-400 leading-tight">
                  Indenização de <span className="text-emerald-400 font-bold">100% da FIPE</span> se o dano atingir 75% do valor do veículo em colisões ou desastres naturais.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Footer */}
      <div className="p-8 bg-slate-900 border-t border-slate-800 relative z-10 mt-auto">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Investimento</p>
            <p className="text-3xl font-black text-white">{data.paymentMethod || 'Consulte parcelas'}</p>
            <p className="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-wider">Plano de Proteção</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Seguradora</p>
            <p className="text-sm font-black text-slate-200">{selectedCompany?.name || '---'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase">Seguro<span className="text-blue-500">Auto</span>Pro</span>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('gerador')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'gerador' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              GERADOR
            </button>
            <button 
              onClick={() => setActiveTab('configuracoes')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'configuracoes' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              CONFIGURAÇÕES
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'gerador' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold text-sm uppercase tracking-widest">Dados da Cotação</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nome do Cliente</label>
                    <input 
                      type="text" name="clientName" value={data.clientName} onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Veículo</label>
                    <input 
                      type="text" name="vehicleModel" value={data.vehicleModel} onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                      placeholder="Marca e Modelo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Valor FIPE (R$)</label>
                    <input 
                      type="text" name="fipeValue" value={data.fipeValue} onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                      placeholder="00.000,00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Uso</label>
                    <select 
                      name="usageType" value={data.usageType} onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="Particular">Particular</option>
                      <option value="App">App (Uber/99)</option>
                      <option value="Comercial">Comercial</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold text-sm uppercase tracking-widest">Seleção de Plano</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Seguradora</label>
                      <select 
                        name="companyId" value={data.companyId} onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Selecione...</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Plano</label>
                      <select 
                        name="planId" value={data.planId} onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                        disabled={!data.companyId}
                      >
                        <option value="">Selecione...</option>
                        {selectedCompany?.plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Valor do Seguro (R$)</label>
                      <input 
                        type="text" name="premiumValue" value={data.premiumValue} onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                        placeholder="0.000,00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pagamento</label>
                      <input 
                        type="text" name="paymentMethod" value={data.paymentMethod} onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: 10x Cartão"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={generateProfessionalText}
                disabled={isGenerating || !data.clientName || !data.planId}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
              >
                {isGenerating ? "Processando..." : <><Sparkles className="w-4 h-4" /> Gerar Apresentação</>}
              </button>
            </div>

            {/* Preview */}
            <div className="lg:col-span-5 space-y-6">
              {showPreview ? (
                <div className="space-y-6 sticky top-24">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preview Final</h3>
                    <div className="flex gap-3">
                      <button onClick={() => setIsModalOpen(true)} className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all text-slate-400"><LayoutDashboard className="w-4 h-4" /></button>
                      <button onClick={downloadImage} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"><Download className="w-3.5 h-3.5" /> BAIXAR</button>
                    </div>
                  </div>

                  <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-800 scale-[0.9] origin-top">
                    <div ref={previewRef}>
                      <PreviewContent />
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Texto WhatsApp</span>
                      <button onClick={copyToClipboard} className="text-blue-500 hover:text-blue-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Copy className="w-3 h-3" /> COPIAR</button>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {generatedText}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800 text-slate-600">
                  <HelpCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Aguardando Dados</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Configurações</h2>
                <p className="text-sm text-slate-500">Cadastre suas seguradoras e planos personalizados.</p>
              </div>
              <button 
                onClick={addCompany}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-4 h-4" /> NOVA SEGURADORA
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {companies.map(company => (
                <div key={company.id} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <h3 className="font-bold text-lg">{company.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => addPlan(company.id)}
                        className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all text-blue-400"
                        title="Adicionar Plano"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeCompany(company.id)}
                        className="p-2 bg-slate-800 rounded-lg hover:bg-red-900/30 transition-all text-red-500"
                        title="Remover Seguradora"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {company.plans.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">Nenhum plano cadastrado para esta seguradora.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {company.plans.map(plan => (
                          <div key={plan.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-start group">
                            <div>
                              <h4 className="font-bold text-sm text-slate-200">{plan.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{plan.details}</p>
                            </div>
                            <button 
                              onClick={() => removePlan(company.id, plan.id)}
                              className="p-1.5 text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Nova Seguradora */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-lg">Nova Seguradora</h3>
              </div>
              <button onClick={() => setIsCompanyModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nome da Seguradora</label>
                <input 
                  type="text" 
                  value={newCompanyData.name} 
                  onChange={(e) => setNewCompanyData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Porto Seguro"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nome do Primeiro Plano</label>
                <input 
                  type="text" 
                  value={newCompanyData.planName} 
                  onChange={(e) => setNewCompanyData(prev => ({ ...prev, planName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Completo + Assistência"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Detalhes da Cobertura</label>
                <textarea 
                  value={newCompanyData.planDetails} 
                  onChange={(e) => setNewCompanyData(prev => ({ ...prev, planDetails: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all min-h-[100px] resize-none"
                  placeholder="Descreva o que está incluso no plano..."
                />
              </div>
            </div>
            <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex gap-3">
              <button 
                onClick={() => setIsCompanyModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveCompany}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualização */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center bg-slate-950/98 backdrop-blur-xl p-4 overflow-y-auto pt-20 pb-10 custom-scrollbar">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="fixed top-6 right-6 z-[110] bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-2xl shadow-blue-900/40 transition-all border border-blue-500/50 group"
            title="Fechar Visualização"
          >
            <Check className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          <div className="relative w-full max-w-[400px] mx-auto animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Apresentação Final</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Confira todos os detalhes abaixo</p>
            </div>

            <div className="rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-slate-800 bg-slate-950 overflow-hidden">
              <PreviewContent />
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button 
                onClick={downloadImage}
                className="flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl"
              >
                <Download className="w-4 h-4" /> BAIXAR IMAGEM AGORA
              </button>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Pronta para envio via WhatsApp</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
