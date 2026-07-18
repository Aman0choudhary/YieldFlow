#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env};

#[contract]
pub struct StreamingContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub employer: Address,
    pub withdrawal_controller: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stream {
    pub employee: Address,
    pub total_amount: i128,
    pub withdrawn_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
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

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Config,
    Stream(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    InvalidSchedule = 4,
    StreamAlreadyExists = 5,
    StreamNotFound = 6,
    InsufficientUnlockedBalance = 7,
}

#[contractimpl]
impl StreamingContract {
    pub fn init(env: Env, employer: Address, withdrawal_controller: Address) -> Config {
        if env.storage().persistent().has(&DataKey::Config) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }

        employer.require_auth();

        let config = Config {
            employer,
            withdrawal_controller,
        };
        env.storage().persistent().set(&DataKey::Config, &config);
        config
    }

    pub fn config(env: Env) -> Config {
        read_config(&env)
    }

    pub fn create_stream(
        env: Env,
        employee: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
    ) -> Stream {
        let config = read_config(&env);
        config.employer.require_auth();

        if total_amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        if end_time <= start_time {
            panic_with_error!(&env, Error::InvalidSchedule);
        }

        let key = DataKey::Stream(employee.clone());
        if env.storage().persistent().has(&key) {
            panic_with_error!(&env, Error::StreamAlreadyExists);
        }

        let stream = Stream {
            employee,
            total_amount,
            withdrawn_amount: 0,
            start_time,
            end_time,
        };

        env.storage().persistent().set(&key, &stream);
        stream
    }

    pub fn get_stream(env: Env, employee: Address) -> Stream {
        read_stream(&env, &employee)
    }

    pub fn balance(env: Env, employee: Address) -> BalanceSnapshot {
        let stream = read_stream(&env, &employee);
        snapshot(&env, &stream)
    }

    pub fn record_withdrawal(env: Env, employee: Address, amount: i128) -> BalanceSnapshot {
        let config = read_config(&env);
        config.withdrawal_controller.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let key = DataKey::Stream(employee.clone());
        let mut stream = read_stream(&env, &employee);
        let current = snapshot(&env, &stream);

        if amount > current.withdrawable_amount {
            panic_with_error!(&env, Error::InsufficientUnlockedBalance);
        }

        stream.withdrawn_amount += amount;
        env.storage().persistent().set(&key, &stream);
        snapshot(&env, &stream)
    }
}

fn read_config(env: &Env) -> Config {
    env.storage()
        .persistent()
        .get(&DataKey::Config)
        .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
}

fn read_stream(env: &Env, employee: &Address) -> Stream {
    env.storage()
        .persistent()
        .get(&DataKey::Stream(employee.clone()))
        .unwrap_or_else(|| panic_with_error!(env, Error::StreamNotFound))
}

fn snapshot(env: &Env, stream: &Stream) -> BalanceSnapshot {
    let now = env.ledger().timestamp();
    let unlocked_amount = unlocked_amount(stream, now);
    let withdrawable_amount = unlocked_amount - stream.withdrawn_amount;
    let duration = (stream.end_time - stream.start_time) as i128;

    BalanceSnapshot {
        employee: stream.employee.clone(),
        total_amount: stream.total_amount,
        unlocked_amount,
        withdrawn_amount: stream.withdrawn_amount,
        withdrawable_amount,
        rate_per_second: stream.total_amount / duration,
        start_time: stream.start_time,
        end_time: stream.end_time,
        updated_at: now,
    }
}

fn unlocked_amount(stream: &Stream, now: u64) -> i128 {
    if now <= stream.start_time {
        return 0;
    }

    if now >= stream.end_time {
        return stream.total_amount;
    }

    let elapsed = (now - stream.start_time) as i128;
    let duration = (stream.end_time - stream.start_time) as i128;
    stream.total_amount * elapsed / duration
}

mod test;
