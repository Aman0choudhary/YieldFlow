#![no_std]
//! YieldFlow DeFindex / Blend router adapter scaffold (Phase 3).

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TargetVault,
    RoutedTotal,
}

#[contract]
pub struct DefindexRouter;

#[contractimpl]
impl DefindexRouter {
    pub fn __constructor(env: Env, admin: Address, target_vault: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TargetVault, &target_vault);
        env.storage().instance().set(&DataKey::RoutedTotal, &0_i128);
    }

    /// Route a positive amount toward the configured yield venue (mock accounting only).
    pub fn route_to_yield(env: Env, caller: Address, amount: i128) {
        caller.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let total: i128 = env.storage().instance().get(&DataKey::RoutedTotal).unwrap_or(0);
        env.storage().instance().set(&DataKey::RoutedTotal, &(total + amount));
    }

    pub fn harvest_note(env: Env, caller: Address, amount: i128) {
        Self::route_to_yield(env, caller, amount);
    }

    pub fn routed_total(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::RoutedTotal).unwrap_or(0)
    }

    pub fn target_vault(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::TargetVault)
            .unwrap_or_else(|| panic!("uninitialized"))
    }
}
