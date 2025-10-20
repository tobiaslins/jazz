"use client";

import { Card } from "@garden-co/design-system/src/components/atoms/Card";
import { GappedGrid } from "@garden-co/design-system/src/components/molecules/GappedGrid";
import { Prose } from "@garden-co/design-system/src/components/molecules/Prose";
import Link from "next/link";
import { H3 } from "@garden-co/design-system/src/components/atoms/Headings";
import { Icon } from "@garden-co/design-system/src/components/atoms/Icon";
import { Input } from "@garden-co/design-system/src/components/molecules/Input";
import { Label } from "@garden-co/design-system/src/components/atoms/Label";
import { Button } from "@garden-co/design-system/src/components/atoms/Button";
import QRCode from "qrcode";
import {
  IframeHTMLAttributes,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import clsx from "clsx";

function Iframe(
  props: IframeHTMLAttributes<HTMLIFrameElement> & {
    user: string;
  },
) {
  const { src, user, className } = props;

  return (
    <Card
      className={clsx(
        "relative col-span-2 w-full overflow-hidden dark:bg-black lg:col-span-2",
        className,
      )}
    >
      <iframe
        {...props}
        src={src}
        title="Jazz chat demo"
        className="w-full"
        width="200"
        height="390"
        allowFullScreen
      />
    </Card>
  );
}

export function ChatDemoSection() {
  const [chatId, setChatId] = useState<string | undefined>();

  const user1 = "Alice";
  const user2 = "Bob";

  const [server1, setServer1] = useState<string | null>();
  const [server2, setServer2] = useState<string | null>();
  const [shareUrl, setShareUrl] = useState<string | null>();
  const [qrCode, setQrCode] = useState<string | null>();
  const [isFlipped, setIsFlipped] = useState(false);

  let [copyCount, setCopyCount] = useState(0);
  let copied = copyCount > 0;

  useEffect(() => {
    if (copyCount > 0) {
      let timeout = setTimeout(() => setCopyCount(0), 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copyCount]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const isLocal = window.location.hostname === "localhost";

    if (chatId) {
      const shareServer = isLocal
        ? "http://localhost:5173"
        : "https://chat.jazz.tools";
      const url = `${shareServer}/${chatId}`;
      setShareUrl(url);

      QRCode.toDataURL(url, {
        errorCorrectionLevel: "L",
      }).then((dataUrl) => {
        setQrCode(dataUrl);
      });

      return; // Once the chatId is set, we don't need to listen for messages anymore
    }

    setServer1(
      (isLocal ? "http://localhost:5173" : "https://jazz-chat-1.vercel.app") +
        `?user=${user1}`,
    );
    setServer2(
      (isLocal ? "http://localhost:5174" : "https://jazz-chat-2.vercel.app") +
        `?user=${user2}`,
    );

    if (!server1 || !server2) return;

    const server1Url = new URL(server1);

    const listener = (e: MessageEvent) => {
      const isValidOrigin = e.origin === server1Url.origin;

      if (e.data.type === "navigate" && isValidOrigin) {
        setChatId(new URL(e.data.url).hash);
      }
    };
    window.addEventListener("message", listener);
    return () => {
      window.removeEventListener("message", listener);
    };
  }, [chatId, server1, server2]);

  const server2WithSameChatId = useMemo(() => {
    if (chatId && server2) {
      const server2Url = new URL(server2);
      server2Url.hash = chatId;
      return server2Url.toString();
    }

    return null;
  }, [chatId, server2]);

  if (!server1) return null;

  const copyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyCount((count) => count + 1);
      });
    }
  };

  return (
    <div className="relative" style={{ perspective: "1000px" }}>
      <div
        className="relative transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front side - Chat iframes + Join button */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="chats perspective-distant perspective-origin-center flex gap-4 md:gap-8">
            <Iframe
              className="chat-1"
              src={server1}
              user={user1}
              title="Jazz chat demo user 1"
            />
            {server2WithSameChatId && (
              <Iframe
                className="chat-2"
                src={server2WithSameChatId}
                user={user2}
                title="Jazz chat demo user 2"
              />
            )}
          </div>

          {/* Join the chat button */}
          {chatId && shareUrl && (
            <div className="mt-4 text-center md:mt-8">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsFlipped(true)}
                icon="qrcode"
              >
                Join the chat
              </Button>
            </div>
          )}
        </div>

        {/* Back side - QR Code + Back button */}
        {chatId && shareUrl && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <H3 className="!mb-0 font-medium text-highlight">Join the chat</H3>
            <p>Scan the QR code</p>

            {qrCode && (
              <img
                src={qrCode}
                className="mx-auto size-48 rounded-lg border"
                alt="Scan this QR code to join the chat"
              />
            )}
            <div className="flex w-full max-w-md items-center gap-2">
              <div className="h-px w-full border-t" />
              <p className="whitespace-nowrap">or copy the URL</p>
              <div className="h-px w-full border-t" />
            </div>
            <div className="relative w-full max-w-md">
              <Label
                label="To join the chat, copy the URL"
                htmlFor="shareUrl"
                className="sr-only"
              />
              <input
                id="shareUrl"
                className="h-10 w-full rounded-md border bg-transparent px-3"
                type="text"
                value={shareUrl}
                onClick={(e) => e.currentTarget.select()}
                onBlur={(e) => e.currentTarget.setSelectionRange(0, 0)}
                readOnly
              />
              <button
                type="button"
                className="absolute right-0 top-0 p-3 text-primary dark:text-blue-400"
                onClick={copyUrl}
              >
                {copied ? (
                  <Icon name="check" size="xs" />
                ) : (
                  <Icon name="copy" size="xs" />
                )}
                <span className="sr-only">Copy URL</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="lg"
              icon="previous"
              iconPosition="left"
              onClick={() => setIsFlipped(false)}
              className="mt-4"
            >
              Back to chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
