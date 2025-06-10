import { MusicTrack, MusicaAccount } from "@/1_schema";
import { createNewPlaylist, deletePlaylist } from "@/4_actions";
import { MediaPlayer } from "@/5_useMediaPlayer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePlayState } from "@/lib/audio/usePlayState";
import { useAccount, useCoState } from "jazz-react";
import { Home, Music, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { AuthButton } from "./AuthButton";

export function SidePanel({ mediaPlayer }: { mediaPlayer: MediaPlayer }) {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { me } = useAccount(MusicaAccount, {
    resolve: { root: { playlists: { $each: true } } },
  });

  const playState = usePlayState();
  const isPlaying = playState.value === "play";

  function handleAllTracksClick() {
    navigate(`/`);
  }

  function handlePlaylistClick(playlistId: string) {
    navigate(`/playlist/${playlistId}`);
  }

  async function handleDeletePlaylist(playlistId: string) {
    if (confirm("Are you sure you want to delete this playlist?")) {
      await deletePlaylist(playlistId);
      navigate(`/`);
    }
  }

  async function handleCreatePlaylist() {
    const playlist = await createNewPlaylist();
    navigate(`/playlist/${playlist.id}`);
  }

  const activeTrack = useCoState(MusicTrack, mediaPlayer.activeTrackId, {
    resolve: { waveform: true },
  });

  const activeTrackTitle = activeTrack?.title;

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18V5l12-2v13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 15H3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM18 13h-3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Music Player</span>
            </div>
            <AuthButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleAllTracksClick}>
                  <Home className="size-4" />
                  <span>Go to all tracks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Playlists</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleCreatePlaylist}>
                  <Plus className="size-4" />
                  <span>Add a new playlist</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {me?.root.playlists.map((playlist) => (
                <SidebarMenuItem key={playlist.id}>
                  <SidebarMenuButton
                    onClick={() => handlePlaylistClick(playlist.id)}
                    isActive={playlist.id === playlistId}
                  >
                    <div className="flex items-center gap-2">
                      <Music className="size-4" />
                      <span>{playlist.title}</span>
                    </div>
                  </SidebarMenuButton>
                  {playlist.id === playlistId && (
                    <SidebarMenuAction
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete {playlist.title}</span>
                    </SidebarMenuAction>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {activeTrack && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex justify-end">
              <SidebarMenuButton
                onClick={playState.toggle}
                aria-label={
                  isPlaying ? "Pause active track" : "Play active track"
                }
              >
                <div className="w-[28px] h-[28px] flex items-center justify-center bg-blue-600 rounded-full text-white hover:bg-blue-700">
                  {isPlaying ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                </div>
                <span>{activeTrackTitle}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
