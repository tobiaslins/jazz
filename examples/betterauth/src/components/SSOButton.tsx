import { Button } from "@/components/ui/button";
import {
  SiApple,
  SiDiscord,
  SiDropbox,
  SiFacebook,
  SiGithub,
  SiGitlab,
  SiGoogle,
  SiKick,
  SiReddit,
  SiRoblox,
  SiSpotify,
  SiTiktok,
  SiTwitch,
  SiVk,
  SiX,
  SiZoom,
} from "@icons-pack/react-simple-icons";
import { type SSOProviderType, useAuth } from "jazz-react-auth-betterauth";
import type { ReactNode } from "react";

interface SocialProvider {
  name: string;
  icon?: ReactNode;
}

const socialProviderMap: Record<SSOProviderType, SocialProvider> = {
  github: {
    name: "GitHub",
    icon: <SiGithub />,
  },
  google: {
    name: "Google",
    icon: <SiGoogle />,
  },
  apple: {
    name: "Apple",
    icon: <SiApple />,
  },
  discord: {
    name: "Discord",
    icon: <SiDiscord />,
  },
  facebook: {
    name: "Facebook",
    icon: <SiFacebook />,
  },
  microsoft: {
    name: "Microsoft",
  },
  twitter: {
    name: "X",
    icon: <SiX />,
  },
  dropbox: {
    name: "Dropbox",
    icon: <SiDropbox />,
  },
  linkedin: {
    name: "LinkedIn",
  },
  gitlab: {
    name: "GitLab",
    icon: <SiGitlab />,
  },
  kick: {
    name: "Kick",
    icon: <SiKick />,
  },
  tiktok: {
    name: "TikTok",
    icon: <SiTiktok />,
  },
  twitch: {
    name: "Twitch",
    icon: <SiTwitch />,
  },
  vk: {
    name: "VK",
    icon: <SiVk />,
  },
  zoom: {
    name: "Zoom",
    icon: <SiZoom />,
  },
  roblox: {
    name: "Roblox",
    icon: <SiRoblox />,
  },
  reddit: {
    name: "Reddit",
    icon: <SiReddit />,
  },
  spotify: {
    name: "Spotify",
    icon: <SiSpotify />,
  },
};

interface Props {
  provider: SSOProviderType;
  callbackURL?: string;
}

export function SSOButton({ provider, callbackURL }: Props) {
  const auth = useAuth();
  return (
    <Button
      type="button"
      variant="outline"
      onClick={async (e) => {
        e.preventDefault();
        const { error } = await (async () => {
          return await auth.authClient.signIn.social({
            provider,
            callbackURL,
          });
        })();
        if (error) {
          // setError({
          //   ...error,
          //   name: error.message ?? error.statusText,
          //   message: error.message ?? error.statusText,
          // });
        }
      }}
    >
      {socialProviderMap[provider].icon}
      Continue with {socialProviderMap[provider].name}
    </Button>
  );
}
