import React, { createContext, useContext, useEffect, useState } from "react";

const ProfileContext = createContext(null);
export function useProfile() { return useContext(ProfileContext); }

// Helper: do we have any real survey answers?
function hasSurveyData(s) {
  if (!s || typeof s !== "object") return false;
  const keys = ["goals","focus_categories","nudges","time_horizon"];
  return keys.some(k => Array.isArray(s[k]) && s[k].length > 0);
}

export function ProfileProvider({ children, persistKey = "budgeteer:goals-survey:v1" }) {
  const [profile, setProfile] = useState(null);

  // Hydrate from localStorage (if present)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const survey = JSON.parse(raw);
        setProfile({
          schema: "budgeteer.profile",
          version: 1,
          updatedAt: new Date().toISOString(),
          user: { id: null, email: null },
          survey,
        });
      }
    } catch {}
  }, [persistKey]);

  // Expose a robust “hasSurvey” so we don’t skip the survey on empty objects
  const value = {
    profile,
    setProfile,
    persistKey,
    hasSurvey: hasSurveyData(profile?.survey),
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
