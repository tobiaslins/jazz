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
import type { SocialProviderList } from "better-auth/social-providers";
import { useBetterAuth } from "jazz-tools/better-auth/auth/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";

interface SocialProvider {
  name: string;
  icon?: ReactNode;
}

const socialProviderMap: Partial<
  Record<SocialProviderList[number], SocialProvider>
> = {
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
  provider: SocialProviderList[number];
  link?: boolean;
}

export function SSOButton({ provider, link = false }: Props) {
  const auth = useBetterAuth();
  const router = useRouter();

  if (!socialProviderMap[provider]) {
    return <div>Provider not supported</div>;
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        if (link) {
          auth.linkSocial({ provider });
        } else {
          auth.signIn.social({ provider });
        }
      }}
    >
      {socialProviderMap[provider].icon}
      {link ? "Link" : "Continue with"} {socialProviderMap[provider].name}
    </Button>
  );
}
