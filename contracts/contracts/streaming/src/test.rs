#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

fn setup() -> (
    Env,
    StreamingContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);

    let employer = Address::generate(&env);
    let controller = Address::generate(&env);
    let employee = Address::generate(&env);
    let contract_id = env.register(StreamingContract, ());
    let client = StreamingContractClient::new(&env, &contract_id);

    client.init(&employer, &controller);

    (env, client, employer, controller, employee)
}

#[test]
fn creates_stream_and_calculates_live_balance() {
    let (env, client, _employer, _controller, employee) = setup();

    client.create_stream(&employee, &3_000_0000000_i128, &1_000_u64, &2_000_u64);

    env.ledger().set_timestamp(1_500);
    let balance = client.balance(&employee);

    assert_eq!(balance.total_amount, 3_000_0000000_i128);
    assert_eq!(balance.unlocked_amount, 1_500_0000000_i128);
    assert_eq!(balance.withdrawn_amount, 0);
    assert_eq!(balance.withdrawable_amount, 1_500_0000000_i128);
    assert_eq!(balance.rate_per_second, 3_0000000_i128);
    assert_eq!(balance.updated_at, 1_500);
}

#[test]
fn caps_unlocked_balance_at_total_amount_after_stream_end() {
    let (env, client, _employer, _controller, employee) = setup();

    client.create_stream(&employee, &3_000_0000000_i128, &1_000_u64, &2_000_u64);

    env.ledger().set_timestamp(2_500);
    let balance = client.balance(&employee);

    assert_eq!(balance.unlocked_amount, 3_000_0000000_i128);
    assert_eq!(balance.withdrawable_amount, 3_000_0000000_i128);
}

#[test]
fn records_withdrawals_against_unlocked_balance() {
    let (env, client, _employer, _controller, employee) = setup();

    client.create_stream(&employee, &3_000_0000000_i128, &1_000_u64, &2_000_u64);

    env.ledger().set_timestamp(1_500);
    let balance = client.record_withdrawal(&employee, &500_0000000_i128);

    assert_eq!(balance.unlocked_amount, 1_500_0000000_i128);
    assert_eq!(balance.withdrawn_amount, 500_0000000_i128);
    assert_eq!(balance.withdrawable_amount, 1_000_0000000_i128);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn blocks_withdrawal_over_unlocked_amount() {
    let (env, client, _employer, _controller, employee) = setup();

    client.create_stream(&employee, &3_000_0000000_i128, &1_000_u64, &2_000_u64);

    env.ledger().set_timestamp(1_100);
    client.record_withdrawal(&employee, &1_000_0000000_i128);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn prevents_accidental_stream_overwrite() {
    let (_env, client, _employer, _controller, employee) = setup();

    client.create_stream(&employee, &3_000_0000000_i128, &1_000_u64, &2_000_u64);
    client.create_stream(&employee, &1_000_0000000_i128, &1_000_u64, &2_000_u64);
}
