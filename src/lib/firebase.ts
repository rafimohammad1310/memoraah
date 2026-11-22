export { auth, db, storage } from "@/firebase/config";
import { doc } from "firebase/firestore";
import { db } from "@/firebase/config";

export const getUserDocRef = (userId: string) => doc(db, "users", userId);
