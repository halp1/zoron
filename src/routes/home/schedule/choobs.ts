import type { aspen } from '$lib/aspen';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVoGkL5QTUBKvZa2s-UYjeAs8UOXQzQkI",
  authDomain: "schedule-app-763cd.firebaseapp.com",
  projectId: "schedule-app-763cd",
  storageBucket: "schedule-app-763cd.appspot.com",
  messagingSenderId: "820780212647",
  appId: "1:820780212647:web:3622afb5b9b3f0f10ed682",
  measurementId: "G-G2K5N8SF73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const updateChoobsSchedule = async (schedule: aspen.Types.Schedule.Schedule['schedule'], email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    throw new Error("Invalid choobs.app credentials");
  }
  const user = await getDoc(doc(db, "users", auth.currentUser?.uid!));
  if (!user.exists()) throw new Error("User not found");

	const classes: Record<string, [string, string]> = {};

  const nameRemap = {
    "Adolescent Health Issues II": "Health",
    "Adolescent Health Issues I": "Health",
    "AP United States History": "APUSH",
    "Homeroom/Advisory": "Advisory",
    "American Literature": "English"
  };

  schedule.forEach((block) => {
    if (block && block.schedule === "HR") block.block = "Adv";
    if (block && block.description in nameRemap) {
      block.description = nameRemap[block.description as keyof typeof nameRemap];
    }
    if (block) {
      classes[block.block] = [block.description, block.room];
    }
  });

  await setDoc(doc(db, "users", auth.currentUser!.uid), { classes }, { merge: true });
};
