import { useCallback, useEffect, useState } from "react";
import { followUser, unfollowUser } from "./api/user";
import { useProfile } from "./useProfile";

export function useUserProfile(userId: string, viewerId?: string) {
  const profile = useProfile(userId);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (profile.profile) setFollowing(profile.profile.isFollowing);
  }, [profile.profile]);

  const toggleFollow = useCallback(async () => {
    if (!viewerId || viewerId === userId) return;
    const next = !following;
    setFollowing(next);
    try {
      if (next) await followUser(viewerId, userId);
      else await unfollowUser(viewerId, userId);
    } catch {
      setFollowing(!next);
    }
  }, [following, viewerId, userId]);

  return {
    profile: profile.profile,
    reviews: profile.reviews,
    status: profile.status,
    error: profile.error,
    following,
    toggleFollow,
  };
}
