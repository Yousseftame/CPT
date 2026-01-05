import { ref, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export const deleteFileByUrl = async (url: string) => {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
};
