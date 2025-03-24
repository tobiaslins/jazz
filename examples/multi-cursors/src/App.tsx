import { useAccountOrGuest } from "jazz-react";
import { Logo } from "./Logo";
import Canvas from "./components/Canvas";
import { useState, useCallback, useEffect } from "react";
import { CursorContainer, CursorFeed } from "./schema";
import { Group, type ID } from "jazz-tools";
import { hashedColor } from "./utils/mappedColors";

function App() {
  const { me } = useAccountOrGuest();

  const [cursorFeed, setCursorFeed] = useState<CursorFeed | null>(null);
  const [container, setContainer] = useState<CursorContainer | null>(null);

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
      setContainer(cursorContainer);
      setCursorFeed(cursorContainer.cursorFeed);
    } else {
      console.log(
        "Global cursors already exists, loading...",
        cursorContainer.id,
      );
      setContainer(cursorContainer);
      setCursorFeed(cursorContainer.cursorFeed);
    }
  }

  useEffect(() => {
    if (!me) return;
    loadCursorContainer();
  }, [me]);

  useEffect(() => {
    console.log("container", container);
  }, [container]);

  const handleCursorMove = useCallback(
    (move: { position: { x: number; y: number } }) => {
      console.log("cursorFeed", cursorFeed);
      if (!(cursorFeed && me)) return;
      cursorFeed.push({
        position: move.position,
      });
    },
    [me, cursorFeed],
  );

  const remoteCursors = useCallback(
    () =>
      Object.values(cursorFeed?.perSession || {}).map((entry) => {
        const id = entry.by?.id || "";
        return {
          id,
          position: entry.value.position,
          // Use the hashedColor function to generate a unique color based on the user ID
          color: hashedColor(id),
          isDragging: false,
        };
      }),
    [cursorFeed, me],
  );

  return (
    <>
      <main className="h-screen">
        <Canvas
          onCursorMove={handleCursorMove}
          remoteCursors={remoteCursors()}
        />
      </main>

      <footer className="fixed bottom-4 right-4 pointer-events-none">
        <Logo />
      </footer>
    </>
  );
}

export default App;
