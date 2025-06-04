import Link from "next/link";
import { Buttons } from "./components/Buttons";
import { Colors } from "./components/Colors";
import { Forms } from "./components/Forms";
import { Typography } from "./components/Typography";

const designSystemTopics = [
  "Colors",
  "Typography",
  "Forms",
  "Buttons",
  // 'Components',
];

export default function Home() {
  return (
    <main className="container flex flex-col gap-8 py-8 lg:py-16 grid grid-cols-10 relative h-full overflow-hidden">
      <div className="col-span-2 sticky top-0">
        {designSystemTopics.map((topic) => (
          <div key={topic}>
            <Link href={`#${topic.toLowerCase()}`}>{topic}</Link>
          </div>
        ))}
      </div>
      <div className="col-span-8 overflow-y-scroll mt-7">
        <h1 className="text-2xl font-semibold font-display">
          Jazz Design System
        </h1>

        <Buttons />
        <Colors />
        <Typography />
        {/* <Components /> */}
        <Forms />
      </div>
    </main>
  );
}
