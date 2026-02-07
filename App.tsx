import React, { useState, useEffect } from 'react';
import { MaintenanceRecord, MaintenanceType, ServiceItem } from './types';
import { 
  MECHANICS, 
  CATEGORIES, 
  SERVICES_BY_CATEGORY, 
  QUICK_SERVICES 
} from './constants';
import Button from './components/Button';
import { saveMaintenanceToSupabase } from './services/supabaseService';

type ActiveView = 'START' | 'DASHBOARD' | 'ADD_SERVICE' | 'OBSERVATIONS' | 'FINALIZE';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('START');
  const [currentMaintenance, setCurrentMaintenance] = useState<MaintenanceRecord | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Auto-scroll to top whenever the view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  // Load initial state from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('meca_flow_active');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentMaintenance(parsed);
        setActiveView('DASHBOARD');
      } catch (e) {
        localStorage.removeItem('meca_flow_active');
      }
    }
  }, []);

  // Optimized LocalStorage Sync (Debounced to prevent typing lag)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentMaintenance && !showSuccessPopup) {
        localStorage.setItem('meca_flow_active', JSON.stringify(currentMaintenance));
      } else if (!currentMaintenance) {
        localStorage.removeItem('meca_flow_active');
      }
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [currentMaintenance, showSuccessPopup]);

  // Handle successful save redirection
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
        setCurrentMaintenance(null);
        localStorage.removeItem('meca_flow_active');
        setActiveView('START');
      }, 2500); // 2.5 segundos é um tempo adequado para leitura
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  const handleStartMaintenance = (data: Partial<MaintenanceRecord>) => {
    const newRecord: MaintenanceRecord = {
      id: `MT-${Date.now()}`,
      date: data.date || new Date().toISOString().split('T')[0],
      startTime: data.startTime || '',
      mechanics: data.mechanics || [],
      plate: data.plate || '',
      km: data.km || 0,
      type: data.type || MaintenanceType.CORRETIVA,
      observations: '',
      services: []
    };
    setCurrentMaintenance(newRecord);
    setActiveView('DASHBOARD');
  };

  const handleAddService = (service: ServiceItem) => {
    setCurrentMaintenance(prev => {
      if (!prev) return null;

      const existingIndex = prev.services.findIndex(
        s => s.name === service.name && s.category === service.category
      );

      if (existingIndex !== -1) {
        const updatedServices = [...prev.services];
        updatedServices[existingIndex] = {
          ...updatedServices[existingIndex],
          quantity: updatedServices[existingIndex].quantity + service.quantity
        };
        return { ...prev, services: updatedServices };
      }

      return { ...prev, services: [...prev.services, service] };
    });
    setActiveView('DASHBOARD');
  };

  const handleRemoveService = (index: number) => {
    setCurrentMaintenance(prev => {
      if (!prev) return null;
      const newServices = [...prev.services];
      newServices.splice(index, 1);
      return { ...prev, services: newServices };
    });
  };

  const handleUpdateServiceQuantity = (index: number, newQty: number) => {
    setCurrentMaintenance(prev => {
      if (!prev) return null;
      const newServices = [...prev.services];
      newServices[index] = { ...newServices[index], quantity: Math.max(1, newQty) };
      return { ...prev, services: newServices };
    });
  };

  const handleGoHome = () => {
    setActiveView('START');
  };

  const finalizeMaintenance = async (recordToSave: MaintenanceRecord) => {
    setIsSending(true);
    try {
      const success = await saveMaintenanceToSupabase(recordToSave);
      if (success) {
        setShowSuccessPopup(true);
      } else {
        alert("ERRO: O sistema não conseguiu salvar. Verifique sua conexão ou contate o suporte.");
      }
    } catch (err) {
      console.error('Falha no salvamento:', err);
      alert("Erro inesperado ao conectar com o servidor.");
    } finally {
      setIsSending(false);
    }
  };

  const PageHeader = ({ title }: { title: string }) => (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm px-6 py-4 mb-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-black text-red-700 italic tracking-tighter">SoPipa</h2>
          <span className="hidden sm:inline-block h-6 w-[2px] bg-slate-100"></span>
          <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">{title}</span>
        </div>
        <button 
          onClick={handleGoHome}
          className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 font-black hover:bg-white hover:text-red-600 transition-all active:scale-95"
        >
          <i className="fas fa-home"></i>
          <span className="hidden sm:inline">PÁGINA INICIAL</span>
        </button>
      </div>
    </div>
  );

  const SuccessPopup = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl">
          <i className="fas fa-check"></i>
        </div>
        <h3 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">O.S. salva com sucesso</h3>
        <p className="text-slate-500 font-bold text-lg uppercase tracking-widest">Retornando ao início...</p>
      </div>
    </div>
  );

  const StartView = () => {
    const [plate, setPlate] = useState('');
    const [km, setKm] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const [selectedMechanics, setSelectedMechanics] = useState<string[]>([]);
    const [type, setType] = useState<MaintenanceType>(MaintenanceType.CORRETIVA);

    const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
      setPlate(val);
    };

    const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '');
      setKm(val);
    };

    const isValid = plate.length >= 7 && km !== '' && Number(km) > 0 && selectedMechanics.length > 0 && startTime !== '' && date !== '';

    return (
      <div className="max-w-5xl mx-auto p-4 animate-in fade-in duration-300">
        <header className="mb-10 text-center pt-8">
            <h1 className="text-6xl font-black text-red-700 mb-2 tracking-tighter italic">SoPipa</h1>
            <p className="text-slate-500 font-bold uppercase text-sm tracking-widest">Abertura de Ordem de Serviço</p>
        </header>
        
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Placa do Veículo</label>
                    <input 
                      type="text" 
                      placeholder="ABC1234" 
                      value={plate} 
                      onChange={handlePlateChange} 
                      className="w-full text-5xl p-6 border-2 border-slate-100 rounded-[2rem] text-center font-black focus:border-red-500 bg-slate-50 transition-all uppercase" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Quilometragem Atual</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="000000" 
                      value={km} 
                      onChange={handleKmChange} 
                      className="w-full text-5xl p-6 border-2 border-slate-100 rounded-[2rem] text-center text-emerald-600 font-black focus:border-red-500 bg-slate-50 transition-all" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Data de Entrada</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      className="w-full text-3xl p-6 border-2 border-slate-100 rounded-[2rem] text-center font-black focus:border-red-500 bg-slate-50 transition-all" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Horário de Início</label>
                    <input 
                      type="time" 
                      value={startTime} 
                      onChange={(e) => setStartTime(e.target.value)} 
                      className="w-full text-3xl p-6 border-2 border-slate-100 rounded-[2rem] text-center font-black focus:border-red-500 bg-slate-50 transition-all" 
                    />
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Tipo de Atendimento</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.values(MaintenanceType).map(t => (
                        <button 
                          key={t} 
                          onClick={() => setType(t)} 
                          className={`p-6 rounded-3xl border-2 font-black text-xl transition-all ${type === t ? 'bg-slate-900 border-slate-900 text-white scale-105 shadow-xl' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                        >
                          {t.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Equipe Responsável</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {MECHANICS.map(m => (
                        <button
                            key={m}
                            onClick={() => setSelectedMechanics(prev => prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m])}
                            className={`p-5 rounded-2xl border-2 transition-all font-bold text-base truncate ${selectedMechanics.includes(m) ? 'bg-red-600 border-red-600 text-white shadow-lg scale-105' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                            title={m}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        <Button fullWidth size="xl" disabled={!isValid} onClick={() => handleStartMaintenance({ plate, km: Number(km), date, mechanics: selectedMechanics, type, startTime })} className="mt-12 rounded-[2.5rem] shadow-2xl py-8">
          GERAR ORDEM DE SERVIÇO
        </Button>
      </div>
    );
  };

  const DashboardView = () => {
    if (!currentMaintenance) return null;
    return (
      <div className="animate-in fade-in duration-300">
        <PageHeader title="Painel de Serviços" />
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex flex-wrap justify-between items-center mb-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
              <div className="flex flex-wrap gap-10">
                  <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 tracking-widest">PLACA</span>
                    <span className="text-4xl font-black text-red-700 tracking-tighter">{currentMaintenance.plate}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 tracking-widest">KM</span>
                    <span className="text-4xl font-black text-emerald-600 tracking-tighter">{currentMaintenance.km.toLocaleString()}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 tracking-widest">DATA</span>
                    <span className="text-xl font-black text-slate-700">{currentMaintenance.date.split('-').reverse().join('/')}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 tracking-widest">INÍCIO</span>
                    <span className="text-xl font-black text-slate-600">{currentMaintenance.startTime}</span>
                  </div>
              </div>
              <div className="flex gap-4">
                  <Button variant="outline" size="md" onClick={() => setActiveView('OBSERVATIONS')} icon="fa-comment-dots">NOTAS</Button>
                  <Button 
                    variant="danger" 
                    size="md" 
                    icon="fa-times" 
                    onClick={() => {
                      if (window.confirm("Deseja mesmo cancelar esta manutenção? Todos os dados serão perdidos.")) {
                        localStorage.removeItem('meca_flow_active');
                        setCurrentMaintenance(null);
                        setActiveView('START');
                      }
                    }} 
                  />
              </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-2xl font-black text-slate-800">Serviços Adicionados ({currentMaintenance.services.length})</h2>
                  {currentMaintenance.services.length === 0 ? (
                      <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-32 text-center text-slate-300">
                        <i className="fas fa-tools text-6xl mb-6"></i>
                        <p className="font-bold text-xl">Nenhum serviço registrado ainda.</p>
                      </div>
                  ) : (
                      currentMaintenance.services.map((svc, idx) => (
                          <div key={svc.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-sm">
                              <div className="flex-1">
                                  <span className="text-[10px] font-black text-red-500 uppercase px-3 py-1 bg-red-50 rounded-lg mb-2 inline-block tracking-wider">{svc.category}</span>
                                  <h3 className="text-2xl font-black text-slate-800">{svc.name}</h3>
                                  <div className="mt-4 flex items-center gap-4">
                                    <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                                      <button onClick={() => handleUpdateServiceQuantity(idx, svc.quantity - 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-black text-xl text-slate-400 hover:text-red-600 transition-all">-</button>
                                      <span className="w-12 text-center text-xl font-black text-emerald-600">{svc.quantity}</span>
                                      <button onClick={() => handleUpdateServiceQuantity(idx, svc.quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-black text-xl text-slate-400 hover:text-red-600 transition-all">+</button>
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">QTD</span>
                                  </div>
                              </div>
                              <button onClick={() => handleRemoveService(idx)} className="text-slate-200 hover:text-red-500 p-4 transition-colors">
                                <i className="fas fa-trash-alt text-2xl"></i>
                              </button>
                          </div>
                      ))
                  )}
              </div>
              
              <div className="space-y-6">
                  <Button fullWidth size="xl" onClick={() => setActiveView('ADD_SERVICE')} icon="fa-plus-circle" className="rounded-3xl shadow-lg">ADICIONAR SERVIÇO</Button>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                      <h4 className="font-black text-slate-400 text-[10px] mb-6 uppercase tracking-widest">Atalhos Rápidos</h4>
                      <div className="grid grid-cols-1 gap-3">
                          {QUICK_SERVICES.map(qs => (
                              <button 
                                key={qs.name} 
                                onClick={() => handleAddService({
                                  id: `SV-${Date.now()}-${Math.random()}`,
                                  category: qs.category,
                                  system: qs.system,
                                  name: qs.name,
                                  quantity: 1
                                })} 
                                className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-left font-bold text-slate-700 hover:bg-red-50 hover:border-red-200 transition-all flex justify-between items-center"
                              >
                                {qs.name}
                                <i className="fas fa-plus text-slate-200 text-xs"></i>
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      fullWidth 
                      size="xl" 
                      variant="success" 
                      disabled={currentMaintenance.services.length === 0} 
                      onClick={() => setActiveView('FINALIZE')} 
                      icon="fa-check-double"
                      className="rounded-[2.5rem] shadow-2xl py-8"
                    >
                      CONCLUIR OS
                    </Button>
                    <button onClick={handleGoHome} className="w-full py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] text-slate-400 font-black text-xl hover:bg-slate-50 hover:text-red-600 transition-all">
                      <i className="fas fa-home mr-3"></i> VOLTAR AO INÍCIO
                    </button>
                  </div>
              </div>
          </div>
        </div>
      </div>
    );
  };

  const AddServiceView = () => {
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState('');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const handleSave = () => {
        selectedServices.forEach(s => {
            handleAddService({
                id: `SV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                category,
                system: 'Geral',
                name: s,
                quantity: quantities[s] || 1
            });
        });
    };

    const toggleService = (s: string) => {
        setSelectedServices(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
        if (!quantities[s]) setQuantities(q => ({ ...q, [s]: 1 }));
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            <PageHeader title="Adicionar Serviço" />
            <div className="max-w-5xl mx-auto p-4 pb-40">
                <header className="flex justify-between items-center mb-10">
                    <button onClick={() => step === 1 ? setActiveView('DASHBOARD') : setStep(1)} className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                        <i className="fas fa-chevron-left text-2xl"></i>
                    </button>
                    <div className="text-center">
                        <span className="text-xs font-black text-red-600 uppercase tracking-widest">Etapa {step} de 2</span>
                        <h2 className="text-4xl font-black text-slate-800">{step === 1 ? "CATEGORIAS" : category.toUpperCase()}</h2>
                    </div>
                    <div className="w-16"></div>
                </header>

                {step === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {CATEGORIES.map(c => (
                            <button key={c} onClick={() => { setCategory(c); setStep(2); }} className="p-12 bg-white rounded-[2.5rem] shadow-sm border-4 border-transparent font-black text-2xl hover:border-red-500 hover:text-red-600 transition-all text-slate-600 text-center">
                                {c}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 max-h-[55vh] overflow-y-auto pr-4 scroll-smooth">
                            {(SERVICES_BY_CATEGORY[category] || []).map(s => {
                                const isSelected = selectedServices.includes(s);
                                return (
                                    <div key={s} className={`p-8 rounded-[2.5rem] border-2 transition-all ${isSelected ? 'bg-red-50 border-red-400' : 'bg-white border-slate-100'}`}>
                                        <button onClick={() => toggleService(s)} className={`w-full text-left font-black text-2xl flex items-center justify-between ${isSelected ? 'text-red-700' : 'text-slate-600'}`}>
                                            <div className="flex items-center">
                                                <i className={`fas ${isSelected ? 'fa-check-circle' : 'fa-circle text-slate-100'} mr-6 text-4xl`}></i>
                                                {s}
                                            </div>
                                        </button>
                                        {isSelected && (
                                            <div className="mt-8 flex items-center justify-between bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Quantidade</span>
                                                <div className="flex items-center gap-8">
                                                    <button onClick={() => setQuantities(q => ({...q, [s]: Math.max(1, (q[s]||1)-1)}))} className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center font-black text-3xl">-</button>
                                                    <span className="text-3xl font-black w-14 text-center">{quantities[s] || 1}</span>
                                                    <button onClick={() => setQuantities(q => ({...q, [s]: (q[s]||1)+1}))} className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-black text-3xl">+</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-10 flex justify-center">
                            <Button fullWidth size="xl" disabled={selectedServices.length === 0} onClick={handleSave} className="rounded-3xl shadow-2xl max-w-4xl py-8">ADICIONAR SELECIONADOS</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const FinalizeView = () => {
    if (!currentMaintenance) return null;
    
    // Using local state to prevent lag when typing
    const [localEndTime, setLocalEndTime] = useState(currentMaintenance.endTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const [localObs, setLocalObs] = useState(currentMaintenance.observations || '');

    const syncAndSave = async () => {
      const updatedRecord = { 
        ...currentMaintenance, 
        observations: localObs, 
        endTime: localEndTime 
      };
      setCurrentMaintenance(updatedRecord);
      await finalizeMaintenance(updatedRecord);
    };

    return (
        <div className="animate-in zoom-in-95 duration-300 pb-20">
            <PageHeader title="Resumo Final" />
            <div className="max-w-3xl mx-auto p-4">
              <h2 className="text-5xl font-black text-center mb-10 text-slate-800 tracking-tighter uppercase">Revisão da OS</h2>
              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden mb-10 border border-slate-100">
                  <div className="bg-slate-900 p-12 text-white text-center">
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">VEÍCULO</span>
                      <div className="text-7xl font-mono font-black mb-4 tracking-[0.2em]">{currentMaintenance.plate}</div>
                      <div className="inline-flex gap-4">
                        <div className="px-6 py-2 bg-emerald-500/20 text-emerald-400 rounded-full font-black text-2xl">{currentMaintenance.km.toLocaleString()} KM</div>
                        <div className="px-6 py-2 bg-red-500/20 text-red-400 rounded-full font-black text-xl uppercase">{currentMaintenance.type}</div>
                      </div>
                  </div>
                  <div className="p-12 space-y-10">
                      <div className="grid grid-cols-2 gap-8 text-center bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <div>
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horário Início</span>
                          <div className="text-3xl font-black text-slate-700">{currentMaintenance.startTime}</div>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horário Término</span>
                          <input 
                            type="time" 
                            value={localEndTime} 
                            onChange={(e) => setLocalEndTime(e.target.value)} 
                            className="w-full text-3xl p-3 border-2 border-white rounded-2xl text-center font-black focus:border-red-500 bg-white shadow-inner transition-all" 
                          />
                        </div>
                      </div>

                      <div>
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mecânicos</span>
                          <div className="flex flex-wrap gap-3">
                            {currentMaintenance.mechanics.map(m => (
                              <span key={m} className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 text-lg">{m}</span>
                            ))}
                          </div>
                      </div>
                      
                      <div className="border-t border-slate-50 pt-10">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Serviços Executados</span>
                          <div className="space-y-4">
                              {currentMaintenance.services.map(s => (
                                  <div key={s.id} className="flex justify-between items-center py-5 border-b border-slate-50 last:border-0">
                                      <span className="font-black text-slate-800 text-2xl">{s.name}</span>
                                      <span className="font-black bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl text-lg">QTD: {s.quantity}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="border-t border-slate-50 pt-10">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Observações e Notas Finais</span>
                          <textarea 
                            className="w-full h-48 p-8 rounded-[2rem] bg-slate-50 border-2 border-slate-100 text-xl font-medium focus:ring-4 focus:ring-red-50 transition-all shadow-inner" 
                            placeholder="Descreva observações técnicas..." 
                            value={localObs} 
                            onChange={(e) => setLocalObs(e.target.value)}
                          />
                      </div>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                  <Button variant="outline" className="flex-1 rounded-[2rem] py-6" onClick={() => {
                      setCurrentMaintenance(prev => prev ? { ...prev, observations: localObs, endTime: localEndTime } : null);
                      setActiveView('DASHBOARD');
                  }}>VOLTAR</Button>
                  <Button variant="success" className="flex-[2] rounded-[2rem] shadow-2xl py-6" onClick={syncAndSave} disabled={isSending} icon={isSending ? "fa-circle-notch fa-spin" : "fa-cloud-upload-alt"}>
                      {isSending ? "ENVIANDO..." : "CONCLUIR E SALVAR"}
                  </Button>
              </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-red-100 relative">
        {activeView === 'START' && <StartView />}
        {activeView === 'DASHBOARD' && <DashboardView />}
        {activeView === 'ADD_SERVICE' && <AddServiceView />}
        {activeView === 'OBSERVATIONS' && (
            <div className="animate-in fade-in duration-300">
                <PageHeader title="Notas Técnicas" />
                <div className="max-w-3xl mx-auto p-4">
                    <header className="flex justify-between items-center mb-10">
                        <h2 className="text-4xl font-black tracking-tighter">NOTAS TÉCNICAS</h2>
                        <Button variant="outline" size="md" onClick={() => setActiveView('DASHBOARD')}>Fechar</Button>
                    </header>
                    <textarea 
                      className="w-full h-96 p-10 rounded-[3rem] bg-white border-2 border-slate-100 shadow-xl text-3xl font-medium focus:ring-8 focus:ring-red-50 transition-all" 
                      placeholder="Descreva problemas ou recomendações..." 
                      defaultValue={currentMaintenance?.observations || ''} 
                      onBlur={(e) => setCurrentMaintenance(p => p ? {...p, observations: e.target.value} : null)} 
                    />
                    <Button fullWidth size="xl" onClick={() => setActiveView('DASHBOARD')} className="mt-8 rounded-[2rem] shadow-2xl py-8">SALVAR NOTA</Button>
                </div>
            </div>
        )}
        {activeView === 'FINALIZE' && <FinalizeView />}
        
        {showSuccessPopup && <SuccessPopup />}
    </div>
  );
};

export default App;
