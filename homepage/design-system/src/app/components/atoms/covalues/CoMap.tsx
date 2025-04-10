import { CoMap } from "jazz-tools";

interface CoMapVisualizerProps {
  data: InstanceType<typeof CoMap>;
}

export function CoMapVisualizer({ data }: CoMapVisualizerProps) {
  return (
    <div className="flex justify-center p-4">
      <div className="bg-black rounded-lg p-6 min-w-[200px] shadow-md">
        <ul className="list-none p-0 m-0">
          {Object.entries(data).map(([key, value]) => (
            <li
              key={key}
              className="text-white font-mono py-2 flex justify-between border-b border-white/10 last:border-b-0"
            >
              <span className="font-bold mr-4">{key}:</span>
              <span className="text-white">{value.toString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
