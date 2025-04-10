"use client";

import { CoListVisualizer } from "../components/atoms/covalues/CoList";
import { CoMapVisualizer } from "../components/atoms/covalues/CoMap";
import { ListOfPeople, Person } from "./schema";

export default function Playground() {
  const examplePerson = Person.create({
    name: "John",
    age: 20,
    height: 180,
    weight: 70,
  });

  const examplePersonList = ListOfPeople.create([examplePerson]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        CoValues Visualizer Playground
      </h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">CoMap</h2>
        <CoMapVisualizer instance={examplePerson} />
        <CoMapVisualizer instance={examplePerson} showMetadata={true} />
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">CoList</h2>
        <CoListVisualizer instance={examplePersonList} />
        <CoListVisualizer instance={examplePersonList} showMetadata={true} />
      </div>
    </div>
  );
}
