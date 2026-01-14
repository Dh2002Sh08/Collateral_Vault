use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("***************Your-Program-ID***************");

#[program]
pub mod collateral_vault {
    use super::*;


    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        vault.owner = ctx.accounts.user.key();
        vault.usdt_mint = ctx.accounts.usdt_mint.key();
        vault.token_account = ctx.accounts.vault_token_account.key();
        vault.total_balance = 0;
        vault.locked_balance = 0;
        vault.available_balance = 0;
        vault.total_deposited = 0;
        vault.total_withdrawn = 0;
        vault.created_at = Clock::get()?.unix_timestamp;
        vault.bump = ctx.bumps.vault;

        emit!(InitializeVaultEvent {
            vault: vault.key(),
            owner: vault.owner,
            token_mint: vault.usdt_mint,
            vault_token_account: vault.token_account,
            timestamp: vault.created_at,
        });

        Ok(())
    }


    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.total_balance = vault.total_balance.checked_add(amount).unwrap();
        vault.available_balance = vault.available_balance.checked_add(amount).unwrap();
        vault.total_deposited = vault.total_deposited.checked_add(amount).unwrap();

        emit!(DepositEvent {
            user: ctx.accounts.user.key(),
            amount,
            new_balance: vault.total_balance,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }


    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        require!(
            ctx.accounts.vault.available_balance >= amount,
            ErrorCode::InsufficientBalance
        );

        let seeds = &[
            b"vault_v1",
            ctx.accounts.vault.owner.as_ref(),
            &[ctx.accounts.vault.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        let vault = &mut ctx.accounts.vault;

        vault.total_balance = vault.total_balance.checked_sub(amount).unwrap();
        vault.available_balance = vault.available_balance.checked_sub(amount).unwrap();
        vault.total_withdrawn = vault.total_withdrawn.checked_add(amount).unwrap();

        emit!(WithdrawEvent {
            user: vault.owner,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

 
    pub fn lock_collateral(ctx: Context<LockCollateral>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        require!(
            vault.available_balance >= amount,
            ErrorCode::InsufficientBalance
        );

        vault.available_balance -= amount;
        vault.locked_balance += amount;

        emit!(LockEvent {
            vault: vault.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn unlock_collateral(ctx: Context<UnlockCollateral>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        require!(
            vault.locked_balance >= amount,
            ErrorCode::InsufficientBalance
        );

        vault.locked_balance -= amount;
        vault.available_balance += amount;

        emit!(UnlockEvent {
            vault: vault.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn transfer_collateral(ctx: Context<TransferCollateral>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let from = &mut ctx.accounts.from_vault;
        let to = &mut ctx.accounts.to_vault;

        if to.owner == Pubkey::default() {
            to.owner = ctx.accounts.to_owner.key();
            to.usdt_mint = from.usdt_mint;
            to.token_account = Pubkey::default(); 
            to.total_balance = 0;
            to.locked_balance = 0;
            to.available_balance = 0;
            to.total_deposited = 0;
            to.total_withdrawn = 0;
            to.created_at = Clock::get()?.unix_timestamp;
            to.bump = ctx.bumps.to_vault;
        }

        require!(
            from.available_balance >= amount,
            ErrorCode::InsufficientBalance
        );

        from.available_balance -= amount;
        from.total_balance -= amount;

        to.available_balance += amount;
        to.total_balance += amount;

        emit!(TransferEvent {
            from: from.key(),
            to: to.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

}
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + CollateralVault::LEN,
        seeds = [b"vault_v1", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, CollateralVault>,

    #[account(
        init,
        payer = user,
        associated_token::mint = usdt_mint,
        associated_token::authority = vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub usdt_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault_v1", user.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, CollateralVault>,

    #[account(
        mut,
        associated_token::mint = vault.usdt_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = vault.usdt_mint,
        associated_token::authority = vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        has_one = owner,
        seeds = [b"vault_v1", owner.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, CollateralVault>,

    pub owner: SystemAccount<'info>,

    #[account(
        mut,
        associated_token::mint = vault.usdt_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = vault.usdt_mint,
        associated_token::authority = vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LockCollateral<'info> {
    #[account(mut)]
    pub vault: Account<'info, CollateralVault>,
}

#[derive(Accounts)]
pub struct UnlockCollateral<'info> {
    #[account(mut)]
    pub vault: Account<'info, CollateralVault>,
}

#[derive(Accounts)]
pub struct TransferCollateral<'info> {
    #[account(mut)]
    pub from_owner: Signer<'info>,

    /// CHECK: used only as PDA seed
    pub to_owner: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault_v1", from_owner.key().as_ref()],
        bump = from_vault.bump,
    )]
    pub from_vault: Account<'info, CollateralVault>,

    #[account(
        init_if_needed,
        payer = from_owner,
        space = 8 + CollateralVault::LEN,
        seeds = [b"vault_v1", to_owner.key().as_ref()],
        bump
    )]
    pub to_vault: Account<'info, CollateralVault>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct CollateralVault {
    pub owner: Pubkey,
    pub usdt_mint: Pubkey,
    pub token_account: Pubkey,
    pub total_balance: u64,
    pub locked_balance: u64,
    pub available_balance: u64,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl CollateralVault {
    pub const LEN: usize = 32 +
        32 + 
        32 + 
        8 * 5 +
        8 +
        1;
}


#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct LockEvent {
    pub vault: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct UnlockEvent {
    pub vault: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TransferEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct InitializeVaultEvent {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub vault_token_account: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Insufficient balance")]
    InsufficientBalance,

    #[msg("Unauthorized vault access")]
    Unauthorized,

    #[msg("Recipient vault is invalid or not initialized")]
    InvalidRecipientVault,
}
