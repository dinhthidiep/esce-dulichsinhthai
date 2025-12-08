import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

/**
 * Sign in to Firebase Auth using email and password
 * This should be called after successful backend login
 * If user doesn't exist, creates the account automatically
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<UserCredential>}
 */
export const signInToFirebase = async (email, password) => {
  try {
    // Try to sign in first
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase Auth sign-in successful:', userCredential.user.uid);
    return userCredential;
  } catch (error) {
    // If user doesn't exist (auth/user-not-found), create the account
    if (error.code === 'auth/user-not-found') {
      console.log('Firebase Auth user not found, creating account...');
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Firebase Auth account created:', userCredential.user.uid);
        return userCredential;
      } catch (createError) {
        console.error('Firebase Auth account creation error:', createError);
        throw createError;
      }
    } else {
      // For other errors (wrong password, etc.), throw the error
      console.error('Firebase Auth sign-in error:', error);
      throw error;
    }
  }
};

/**
 * Sign out from Firebase Auth
 */
export const signOutFromFirebase = async () => {
  try {
    await signOut(auth);
    console.log('Firebase Auth sign-out successful');
  } catch (error) {
    console.error('Firebase Auth sign-out error:', error);
    throw error;
  }
};

/**
 * Get current Firebase Auth user
 * @returns {User|null}
 */
export const getCurrentFirebaseUser = () => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated with Firebase
 * @returns {boolean}
 */
export const isFirebaseAuthenticated = () => {
  return auth.currentUser !== null;
};

/**
 * Wait for Firebase Auth state to be determined
 * @returns {Promise<User|null>}
 */
export const waitForAuthState = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * Try to sign in to Firebase Auth if user is already logged in to backend
 * This is called on app load for users who are already authenticated
 * Note: This requires the password, which we don't store for security
 * For now, this will only work if user logs in fresh
 * @param {string} email - User email from localStorage
 * @returns {Promise<boolean>} - True if signed in, false otherwise
 */
export const tryAutoSignIn = async (email) => {
  // We can't auto-sign in without password
  // This is a placeholder - in production, you'd use custom tokens from backend
  // For now, return false and let the user sign in through normal login flow
  return false;
};

