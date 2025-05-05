import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";

export async function checkAdminAccess(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        reject(new Error("User not authenticated"));
      }
    });
  });
}