"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";

interface UserProfile { [key: string]: unknown; cart?: { id: string; quantity: number }[] }
interface UserContextValue { user: User | null; profile: UserProfile | null; loading: boolean }
const UserContext = createContext<UserContextValue>({ user: null, profile: null, loading: true });

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileOwner, setProfileOwner] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (loading) {
      setProfileLoading(true);
    } else if (user) {
      setProfileLoading(true);
      getDoc(doc(db, "users", user.uid))
        .then((userDoc) => {
          if (active) {
            setProfile(userDoc.exists() ? userDoc.data() as UserProfile : null);
            setProfileOwner(user.uid);
          }
        })
        .catch((error) => {
          console.error("Failed to load user profile", error);
          if (active) { setProfile(null); setProfileOwner(user.uid); }
        })
        .finally(() => { if (active) setProfileLoading(false); });
    } else {
      setProfile(null);
      setProfileOwner(null);
      setProfileLoading(false);
    }
    return () => { active = false; };
  }, [user, loading]);

  return (
    <UserContext.Provider value={{ user, profile, loading: loading || profileLoading || Boolean(user && profileOwner !== user.uid) }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
