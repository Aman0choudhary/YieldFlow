#![no_std]
//! YieldFlow vault contract scaffold (Phase 3).
//! Employer deposits, buffer accounting, withdrawal accounting.

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TotalPool,
    BufferBps,
    YieldBps,
    EmployerDeposit(Address),
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    pub fn __constructor(env: Env, admin: Address, buffer_bps: u32, yield_bps: u32) {
        admin.require_auth();
        if buffer_bps + yield_bps != 10_000 {
            panic!("bps must sum to 10000");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::BufferBps, &buffer_bps);
        env.storage().instance().set(&DataKey::YieldBps, &yield_bps);
        env.storage().instance().set(&DataKey::TotalPool, &0_i128);
    }

    /// Record an employer deposit amount (token transfer via SAC happens off this scaffold).
    pub fn deposit(env: Env, employer: Address, amount: i128) {
        employer.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let pool: i128 = env.storage().instance().get(&DataKey::TotalPool).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalPool, &(pool + amount));
        let prior: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::EmployerDeposit(employer.clone()))
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::EmployerDeposit(employer), &(prior + amount));
    }

    /// Accounting-only pool reduction for settled withdrawals (caller must be admin for scaffold).
    pub fn record_withdrawal(env: Env, amount: i128) {
        Self::require_admin(&env);
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let pool: i128 = env.storage().instance().get(&DataKey::TotalPool).unwrap_or(0);
        if amount > pool {
            panic!("insufficient pool");
        }
        env.storage().instance().set(&DataKey::TotalPool, &(pool - amount));
    }

    pub fn total_pool(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalPool).unwrap_or(0)
    }

    pub fn allocation_bps(env: Env) -> (u32, u32) {
        let buffer_bps: u32 = env.storage().instance().get(&DataKey::BufferBps).unwrap_or(1500);
        let yield_bps: u32 = env.storage().instance().get(&DataKey::YieldBps).unwrap_or(8500);
        (buffer_bps, yield_bps)
    }

    pub fn split(env: Env, amount: i128) -> (i128, i128) {
        if amount < 0 {
            panic!("negative amount");
        }
        let buffer_bps: u32 = env.storage().instance().get(&DataKey::BufferBps).unwrap_or(1500);
        let buffer = amount.saturating_mul(buffer_bps as i128) / 10_000;
        (buffer, amount - buffer)
    }

    pub fn name(env: Env) -> Symbol {
        Symbol::new(&env, "YieldVault")
    }

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("uninitialized"));
        admin.require_auth();
    }
}
