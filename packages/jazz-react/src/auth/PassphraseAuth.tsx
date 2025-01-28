import { usePassphraseAuth } from "jazz-react-core";
import { useState } from "react";

export const PassphraseAuthBasicUI = (
  props: ReturnType<typeof usePassphraseAuth>,
) => {
  const { logIn, signUp } = props;

  const [passphrase, setPassphrase] = useState<string>();
  const [loginPassphrase, setLoginPassphrase] = useState<string>("");

  if (props.state === "signedIn") {
    if (passphrase) {
      return (
        <textarea
          placeholder="Passphrase"
          value={passphrase}
          disabled
          style={{
            border: "2px solid #000",
            padding: "11px 8px",
            borderRadius: "6px",
            height: "7rem",
          }}
        />
      );
    }

    return null;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "30rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            setPassphrase(await signUp());
          }}
          style={{
            padding: "11px 8px",
            borderRadius: "6px",
            background: "#eee",
          }}
        >
          Sign up
        </button>
        <div style={{ textAlign: "center" }}>&mdash; or &mdash;</div>
        <form
          style={{
            width: "30rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            logIn(loginPassphrase);
            setLoginPassphrase("");
          }}
        >
          <textarea
            placeholder="Passphrase"
            value={loginPassphrase}
            onChange={(e) => setLoginPassphrase(e.target.value)}
            style={{
              border: "2px solid #000",
              padding: "11px 8px",
              borderRadius: "6px",
              height: "7rem",
            }}
          />
          <input
            type="submit"
            value="Log in as existing account"
            style={{
              background: "#000",
              color: "#fff",
              padding: "13px 5px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          />
        </form>
      </div>
    </div>
  );
};
