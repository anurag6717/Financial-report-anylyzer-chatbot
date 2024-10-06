// firebaseAuth.js
import { GoogleAuthProvider,getAuth, signInWithPopup, signOut } from 'firebase/auth';
import { app, db } from '../firebase/firebase.init';
import { collection, getDoc, doc, setDoc } from 'firebase/firestore';

// Initialize Firebase auth
export const auth = getAuth(app);

// Google Sign-In Provider
const googleProvider = new GoogleAuthProvider();


// Function to store user data in Firestore
const storeUserData = async (user) => {
  const userRef = collection(db, 'users');
  const userDoc = await getDoc(doc(userRef, user.uid));

  if (!userDoc.exists()) {
    // Create a new document if it doesn't exist
    await setDoc(doc(userRef, user.uid), {
      displayName: user.displayName,
      email: user.email,
      // Add other user data as needed
    });
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const loggedInUser = result.user;
    await storeUserData(loggedInUser);
    return loggedInUser;
  } catch (error) {
    throw new Error(error.message);
  }
};



// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};