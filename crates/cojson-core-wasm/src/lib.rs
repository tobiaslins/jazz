use cojson_core::{KeyID, SessionLogInternal, CoID, SessionID};
use ed25519_dalek::{Signature, SigningKey, VerifyingKey};
use serde_json::value::RawValue;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct SessionLog {
    internal: SessionLogInternal,
}

#[wasm_bindgen]
impl SessionLog {
    #[wasm_bindgen(constructor)]
    pub fn new(
        co_id_str: String,
        session_id_str: String,
        public_key_bytes: &[u8],
    ) -> SessionLog {
        let co_id = CoID(co_id_str);
        let session_id = SessionID(session_id_str);
        let public_key_array: [u8; 32] = public_key_bytes
            .try_into()
            .expect("Invalid public key length, expected 32 bytes");
        let public_key = VerifyingKey::from_bytes(&public_key_array)
            .expect("Invalid public key");

        let internal = SessionLogInternal::new(co_id, session_id, public_key);

        SessionLog { internal }
    }

    #[wasm_bindgen(js_name = tryAdd)]
    pub fn try_add(
        &mut self,
        transactions_js: JsValue,
        new_signature_bytes: &[u8],
        skip_verify: bool,
    ) -> Result<(), JsValue> {
        let transactions_str: Vec<String> = serde_wasm_bindgen::from_value(transactions_js)?;
        let transactions: Vec<Box<RawValue>> = transactions_str
            .into_iter()
            .map(|s| {
                serde_json::from_str(&s)
                    .map_err(|e| JsValue::from(format!("Failed to parse transaction string: {}", e)))
            })
            .collect::<Result<Vec<_>, _>>()?;

        let signature_array: [u8; 64] = new_signature_bytes
            .try_into()
            .map_err(|_| JsValue::from_str("Invalid signature length, expected 64 bytes"))?;
        let new_signature = Signature::from_bytes(&signature_array);

        self.internal
            .try_add(transactions, new_signature, skip_verify)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = addNewTransaction)]
    pub fn add_new_transaction(
        &mut self,
        changes_json: &str,
        signing_key_bytes: &[u8],
        encryption_key: &[u8],
        key_id_str: String,
        made_at: f64,
    ) -> Result<Vec<u8>, JsValue> {
        let signing_key_array: [u8; 32] = signing_key_bytes
            .try_into()
            .map_err(|_| JsValue::from_str("Invalid signing key length, expected 32 bytes"))?;
        let signing_key = SigningKey::from_bytes(&signing_key_array);
        let key_id = KeyID(key_id_str);

        let signature = self.internal.add_new_transaction(
            changes_json,
            &signing_key,
            encryption_key,
            key_id,
            made_at as u64,
        );

        Ok(signature.to_bytes().to_vec())
    }

    #[wasm_bindgen(js_name = decryptNextTransactionChangesJson)]
    pub fn decrypt_next_transaction_changes_json(
        &self,
        tx_index: u32,
        key_secret: &[u8],
    ) -> Result<String, JsValue> {
        self.internal
            .decrypt_next_transaction_changes_json(tx_index, key_secret)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}