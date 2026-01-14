'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet, BN } from '@project-serum/anchor';
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

  // Form states
  const [tokenMint, setTokenMint] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [lockAmount, setLockAmount] = useState('');
  const [unlockAmount, setUnlockAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferToAddress, setTransferToAddress] = useState('');

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
    } catch (err: any) {
      console.error('Error loading vault:', err);
      setVaultData(null);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
    loadVault();
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
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
      showSuccess(`Vault initialized! Transaction: ${signature}`);
    } catch (err: any) {
      showError(err.message || 'Failed to initialize vault');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!provider || !wallet.publicKey || !tokenMint || !depositAmount) {
      showError('Please fill all required fields');
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
      const signature = await deposit(provider, wallet.publicKey, mint, depositAmount);
      showSuccess(`Deposit successful! Transaction: ${signature}`);
      setDepositAmount('');
    } catch (err: any) {
      showError(err.message || 'Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!provider || !wallet.publicKey || !tokenMint || !withdrawAmount) {
      showError('Please fill all required fields');
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
      const signature = await withdraw(provider, wallet.publicKey, mint, withdrawAmount);
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
  
      showSuccess(`Transfer successful! Transaction: ${signature}`);
      setTransferAmount('');
      setTransferToAddress('');
    } catch (err: any) {
      showError(err.message || 'Failed to transfer collateral');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
  
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                🏦 Collateral Vault
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Securely deposit, lock, and transfer SPL token collateral
              </p>
            </div>
            <WalletMultiButton />
          </div>
  
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300">
              ❌ {error}
            </div>
          )}
  
          {success && (
            <div className="mb-6 p-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300">
              ✅ {success}
            </div>
          )}
  
          {/* Vault Info */}
          <div className="mb-10 p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                📊 Vault Overview
              </h2>
              <button
                onClick={loadVault}
                className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh
              </button>
            </div>
  
            {vaultData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Balance", value: vaultData.totalBalance },
                  { label: "Locked Balance", value: vaultData.lockedBalance },
                  { label: "Available", value: vaultData.availableBalance },
                  { label: "Total Deposited", value: vaultData.totalDeposited },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Vault not initialized yet.
              </p>
            )}
          </div>
  
          {/* SPL Token Note */}
          <div className="mb-10 p-6 rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30">
            <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
              ⚠️ Important: SPL Token Requirement
            </h2>
            <ul className="list-disc list-inside text-sm text-yellow-900 dark:text-yellow-200 space-y-2">
              <li>You must use a valid <b>SPL Token Mint</b> to initialize the vault.</li>
              <li>Create a token using the Solana CLI:</li>
            </ul>
  
            <pre className="mt-3 p-4 bg-black text-green-400 rounded-lg text-sm overflow-x-auto">
  {`solana-keygen new
  spl-token create-token
  spl-token create-account <TOKEN_MINT>
  spl-token mint <TOKEN_MINT> 1000000`}
            </pre>
  
            <p className="mt-3 text-sm text-yellow-800 dark:text-yellow-300">
              📌 Copy the <b>Token Mint Address</b> and paste it below when initializing the vault.
            </p>
          </div>
  
          {/* Action Sections */}
          {[
            {
              title: "Initialize Vault",
              action: handleInitializeVault,
              color: "blue",
              inputs: [
                {
                  placeholder: "Token Mint Address",
                  value: tokenMint,
                  setValue: setTokenMint,
                },
              ],
            },
            {
              title: "Deposit",
              action: handleDeposit,
              color: "green",
              inputs: [
                { placeholder: "Amount", value: depositAmount, setValue: setDepositAmount },
              ],
            },
            {
              title: "Withdraw",
              action: handleWithdraw,
              color: "red",
              inputs: [
                { placeholder: "Amount", value: withdrawAmount, setValue: setWithdrawAmount },
              ],
            },
            {
              title: "Lock Collateral",
              action: handleLockCollateral,
              color: "yellow",
              inputs: [
                { placeholder: "Amount", value: lockAmount, setValue: setLockAmount },
              ],
            },
            {
              title: "Unlock Collateral",
              action: handleUnlockCollateral,
              color: "purple",
              inputs: [
                { placeholder: "Amount", value: unlockAmount, setValue: setUnlockAmount },
              ],
            },
          ].map((section) => (
            <div
              key={section.title}
              className="mb-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                {section.title}
              </h2>
              <div className="flex gap-4">
                {section.inputs.map((input, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={input.placeholder}
                    value={input.value}
                    onChange={(e) => input.setValue(e.target.value)}
                    className="flex-1 px-4 py-2 rounded border dark:bg-gray-800 dark:text-white"
                  />
                ))}
                <button
                  onClick={section.action}
                  disabled={loading}
                  className={`px-6 py-2 rounded text-white bg-${section.color}-500 hover:bg-${section.color}-600 disabled:opacity-50`}
                >
                  {section.title.split(" ")[0]}
                </button>
              </div>
            </div>
          ))}
  
          {/* Transfer */}
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              🔁 Transfer Collateral
            </h2>
  
            <input
              type="text"
              placeholder="Recipient Wallet Address"
              value={transferToAddress}
              onChange={(e) => setTransferToAddress(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded border dark:bg-gray-800 dark:text-white"
            />
  
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="flex-1 px-4 py-2 rounded border dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={handleTransferCollateral}
                disabled={loading}
                className="px-6 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
              >
                Transfer
              </button>
            </div>
          </div>
  
          {loading && (
            <p className="text-center mt-6 text-sm text-gray-500">
              ⏳ Processing transaction...
            </p>
          )}
        </div>
      </div>
    </div>
  );
  
}