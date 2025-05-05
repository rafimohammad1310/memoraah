import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc } from "firebase/firestore";

export async function getProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getProductById(id: string) {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error("Product not found");
  }
}

export async function saveProduct(data: any, id: string | null = null) {
  if (id) {
    // Update existing product
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, data);
  } else {
    // Add new product
    await addDoc(collection(db, "products"), data);
  }
}