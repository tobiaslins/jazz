import { JsonObject } from "cojson";
import { Card, CardBody, CardHeader } from "../ui/card.js";
import { Text } from "../ui/text.js";
import { ValueRenderer } from "./value-renderer.js";

export function RawDataCard({ data }: { data: JsonObject }) {
  return (
    <Card>
      <CardHeader>
        <Text strong>Raw data</Text>
      </CardHeader>
      <CardBody>
        <ValueRenderer json={data} />
      </CardBody>
    </Card>
  );
}
