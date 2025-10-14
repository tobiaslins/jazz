import { type Locator, type Page, expect } from "@playwright/test";

export class HomePage {
  page: Page;
  newPlaylistButton: Locator;
  playlistTitleInput: Locator;
  loginButton: Locator;
  logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newPlaylistButton = this.page.getByRole("button", {
      name: "New Playlist",
    });
    this.playlistTitleInput = this.page.getByRole("textbox", {
      name: "Playlist title",
    });
    this.loginButton = this.page.getByRole("button", {
      name: "Sign up",
    });
    this.logoutButton = this.page.getByRole("button", {
      name: "Sign out",
    });
  }

  async fillUsername(username: string) {
    await this.page.getByRole("textbox", { name: "Username" }).fill(username);
  }

  async expectActiveTrackPlaying() {
    await expect(
      this.page.getByRole("button", {
        name: `Pause active track`,
      }),
    ).toBeVisible({
      timeout: 10_000,
    });
  }

  async expectMusicTrack(trackName: string) {
    await expect(
      this.page.getByRole("button", {
        name: `Play ${trackName}`,
      }),
    ).toBeVisible();
  }

  async notExpectMusicTrack(trackName: string) {
    await expect(
      this.page.getByRole("button", {
        name: `Play ${trackName}`,
      }),
    ).not.toBeVisible();
  }

  async playMusicTrack(trackName: string) {
    await this.page
      .getByRole("button", {
        name: `Play ${trackName}`,
      })
      .click();
  }

  async editTrackTitle(trackTitle: string, newTitle: string) {
    await this.page
      .getByRole("button", {
        name: `Open ${trackTitle} menu`,
      })
      .click();

    await this.page
      .getByRole("menuitem", {
        name: `Edit`,
      })
      .click();

    await this.page.getByPlaceholder("Enter track name...").fill(newTitle);

    await this.page.getByRole("button", { name: "Save" }).click();
  }

  async createPlaylist(playlistTitle: string) {
    await this.newPlaylistButton.click();
    await this.playlistTitleInput.fill(playlistTitle);
    await this.page.getByRole("button", { name: "Create Playlist" }).click();
  }

  async navigateToPlaylist(playlistTitle: string) {
    await this.page
      .getByRole("button", {
        name: playlistTitle,
      })
      .click();
  }

  async navigateToHome() {
    await this.page
      .getByRole("button", {
        name: "All tracks",
      })
      .click();
  }

  async getShareLink() {
    await this.page
      .getByRole("button", {
        name: "Share",
      })
      .click();

    const inviteUrl = await this.page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    expect(inviteUrl).toBeTruthy();

    return inviteUrl;
  }

  async addTrackToPlaylist(trackTitle: string, playlistTitle: string) {
    await this.page
      .getByRole("button", {
        name: `Open ${trackTitle} menu`,
      })
      .click();

    await this.page
      .getByRole("menuitem", {
        name: `Add to ${playlistTitle}`,
      })
      .click();
  }

  async removeTrackFromPlaylist(trackTitle: string, playlistTitle: string) {
    await this.page
      .getByRole("button", {
        name: `Open ${trackTitle} menu`,
      })
      .click();

    await this.page
      .getByRole("menuitem", {
        name: `Remove from ${playlistTitle}`,
      })
      .click();
  }

  async signUp() {
    await this.page.getByRole("button", { name: "Sign up" }).click();
    await this.page
      .getByRole("button", { name: "Sign up with passkey" })
      .click();

    await this.logoutButton.waitFor({
      state: "visible",
    });

    await expect(this.logoutButton).toBeVisible();
  }

  async logOut() {
    await this.logoutButton.click();

    await this.page.getByRole("textbox", { name: "Username" }).waitFor({
      state: "visible",
    });

    await expect(
      this.page.getByRole("textbox", { name: "Username" }),
    ).toBeVisible();
  }
}
