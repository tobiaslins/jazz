import { CoMap } from "jazz-tools";

interface CoMapVisualizerProps {
  data: InstanceType<typeof CoMap>;
  showMetadata?: boolean;
}

export function CoMapVisualizer({
  data,
  showMetadata = false,
}: CoMapVisualizerProps) {
  return (
    <div className="flex justify-center p-4">
      <div className="bg-black rounded-lg p-6 min-w-[200px] shadow-md">
        {showMetadata && (
          <div className="text-white/50 text-xs mb-4">coId: {data.id}</div>
        )}
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
