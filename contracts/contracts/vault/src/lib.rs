#![no_std]

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, panic_with_error,
    token::TokenClient, Address, Env, MuxedAddress,
};

const BPS_DENOMINATOR: u32 = 10_000;

#[contract]
pub struct VaultContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub employer: Address,
    pub withdrawal_controller: Address,
    pub streaming_contract: Address,
    pub token: Address,
    pub buffer_bps: u32,
    pub yield_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultState {
    pub total_deposited: i128,
    pub buffer_balance: i128,
    pub yield_principal: i128,
    pub total_released: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultStats {
    pub token: Address,
    pub total_deposited: i128,
    pub total_pool: i128,
    pub buffer_balance: i128,
    pub yield_principal: i128,
    pub total_released: i128,
    pub buffer_bps: u32,
    pub yield_bps: u32,
    pub buffer_healthy: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BalanceSnapshot {
    pub employee: Address,
    pub total_amount: i128,
    pub unlocked_amount: i128,
    pub withdrawn_amount: i128,
    pub withdrawable_amount: i128,
    pub rate_per_second: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub updated_at: u64,
}

#[contractclient(name = "StreamingClient")]
pub trait Streaming {
    fn record_withdrawal(env: Env, employee: Address, amount: i128) -> BalanceSnapshot;
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Config,
    State,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidSplit = 3,
    InvalidAmount = 4,
    InsufficientBuffer = 5,
    InsufficientYieldPrincipal = 6,
}

#[contractimpl]
impl VaultContract {
    pub fn init(
        env: Env,
        employer: Address,
        withdrawal_controller: Address,
        streaming_contract: Address,
        token: Address,
        buffer_bps: u32,
        yield_bps: u32,
    ) -> Config {
        if env.storage().persistent().has(&DataKey::Config) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }

        employer.require_auth();

        if buffer_bps + yield_bps != BPS_DENOMINATOR {
            panic_with_error!(&env, Error::InvalidSplit);
        }

        let config = Config {
            employer,
            withdrawal_controller,
            streaming_contract,
            token,
            buffer_bps,
            yield_bps,
        };
        let state = VaultState {
            total_deposited: 0,
            buffer_balance: 0,
            yield_principal: 0,
            total_released: 0,
        };

        env.storage().persistent().set(&DataKey::Config, &config);
        env.storage().persistent().set(&DataKey::State, &state);

        config
    }

    pub fn config(env: Env) -> Config {
        read_config(&env)
    }

    pub fn stats(env: Env) -> VaultStats {
        let config = read_config(&env);
        let state = read_state(&env);
        stats_from(&config, &state)
    }

    pub fn deposit_payroll(env: Env, amount: i128) -> VaultStats {
        let config = read_config(&env);
        config.employer.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let buffer_amount = amount * config.buffer_bps as i128 / BPS_DENOMINATOR as i128;
        let yield_amount = amount - buffer_amount;

        let token = TokenClient::new(&env, &config.token);
        let vault_address = env.current_contract_address();
        token.transfer(
            &config.employer,
            &MuxedAddress::from(vault_address),
            &amount,
        );

        let mut state = read_state(&env);
        state.total_deposited += amount;
        state.buffer_balance += buffer_amount;
        state.yield_principal += yield_amount;
        write_state(&env, &state);

        stats_from(&config, &state)
    }

    pub fn release_buffer(env: Env, recipient: Address, amount: i128) -> VaultStats {
        let config = read_config(&env);
        config.withdrawal_controller.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let mut state = read_state(&env);
        if amount > state.buffer_balance {
            panic_with_error!(&env, Error::InsufficientBuffer);
        }

        state.buffer_balance -= amount;
        state.total_released += amount;
        write_state(&env, &state);

        let streaming = StreamingClient::new(&env, &config.streaming_contract);
        streaming.record_withdrawal(&recipient, &amount);

        let token = TokenClient::new(&env, &config.token);
        let vault_address = env.current_contract_address();
        token.transfer(&vault_address, &MuxedAddress::from(recipient), &amount);

        stats_from(&config, &state)
    }

    pub fn rebalance_to_buffer(env: Env, amount: i128) -> VaultStats {
        let config = read_config(&env);
        config.employer.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let mut state = read_state(&env);
        if amount > state.yield_principal {
            panic_with_error!(&env, Error::InsufficientYieldPrincipal);
        }

        state.yield_principal -= amount;
        state.buffer_balance += amount;
        write_state(&env, &state);

        stats_from(&config, &state)
    }
}

fn read_config(env: &Env) -> Config {
    env.storage()
        .persistent()
        .get(&DataKey::Config)
        .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
}

fn read_state(env: &Env) -> VaultState {
    env.storage()
        .persistent()
        .get(&DataKey::State)
        .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
}

fn write_state(env: &Env, state: &VaultState) {
    env.storage().persistent().set(&DataKey::State, state);
}

fn stats_from(config: &Config, state: &VaultState) -> VaultStats {
    let total_pool = state.buffer_balance + state.yield_principal;
    let target_buffer = state.total_deposited * config.buffer_bps as i128 / BPS_DENOMINATOR as i128;

    VaultStats {
        token: config.token.clone(),
        total_deposited: state.total_deposited,
        total_pool,
        buffer_balance: state.buffer_balance,
        yield_principal: state.yield_principal,
        total_released: state.total_released,
        buffer_bps: config.buffer_bps,
        yield_bps: config.yield_bps,
        buffer_healthy: state.buffer_balance >= target_buffer / 2,
    }
}

mod test;
