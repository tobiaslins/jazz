import { useAccount } from "jazz-react";
import { Group, type ID } from "jazz-tools";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "./Logo";
import Container from "./components/Container";
import { CursorFeed } from "./schema";
import { loadCursorContainer } from "./utils/loadCursorContainer";
import { getName } from "./utils/mappedNickname";

const cursorFeedIDToLoad = import.meta.env.VITE_CURSOR_FEED_ID;
const groupIDToLoad = import.meta.env.VITE_GROUP_ID;

function App() {
  const { me } = useAccount();
  const [loaded, setLoaded] = useState(false);
  const [cursorFeedID, setCursorFeedID] = useState<ID<CursorFeed> | null>(null);

  useEffect(() => {
    if (!me) return;
    const loadCursorFeed = async () => {
      const id = await loadCursorContainer(
        me,
        cursorFeedIDToLoad as ID<CursorFeed>,
        groupIDToLoad as ID<Group>,
      );
      if (id) {
        setCursorFeedID(id);
        setLoaded(true);
      }
    };
    loadCursorFeed();
  }, [me]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!me?.profile) return;
      const newName = e.target.value;
      me.profile.name = newName;
    },
    [me],
  );

  return (
    <>
      <main className="h-screen">
        {loaded && cursorFeedID ? (
          <Container cursorFeedID={cursorFeedID} />
        ) : (
          <div>Loading...</div>
        )}
      </main>

      <footer className="fixed bottom-4 right-4 flex items-center gap-4">
        <input
          type="text"
          value={getName(me?.profile?.name, me?.sessionID)}
          onChange={handleNameChange}
          placeholder="Your name"
          className="px-2 py-1 rounded border pointer-events-auto"
          autoComplete="off"
        />
        <div className="pointer-events-none">
          <Logo />
        </div>
      </footer>
    </>
  );
}

export default App;
