"use client";

import { CoMapVisualizer } from "../components/atoms/covalues/CoMap";
import { Person } from "./schema";

export default function Playground() {
  const examplePerson = Person.create({
    name: "John",
    age: 20,
    height: 180,
    weight: 70,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        CoValues Visualizer Playground
      </h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">CoMap</h2>
        <CoMapVisualizer data={examplePerson} />
        <CoMapVisualizer data={examplePerson} showMetadata={true} />
      </div>
    </div>
  );
}
