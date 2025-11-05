import { JsonObject, JsonValue, LocalNode, RawCoMap } from "cojson";
import { PageInfo } from "./types";
import { GridView } from "./grid-view.js";
import { useState, useMemo } from "react";
import { MapOpPayload } from "cojson/dist/coValues/coMap.js";
import { Button, Icon } from "../ui";
import { styled } from "goober";
import { restoreCoMapToTimestamp } from "../utils/history";

export function CoMapView({
  coValue,
  data,
  node,
  onNavigate,
}: {
  coValue: RawCoMap;
  data: JsonObject;
  node: LocalNode;
  onNavigate: (pages: PageInfo[]) => void;
}) {
  return (
    <>
      <GridView data={data} onNavigate={onNavigate} node={node} />
      <div>
        <RestoreSnapshotModal coValue={coValue} />
      </div>
    </>
  );
}

function RestoreSnapshotModal({ coValue }: { coValue: RawCoMap }) {
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [removeUnknownProperties, setRemoveUnknownProperties] = useState(false);

  const timestamps = useMemo(
    () => coValue.core.verifiedTransactions.map((tx) => tx.madeAt),
    [coValue.core.verifiedTransactions.length],
  );

  const coMapAtSelectedIndex = useMemo(() => {
    if (selectedIndex === -1) return null;
    return coValue.atTime(timestamps[selectedIndex]!).toJSON() as JsonObject;
  }, [coValue, timestamps, selectedIndex]);

  const openRestoreModal = () => {
    setIsRestoreModalOpen(true);
    setSelectedIndex(timestamps.length - 1);
  };

  const handleRestore = () => {
    if (timestamps.length === 0) return;

    const selectedTimestamp = timestamps[selectedIndex];
    if (selectedTimestamp === undefined) return;

    restoreCoMapToTimestamp(
      coValue,
      selectedTimestamp,
      removeUnknownProperties,
    );

    setIsRestoreModalOpen(false);
  };

  return (
    <>
      <Button
        title="Restore to Snapshot"
        variant="secondary"
        onClick={openRestoreModal}
      >
        <Icon name="history" />
      </Button>

      {isRestoreModalOpen && (
        <ModalOverlay onClick={() => setIsRestoreModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalHeading>Restore to Snapshot</ModalHeading>
              <CloseButton onClick={() => setIsRestoreModalOpen(false)}>
                ×
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <RangeContainer>
                <RangeLabel>Select Timestamp</RangeLabel>
                <RangeInput
                  type="range"
                  min={0}
                  max={Math.max(0, timestamps.length - 1)}
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(Number(e.target.value))}
                  disabled={timestamps.length === 0}
                />
                <TimestampDisplay>
                  {timestamps.length > 0 &&
                  timestamps[selectedIndex] !== undefined
                    ? new Date(timestamps[selectedIndex]!).toISOString()
                    : "No timestamps available"}
                </TimestampDisplay>
              </RangeContainer>

              <CheckboxContainer>
                <CheckboxInput
                  type="checkbox"
                  id="remove-unknown-properties"
                  checked={removeUnknownProperties}
                  onChange={(e) => setRemoveUnknownProperties(e.target.checked)}
                />
                <CheckboxLabel htmlFor="remove-unknown-properties">
                  Remove unknown properties (properties that don't exist in the
                  selected snapshot)
                </CheckboxLabel>
              </CheckboxContainer>

              {timestamps.length > 0 &&
                timestamps[selectedIndex] !== undefined && (
                  <PreviewSection>
                    <PreviewLabel>State at that time:</PreviewLabel>
                    <PreviewPre>
                      {JSON.stringify(coMapAtSelectedIndex, null, 2)}
                    </PreviewPre>
                  </PreviewSection>
                )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => setIsRestoreModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={timestamps.length === 0}
                onClick={handleRestore}
              >
                Restore
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}

const ModalOverlay = styled("div")`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled("div")`
  background-color: var(--j-background);
  border-radius: var(--j-radius-lg);
  border: 1px solid var(--j-border-color);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled("div")`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 1.5rem 0 1.5rem;
  gap: 1rem;
`;

const ModalHeading = styled("h3")`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--j-text-color-strong);
`;

const CloseButton = styled("button")`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--j-radius-sm);
  color: var(--j-text-color);
  font-size: 1.25rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  min-height: 2rem;

  &:hover {
    background-color: var(--j-foreground);
  }

  &:focus-visible {
    outline: 2px solid var(--j-border-focus);
    outline-offset: 2px;
  }
`;

const ModalBody = styled("div")`
  padding: 1rem 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const PreviewSection = styled("div")`
  margin-top: 1.5rem;
`;

const PreviewLabel = styled("div")`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--j-text-color-strong);
`;

const PreviewPre = styled("pre")`
  background-color: var(--j-foreground);
  border: 1px solid var(--j-border-color);
  border-radius: var(--j-radius-md);
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.875rem;
  max-height: 400px;
  overflow-y: auto;
  color: var(--j-text-color);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`;

const ModalFooter = styled("div")`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
`;

const RangeContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RangeLabel = styled("label")`
  font-weight: 500;
  color: var(--j-text-color-strong);
  font-size: 0.875rem;
`;

const RangeInput = styled("input")`
  width: 100%;
  height: 0.5rem;
  border-radius: var(--j-radius-sm);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  background: var(--j-foreground);
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: var(--j-primary-color);
    cursor: pointer;
    border: 2px solid var(--j-background);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: var(--j-primary-color);
    cursor: pointer;
    border: 2px solid var(--j-background);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TimestampDisplay = styled("div")`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  color: var(--j-text-color);
  padding: 0.5rem;
  background-color: var(--j-foreground);
  border: 1px solid var(--j-border-color);
  border-radius: var(--j-radius-md);
  text-align: center;
`;

const CheckboxContainer = styled("div")`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const CheckboxInput = styled("input")`
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
  cursor: pointer;
  accent-color: var(--j-primary-color);
`;

const CheckboxLabel = styled("label")`
  font-size: 0.875rem;
  color: var(--j-text-color);
  cursor: pointer;
  line-height: 1.25rem;
`;
