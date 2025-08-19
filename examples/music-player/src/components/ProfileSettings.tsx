import { useState } from "react";
import { useAccount } from "jazz-tools/react";
import { MusicaAccount } from "../1_schema";
import { ProfileForm } from "./ProfileForm";
import { Button } from "./ui/button";

export function ProfileSettings() {
  const { me } = useAccount(MusicaAccount, {
    resolve: { profile: true, root: true },
  });
  const [isEditing, setIsEditing] = useState(false);

  if (!me) return null;

  const handleSaveProfile = (data: { username: string; avatar?: any }) => {
    // Profile is automatically updated by the ProfileForm component
    // You can add additional logic here if needed
    console.log("Profile updated:", data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <ProfileForm
            onSubmit={handleSaveProfile}
            onCancel={handleCancel}
            showCancelButton={true}
            submitButtonText="Save Changes"
            showHeader={true}
            headerTitle="Edit Profile"
            headerDescription="Update your profile information"
            initialUsername={me.profile.name || ""}
            initialAvatar={me.profile.avatar}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Profile Display */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Profile Settings
          </h1>

          {/* Avatar Display */}
          <div className="mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
              {me.profile.avatar ? (
                <img
                  src={`/api/images/${me.profile.avatar.id}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">👤</span>
                </div>
              )}
            </div>
          </div>

          {/* Username Display */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {me.profile.name || "No username set"}
            </h2>
            <p className="text-gray-600 text-sm">
              {me.profile.name
                ? "Your display name"
                : "Set a username to get started"}
            </p>
          </div>

          {/* Edit Button */}
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            Edit Profile
          </Button>
        </div>

        {/* Additional Profile Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Account ID:</span>
              <span className="text-sm font-mono text-gray-800">{me.id}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Setup Completed:</span>
              <span
                className={`text-sm ${me.root.accountSetupCompleted ? "text-green-600" : "text-red-600"}`}
              >
                {me.root.accountSetupCompleted ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
