import { useAccount } from "jazz-react";
import { Group } from "jazz-tools";
import { ID } from "jazz-tools";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import Canvas from "./components/Canvas";
import { CursorContainer, CursorFeed } from "./schema";

const debugProxy = (proxy: any) => {
  return JSON.parse(JSON.stringify(proxy));
};

function App() {
  const { me } = useAccount({ root: { cursors: [] } });
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
      if (me?.root) {
        me.root.cursors = cursorContainer.cursorFeed;
      }
    } else {
      console.log("Global cursors already exists, loading...");
      if (me?.root) {
        cursorContainer.cursorFeed.push({
          position: { x: 0, y: 0 },
        });
        me.root.cursors = cursorContainer.cursorFeed;
      }
    }
  }

  useEffect(() => {
    loadCursorContainer();
  }, []);

  return (
    <>
      <main className="h-screen">
        <Canvas
          onCursorMove={(_move) => {
            const { x, y } = _move.position;
            console.log("onCursorMove", x, y);
          }}
          remoteCursors={[
            {
              id: "1",
              position: { x: -40, y: 60 },
              color: "#dd0000",
              isDragging: false,
            },
            {
              id: "2",
              position: { x: 40, y: 80 },
              color: "#00dd00",
              isDragging: false,
            },
            {
              id: "3",
              position: { x: -10, y: 120 },
              color: "#0000dd",
              isDragging: false,
            },
          ]}
        />
      </main>

      <footer className="fixed bottom-4 right-4 pointer-events-none">
        <Logo />
      </footer>
    </>
  );
}

export default App;
