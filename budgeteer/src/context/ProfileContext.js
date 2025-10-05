import React, { createContext, useContext, useEffect, useState } from "react";

const ProfileContext = createContext(null);
export function useProfile() { return useContext(ProfileContext); }

const PROFILE_KEY = "budgeteer:profile:v1";
const SURVEY_KEY_FALLBACK = "budgeteer:goals-survey:v1"; // for older local data

function hasSurveyData(s) {
  if (!s || typeof s !== "object") return false;
  const keys = ["goals", "focus_categories", "nudges", "time_horizon"];
  return keys.some(k => Array.isArray(s[k]) && s[k].length > 0);
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    try {
      // Prefer full profile (new)
      const rawProfile = localStorage.getItem(PROFILE_KEY);
      if (rawProfile) {
        setProfile(JSON.parse(rawProfile));
        return;
      }
      // Fallback: old survey-only storage
      const rawSurvey = localStorage.getItem(SURVEY_KEY_FALLBACK);
      if (rawSurvey) {
        const survey = JSON.parse(rawSurvey);
        setProfile({
          schema: "budgeteer.profile",
          version: 1,
          updatedAt: new Date().toISOString(),
          user: { id: null, email: null },
          meta: { completed: hasSurveyData(survey) }, // infer completion
          survey,
        });
      }
    } catch {}
  }, []);

  const setProfileAndPersist = (next) => {
    setProfile(next);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch {}
    // keep survey-only key in sync so older code (if any) keeps working
    if (next?.survey) {
      try { localStorage.setItem(SURVEY_KEY_FALLBACK, JSON.stringify(next.survey)); } catch {}
    }
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      setProfile: setProfileAndPersist,
      hasSurvey: hasSurveyData(profile?.survey),
      hasCompleted: !!profile?.meta?.completed,
      PROFILE_KEY,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}
