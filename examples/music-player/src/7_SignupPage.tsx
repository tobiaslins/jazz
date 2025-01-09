import {
  PasskeyAuthBasicUI,
  useAccount,
  useOnboardingAuthUpgrade,
  usePasskeyAuth,
} from "jazz-react";
import { useNavigate } from "react-router";

export function SignupPage() {
  const navigate = useNavigate();
  const [auth, state] = usePasskeyAuth({
    appName: "Jazz Music Player",
  });

  const { me } = useAccount();

  useOnboardingAuthUpgrade({
    auth,
    onUpgrade: ({ username, isSignUp }) => {
      if (isSignUp) {
        me.profile!.name = username;
        navigate("/");
      } else {
        // TODO: We do a full reload here because we need to re-initialize the Jazz context
        // We should just restart the jazz provider
        location.href = "/";
      }
    },
  });

  return <PasskeyAuthBasicUI state={state} />;
}
