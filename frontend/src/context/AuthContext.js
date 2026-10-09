import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

// Any component can call useAuth() to get { session, startSession, endSession }.
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
