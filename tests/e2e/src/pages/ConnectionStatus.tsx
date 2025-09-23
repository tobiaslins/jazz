import { useSyncConnectionStatus } from "jazz-tools/react";

export function ConnectionStatus() {
  const connected = useSyncConnectionStatus();

  return (
    <div>
      <h1>Connection Status</h1>
      <p data-testid="connected">{connected ? "true" : "false"}</p>
    </div>
  );
}
