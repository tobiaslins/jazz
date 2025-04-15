import { JsonObject, LocalNode, RawAccount, RawCoValue } from "cojson";
import { CoID } from "cojson";
import { useEffect, useState } from "react";
import { Button } from "../ui/button.js";
import { Card, CardBody, CardHeader } from "../ui/card.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.js";
import { Text } from "../ui/text.js";
import { PageInfo, isCoId } from "./types.js";
import {
  resolveCoValue,
  useResolvedCoValue,
  useResolvedCoValues,
} from "./use-resolve-covalue.js";
import { ValueRenderer } from "./value-renderer.js";

function AccountNameDisplay({
  accountId,
  node,
}: {
  accountId: CoID<RawAccount>;
  node: LocalNode;
}) {
  const { snapshot } = useResolvedCoValue(accountId, node);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (snapshot && typeof snapshot === "object" && "profile" in snapshot) {
      const profileId = snapshot.profile as CoID<RawCoValue>;
      resolveCoValue(profileId, node).then((profileResult) => {
        if (
          profileResult.snapshot &&
          typeof profileResult.snapshot === "object" &&
          "name" in profileResult.snapshot
        ) {
          setName(profileResult.snapshot.name as string);
        }
      });
    }
  }, [snapshot, node]);

  return name ? `${name} <${accountId}>` : accountId;
}

export function GroupView({
  data,
  onNavigate,
  node,
}: {
  data: JsonObject;
  onNavigate: (pages: PageInfo[]) => void;
  node: LocalNode;
}) {
  const entries = Object.entries(data).filter((entry) => isCoId(entry[0]));
  const memberIds = entries.map((entry) => entry[0] as CoID<RawCoValue>);
  const result = useResolvedCoValues(memberIds, node);

  return (
    <>
      <Text strong>Members</Text>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Account</TableHeader>
            <TableHeader>Permission</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {"everyone" in data && typeof data.everyone === "string" ? (
            <TableRow>
              <TableCell>everyone</TableCell>
              <TableCell>{data.everyone}</TableCell>
            </TableRow>
          ) : null}
          {result.map((row) =>
            row.snapshot !== "unavailable" ? (
              <TableRow>
                <TableCell style={{ maxWidth: "12rem" }}>
                  <Button
                    variant="link"
                    onClick={() => {
                      onNavigate([{ coId: row.value.id, name: row.value.id }]);
                    }}
                  >
                    <AccountNameDisplay
                      accountId={row.value.id as CoID<RawAccount>}
                      node={node}
                    />
                  </Button>
                </TableCell>
                <TableCell>{data[row.value.id] as string}</TableCell>
              </TableRow>
            ) : null,
          )}
        </TableBody>
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
