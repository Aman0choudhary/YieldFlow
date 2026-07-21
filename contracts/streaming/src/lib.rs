#![no_std]
//! YieldFlow streaming contract scaffold (Phase 3).
//! Timestamp-based employee salary accrual. Not deployed yet — mock SDK remains default.

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Stream(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct StreamState {
    pub rate_per_second: i128,
    pub cap: i128,
    pub started_at: u64,
    pub withdrawn: i128,
}

#[contract]
pub struct StreamingContract;

#[contractimpl]
impl StreamingContract {
    pub fn __constructor(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Open or replace a stream for `employee` with non-negative i128 amounts.
    pub fn open_stream(env: Env, employee: Address, rate_per_second: i128, cap: i128) {
        Self::require_admin(&env);
        if rate_per_second < 0 || cap < 0 {
            panic!("negative amount");
        }
        let state = StreamState {
            rate_per_second,
            cap,
            started_at: env.ledger().timestamp(),
            withdrawn: 0,
        };
        env.storage().persistent().set(&DataKey::Stream(employee), &state);
    }

    /// Accrued unlocked amount since stream start minus withdrawn.
    pub fn unlocked(env: Env, employee: Address) -> i128 {
        let state = Self::load_stream(&env, &employee);
        let elapsed = env.ledger().timestamp().saturating_sub(state.started_at) as i128;
        let gross = state.rate_per_second.saturating_mul(elapsed);
        let capped = if gross > state.cap { state.cap } else { gross };
        capped.saturating_sub(state.withdrawn)
    }

    /// Withdraw up to unlocked amount; returns amount paid.
    pub fn withdraw(env: Env, employee: Address, amount: i128) -> i128 {
        employee.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let mut state = Self::load_stream(&env, &employee);
        let available = Self::unlocked(env.clone(), employee.clone());
        if amount > available {
            panic!("insufficient unlocked");
        }
        state.withdrawn = state.withdrawn.saturating_add(amount);
        env.storage().persistent().set(&DataKey::Stream(employee), &state);
        amount
    }

    pub fn stream_of(env: Env, employee: Address) -> StreamState {
        Self::load_stream(&env, &employee)
    }

    fn load_stream(env: &Env, employee: &Address) -> StreamState {
        env.storage()
            .persistent()
            .get(&DataKey::Stream(employee.clone()))
            .unwrap_or_else(|| panic!("missing stream"))
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
