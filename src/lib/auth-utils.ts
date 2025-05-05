import { User, getAuth } from "firebase/auth";

// Check if current user is admin
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  
  try {
    // Get the auth instance
    const auth = getAuth();
    // Get the current user (fresh instance)
    const currentUser = auth.currentUser;
    
    if (!currentUser) return false;
    
    // Get the ID token result
    const idTokenResult = await currentUser.getIdTokenResult();
    return !!idTokenResult.claims.admin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}