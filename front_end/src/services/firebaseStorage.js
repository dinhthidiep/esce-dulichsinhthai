import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
// Firebase Auth imports commented out - using public rules for now
// import { getCurrentFirebaseUser, waitForAuthState } from './firebaseAuth';

/**
 * Upload an image file to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder path in Firebase Storage (e.g., 'posts', 'comments')
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export const uploadImageToFirebase = async (file, folder = 'images') => {
  try {
    // Note: With public security rules, Firebase Auth is not required
    // If you switch to authenticated rules later, uncomment the auth check below
    /*
    // Ensure user is authenticated with Firebase Auth
    let firebaseUser = getCurrentFirebaseUser();
    if (!firebaseUser) {
      firebaseUser = await waitForAuthState();
      if (!firebaseUser) {
        throw new Error('Firebase Authentication required. Please log out and log back in to enable image uploads.');
      }
    }
    */

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only image files are allowed.');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);

    // Upload file (Firebase Storage will use the authenticated user automatically)
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Log the URL for debugging
    console.log('Firebase Storage download URL:', downloadURL);
    
    // Validate URL format
    if (!downloadURL.includes('/o/') || downloadURL.includes('o?name=')) {
      console.error('Invalid Firebase Storage URL format:', downloadURL);
      throw new Error('Invalid Firebase Storage URL format received');
    }
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    throw error;
  }
};

/**
 * Delete an image from Firebase Storage
 * @param {string} imageUrl - The full URL of the image to delete
 * @returns {Promise<void>}
 */
export const deleteImageFromFirebase = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('firebasestorage')) {
      console.warn('Invalid Firebase Storage URL:', imageUrl);
      return;
    }

    // Extract the path from the URL
    // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const urlParts = imageUrl.split('/o/');
    if (urlParts.length < 2) {
      console.warn('Could not extract path from Firebase URL:', imageUrl);
      return;
    }

    const pathWithQuery = urlParts[1].split('?')[0]; // Remove query parameters
    const decodedPath = decodeURIComponent(pathWithQuery);
    
    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image from Firebase:', error);
    // Don't throw - we don't want to fail the operation if file deletion fails
  }
};

/**
 * Extract Firebase Storage path from a full URL
 * @param {string} imageUrl - The full Firebase Storage URL
 * @returns {string|null} - The storage path or null if invalid
 */
export const extractFirebasePath = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('firebasestorage')) {
    return null;
  }

  try {
    const urlParts = imageUrl.split('/o/');
    if (urlParts.length < 2) {
      return null;
    }

    const pathWithQuery = urlParts[1].split('?')[0];
    return decodeURIComponent(pathWithQuery);
  } catch (error) {
    console.error('Error extracting Firebase path:', error);
    return null;
  }
};

