use cojson_core::{CoJsonCoreError, KeyID, SessionLogInternal, CoID, SessionID};
use ed25519_dalek::{Signature, SigningKey, VerifyingKey, Signer};
use serde_json::value::RawValue;
use thiserror::Error;
use wasm_bindgen::prelude::*;

#[derive(Error, Debug)]
pub enum WasmError {
    #[error(transparent)]
    CoJson(#[from] CoJsonCoreError),
    #[error("JsValue Error: {0:?}")]
    Js(JsValue),
}

impl From<serde_wasm_bindgen::Error> for WasmError {
    fn from(err: serde_wasm_bindgen::Error) -> Self {
        WasmError::Js(err.into())
    }
}

impl From<WasmError> for JsValue {
    fn from(err: WasmError) -> Self {
        JsValue::from_str(&err.to_string())
    }
}

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
    ) -> Result<(), WasmError> {
        let transactions_str: Vec<String> = serde_wasm_bindgen::from_value(transactions_js)?;
        let transactions: Vec<Box<RawValue>> = transactions_str
            .into_iter()
            .map(|s| {
                serde_json::from_str(&s)
                    .map_err(|e| WasmError::Js(JsValue::from(format!("Failed to parse transaction string: {}", e))))
            })
            .collect::<Result<Vec<_>, _>>()?;

            let signature_bytes_from_js = new_signature_bytes.to_vec();

            let signature_array: [u8; 64] = signature_bytes_from_js
                .try_into()
                .map_err(|_| WasmError::Js(JsValue::from_str("Invalid signature length, expected 64 bytes")))?;
            let new_signature = Signature::from_bytes(&signature_array);

        self.internal
            .try_add(transactions, new_signature, skip_verify)?;

        Ok(())
    }

    #[wasm_bindgen(js_name = addNewTransaction)]
    pub fn add_new_transaction(
        &mut self,
        changes_json: &str,
        signing_key_bytes: &[u8],
        encryption_key: &[u8],
        key_id_str: String,
        made_at: f64,
    ) -> Result<Vec<u8>, WasmError> {
        let signing_key_array: [u8; 32] = signing_key_bytes
            .try_into()
            .map_err(|_| WasmError::Js(JsValue::from_str("Invalid signing key length, expected 32 bytes")))?;
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
    ) -> Result<String, WasmError> {
        Ok(self
            .internal
            .decrypt_next_transaction_changes_json(tx_index, key_secret)?)
    }
}

#[wasm_bindgen]
pub fn test_ed25519_dalek_vector() -> Result<(), JsValue> {
    let line = "0d4a05b07352a5436e180356da0ae6efa0345ff7fb1572575772e8005ed978e9e61a185bcef2613a6c7cb79763ce945d3b245d76114dd440bcf5f2dc1aa57057:e61a185bcef2613a6c7cb79763ce945d3b245d76114dd440bcf5f2dc1aa57057:cbc77b:d9868d52c2bebce5f3fa5a79891970f309cb6591e3e1702a70276fa97c24b3a8e58606c38c9758529da50ee31b8219cba45271c689afa60b0ea26c99db19b00ccbc77b:";
    let parts: Vec<&str> = line.split(':').collect();
    if parts.len() != 5 {
        return Err(JsValue::from_str(&format!("wrong number of fields in line: expected 5, got {}", parts.len())));
    }

    let sec_bytes: Vec<u8> = hex::decode(parts[0]).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let pub_bytes: Vec<u8> = hex::decode(parts[1]).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let msg_bytes: Vec<u8> = hex::decode(parts[2]).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sig_bytes: Vec<u8> = hex::decode(parts[3]).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let sec_key_bytes: &[u8; 32] = &sec_bytes[..32].try_into().map_err(|_| JsValue::from_str("Failed to slice secret key"))?;
    let pub_key_bytes: &[u8; 32] = &pub_bytes[..32].try_into().map_err(|_| JsValue::from_str("Failed to slice public key"))?;

    let signing_key = SigningKey::from_bytes(sec_key_bytes);
    let expected_verifying_key = VerifyingKey::from_bytes(pub_key_bytes).map_err(|e| JsValue::from_str(&e.to_string()))?;
    if expected_verifying_key != signing_key.verifying_key() {
        return Err(JsValue::from_str("Derived verifying key does not match expected verifying key"));
    }

    let sig1: Signature = Signature::try_from(&sig_bytes[..64]).map_err(|_| JsValue::from_str("Failed to create signature from bytes"))?;
    let sig2: Signature = signing_key.sign(&msg_bytes);

    if sig1 != sig2 {
        return Err(JsValue::from_str("Signature bytes not equal"));
    }

    signing_key.verify(&msg_bytes, &sig2).map_err(|e| JsValue::from_str(&format!("Signature verification failed: {}", e)))?;

    expected_verifying_key
        .verify_strict(&msg_bytes, &sig2)
        .map_err(|e| JsValue::from_str(&format!("Signature strict verification failed: {}", e)))?;

    Ok(())
}