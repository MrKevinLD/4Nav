import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LockKey,
  LockKeyOpen,
  Eye,
  EyeSlash,
  Copy,
  Check,
  Plus,
  Trash,
  PencilSimple,
  ShieldCheck,
  ShieldWarning,
  Key,
  X,
  MagnifyingGlass,
  Clock,
  ArrowRight,
} from '@phosphor-icons/react';
import {
  VaultCredential,
  getVaultSecurityConfig,
  verifyMasterPin,
  setMasterPin,
  removeMasterPin,
  loadVaultCredentials,
  saveVaultCredentials,
} from '../utils/vaultCrypto';

interface CredentialsVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFillCredentialToPane?: (slotNumber: number, username: string) => void;
}

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de inatividade

export const CredentialsVaultModal: React.FC<CredentialsVaultModalProps> = ({
  isOpen,
  onClose,
  onFillCredentialToPane,
}) => {
  const [securityConfig, setSecurityConfig] = useState(getVaultSecurityConfig());
  const [isUnlocked, setIsUnlocked] = useState(!securityConfig.hasPin);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<VaultCredential[]>(loadVaultCredentials());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<number | null>(null);

  // Password visibility set
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Sub-views
  const [isEditingCredential, setIsEditingCredential] = useState(false);
  const [currentEditCred, setCurrentEditCred] = useState<Partial<VaultCredential> | null>(null);

  // PIN Management Sub-view
  const [isManagingPin, setIsManagingPin] = useState(false);
  const [currentPinAttempt, setCurrentPinAttempt] = useState('');
  const [newPinValue, setNewPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinMgmtError, setPinMgmtError] = useState<string | null>(null);
  const [pinMgmtSuccess, setPinMgmtSuccess] = useState<string | null>(null);

  // Inactivity Auto-Lock Timer (5 min)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const lastActivityRef = useRef<number>(Date.now());

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSecondsRemaining(300);
  }, []);

  // Sync config when modal opens
  useEffect(() => {
    if (isOpen) {
      const cfg = getVaultSecurityConfig();
      setSecurityConfig(cfg);
      if (!cfg.hasPin) {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
      setPinInput('');
      setPinError(null);
      setCredentials(loadVaultCredentials());
      resetInactivityTimer();
    }
  }, [isOpen, resetInactivityTimer]);

  // Inactivity Timer Loop
  useEffect(() => {
    if (!isOpen || !isUnlocked || !securityConfig.hasPin) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const left = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
      setSecondsRemaining(left);

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        setIsUnlocked(false);
        setPinInput('');
        setPinError('🔒 Cofre bloqueado automaticamente por 5 minutos de inatividade.');
      }
    }, 1000);

    const onUserActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener('mousemove', onUserActivity);
    window.addEventListener('mousedown', onUserActivity);
    window.addEventListener('keydown', onUserActivity);
    window.addEventListener('touchstart', onUserActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', onUserActivity);
      window.removeEventListener('mousedown', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('touchstart', onUserActivity);
    };
  }, [isOpen, isUnlocked, securityConfig.hasPin, resetInactivityTimer]);

  if (!isOpen) return null;

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);
    if (!pinInput || pinInput.length < 4) {
      setPinError('O PIN deve conter pelo menos 4 dígitos.');
      return;
    }

    const isValid = await verifyMasterPin(pinInput);
    if (isValid) {
      setIsUnlocked(true);
      setPinInput('');
      resetInactivityTimer();
    } else {
      setPinError('PIN Mestre incorreto. Tente novamente.');
    }
  };

  const handleLockNow = () => {
    setIsUnlocked(false);
    setPinInput('');
    setPinError(null);
  };

  const togglePasswordVisibility = (id: string) => {
    resetInactivityTimer();
    setVisiblePasswordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, identifier: string) => {
    resetInactivityTimer();
    navigator.clipboard.writeText(text);
    setCopiedId(identifier);
    setTimeout(() => {
      setCopiedId((prev) => (prev === identifier ? null : prev));
    }, 2000);
  };

  const handleSaveCredential = (e: React.FormEvent) => {
    e.preventDefault();
    resetInactivityTimer();
    if (!currentEditCred?.title || !currentEditCred?.username || !currentEditCred?.password) {
      return;
    }

    let updated: VaultCredential[];
    if (currentEditCred.id) {
      // Edit
      updated = credentials.map((c) =>
        c.id === currentEditCred.id
          ? ({
              ...c,
              ...currentEditCred,
              updatedAt: Date.now(),
            } as VaultCredential)
          : c
      );
    } else {
      // Create
      const newCred: VaultCredential = {
        id: 'cred_' + Math.random().toString(36).substring(2, 9),
        title: currentEditCred.title.trim(),
        username: currentEditCred.username.trim(),
        password: currentEditCred.password,
        slot: currentEditCred.slot || undefined,
        url: currentEditCred.url?.trim() || undefined,
        notes: currentEditCred.notes?.trim() || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updated = [newCred, ...credentials];
    }

    setCredentials(updated);
    saveVaultCredentials(updated);
    setIsEditingCredential(false);
    setCurrentEditCred(null);
  };

  const handleDeleteCredential = (id: string) => {
    resetInactivityTimer();
    if (confirm('Tem certeza que deseja excluir esta credencial do cofre?')) {
      const updated = credentials.filter((c) => c.id !== id);
      setCredentials(updated);
      saveVaultCredentials(updated);
    }
  };

  const handlePinMgmtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMgmtError(null);
    setPinMgmtSuccess(null);

    // If currently has PIN, verify old PIN first
    if (securityConfig.hasPin) {
      const isOldCorrect = await verifyMasterPin(currentPinAttempt);
      if (!isOldCorrect) {
        setPinMgmtError('O PIN Mestre atual está incorreto.');
        return;
      }
    }

    if (newPinValue) {
      if (newPinValue.length < 4 || newPinValue.length > 12) {
        setPinMgmtError('O novo PIN deve ter entre 4 e 12 caracteres.');
        return;
      }
      if (newPinValue !== confirmPinValue) {
        setPinMgmtError('A confirmação do novo PIN não confere.');
        return;
      }

      await setMasterPin(newPinValue);
      const updatedCfg = getVaultSecurityConfig();
      setSecurityConfig(updatedCfg);
      setPinMgmtSuccess('✅ PIN Mestre configurado com sucesso (PBKDF2 SHA-256)!');
      setCurrentPinAttempt('');
      setNewPinValue('');
      setConfirmPinValue('');
      setTimeout(() => {
        setIsManagingPin(false);
        setPinMgmtSuccess(null);
      }, 1500);
    } else {
      // Removing PIN
      removeMasterPin();
      const updatedCfg = getVaultSecurityConfig();
      setSecurityConfig(updatedCfg);
      setPinMgmtSuccess('🔓 Proteção por PIN removida com sucesso.');
      setCurrentPinAttempt('');
      setTimeout(() => {
        setIsManagingPin(false);
        setPinMgmtSuccess(null);
      }, 1500);
    }
  };

  const filteredCredentials = credentials.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSlot = selectedSlotFilter === null || c.slot === selectedSlotFilter;
    return matchesSearch && matchesSlot;
  });

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl bg-[#0F1218] border border-[#232832] rounded-[4px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141822] border-b border-[#232832]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[#3B82F6]/15 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6]">
              {isUnlocked ? <LockKeyOpen size={18} weight="bold" /> : <LockKey size={18} weight="bold" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#F3F4F6] tracking-wide">
                  Cofre de Senhas & Contas
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PBKDF2 SHA-256
                </span>
              </div>
              <p className="text-[11px] text-[#9CA3AF]">
                Criptografia com 100.000 iterações e auto-lock inteligente para jogos idle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && securityConfig.hasPin && (
              <div
                className="hidden sm:flex items-center gap-1 px-2 py-1 bg-[#1A1F2C] border border-[#232832] rounded-[3px] text-[10px] font-mono text-[#EAB308]"
                title="Cofre será bloqueado automaticamente se inativo por 5 minutos"
              >
                <Clock size={12} />
                <span>Auto-lock: {formatCountdown(secondsRemaining)}</span>
              </div>
            )}

            {isUnlocked && (
              <button
                type="button"
                onClick={() => {
                  setIsManagingPin(true);
                  setPinMgmtError(null);
                  setPinMgmtSuccess(null);
                }}
                className="px-2.5 py-1 text-[11px] font-medium text-[#F3F4F6] bg-[#1A202C] hover:bg-[#252E3E] border border-[#2D3748] rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Key size={13} className="text-[#3B82F6]" weight="bold" />
                <span>PIN Mestre</span>
              </button>
            )}

            {isUnlocked && securityConfig.hasPin && (
              <button
                type="button"
                onClick={handleLockNow}
                className="px-2 py-1 text-[11px] font-medium text-[#EF4444] bg-[#2A1518] hover:bg-[#3D1A1F] border border-[#521C24] rounded-[3px] transition-colors cursor-pointer"
                title="Bloquear cofre agora"
              >
                Bloquear
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-[3px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] transition-colors cursor-pointer"
            >
              <X size={15} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto">
          {!isUnlocked ? (
            /* LOCKED STATE: PIN Verification Screen */
            <div className="py-8 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#181F2E] border border-[#2B3A55] flex items-center justify-center text-[#3B82F6] mb-4 shadow-inner">
                <LockKey size={32} weight="duotone" />
              </div>
              <h3 className="text-base font-bold text-[#F3F4F6] mb-1">
                Cofre Protegido por PIN Mestre
              </h3>
              <p className="text-xs text-[#9CA3AF] mb-5 leading-relaxed">
                Digite o seu PIN Mestre (4 a 12 dígitos) para acessar suas credenciais e senhas salvas.
              </p>

              <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3">
                <div className="relative">
                  <input
                    type="password"
                    maxLength={12}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                    className="w-full h-11 px-4 text-center tracking-[0.4em] font-mono text-lg bg-[#090C11] border border-[#2B3546] rounded-[4px] text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                  />
                </div>

                {pinError && (
                  <div className="p-2 bg-[#2D1215] border border-[#5E1A22] rounded-[3px] text-xs text-[#F87171] text-left">
                    {pinError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-10 mt-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs uppercase tracking-wider rounded-[3px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <LockKeyOpen size={14} weight="bold" />
                  <span>Desbloquear Cofre</span>
                </button>
              </form>
            </div>
          ) : isManagingPin ? (
            /* PIN MANAGEMENT SUB-VIEW */
            <div className="max-w-md mx-auto py-2">
              <div className="flex items-center justify-between mb-4 border-b border-[#232832] pb-2">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-[#3B82F6]" weight="bold" />
                  <h3 className="text-sm font-bold text-[#F3F4F6]">
                    Gerenciar PIN Mestre do Cofre
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManagingPin(false)}
                  className="text-xs text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              <form onSubmit={handlePinMgmtSubmit} className="flex flex-col gap-3">
                {securityConfig.hasPin && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                      PIN Mestre Atual:
                    </label>
                    <input
                      type="password"
                      maxLength={12}
                      value={currentPinAttempt}
                      onChange={(e) => setCurrentPinAttempt(e.target.value)}
                      placeholder="Digite o PIN atual..."
                      required
                      className="w-full h-9 px-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                    Novo PIN Mestre (4 a 12 caracteres):
                  </label>
                  <input
                    type="password"
                    maxLength={12}
                    value={newPinValue}
                    onChange={(e) => setNewPinValue(e.target.value)}
                    placeholder={
                      securityConfig.hasPin
                        ? 'Deixe em branco para remover a senha mestre'
                        : 'Digite o novo PIN...'
                    }
                    className="w-full h-9 px-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Protegido com chave PBKDF2 de 256 bits derivada com salt randômico e 100.000 iterações.
                  </p>
                </div>

                {newPinValue && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                      Confirmar Novo PIN:
                    </label>
                    <input
                      type="password"
                      maxLength={12}
                      value={confirmPinValue}
                      onChange={(e) => setConfirmPinValue(e.target.value)}
                      placeholder="Repita o novo PIN..."
                      required
                      className="w-full h-9 px-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                    />
                  </div>
                )}

                {pinMgmtError && (
                  <div className="p-2 bg-[#2D1215] border border-[#5E1A22] rounded-[3px] text-xs text-[#F87171]">
                    {pinMgmtError}
                  </div>
                )}

                {pinMgmtSuccess && (
                  <div className="p-2 bg-[#0E281E] border border-[#1A5C3D] rounded-[3px] text-xs text-[#34D399]">
                    {pinMgmtSuccess}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsManagingPin(false)}
                    className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] bg-[#1A1F2A] rounded-[3px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[3px] transition-colors cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          ) : isEditingCredential ? (
            /* CREATE / EDIT CREDENTIAL FORM */
            <div className="max-w-lg mx-auto py-1">
              <div className="flex items-center justify-between mb-3 border-b border-[#232832] pb-2">
                <h3 className="text-sm font-bold text-[#F3F4F6]">
                  {currentEditCred?.id ? 'Editar Credencial' : 'Nova Credencial de Jogo'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCredential(false);
                    setCurrentEditCred(null);
                  }}
                  className="text-xs text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleSaveCredential} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                      Identificador / Nome da Conta *
                    </label>
                    <input
                      type="text"
                      required
                      value={currentEditCred?.title || ''}
                      onChange={(e) =>
                        setCurrentEditCred((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Ex: Ragnarok Cavaleiro Principal"
                      className="w-full h-9 px-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                      Quadrante / Slot Vinculado
                    </label>
                    <select
                      value={currentEditCred?.slot || ''}
                      onChange={(e) =>
                        setCurrentEditCred((prev) => ({
                          ...prev,
                          slot: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      className="w-full h-9 px-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                    >
                      <option value="">Nenhum (Livre para qualquer tela)</option>
                      <option value="1">Quadrante 1 (J1 - Superior Esquerdo)</option>
                      <option value="2">Quadrante 2 (J2 - Superior Direito)</option>
                      <option value="3">Quadrante 3 (J3 - Inferior Esquerdo)</option>
                      <option value="4">Quadrante 4 (J4 - Inferior Direito)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                      Usuário / E-mail / Login *
                    </label>
                    <input
                      type="text"
                      required
                      value={currentEditCred?.username || ''}
                      onChange={(e) =>
                        setCurrentEditCred((prev) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="usuario_jogo"
                      className="w-full h-9 px-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                      Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={currentEditCred?.password || ''}
                      onChange={(e) =>
                        setCurrentEditCred((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••••••"
                      className="w-full h-9 px-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                    URL Direta do Jogo (Opcional)
                  </label>
                  <input
                    type="url"
                    value={currentEditCred?.url || ''}
                    onChange={(e) =>
                      setCurrentEditCred((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="https://play.roclassicidle.com.br/..."
                    className="w-full h-9 px-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">
                    Notas / Observações
                  </label>
                  <textarea
                    rows={2}
                    value={currentEditCred?.notes || ''}
                    onChange={(e) =>
                      setCurrentEditCred((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Ex: Servidor Odin, personagem nível 85..."
                    className="w-full px-3 py-2 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCredential(false);
                      setCurrentEditCred(null);
                    }}
                    className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] bg-[#1A1F2A] rounded-[3px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[3px] transition-colors cursor-pointer"
                  >
                    Salvar Credencial
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* CREDENTIALS LIST VIEW */
            <div>
              {/* Security Hint if no PIN is set */}
              {!securityConfig.hasPin && (
                <div className="mb-3 p-2.5 bg-[#1C1A14] border border-[#524424] rounded-[4px] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#EAB308]">
                    <ShieldWarning size={16} weight="bold" />
                    <span>
                      Dica de Segurança: Seu cofre não possui um PIN Mestre configurado.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManagingPin(true)}
                    className="px-2 py-0.5 text-[11px] font-medium bg-[#EAB308] text-black rounded-[2px] hover:bg-[#FACC15] transition-colors cursor-pointer"
                  >
                    Ativar PIN Mestre
                  </button>
                </div>
              )}

              {/* Controls: Search, Slot Filters, Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                  <div className="relative flex-1">
                    <MagnifyingGlass
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        resetInactivityTimer();
                        setSearchQuery(e.target.value);
                      }}
                      placeholder="Buscar conta ou usuário..."
                      className="w-full h-8 pl-8 pr-3 bg-[#0A0D13] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
                    />
                  </div>

                  {/* Slot Filter Pills */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        resetInactivityTimer();
                        setSelectedSlotFilter(null);
                      }}
                      className={`px-2 py-1 text-[10px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                        selectedSlotFilter === null
                          ? 'bg-[#3B82F6] text-white'
                          : 'bg-[#141822] text-[#9CA3AF] hover:text-[#F3F4F6]'
                      }`}
                    >
                      Todos
                    </button>
                    {[1, 2, 3, 4].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          resetInactivityTimer();
                          setSelectedSlotFilter(slot === selectedSlotFilter ? null : slot);
                        }}
                        className={`px-1.5 py-1 text-[10px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                          selectedSlotFilter === slot
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-[#141822] text-[#9CA3AF] hover:text-[#F3F4F6]'
                        }`}
                      >
                        J{slot}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetInactivityTimer();
                    setCurrentEditCred({});
                    setIsEditingCredential(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus size={13} weight="bold" />
                  <span>Nova Credencial</span>
                </button>
              </div>

              {/* Cards List */}
              {filteredCredentials.length === 0 ? (
                <div className="py-12 text-center text-[#6B7280]">
                  <p className="text-xs">
                    {searchQuery || selectedSlotFilter !== null
                      ? 'Nenhuma credencial encontrada com os filtros selecionados.'
                      : 'Nenhuma credencial salva no cofre ainda.'}
                  </p>
                  <p className="text-[11px] mt-1 text-[#4B5563]">
                    Clique em "+ Nova Credencial" para guardar suas contas de jogos com segurança.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredCredentials.map((cred) => {
                    const isPassVisible = visiblePasswordIds.has(cred.id);
                    return (
                      <div
                        key={cred.id}
                        className="p-3 bg-[#11151F] border border-[#202736] hover:border-[#2C364A] rounded-[4px] flex flex-col justify-between transition-colors shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-xs text-[#F3F4F6] truncate">
                                {cred.title}
                              </span>
                              {cred.slot && (
                                <span className="px-1 py-0.2 text-[9px] font-mono font-bold rounded-[2px] bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 shrink-0">
                                  J{cred.slot}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  resetInactivityTimer();
                                  setCurrentEditCred(cred);
                                  setIsEditingCredential(true);
                                }}
                                title="Editar"
                                className="w-5 h-5 flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1E2533] cursor-pointer"
                              >
                                <PencilSimple size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCredential(cred.id)}
                                title="Excluir"
                                className="w-5 h-5 flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#1E2533] cursor-pointer"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Username row */}
                          <div className="flex items-center justify-between gap-2 p-1.5 bg-[#090C11] border border-[#1A202C] rounded-[3px] text-xs mb-1.5">
                            <span className="text-[#9CA3AF] text-[10px] uppercase font-mono tracking-wider shrink-0">
                              Usuário:
                            </span>
                            <span className="font-mono text-[#F3F4F6] truncate select-all flex-1 text-right">
                              {cred.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(cred.username, cred.id + '_user')}
                              title="Copiar Usuário"
                              className="text-[#9CA3AF] hover:text-[#3B82F6] cursor-pointer shrink-0"
                            >
                              {copiedId === cred.id + '_user' ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>

                          {/* Password row */}
                          <div className="flex items-center justify-between gap-2 p-1.5 bg-[#090C11] border border-[#1A202C] rounded-[3px] text-xs">
                            <span className="text-[#9CA3AF] text-[10px] uppercase font-mono tracking-wider shrink-0">
                              Senha:
                            </span>
                            <span className="font-mono text-[#F3F4F6] truncate flex-1 text-right">
                              {isPassVisible ? cred.password : '••••••••••••'}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(cred.id)}
                                title={isPassVisible ? 'Ocultar' : 'Revelar Senha'}
                                className="text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
                              >
                                {isPassVisible ? <EyeSlash size={12} /> : <Eye size={12} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(cred.password, cred.id + '_pass')}
                                title="Copiar Senha"
                                className="text-[#9CA3AF] hover:text-[#3B82F6] cursor-pointer"
                              >
                                {copiedId === cred.id + '_pass' ? (
                                  <Check size={12} className="text-emerald-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Quick Actions */}
                        {cred.slot && onFillCredentialToPane && (
                          <div className="mt-2.5 pt-2 border-t border-[#1C2230] flex items-center justify-between text-[11px]">
                            <span className="text-[#6B7280]">Slot J{cred.slot}</span>
                            <button
                              type="button"
                              onClick={() => {
                                resetInactivityTimer();
                                onFillCredentialToPane(cred.slot!, cred.username);
                              }}
                              className="text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <span>Copiar p/ J{cred.slot}</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="px-4 py-2 bg-[#0A0D13] border-t border-[#1E2534] flex items-center justify-between text-[11px] text-[#6B7280]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>NIST SP 800-132 • Salt Randômico • Nunca salvo em texto puro</span>
          </div>
          <span>Total: {credentials.length} conta(s)</span>
        </div>
      </div>
    </div>
  );
};
