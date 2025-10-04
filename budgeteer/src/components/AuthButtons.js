import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function AuthButtons() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user } = useAuth0();

  if (isLoading) return <button disabled>Loading…</button>;

  return isAuthenticated ? (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <span>Hi, {user?.name || "user"} 👋</span>
      <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
        Log out
      </button>
    </div>
  ) : (
    <button onClick={() => loginWithRedirect()}>Log in</button>
  );
}