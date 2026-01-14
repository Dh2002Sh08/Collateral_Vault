'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet, BN } from '@project-serum/anchor';
import toast, { Toaster } from 'react-hot-toast';
import { 
  initializeVault, 
  deposit, 
  withdraw, 
  lockCollateral, 
  unlockCollateral, 
  transferCollateral, 
  fetchVault,
  getVaultPDA 
} from '@/utils/useprogram';

export default function CollateralVault() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [vaultData, setVaultData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const [tokenMint, setTokenMint] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [lockAmount, setLockAmount] = useState('');
  const [unlockAmount, setUnlockAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferToAddress, setTransferToAddress] = useState('');
  const mintAddressToDisplay = vaultData?.tokenMint || tokenMint;

  const formatNumber = (value: string | number | undefined): string => {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return value.toString();
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
      useGrouping: true,
    }).format(num);
  };

  useEffect(() => {
    if (wallet.publicKey && wallet.signTransaction && wallet.signAllTransactions) {
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      } as Wallet;
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
      });
      setProvider(provider);
    } else {
      setProvider(null);
    }
  }, [wallet, connection]);

  useEffect(() => {
    if (provider && wallet.publicKey) {
      loadVault();
    }
  }, [provider, wallet.publicKey]);

  const loadVault = async () => {
    if (!provider || !wallet.publicKey) return;
    try {
      setError(null);
      const data = await fetchVault(provider, wallet.publicKey);
      setVaultData(data);
      if (data?.tokenMint) {
        setTokenMint(data.tokenMint);
      }
    } catch (err: any) {
      console.error('Error loading vault:', err);
      setVaultData(null);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
    toast.success(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: 'linear-gradient(to right, #10b981, #059669)',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
    loadVault();
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: 'linear-gradient(to right, #ef4444, #dc2626)',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  };

  const handleInitializeVault = async () => {
    if (!provider || !wallet.publicKey || !tokenMint) {
      showError('Please connect wallet and enter token mint address');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let mint: PublicKey;
      try {
        mint = new PublicKey(tokenMint);
      } catch {
        showError('Invalid token mint address');
        return;
      }
      const signature = await initializeVault(provider, wallet.publicKey, mint);
      setLastTx(signature);
      setTokenMint(tokenMint);
      showSuccess(`Vault initialized! Transaction: ${signature}`);
    } catch (err: any) {
      showError(err.message || 'Failed to initialize vault');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const mintAddress = vaultData?.tokenMint || tokenMint;
    if (!provider || !wallet.publicKey || !mintAddress || !depositAmount) {
      showError('Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let mint: PublicKey;
      try {
        mint = new PublicKey(mintAddress);
      } catch {
        showError('Invalid token mint address');
        return;
      }
      const signature = await deposit(provider, wallet.publicKey, mint, depositAmount);
      setLastTx(signature);
      showSuccess(`Deposit successful! Transaction: ${signature}`);
      setDepositAmount('');
    } catch (err: any) {
      showError(err.message || 'Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const mintAddress = vaultData?.tokenMint || tokenMint;
    if (!provider || !wallet.publicKey || !mintAddress || !withdrawAmount) {
      showError('Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let mint: PublicKey;
      try {
        mint = new PublicKey(mintAddress);
      } catch {
        showError('Invalid token mint address');
        return;
      }
      const signature = await withdraw(provider, wallet.publicKey, mint, withdrawAmount);
      setLastTx(signature);
      showSuccess(`Withdraw successful! Transaction: ${signature}`);
      setWithdrawAmount('');
    } catch (err: any) {
      showError(err.message || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  const handleLockCollateral = async () => {
    if (!provider || !wallet.publicKey || !lockAmount) {
      showError('Please enter lock amount');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const amount = new BN(lockAmount);
      const signature = await lockCollateral(provider, wallet.publicKey, amount);
      setLastTx(signature);
      showSuccess(`Collateral locked! Transaction: ${signature}`);
      setLockAmount('');
    } catch (err: any) {
      showError(err.message || 'Failed to lock collateral');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockCollateral = async () => {
    if (!provider || !wallet.publicKey || !unlockAmount) {
      showError('Please enter unlock amount');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const amount = new BN(unlockAmount);
      const signature = await unlockCollateral(provider, wallet.publicKey, amount);
      setLastTx(signature);
      showSuccess(`Collateral unlocked! Transaction: ${signature}`);
      setUnlockAmount('');
    } catch (err: any) {
      showError(err.message || 'Failed to unlock collateral');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferCollateral = async () => {
    if (!provider || !wallet.publicKey || !transferAmount || !transferToAddress) {
      showError('Please fill all required fields');
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      let toUser: PublicKey;
      try {
        toUser = new PublicKey(transferToAddress);
      } catch {
        showError('Invalid recipient address');
        return;
      }

      const amount = new BN(transferAmount);
  
      const signature = await transferCollateral(
        provider,
        wallet.publicKey,
        toUser,
        amount
      );
  
      setLastTx(signature);
      showSuccess(`Transfer successful! Transaction: ${signature}`);
      setTransferAmount('');
      setTransferToAddress('');
    } catch (err: any) {
      showError(err.message || 'Failed to transfer collateral');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMint = async () => {
    if (!mintAddressToDisplay) return;
    try {
      await navigator.clipboard.writeText(mintAddressToDisplay);
      toast.success('Mint address copied to clipboard');
    } catch (err) {
      toast.error('Unable to copy mint address');
    }
  };

  if (!wallet.connected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            Collateral Vault
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your wallet to use the Collateral Vault
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
            style: {
              background: 'linear-gradient(to right, #10b981, #059669)',
              color: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
            style: {
              background: 'linear-gradient(to right, #ef4444, #dc2626)',
              color: '#fff',
            },
          },
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-[#0b0f1a] dark:via-[#0f172a] dark:to-black py-12">
        <div className="max-w-6xl mx-auto px-4">
        <div className="relative bg-white/90 dark:bg-[#0b1220]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 p-8 md:p-10 transition-all duration-300">
  
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10 pb-8 border-b border-gray-200/50 dark:border-white/10">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Collateral Vault
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                Secure SPL collateral management on Solana Devnet
              </p>
            </div>
            <div className="flex-shrink-0">
              <WalletMultiButton />
            </div>
          </div>
  
          {/* Token Mint (always visible when entered or initialized) */}
          {(mintAddressToDisplay || vaultData) && (
            <div className="mb-8 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-purple-50/70 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-900/20 backdrop-blur-sm p-5 md:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <span className="text-2xl">🪙</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-300">Token Mint</p>
                  <p className="mt-1 font-mono text-sm md:text-base text-gray-900 dark:text-white break-all">
                    {mintAddressToDisplay || 'Mint not set'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Keep this handy for deposits, transfers, and explorer lookups.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadVault}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/90 dark:bg-white/10 border border-blue-200/60 dark:border-white/10 text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-white/5 transition-all shadow-sm"
                >
                  Refresh Mint
                </button>
                <button
                  onClick={handleCopyMint}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Copy Mint
                </button>
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="mb-6 animate-in slide-in-from-top-5 duration-300 rounded-xl border-2 border-red-500/40 bg-gradient-to-r from-red-50/90 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 backdrop-blur-sm px-5 py-4 shadow-lg shadow-red-500/10">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}
  
          {success && (
            <div className="mb-6 animate-in slide-in-from-top-5 duration-300 rounded-xl border-2 border-green-500/40 bg-gradient-to-r from-green-50/90 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 backdrop-blur-sm px-5 py-4 shadow-lg shadow-green-500/10">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">{success}</p>
              </div>
            </div>
          )}
  
          {/* Transaction Link */}
          {lastTx && (
            <div className="mb-8 animate-in slide-in-from-top-5 duration-300 rounded-xl border-2 border-blue-500/40 bg-gradient-to-r from-blue-50/90 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 backdrop-blur-sm px-5 py-4 shadow-lg shadow-blue-500/10">
              <a
                href={`https://explorer.solana.com/tx/${lastTx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View transaction on Solana Explorer
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          )}
  
          {/* Vault Overview */}
          <div className="mb-12 rounded-2xl border-2 border-gray-200/60 dark:border-white/10 bg-gradient-to-br from-gray-50/80 to-white/50 dark:from-white/5 dark:to-white/0 p-6 md:p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Vault Overview
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Real-time vault statistics</p>
              </div>
              <button
                onClick={loadVault}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
  
            {vaultData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Total Balance', value: vaultData.totalBalance, icon: '💰', gradient: 'from-blue-500 to-cyan-500' },
                  { label: 'Locked Balance', value: vaultData.lockedBalance, icon: '🔒', gradient: 'from-amber-500 to-orange-500' },
                  { label: 'Available Balance', value: vaultData.availableBalance, icon: '✅', gradient: 'from-emerald-500 to-teal-500' },
                  { label: 'Total Deposited', value: vaultData.totalDeposited, icon: '📊', gradient: 'from-purple-500 to-pink-500' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="group relative rounded-xl bg-white/80 dark:bg-[#0b1220]/80 border-2 border-gray-200/50 dark:border-white/10 p-5 md:p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${item.gradient} opacity-10 group-hover:opacity-20 rounded-full blur-2xl transition-opacity`}></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{item.icon}</span>
                        <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                          {item.label}
                        </p>
                      </div>
                      <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white break-words">
                        {formatNumber(item.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl bg-gray-50/50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10">
                <div className="text-4xl mb-3">🏦</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Vault not initialized yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Initialize your vault to get started
                </p>
              </div>
            )}
          </div>
  
          {/* SPL Token Note */}
          <div className="mb-12 rounded-2xl border-2 border-yellow-400/40 bg-gradient-to-br from-yellow-50/90 to-amber-50/50 dark:from-yellow-950/30 dark:to-amber-900/20 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-yellow-400/20 dark:bg-yellow-500/20 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                  SPL Token Required
                </h2>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 leading-relaxed">
                  Create an SPL token and initialize your vault before using collateral features.
                </p>
              </div>
            </div>
  
            <div className="mt-4 rounded-xl bg-black/95 dark:bg-black border-2 border-yellow-400/20 p-4 md:p-5 overflow-x-auto">
              <pre className="text-green-400 text-xs md:text-sm font-mono leading-relaxed">
{`spl-token create-token
spl-token create-account <TOKEN_MINT>
spl-token mint <TOKEN_MINT> 1000000`}
              </pre>
            </div>
          </div>
  
          {/* Initialize Vault */}
          <div className="mb-8 rounded-2xl border-2 border-gray-200/60 dark:border-white/10 bg-gradient-to-br from-white/50 to-gray-50/30 dark:from-white/5 dark:to-white/0 p-6 md:p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Initialize Vault
              </h2>
            </div>
  
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Token Mint Address"
                value={tokenMint}
                onChange={(e) => setTokenMint(e.target.value)}
                className="flex-1 rounded-xl border-2 border-gray-300/50 dark:border-white/10 bg-white dark:bg-[#0b1220] px-5 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 font-mono text-sm"
              />
              <button
                onClick={handleInitializeVault}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-white font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Initializing...</span>
                  </>
                ) : (
                  <span>Initialize</span>
                )}
              </button>
            </div>
          </div>
  
          {/* Deposit / Withdraw / Lock / Unlock */}
          {[
            { title: 'Deposit', value: depositAmount, setValue: setDepositAmount, action: handleDeposit, color: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800', icon: '💵', bg: 'from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-900/10' },
            { title: 'Withdraw', value: withdrawAmount, setValue: setWithdrawAmount, action: handleWithdraw, color: 'from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800', icon: '💸', bg: 'from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-900/10' },
            { title: 'Lock Collateral', value: lockAmount, setValue: setLockAmount, action: handleLockCollateral, color: 'from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800', icon: '🔒', bg: 'from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-900/10' },
            { title: 'Unlock Collateral', value: unlockAmount, setValue: setUnlockAmount, action: handleUnlockCollateral, color: 'from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800', icon: '🔓', bg: 'from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-900/10' },
          ].map((item) => (
            <div
              key={item.title}
              className={`mb-6 rounded-2xl border-2 border-gray-200/60 dark:border-white/10 bg-gradient-to-br ${item.bg} p-6 md:p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Enter amount"
                  value={item.value}
                  onChange={(e) => item.setValue(e.target.value)}
                  className="flex-1 rounded-xl border-2 border-gray-300/50 dark:border-white/10 bg-white dark:bg-[#0b1220] px-5 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-sm"
                />
                <button
                  onClick={item.action}
                  disabled={loading}
                  className={`rounded-xl bg-gradient-to-r ${item.color} px-8 py-3 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 min-w-[140px]`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{item.title.split(' ')[0]}</span>
                  )}
                </button>
              </div>
            </div>
          ))}
  
          {/* Transfer Collateral */}
          <div className="rounded-2xl border-2 border-gray-200/60 dark:border-white/10 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-900/10 p-6 md:p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md">
                <span className="text-xl">📤</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Transfer Collateral
              </h2>
            </div>
  
            <input
              type="text"
              placeholder="Recipient Wallet Address"
              value={transferToAddress}
              onChange={(e) => setTransferToAddress(e.target.value)}
              className="mb-4 w-full rounded-xl border-2 border-gray-300/50 dark:border-white/10 bg-white dark:bg-[#0b1220] px-5 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 font-mono text-sm"
            />
  
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Enter amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="flex-1 rounded-xl border-2 border-gray-300/50 dark:border-white/10 bg-white dark:bg-[#0b1220] px-5 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 text-sm"
              />
              <button
                onClick={handleTransferCollateral}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-3 text-white font-semibold hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Transferring...</span>
                  </>
                ) : (
                  <>
                    <span>Transfer</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
  
          {loading && (
            <div className="mt-8 flex flex-col items-center justify-center py-8">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                Processing transaction…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
  
}