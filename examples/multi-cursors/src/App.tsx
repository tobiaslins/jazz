import { useAccount } from "jazz-react";
import { Group, type ID } from "jazz-tools";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "./Logo";
import Canvas from "./components/Canvas";
import { CursorContainer, CursorFeed } from "./schema";
import { hashedColor } from "./utils/mappedColors";

function App() {
  const { me } = useAccount();

  const [cursorFeed, setCursorFeed] = useState<CursorFeed | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<
    {
      id: string;
      position: { x: number; y: number };
      color: string;
      isDragging: boolean;
    }[]
  >([]);

  async function loadCursorContainer() {
    if (!me) return;
    const group = await Group.load(
      "co_zLBGe35kD91bKhmtpjjDeo9VQYc" as ID<Group>,
      {},
    );
    if (group === undefined) return;
    group?.addMember("everyone", "reader");

    const cursorContainerID = CursorContainer.findUnique(
      "multi-cursors",
      group?.id as ID<Group>,
    );
    const cursorContainer = await CursorContainer.load(
      cursorContainerID as ID<CursorContainer>,
      { cursorFeed: [] },
    );
    if (cursorContainer === undefined) {
      console.log("Global cursors does not exist, creating...");
      const cursorContainer = CursorContainer.create(
        {
          cursorFeed: CursorFeed.create([], {
            owner: group,
          }),
        },
        {
          owner: group,
          unique: "multi-cursors",
        },
      );
      console.log("Created global cursors", cursorContainer.id);
      if (cursorContainer.cursorFeed === null) {
        throw new Error("cursorFeed is null");
      }
      setCursorFeed(cursorContainer.cursorFeed);
    } else {
      console.log(
        "Global cursors already exists, loading...",
        cursorContainer.id,
      );
      setCursorFeed(cursorContainer.cursorFeed);
    }
  }

  useEffect(() => {
    if (!me) return;
    console.log("My session ID", me.sessionID);
    loadCursorContainer();
  }, [me]);

  const handleCursorMove = useCallback(
    (move: { position: { x: number; y: number } }) => {
      if (!(cursorFeed && me)) return;
      cursorFeed.push({
        position: {
          x: move.position.x,
          y: move.position.y,
        },
      });
    },
    [me, cursorFeed],
  );

  useEffect(() => {
    if (!cursorFeed) return;
    cursorFeed.subscribe([], (feed) => {
      const cursors = Object.values(feed.perSession)
        .filter((entry) => entry.tx.sessionID !== me?.sessionID)
        .map((entry) => ({
          id: entry.tx.sessionID,
          position: {
            x: entry.value.position.x,
            y: entry.value.position.y,
          },
          color: hashedColor(entry.tx.sessionID),
          isDragging: false,
        }));
      setRemoteCursors(cursors);
    });
  }, [cursorFeed]);

  return (
    <>
      <main className="h-screen">
        <Canvas onCursorMove={handleCursorMove} remoteCursors={remoteCursors} />
      </main>

      <footer className="fixed bottom-4 right-4 pointer-events-none">
        <Logo />
      </footer>
    </>
  );
}

export default App;
