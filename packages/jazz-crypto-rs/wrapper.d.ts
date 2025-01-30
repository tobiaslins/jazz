export function generate_nonce(nonce_material: Uint8Array): Uint8Array;
export function blake3_hash_once(data: Uint8Array): Uint8Array;
export function blake3_hash_once_with_context(
  data: Uint8Array,
  context: Uint8Array,
): Uint8Array;
export function blake3_empty_state(): Uint8Array;
export function blake3_update_state(
  state: Uint8Array,
  data: Uint8Array,
): Uint8Array;
export function blake3_digest_for_state(state: Uint8Array): Uint8Array;

// X25519 functions
export function new_x25519_private_key(): Uint8Array;
export function x25519_public_key(private_key: Uint8Array): Uint8Array;
export function x25519_diffie_hellman(
  private_key: Uint8Array,
  public_key: Uint8Array,
): Uint8Array;

// XSalsa20 functions
export function encrypt_xsalsa20(
  key: Uint8Array,
  nonce_material: Uint8Array,
  plaintext: Uint8Array,
): Uint8Array;
export function decrypt_xsalsa20(
  key: Uint8Array,
  nonce_material: Uint8Array,
  ciphertext: Uint8Array,
): Uint8Array;

// High-level seal/unseal functions
export function seal(
  message: Uint8Array,
  sender_private_key: Uint8Array,
  recipient_public_key: Uint8Array,
  nonce_material: Uint8Array,
): Uint8Array;
export function unseal(
  sealed_message: Uint8Array,
  recipient_private_key: Uint8Array,
  sender_public_key: Uint8Array,
  nonce_material: Uint8Array,
): Uint8Array;

// Sign functions
export function sign(message: Uint8Array, secret: Uint8Array): Uint8Array;
export function verify(
  signature: Uint8Array,
  message: Uint8Array,
  id: Uint8Array,
): boolean;
export function get_signer_id(secret: Uint8Array): Uint8Array;
export function get_sealer_id(secret: Uint8Array): Uint8Array;

// Encrypt functions
export function encrypt(
  value: Uint8Array,
  key_secret: Uint8Array,
  nonce_material: Uint8Array,
): Uint8Array;
export function decrypt(
  ciphertext: Uint8Array,
  key_secret: Uint8Array,
  nonce_material: Uint8Array,
): Uint8Array;

export class Blake3State {
  constructor();
  update(data: Uint8Array): void;
  finalize(): Uint8Array;
  free(): void;
}

export function blake3_incremental_update(
  state: Blake3State,
  data: Uint8Array,
): Blake3State;

// Ed25519 functions
export function new_ed25519_signing_key(): Uint8Array;
export function ed25519_verifying_key(signing_key: Uint8Array): Uint8Array;
export function ed25519_sign(
  signing_key: Uint8Array,
  message: Uint8Array,
): Uint8Array;
export function ed25519_verify(
  verifying_key: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array,
): boolean;
