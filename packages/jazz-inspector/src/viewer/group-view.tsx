import { Card, CardBody, CardHeader } from "@/ui/card";
import { Table, TableCell, TableHead, TableRow } from "@/ui/table";
import { Text } from "@/ui/text";
import { ValueRenderer } from "@/viewer/value-renderer";
import { JsonObject, JsonValue } from "cojson";
import { PageInfo, isCoId } from "./types.js";

function TeamMember({
  entry,
  onNavigate,
}: {
  entry: [string, JsonValue | undefined];
  onNavigate: (pages: PageInfo[]) => void;
}) {
  const [key, value] = entry;

  if (!value || typeof value !== "string") return null;

  return (
    <TableRow>
      <TableCell>
        <ValueRenderer
          json={key}
          onCoIDClick={(coId) => {
            onNavigate([{ coId, name: key }]);
          }}
        />
      </TableCell>
      <TableCell>{value}</TableCell>
    </TableRow>
  );
}

export function GroupView({
  data,
  onNavigate,
}: {
  data: JsonObject;
  onNavigate: (pages: PageInfo[]) => void;
}) {
  const entries = Object.entries(data).filter((entry) => isCoId(entry[0]));

  return (
    <>
      <Text strong>Members</Text>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Account</TableCell>
            <TableCell>Permission</TableCell>
          </TableRow>
        </TableHead>
        {entries.map((entry, childIndex) => (
          <TeamMember entry={entry} onNavigate={onNavigate} key={childIndex} />
        ))}
      </Table>

      <Card>
        <CardHeader>
          <Text strong>Raw data</Text>
        </CardHeader>
        <CardBody>
          <ValueRenderer json={data} />
        </CardBody>
      </Card>
    </>
  );
}
