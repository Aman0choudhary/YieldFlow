#![cfg(test)]

use super::*;
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, panic_with_error};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::token::{StellarAssetClient, TokenClient};
use soroban_sdk::Env;

const USDC: i128 = 10_000_000;

struct Setup {
    env: Env,
    client: VaultContractClient<'static>,
    employer: Address,
    employee: Address,
    token: Address,
    vault: Address,
    streaming: MockStreamingContractClient<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths_allowing_non_root_auth();

    let employer = Address::generate(&env);
    let controller = Address::generate(&env);
    let employee = Address::generate(&env);
    let admin = Address::generate(&env);

    let asset = env.register_stellar_asset_contract_v2(admin);
    let token = asset.address();
    let asset_client = StellarAssetClient::new(&env, &token);
    asset_client.mint(&employer, &(100_000_i128 * USDC));

    let streaming_id = env.register(MockStreamingContract, ());
    let streaming = MockStreamingContractClient::new(&env, &streaming_id);

    let vault = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &vault);
    client.init(
        &employer,
        &controller,
        &streaming_id,
        &token,
        &1_500_u32,
        &8_500_u32,
    );

    Setup {
        env,
        client,
        employer,
        employee,
        token,
        vault,
        streaming,
    }
}

#[test]
fn deposits_payroll_and_splits_buffer_from_yield_principal() {
    let s = setup();
    let token = TokenClient::new(&s.env, &s.token);

    let stats = s.client.deposit_payroll(&(10_000_i128 * USDC));

    assert_eq!(stats.total_deposited, 10_000_i128 * USDC);
    assert_eq!(stats.buffer_balance, 1_500_i128 * USDC);
    assert_eq!(stats.yield_principal, 8_500_i128 * USDC);
    assert_eq!(stats.total_pool, 10_000_i128 * USDC);
    assert!(stats.buffer_healthy);

    assert_eq!(token.balance(&s.vault), 10_000_i128 * USDC);
    assert_eq!(token.balance(&s.employer), 90_000_i128 * USDC);
}

#[test]
fn releases_buffer_to_employee_under_controller_auth() {
    let s = setup();
    let token = TokenClient::new(&s.env, &s.token);

    s.client.deposit_payroll(&(10_000_i128 * USDC));
    s.streaming
        .set_available(&s.employee, &(400_i128 * USDC));
    let stats = s.client.release_buffer(&s.employee, &(400_i128 * USDC));

    assert_eq!(stats.buffer_balance, 1_100_i128 * USDC);
    assert_eq!(stats.total_released, 400_i128 * USDC);
    assert_eq!(token.balance(&s.employee), 400_i128 * USDC);
    assert_eq!(token.balance(&s.vault), 9_600_i128 * USDC);
}

#[test]
fn rebalances_yield_accounting_back_to_buffer() {
    let s = setup();

    s.client.deposit_payroll(&(10_000_i128 * USDC));
    let stats = s.client.rebalance_to_buffer(&(1_000_i128 * USDC));

    assert_eq!(stats.buffer_balance, 2_500_i128 * USDC);
    assert_eq!(stats.yield_principal, 7_500_i128 * USDC);
    assert_eq!(stats.total_pool, 10_000_i128 * USDC);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn blocks_release_larger_than_buffer() {
    let s = setup();

    s.client.deposit_payroll(&(10_000_i128 * USDC));
    s.streaming
        .set_available(&s.employee, &(2_000_i128 * USDC));
    s.client.release_buffer(&s.employee, &(2_000_i128 * USDC));
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn blocks_release_larger_than_streamed_balance() {
    let s = setup();

    s.client.deposit_payroll(&(10_000_i128 * USDC));
    s.streaming
        .set_available(&s.employee, &(300_i128 * USDC));
    s.client.release_buffer(&s.employee, &(400_i128 * USDC));
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn rejects_invalid_split_on_init() {
    let env = Env::default();
    env.mock_all_auths();

    let employer = Address::generate(&env);
    let controller = Address::generate(&env);
    let token = Address::generate(&env);
    let streaming = Address::generate(&env);
    let vault = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &vault);

    client.init(
        &employer,
        &controller,
        &streaming,
        &token,
        &2_000_u32,
        &8_500_u32,
    );
}

#[contract]
pub struct MockStreamingContract;

#[contracttype]
#[derive(Clone)]
enum MockKey {
    Available(Address),
    Withdrawn(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum MockStreamError {
    InsufficientUnlockedBalance = 7,
}

#[contractimpl]
impl MockStreamingContract {
    pub fn set_available(env: Env, employee: Address, amount: i128) {
        env.storage()
            .persistent()
            .set(&MockKey::Available(employee), &amount);
    }

    pub fn record_withdrawal(env: Env, employee: Address, amount: i128) -> BalanceSnapshot {
        let available = read_mock_amount(&env, MockKey::Available(employee.clone()));
        if amount > available {
            panic_with_error!(&env, MockStreamError::InsufficientUnlockedBalance);
        }

        let withdrawn = read_mock_amount(&env, MockKey::Withdrawn(employee.clone())) + amount;
        env.storage()
            .persistent()
            .set(&MockKey::Available(employee.clone()), &(available - amount));
        env.storage()
            .persistent()
            .set(&MockKey::Withdrawn(employee.clone()), &withdrawn);

        BalanceSnapshot {
            employee,
            total_amount: available + withdrawn,
            unlocked_amount: available + withdrawn,
            withdrawn_amount: withdrawn,
            withdrawable_amount: available - amount,
            rate_per_second: 0,
            start_time: 0,
            end_time: 0,
            updated_at: 0,
        }
    }
}

fn read_mock_amount(env: &Env, key: MockKey) -> i128 {
    env.storage().persistent().get(&key).unwrap_or(0)
}
