import { Program, AnchorProvider, BN } from '@project-serum/anchor'
import { SystemProgram, PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getMint } from '@solana/spl-token'
import { programId, IDL } from './program'
// import { get } from 'http';


export const PROGRAM_ID = new PublicKey(programId);


// J19wcaqRjZ91C72iLJ8g5ZwtbPwMkgiF8Pu43h2RTA5p

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL, PROGRAM_ID, provider)
}

// ============ Collateral Vault Functions ============

/**
 * Get the vault PDA for a user
 */
export function getVaultPDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault_v1'), user.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Initialize a new collateral vault
 */
export async function initializeVault(
  provider: AnchorProvider,
  user: PublicKey,
  tokenMint: PublicKey,
) {
  const program = getProgram(provider);
  const connection = provider.connection;

  const [vaultPda] = getVaultPDA(user);
  console.log("Vault PDA:", vaultPda.toBase58());

  // Get associated token account for the vault
  const vaultTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    vaultPda,
    true // allowOwnerOffCurve for PDA
  );

  const transaction = new Transaction();

  // Add priority fee
  const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 10000,
  });
  transaction.add(priorityFeeInstruction);

  // Add initializeVault instruction
  const instruction = await program.methods
    .initializeVault()
    .accounts({
      user,
      vault: vaultPda,
      vaultTokenAccount,
      usdtMint: tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  transaction.add(instruction);

  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = user;

  try {
    const signature = await provider.sendAndConfirm(transaction, [], {
      maxRetries: 5,
      commitment: 'confirmed',
    });

    // Verify transaction
    const confirmation = await connection.getSignatureStatus(signature);
    if (confirmation?.value?.err) {
      console.error('InitializeVault transaction failed:', confirmation.value.err);
      throw new Error(`InitializeVault transaction failed: ${confirmation.value.err}`);
    }
    return signature;
  } catch (error: any) {
    console.error('InitializeVault error:', error);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
    throw new Error(`Failed to initialize vault: ${error.message}`);
  }
}

/**
 * Convert human-readable token amount to base units (smallest unit)
 */
function convertToBaseUnits(amount: string | number, decimals: number): BN {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  const [integerPart, decimalPart = ''] = amountStr.split('.');

  // Pad or truncate decimal part to match decimals
  const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);

  // Combine integer and decimal parts
  const baseUnits = integerPart + paddedDecimal;

  return new BN(baseUnits);
}

/**
 * Deposit tokens into the vault
 */
export async function deposit(
  provider: AnchorProvider,
  user: PublicKey,
  tokenMint: PublicKey,
  amount: string | number, // Human-readable amount (e.g., "1.5" for 1.5 tokens)
) {
  const program = getProgram(provider);
  const connection = provider.connection;

  // Get token decimals from mint
  const mintInfo = await getMint(connection, tokenMint);
  const decimals = mintInfo.decimals;

  // Convert human-readable amount to base units
  const amountInBaseUnits = convertToBaseUnits(amount, decimals);

  const [vaultPda] = getVaultPDA(user);

  // Get user's token account
  const userTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    user
  );

  // Get vault's token account
  const vaultTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    vaultPda,
    true // allowOwnerOffCurve for PDA
  );

  // Check if vault exists, if not initialize it
  const vaultInfo = await connection.getAccountInfo(vaultPda);
  if (!vaultInfo) {
    await initializeVault(provider, user, tokenMint);
  }

  const transaction = new Transaction();

  // Add priority fee
  const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 10000,
  })
  transaction.add(priorityFeeInstruction);

  // Check if user's token account exists, if not create it
  const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
  if (!userTokenAccountInfo) {
    const createATAInstruction = createAssociatedTokenAccountInstruction(
      user, // payer
      userTokenAccount, // ata
      user, // owner
      tokenMint // mint
    );
    transaction.add(createATAInstruction);
  }

  // Add deposit instruction
  const instruction = await program.methods
    .deposit(amountInBaseUnits)
    .accounts({
      user,
      vault: vaultPda,
      userTokenAccount,
      vaultTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  transaction.add(instruction);

  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = user;

  try {
    const signature = await provider.sendAndConfirm(transaction, [], {
      maxRetries: 5,
      commitment: 'confirmed',
    });

    // Verify transaction
    const confirmation = await connection.getSignatureStatus(signature);
    if (confirmation?.value?.err) {
      console.error('Deposit transaction failed:', confirmation.value.err);
      throw new Error(`Deposit transaction failed: ${confirmation.value.err}`);
    }
    return signature;
  } catch (error: any) {
    console.error('Deposit error:', error);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
    throw new Error(`Failed to deposit: ${error.message}`);
  }
}

/**
 * Withdraw tokens from the vault
 */
export async function withdraw(
  provider: AnchorProvider,
  user: PublicKey,
  tokenMint: PublicKey,
  amount: string | number, // Human-readable amount (e.g., "1.5" for 1.5 tokens)
) {
  const program = getProgram(provider);
  const connection = provider.connection;

  // Get token decimals from mint
  const mintInfo = await getMint(connection, tokenMint);
  const decimals = mintInfo.decimals;

  // Convert human-readable amount to base units
  const amountInBaseUnits = convertToBaseUnits(amount, decimals);

  const [vaultPda] = getVaultPDA(user);

  // Fetch vault to get owner
  const vaultAccount = await program.account.collateralVault.fetch(vaultPda);
  const owner = vaultAccount.owner;

  // Get user's token account
  const userTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    user
  );

  // Get vault's token account
  const vaultTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    vaultPda,
    true // allowOwnerOffCurve for PDA
  );

  const transaction = new Transaction();

  // Add priority fee
  const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 10000,
  });
  transaction.add(priorityFeeInstruction);

  // Add withdraw instruction
  const instruction = await program.methods
    .withdraw(amountInBaseUnits)
    .accounts({
      user,
      vault: vaultPda,
      owner,
      userTokenAccount,
      vaultTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  transaction.add(instruction);

  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = user;

  try {
    const signature = await provider.sendAndConfirm(transaction, [], {
      maxRetries: 5,
      commitment: 'confirmed',
    });

    // Verify transaction
    const confirmation = await connection.getSignatureStatus(signature);
    if (confirmation?.value?.err) {
      console.error('Withdraw transaction failed:', confirmation.value.err);
      throw new Error(`Withdraw transaction failed: ${confirmation.value.err}`);
    }
    return signature;
  } catch (error: any) {
    console.error('Withdraw error:', error);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
    throw new Error(`Failed to withdraw: ${error.message}`);
  }
}

/**
 * Lock collateral in the vault
 */
export async function lockCollateral(
  provider: AnchorProvider,
  user: PublicKey,
  amount: BN,
) {
  const program = getProgram(provider);
  const connection = provider.connection;

  const [vaultPda] = getVaultPDA(user);

  const transaction = new Transaction();

  // Add priority fee
  const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 10000,
  });
  transaction.add(priorityFeeInstruction);

  // Add lockCollateral instruction
  const instruction = await program.methods
    .lockCollateral(amount)
    .accounts({
      vault: vaultPda,
    })
    .instruction();
  transaction.add(instruction);

  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = user;

  try {
    const signature = await provider.sendAndConfirm(transaction, [], {
      maxRetries: 5,
      commitment: 'confirmed',
    });

    // Verify transaction
    const confirmation = await connection.getSignatureStatus(signature);
    if (confirmation?.value?.err) {
      console.error('LockCollateral transaction failed:', confirmation.value.err);
      throw new Error(`LockCollateral transaction failed: ${confirmation.value.err}`);
    }
    return signature;
  } catch (error: any) {
    console.error('LockCollateral error:', error);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
    throw new Error(`Failed to lock collateral: ${error.message}`);
  }
}

/**
 * Unlock collateral in the vault
 */
export async function unlockCollateral(
  provider: AnchorProvider,
  user: PublicKey,
  amount: BN,
) {
  const program = getProgram(provider);
  const connection = provider.connection;

  const [vaultPda] = getVaultPDA(user);

  const transaction = new Transaction();

  // Add priority fee
  const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 10000,
  });
  transaction.add(priorityFeeInstruction);

  // Add unlockCollateral instruction
  const instruction = await program.methods
    .unlockCollateral(amount)
    .accounts({
      vault: vaultPda,
    })
    .instruction();
  transaction.add(instruction);

  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = user;

  try {
    const signature = await provider.sendAndConfirm(transaction, [], {
      maxRetries: 5,
      commitment: 'confirmed',
    });

    // Verify transaction
    const confirmation = await connection.getSignatureStatus(signature);
    if (confirmation?.value?.err) {
      console.error('UnlockCollateral transaction failed:', confirmation.value.err);
      throw new Error(`UnlockCollateral transaction failed: ${confirmation.value.err}`);
    }
    return signature;
  } catch (error: any) {
    console.error('UnlockCollateral error:', error);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
    throw new Error(`Failed to unlock collateral: ${error.message}`);
  }
}

/**
 * Transfer collateral between vaults - auto-initializes recipient vault if missing
 */
export async function transferCollateral(
  provider: AnchorProvider,
  fromUser: PublicKey,
  toUser: PublicKey,
  amount: BN
): Promise<string> {
  const program = getProgram(provider);
  const connection = provider.connection;

  // ⚠️ SAFETY CHECK
  if (!provider.wallet.publicKey.equals(fromUser)) {
    throw new Error("fromUser must be the connected wallet (payer & signer)");
  }

  // ────────────────────────────────────────────────
  // PDA DERIVATION (MUST MATCH PROGRAM)
  // ────────────────────────────────────────────────
  const [fromVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_v1"), fromUser.toBuffer()],
    PROGRAM_ID
  );

  const [toVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_v1"), toUser.toBuffer()],
    PROGRAM_ID
  );

  console.log("──────── TRANSFER COLLATERAL ────────");
  console.log("From user:", fromUser.toBase58());
  console.log("To user:", toUser.toBase58());
  console.log("From vault PDA:", fromVaultPda.toBase58());
  console.log("To vault PDA:", toVaultPda.toBase58());
  console.log("Amount:", amount.toString());

  // ────────────────────────────────────────────────
  // ❌ DO NOT CHECK / INIT RECIPIENT VAULT
  // Anchor will auto-create via init_if_needed
  // ────────────────────────────────────────────────

  const tx = new Transaction();

  // Priority fee (optional but good)
  tx.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 25_000,
    })
  );

  const transferIx = await program.methods
    .transferCollateral(amount)
    .accounts({
      fromOwner: fromUser,        // signer
      toOwner: toUser,            // recipient
      fromVault: fromVaultPda,
      toVault: toVaultPda,        // auto-init happens HERE
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  tx.add(transferIx);

  const latest = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = latest.blockhash;
  tx.feePayer = fromUser;

  try {
    const signature = await provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
      maxRetries: 8,
    });

    console.log("✅ Transfer successful");
    console.log("Tx signature:", signature);
    return signature;
  } catch (err: any) {
    console.error("❌ Transfer failed");

    if (err.logs) {
      console.error("Program logs ↓↓↓");
      console.error(err.logs.join("\n"));
    } else {
      console.error(err);
    }

    throw err;
  }
}






/**
 * Fetch vault data
 */
export async function fetchVault(
  provider: AnchorProvider,
  user: PublicKey,
) {
  try {
    const program = getProgram(provider);

    const [vaultPda] = getVaultPDA(user);

    const vaultAccount = await program.account.collateralVault.fetchNullable(vaultPda);

    if (!vaultAccount) {
      return null;
    }

    return {
      owner: vaultAccount.owner.toString(),
      tokenAccount: vaultAccount.tokenAccount.toString(),
      totalBalance: vaultAccount.totalBalance.toString(),
      lockedBalance: vaultAccount.lockedBalance.toString(),
      availableBalance: vaultAccount.availableBalance.toString(),
      totalDeposited: vaultAccount.totalDeposited.toString(),
      totalWithdrawn: vaultAccount.totalWithdrawn.toString(),
      createdAt: vaultAccount.createdAt.toNumber(),
      bump: vaultAccount.bump,
    };
  } catch (err) {
    console.error('Error fetching vault:', err);
    return null;
  }
}