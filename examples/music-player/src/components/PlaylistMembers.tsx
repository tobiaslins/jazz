import { Member } from "./Member";

interface PlaylistMembersProps {
  memberIds: string[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PlaylistMembers({
  memberIds,
  size = "md",
  className = "",
}: PlaylistMembersProps) {
  if (!memberIds || memberIds.length === 0) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex -space-x-2">
        {memberIds.map((memberId) => (
          <Member
            key={memberId}
            accountId={memberId}
            size={size}
            showTooltip={true}
          />
        ))}
      </div>
    </div>
  );
}
