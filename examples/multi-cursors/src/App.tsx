import { useAccount } from "jazz-react";
import { Logo } from "./Logo";
import Canvas from "./components/Canvas";
import { useState, useCallback, useEffect, useMemo } from "react";
import { CursorContainer, CursorFeed } from "./schema";
import { Group, type ID } from "jazz-tools";
import { hashedColor } from "./utils/mappedColors";

function App() {
  const { me } = useAccount();

  const [cursorFeed, setCursorFeed] = useState<CursorFeed | null>(null);

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
      console.log("My cursor feed ID", cursorFeed.id);
      console.log("My session ID", me.sessionID);
      console.log(move.position);
      cursorFeed.push({
        position: {
          x: move.position.x,
          y: move.position.y,
        },
      });
    },
    [me, cursorFeed],
  );

  const remoteCursors = useMemo(
    () =>
      Object.values(cursorFeed?.perSession || {})
        .filter((entry) => entry.by?.id !== me?.sessionID)
        .map((entry) => {
          const id = entry.tx.sessionID;
          return {
            id,
            position: {
              x: entry.value.position.x,
              y: entry.value.position.y,
            },
            // Use the hashedColor function to generate a unique color based on the user ID
            color: hashedColor(id),
            isDragging: false,
          };
        }),
    [cursorFeed, me],
  );

  // Debugging multiple cursors
  useEffect(() => {
    if (!cursorFeed) return;
    cursorFeed.subscribe([], (feed) => {
      console.log(
        "feed",
        Object.values(feed.perSession).map((entry) => entry.tx.sessionID),
      );
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
