import { CoID, LocalNode, RawCoValue } from "cojson";
import { JsonObject } from "cojson";
import { styled } from "goober";
import { ResolveIcon } from "./type-icon.js";
import { PageInfo, isCoId } from "./types.js";
import { CoMapPreview, ValueRenderer } from "./value-renderer.js";

import { Badge } from "../ui/badge.js";
import { Card } from "../ui/card.js";
import { Text } from "../ui/text.js";

const GridContainer = styled("div")`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const TitleContainer = styled("h3")`
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--j-text-color-strong);
`;

const ContentContainer = styled("div")`
  margin-top: 0.5rem;
  font-size: 0.875rem;
`;

export function GridView({
  data,
  onNavigate,
  node,
}: {
  data: JsonObject;
  onNavigate: (pages: PageInfo[]) => void;
  node: LocalNode;
}) {
  const entries = Object.entries(data);

  return (
    <GridContainer>
      {entries.map(([key, child], childIndex) => (
        <Card
          as={isCoId(child) ? "button" : "div"}
          key={childIndex}
          onClick={() =>
            isCoId(child) &&
            onNavigate([{ coId: child as CoID<RawCoValue>, name: key }])
          }
          style={{
            backgroundColor: isCoId(child)
              ? "var(--j-background)"
              : "var(--j-foreground)",
          }}
        >
          <TitleContainer>
            {isCoId(child) ? (
              <>
                <Text strong>{key}</Text>
                <Badge>
                  <ResolveIcon coId={child as CoID<RawCoValue>} node={node} />
                </Badge>
              </>
            ) : (
              <Text strong>{key}</Text>
            )}
          </TitleContainer>
          <ContentContainer>
            {isCoId(child) ? (
              <CoMapPreview coId={child as CoID<RawCoValue>} node={node} />
            ) : (
              <ValueRenderer
                json={child}
                onCoIDClick={(coId) => {
                  onNavigate([{ coId, name: key }]);
                }}
              />
            )}
          </ContentContainer>
        </Card>
      ))}
    </GridContainer>
  );
}
