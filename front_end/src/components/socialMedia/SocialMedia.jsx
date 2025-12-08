import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SocialMedia.css';
import { getAllPosts, createPost as apiCreatePost, createComment as apiCreateComment, createReaction as apiCreateReaction, deleteReaction as apiDeleteReaction, getCurrentUser, getCommentsByPostId, deletePost as apiDeletePost, deleteComment as apiDeleteComment, savePost as apiSavePost, unsavePost as apiUnsavePost, updatePost as apiUpdatePost, updateComment as apiUpdateComment, getPostById as apiGetPostById, getSavedPostIds as apiGetSavedPostIds } from '../../api/SocialMediaApi';
import Header from '../Header';
import Sidebar from '../Sidebar';

// Default avatar from Firebase Storage
const DEFAULT_AVATAR_URL = 'https://firebasestorage.googleapis.com/v0/b/esce-a4b58.firebasestorage.app/o/default%2Fstock_nimg.jpg?alt=media&token=623cc75c-6625-4d18-ab1e-ff5ca18b49a1';

const SocialMedia = () => {
  const navigate = useNavigate();
  const backendUrl = "http://localhost:7267";
  // State management
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const [newPostTitle, setNewPostTitle] = useState(''); // Post title
  const [newPostText, setNewPostText] = useState(''); // Post content
  const [pendingImages, setPendingImages] = useState([]); // Base64 previews for display
  const [pendingImageFiles, setPendingImageFiles] = useState([]); // File objects to send to backend
  const [isSubmittingPost, setIsSubmittingPost] = useState(false); // Prevent duplicate submissions
  const [commentInputs, setCommentInputs] = useState({}); // Key: postId
  const [commentImages, setCommentImages] = useState({}); // Store base64 previews for each comment input by postId (for display only)
  const [commentImageFiles, setCommentImageFiles] = useState({}); // Store File objects for each comment input by postId (to send to backend)
  const [replyInputs, setReplyInputs] = useState({}); // Key: `${postId}-${commentId}`
  const [replyImages, setReplyImages] = useState({}); // Store base64 previews for each reply input (for display only)
  const [replyImageFiles, setReplyImageFiles] = useState({}); // Store File objects for each reply input (to send to backend)
  const [visibleReplies, setVisibleReplies] = useState({}); // Key: `${postId}-${commentId}`
  const [visibleComments, setVisibleComments] = useState({});
  const [hoverTimeouts, setHoverTimeouts] = useState({});
  const [commentHoverTimeouts, setCommentHoverTimeouts] = useState({}); // For comment reaction menus
  const [commentHideTimeouts, setCommentHideTimeouts] = useState({}); // For delayed hiding of comment reaction menus
  const [loadedComments, setLoadedComments] = useState({}); // Store loaded comments for each post
  const [userId, setUserId] = useState(3); // Default user ID for testing
  const [userInfo, setUserInfo] = useState(null); // Current user info
  const [filterType, setFilterType] = useState('newest'); // Filter type: 'newest', 'oldest', 'hottest'
  const [postFilter, setPostFilter] = useState('all'); // Post filter: 'all', 'yours'
  const [showSavedPosts, setShowSavedPosts] = useState(false); // Toggle for viewing saved posts
  const [sidebarActive, setSidebarActive] = useState(false);
  const [showPostSuccessMessage, setShowPostSuccessMessage] = useState(false); // Show success message after post creation
  const [openPostMenu, setOpenPostMenu] = useState(null); // Track which post's menu is open (postId or null)
  const [savedPosts, setSavedPosts] = useState(new Set()); // Track which posts are saved by current user (Set of post IDs)
  const [postSavesCount, setPostSavesCount] = useState({}); // Track savesCount for each post (postId -> count)
  const [editingPostId, setEditingPostId] = useState(null); // Track which post is being edited
  const [editPostTitle, setEditPostTitle] = useState(''); // Edit post title
  const [editPostText, setEditPostText] = useState(''); // Edit post content
  const [editPostImageFile, setEditPostImageFile] = useState(null); // Edit post image file
  const [editPostImagePreview, setEditPostImagePreview] = useState(null); // Edit post image preview
  const editPostFileInputRef = useRef(null); // Ref for edit post file input
  const [editingCommentId, setEditingCommentId] = useState(null); // Track which comment is being edited (format: `${postId}-${commentId}`)
  const [editingReplyId, setEditingReplyId] = useState(null); // Track which reply is being edited (format: `${postId}-${commentId}-${replyId}`)
  const [editCommentInputs, setEditCommentInputs] = useState({}); // Edit comment inputs (key: `${postId}-${commentId}` or `${postId}-${commentId}-${replyId}`)
  const [editCommentImages, setEditCommentImages] = useState({}); // Edit comment image previews
  const [editCommentImageFiles, setEditCommentImageFiles] = useState({}); // Edit comment image files

  const toggleSidebar = () => setSidebarActive(!sidebarActive);

  const fileInputRef = useRef(null);
  const commentFileInputRefs = useRef({}); // Store refs for each comment input by postId
  const replyFileInputRefs = useRef({}); // Store refs for each reply input by `${postId}-${commentId}`

  // Format reaction counts in Vietnamese
  const formatReactionCounts = (reactionCounts) => {
    if (!reactionCounts || Object.keys(reactionCounts).length === 0) {
      return null;
    }

    const reactionLabels = {
      'like': 'thích',
      'dislike': 'không thích',
      'love': 'thương',
      'haha': 'haha',
      'wow': 'wow',
      'angry': 'tức giận'
    };

    const parts = [];
    const order = ['like', 'dislike', 'love', 'haha', 'wow', 'angry'];
    
    for (const type of order) {
      if (reactionCounts[type] && reactionCounts[type] > 0) {
        const label = reactionLabels[type] || type;
        parts.push(`${reactionCounts[type]} ${label}`);
      }
    }

    return parts.length > 0 ? parts.join(', ') : null;
  };


  // Fetch saved post IDs separately
  const fetchSavedPostIds = async () => {
    try {
      const savedPostIds = await apiGetSavedPostIds();
      const savedPostIdsSet = new Set(savedPostIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id));
      // Set state immediately - this will trigger a re-render
      setSavedPosts(savedPostIdsSet);
      console.log('Fetched saved post IDs:', Array.from(savedPostIdsSet));
      return savedPostIdsSet;
    } catch (err) {
      console.error('Error fetching saved post IDs:', err);
      setSavedPosts(new Set()); // Set empty set on error
      return new Set();
    }
  };

  // Fetch posts from backend
  const fetchPosts = async (userFilter = null, showSaved = null) => {
    // Use provided filter or current state
    const activeFilter = userFilter !== null ? userFilter : postFilter;
    const activeShowSaved = showSaved !== null ? showSaved : showSavedPosts;
    try {
      setLoading(true);
      
      // Fetch all posts and saved post IDs in parallel
      const [postsData, savedPostIdsSet] = await Promise.all([
        getAllPosts(),
        fetchSavedPostIds()
      ]);
      
      // Note: savedPosts state is already set inside fetchSavedPostIds()
      // This savedPostIdsSet is used for filtering, but the state is what the UI uses

      // Transform backend data to frontend format
      // Backend returns PostResponseDto with: PostId, PostContent, Images, PosterName, PosterId, PostTitle, PublicDate, Likes, Comments, Status
      const publicUrl = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
      
      const transformedPosts = postsData.map(post => {
        // Process images - backend returns Firebase Storage URLs or old filenames
        let images = [];
        if (post.Images && post.Images.length > 0) {
          images = post.Images
            .filter(img => img && img.trim()) // Filter out empty strings
            .map(img => {
              const imgName = img.trim();
              
              // Skip base64 images (old posts) - they are no longer supported
              if (imgName.startsWith('data:image')) {
                return null; // Filter out old base64 images
              }
              
              // Check if it's a Firebase Storage URL (full URL)
              if (imgName.startsWith('https://') && imgName.includes('firebasestorage')) {
                // Validate URL format - reject malformed URLs with o?name= format
                if (imgName.includes('/o?name=')) {
                  console.error('Malformed Firebase Storage URL detected (o?name= format):', imgName);
                  return null; // Filter out malformed URLs
                }
                
                // Ensure URL has the correct format: /o/{path}?alt=media
                if (!imgName.includes('/o/')) {
                  console.error('Invalid Firebase Storage URL format (missing /o/):', imgName);
                  return null; // Filter out invalid URLs
                }
                
                return {
                  src: imgName,
                  candidates: [imgName]
                };
              }
              
              // Old local filename - construct URLs for backward compatibility
              if (imgName.length <= 200) {
                const candidates = [
                  `${backendUrl}/images/${imgName}`,
                  `${backendUrl}/img/uploads/${imgName}`,
                  `${publicUrl}/img/uploads/${imgName}`
                ];
                
                return {
                  src: candidates[0] || '/img/stock_nimg.jpg',
                  candidates: candidates.length > 0 ? candidates : ['/img/stock_nimg.jpg']
                };
              }
              
              return null;
            })
            .filter(img => img !== null); // Filter out null entries
        }
        
        // Parse PublicDate to Date object
        let createdAt = new Date();
        if (post.PublicDate) {
          // Format: "dd/MM/yyyy HH:mm"
          const dateParts = post.PublicDate.split(' ');
          if (dateParts.length === 2) {
            const [datePart, timePart] = dateParts;
            const [day, month, year] = datePart.split('/');
            const [hour, minute] = timePart.split(':');
            createdAt = new Date(year, month - 1, day, hour, minute);
          }
        }
        
        // Limit to only 1 image since program only supports 1
        const limitedImages = images.length > 0 ? [images[0]] : [];
        
        // Process poster avatar - backend returns filename, not base64
        let posterAvatarUrl = '/img/stock_nimg.jpg'; // Default
        const posterAvatarFileName = post.PosterAvatar || null;
        if (posterAvatarFileName && posterAvatarFileName.trim() !== '') {
          // Skip base64 avatars (old data) - they are no longer supported
          if (!posterAvatarFileName.startsWith('data:image') && posterAvatarFileName.length <= 200) {
            // Construct URL from filename (same as comment avatars)
            posterAvatarUrl = `${backendUrl}/images/${posterAvatarFileName}`;
          }
        }
        
        const postId = parseInt(post.PostId) || 0;
        const savesCount = post.SavesCount || 0;
        
        return {
          id: postId,
          username: post.PosterName || 'Unknown',
          authorId: parseInt(post.PosterId) || 0,
          avatar: posterAvatarUrl,
          images: limitedImages, // Array of image objects with src and candidates (max 1)
          image: limitedImages.length > 0 ? limitedImages[0].src : null, // First image src for backward compatibility
          text: post.PostContent || '',
          title: post.PostTitle || '',
          reaction: post.CurrentUserReaction || null, // Current user's reaction type
          comments: post.Comments || [], // Backend provides comments
          createdAt: createdAt,
          commentsCount: post.Comments ? post.Comments.length : 0,
          reactionsCount: post.Likes ? post.Likes.length : 0,
          reactionCounts: post.ReactionCounts || {}, // Reaction counts by type from backend
          status: post.Status || 'Pending', // Include status from backend
          savesCount: savesCount // Include saves count from backend
        };
      });

      // Filter out posts with "pending" status
      let filteredPosts = transformedPosts.filter(post => {
        const status = (post.status || '').toLowerCase();
        return status !== 'pending';
      });

      // Filter by saved posts if toggle is active
      if (activeShowSaved) {
        filteredPosts = filteredPosts.filter(post => savedPostIdsSet.has(post.id));
      }
      
      // Filter by user - "Của bạn" shows only user's posts, "Tất cả" shows all posts
      // Note: Don't apply user filter when showing saved posts
      if (!activeShowSaved && activeFilter !== 'all') {
        // Show only posts by current user when "Của bạn" is selected
        filteredPosts = filteredPosts.filter(post => {
          const postAuthorId = typeof post.authorId === 'string' ? parseInt(post.authorId, 10) : post.authorId;
          const currentUserIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
          return postAuthorId === currentUserIdNum;
        });
      }

      // Sort posts based on filter type
      const sortedPosts = sortPosts(filteredPosts, filterType);
      setPosts(sortedPosts);
      
      // Initialize saves count from backend data
      const initialSavesCount = {};
      sortedPosts.forEach(post => {
        initialSavesCount[post.id] = post.savesCount || 0;
      });
      setPostSavesCount(prev => ({ ...prev, ...initialSavesCount }));
      
      setError(null);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sort posts based on filter type
  const sortPosts = (posts, filter) => {
    const sorted = [...posts];
    switch (filter) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA; // Newest first
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateA - dateB; // Oldest first
        });
      case 'hottest':
        return sorted.sort((a, b) => {
          const reactionsA = a.reactionsCount || 0;
          const reactionsB = b.reactionsCount || 0;
          return reactionsB - reactionsA; // Most reactions first
        });
      default:
        return sorted;
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    const sortedPosts = sortPosts(posts, newFilter);
    setPosts(sortedPosts);
  };

  // Handle post filter change (all/yours)
  const handlePostFilterChange = (newFilter) => {
    setPostFilter(newFilter);
    // Refetch posts when filter changes, passing the new filter value directly
    fetchPosts(newFilter);
  };

  // Create new post
  const createPost = async (postData) => {
    try {
      await apiCreatePost({
        title: postData.title,
        text: postData.text,
        image: postData.image
      });

      // Don't refresh posts - new posts are pending and will be filtered out
      // Success message will be shown instead
      return true;
    } catch (err) {
      console.error('Error creating post:', err);
      alert(`Không thể đăng bài: ${err.message || 'Có lỗi xảy ra'}`);
      return false;
    }
  };

  // Create comment (top-level or reply)
  const createComment = async (postId, commentText, parentCommentId = null) => {
    const text = commentText?.trim() || '';
    // Get File objects for comments (not base64 previews)
    const imageFiles = parentCommentId 
      ? (replyImageFiles[`${postId}-${parentCommentId}`] || [])
      : (commentImageFiles[postId] || []);
    
    if (!text && imageFiles.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn ảnh!');
      return false;
    }

    try {
      const newComment = await apiCreateComment({
        postId: postId,
        parentCommentId: parentCommentId,
        content: text,
        image: imageFiles.length > 0 ? imageFiles[0] : null // Send File object, not base64
      });

      // Transform the new comment to match our format
      const transformedComment = {
        id: newComment.Id,
        authorId: newComment.AuthorId,
        authorName: newComment.AuthorName,
        authorAvatar: (() => {
          // Process avatar from new comment response
          const avatarFileName = newComment.AuthorAvatar || newComment.authorAvatar || null;
          if (avatarFileName && avatarFileName.trim() !== '' && !avatarFileName.startsWith('data:image') && avatarFileName.length <= 200) {
            return `${backendUrl}/images/${avatarFileName}`;
          }
          return '/img/stock_nimg.jpg';
        })(),
        content: newComment.Content,
        image: newComment.Image ? (newComment.Image.startsWith('data:image') || newComment.Image.length > 200 ? null : `${backendUrl}/images/${newComment.Image}`) : null,
        parentCommentId: newComment.ParentCommentId,
        createdAt: newComment.CreatedAt,
        reactionsCount: 0,
        reactionCounts: {},
        currentUserReaction: null,
        replies: []
      };

      // Clear inputs and images
      if (parentCommentId) {
        // Clear reply input and images
        setReplyInputs(prev => {
          const updated = { ...prev };
          delete updated[`${postId}-${parentCommentId}`];
          return updated;
        });
        setReplyImages(prev => {
          const updated = { ...prev };
          delete updated[`${postId}-${parentCommentId}`];
          return updated;
        });
        setReplyImageFiles(prev => {
          const updated = { ...prev };
          delete updated[`${postId}-${parentCommentId}`];
          return updated;
        });
        
        // Clear file input
        const ref = replyFileInputRefs.current[`${postId}-${parentCommentId}`];
        if (ref) {
          ref.value = '';
        }
      } else {
        // Clear the input and images
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setCommentImages(prev => ({ ...prev, [postId]: [] }));
        setCommentImageFiles(prev => ({ ...prev, [postId]: [] }));
        
        // Clear file input
        const ref = commentFileInputRefs.current[postId];
        if (ref) {
          ref.value = '';
        }
      }

      // Silently refresh comments from backend in background (no loading state)
      getCommentsByPostId(postId).then(comments => {
        const commentsArray = Array.isArray(comments) ? comments : [];
        const transformedComments = transformComments(commentsArray);
        
        setLoadedComments(prev => ({
          ...prev,
          [postId]: transformedComments
        }));
      }).catch(error => {
        console.error('Error refreshing comments after creating reply:', error);
        // If refresh fails, try to add locally as fallback
        if (parentCommentId) {
          const updateParentReplies = (comments, parentId, newReply) => {
            for (let i = 0; i < comments.length; i++) {
              if (comments[i].id === parentId) {
                const updated = [...comments];
                updated[i] = {
                  ...updated[i],
                  replies: [...(updated[i].replies || []), newReply]
                };
                return updated;
              }
              if (comments[i].replies && comments[i].replies.length > 0) {
                const updatedReplies = updateParentReplies(comments[i].replies, parentId, newReply);
                if (updatedReplies) {
                  const updated = [...comments];
                  updated[i] = {
                    ...updated[i],
                    replies: updatedReplies
                  };
                  return updated;
                }
              }
            }
            return null;
          };

          setLoadedComments(prev => {
            const updated = { ...prev };
            const postComments = [...(updated[postId] || [])];
            const updatedComments = updateParentReplies(postComments, parentCommentId, transformedComment);
            if (updatedComments) {
              updated[postId] = updatedComments;
            }
            return updated;
          });
        } else {
          setLoadedComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), transformedComment]
          }));
        }
      });

      // Silently refresh posts in background to update comment count (no loading state)
      getAllPosts().then(postsData => {
        const transformedPosts = postsData.map(post => {
          // Process images - backend returns filenames only
          let images = [];
          if (post.Images && post.Images.length > 0) {
            images = post.Images
              .filter(img => img && img.trim()) // Filter out empty strings
              .map(img => {
                const imgName = img.trim();
                
                // Skip base64 images (old posts) - they are no longer supported
                if (imgName.startsWith('data:image') || imgName.length > 200) {
                  return null; // Filter out old base64 images
                }
                
                // Treat as filename - construct URLs
                const candidates = [
                  `${backendUrl}/images/${imgName}`,
                  `${backendUrl}/img/uploads/${imgName}`,
                  `/img/uploads/${imgName}`
                ];
                
                return {
                  src: candidates[0] || '/img/stock_nimg.jpg',
                  candidates: candidates.length > 0 ? candidates : ['/img/stock_nimg.jpg']
                };
              })
              .filter(img => img !== null); // Filter out null entries
          }
          
          // Limit to only 1 image since program only supports 1
          const limitedImages = images.length > 0 ? [images[0]] : [];
          
          // Process poster avatar - backend returns filename, not base64
          let posterAvatarUrl = '/img/stock_nimg.jpg'; // Default
          const posterAvatarFileName = post.PosterAvatar || null;
          if (posterAvatarFileName && posterAvatarFileName.trim() !== '') {
            // Skip base64 avatars (old data) - they are no longer supported
            if (!posterAvatarFileName.startsWith('data:image') && posterAvatarFileName.length <= 200) {
              // Construct URL from filename (same as comment avatars)
              posterAvatarUrl = `${backendUrl}/images/${posterAvatarFileName}`;
            }
          }
          
          return {
            id: parseInt(post.PostId) || 0,
            username: post.PosterName || 'Unknown',
            authorId: parseInt(post.PosterId) || 0,
            avatar: posterAvatarUrl,
            images: limitedImages, // Array of image objects with src and candidates (max 1)
            image: limitedImages.length > 0 ? limitedImages[0].src : null, // First image src for backward compatibility
            text: post.PostContent || '',
            title: post.PostTitle || '',
          reaction: post.CurrentUserReaction || null,
          comments: [],
            createdAt: post.PublicDate ? (() => {
              // Parse PublicDate to Date object
              const dateParts = post.PublicDate.split(' ');
              if (dateParts.length === 2) {
                const [datePart, timePart] = dateParts;
                const [day, month, year] = datePart.split('/');
                const [hour, minute] = timePart.split(':');
                return new Date(year, month - 1, day, hour, minute);
              }
              return new Date();
            })() : new Date(),
            commentsCount: post.Comments ? post.Comments.length : 0,
            reactionsCount: post.Likes ? post.Likes.length : 0,
            reactionCounts: post.ReactionCounts || {},
            status: post.Status || 'Pending' // Include status from backend
          };
        });
        
        // Filter out posts with "pending" status
        let filteredPosts = transformedPosts.filter(post => {
          const status = (post.status || '').toLowerCase();
          return status !== 'pending';
        });
        
        // Filter by user if "Của bạn" is selected
        if (postFilter !== 'all') {
          filteredPosts = filteredPosts.filter(post => {
            const postAuthorId = typeof post.authorId === 'string' ? parseInt(post.authorId, 10) : post.authorId;
            const currentUserIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
            return postAuthorId === currentUserIdNum;
          });
        }
        
        const sortedPosts = sortPosts(filteredPosts, filterType);
        setPosts(sortedPosts);
      }).catch(err => {
        console.error('Error refreshing posts after comment:', err);
      });
      return true;
    } catch (err) {
      console.error('Error creating comment:', err);
      alert('Không thể bình luận. Vui lòng thử lại.');
      return false;
    }
  };

  // Create or update reaction
  const createReaction = async (targetType, targetId, reactionType) => {
    try {
      const response = await apiCreateReaction({
        targetType: targetType,
        targetId: targetId,
        reactionType: reactionType
      });

      // Return the response so caller can check if it was successful
      return response;
    } catch (err) {
      console.error('Error creating reaction:', err);
      // Re-throw the error so caller can handle it
      throw err;
    }
  };

  // Delete reaction
  const deleteReaction = async (targetType, targetId) => {
    try {
      await apiDeleteReaction(targetType, targetId);

      // Refresh posts to show updated reaction count
      await fetchPosts();
      return true;
    } catch (err) {
      console.error('Error deleting reaction:', err);
      return false;
    }
  };

  // Function to load user info from localStorage and API
  const loadUserInfo = async (forceRefresh = false) => {
    // First try to get from localStorage (fast)
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        const user = JSON.parse(storedUserInfo);
        console.log('Loaded userInfo from localStorage:', user);
        setUserInfo(user);
        if (user.Id || user.id) {
          setUserId(user.Id || user.id);
        }
      } catch (err) {
        console.error('Error parsing user info:', err);
      }
    } else {
      console.log('No userInfo found in localStorage');
    }

    // Then fetch fresh data from API to ensure we have the latest avatar
    // Only fetch if we don't have userInfo or if we want to refresh
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        console.log('Fetched current user:', currentUser);
        console.log('Avatar value:', currentUser.Avatar || currentUser.avatar);
        setUserInfo(currentUser);
        if (currentUser.Id || currentUser.id) {
          setUserId(currentUser.Id || currentUser.id);
        }
        // Update localStorage with fresh data
        localStorage.setItem('userInfo', JSON.stringify(currentUser));
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      // If API fails, keep using localStorage data - don't throw, just log
      // The component will continue to work with localStorage data
    }
  };

  // Load user info on component mount
  useEffect(() => {
    loadUserInfo();
  }, []);

  // Reload userInfo when window gets focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      // Reload from localStorage first (fast)
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          const user = JSON.parse(storedUserInfo);
          setUserInfo(user);
          if (user.Id || user.id) {
            setUserId(user.Id || user.id);
          }
        } catch (err) {
          console.error('Error parsing user info on focus:', err);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Listen for custom event when profile is updated
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('Profile updated event received, reloading userInfo...');
      loadUserInfo(true);
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  // Check Firebase Auth on component mount for users already logged in
  useEffect(() => {
    const checkFirebaseAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // User is logged in to backend
        try {
          const { getCurrentFirebaseUser, waitForAuthState } = await import('../../services/firebaseAuth');
          let firebaseUser = getCurrentFirebaseUser();
          if (!firebaseUser) {
            firebaseUser = await waitForAuthState();
          }
          if (!firebaseUser) {
            // User is logged in to backend but not Firebase Auth
            // This happens for users who logged in before Firebase Auth was integrated
            console.warn('User is logged in to backend but not Firebase Auth. Image uploads will require re-login.');
          }
        } catch (err) {
          console.error('Error checking Firebase Auth:', err);
        }
      }
    };
    checkFirebaseAuth();
  }, []);

  // Load posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Close post menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openPostMenu !== null) {
        const menuElement = document.getElementById(`post-menu-${openPostMenu}`);
        const buttonElement = document.getElementById(`post-menu-btn-${openPostMenu}`);
        if (menuElement && !menuElement.contains(event.target) && 
            buttonElement && !buttonElement.contains(event.target)) {
          setOpenPostMenu(null);
        }
      }
    };

    if (openPostMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openPostMenu]);

  // Utility functions
  const escapeHtml = (text) => {
    return text;
  };

  const getReactionIcon = (reaction) => {
    const icons = {
      'like': '👍',
      'dislike': '👎',
      'love': '❤️',
      'haha': '😂',
      'wow': '😮'
    };
    return reaction ? icons[reaction] : '👍';
  };

  const getReactionText = (reaction) => {
    const texts = {
      'like': 'Thích',
      'dislike': 'Không thích',
      'love': 'Thương',
      'haha': 'Haha',
      'wow': 'Wow'
    };
    return reaction ? texts[reaction] : 'Thích';
  };

  // Event handlers
  const handleReaction = async (postId, reactionType) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const currentReaction = post.reaction;
    
    // Optimistically update local state
    const updatePostReaction = (posts, postId, newReaction) => {
      return posts.map(p => {
        if (p.id === postId) {
          const oldReaction = p.reaction;
          let newReactionsCount = p.reactionsCount || 0;
          const newReactionCounts = { ...(p.reactionCounts || {}) };
          
          // Calculate new counts based on toggle logic
          // If clicking the same reaction type, it will be toggled off
          if (oldReaction === reactionType) {
            // Toggle off - remove reaction
            newReactionsCount = Math.max(0, newReactionsCount - 1);
            if (newReactionCounts[oldReaction]) {
              newReactionCounts[oldReaction] = Math.max(0, newReactionCounts[oldReaction] - 1);
            }
            newReaction = null;
          } else {
            // Toggle on or change reaction type
            // Remove old reaction count if exists
            if (oldReaction) {
              newReactionsCount = Math.max(0, newReactionsCount - 1);
              if (newReactionCounts[oldReaction]) {
                newReactionCounts[oldReaction] = Math.max(0, newReactionCounts[oldReaction] - 1);
              }
            }
            // Add new reaction count
            newReactionsCount += 1;
            newReactionCounts[reactionType] = (newReactionCounts[reactionType] || 0) + 1;
            newReaction = reactionType;
          }
          
          return {
            ...p,
            reaction: newReaction,
            reactionsCount: newReactionsCount,
            reactionCounts: newReactionCounts
          };
        }
        return p;
      });
    };

    // Determine new reaction state (backend handles toggle, but we need to predict for UI)
    let newReaction = null;
    if (currentReaction === reactionType) {
      // Same reaction clicked - will be toggled off
      newReaction = null;
    } else {
      // Different reaction or no reaction - will be set to this type
      newReaction = reactionType;
    }

    // Update UI immediately
    setPosts(prevPosts => {
      const updated = updatePostReaction(prevPosts, postId, newReaction);
      return sortPosts(updated, filterType);
    });

    // Always call createReaction - backend handles toggle logic
    // If same reaction type exists, backend will delete it
    // If different reaction type exists, backend will update it
    // If no reaction exists, backend will create it
    createReaction('POST', postId, reactionType)
      .then(response => {
        // Verify the API call was successful
        if (!response) {
          console.error('Reaction API returned no response');
          // Revert optimistic update if no response
          setPosts(prevPosts => {
            const updated = updatePostReaction(prevPosts, postId, currentReaction);
            return sortPosts(updated, filterType);
          });
          return;
        }
        
        // Backend returns { deleted: true }, { updated: true }, or { created: true }
        // Optimistic update already applied, but verify backend confirmed it
        console.log('Reaction created successfully:', response);
      })
      .catch(err => {
        console.error('Error creating reaction:', err);
        
        // Always revert optimistic update on error
        setPosts(prevPosts => {
          const updated = updatePostReaction(prevPosts, postId, currentReaction);
          return sortPosts(updated, filterType);
        });
        
        // Check if it's a unique constraint error (user already reacted)
        const errorMessage = err?.message || err?.details?.message || '';
        if (errorMessage.includes('đã reaction') || 
            errorMessage.includes('already') || 
            errorMessage.includes('unique') ||
            errorMessage.includes('đã thích') ||
            errorMessage.includes('already liked')) {
          // User already has a reaction - refresh to get current state
          fetchPosts().catch(refreshErr => {
            console.error('Error refreshing posts after reaction error:', refreshErr);
          });
        } else if (errorMessage.includes('saving the entity changes') ||
                   errorMessage.includes('inner exception') ||
                   errorMessage.includes('database')) {
          // Hiển thị thông báo lỗi thân thiện hơn
          alert('Không thể lưu thay đổi. Vui lòng thử lại sau.');
        }
      });
  };

  // Helper function to transform comment from API response
  const transformComment = (comment) => {
    // Handle both PascalCase (from backend) and camelCase (from JSON serialization)
    // Check for replies in both cases
    let replies = comment.Replies || comment.replies;
    if (!replies) {
      replies = [];
    }
    
    // Debug logging
    if (replies && replies.length > 0) {
      console.log(`Comment ${comment.Id || comment.id} has ${replies.length} replies:`, replies);
    }
    
    // Process image - backend now returns filename, not base64
    const imageFileName = comment.Image || comment.image || null;
    let imageUrl = null;
    if (imageFileName) {
      // Skip base64 images (old comments) - they are no longer supported
      if (!imageFileName.startsWith('data:image') && imageFileName.length <= 200) {
        // Construct URL from filename
        imageUrl = `${backendUrl}/images/${imageFileName}`;
      }
    }
    
    // Extract author info from nested Author object (raw Comment entity)
    const author = comment.Author || comment.author || null;
    const authorName = author?.Name || author?.name || comment.AuthorName || comment.authorName || 'Unknown';
    
    // Process avatar - backend returns filename like "5cc3e441-95ed-4c64-bd06-e1371f6dff13.jpg"
    let authorAvatarUrl = '/img/stock_nimg.jpg'; // Default
    const avatarFileName = author?.Avatar || author?.avatar || comment.AuthorAvatar || comment.authorAvatar || null;
    if (avatarFileName && avatarFileName.trim() !== '') {
      // Skip base64 avatars (old data) - they are no longer supported
      // Also skip if it looks like a full URL (shouldn't happen, but defensive)
      if (!avatarFileName.startsWith('data:image') && 
          !avatarFileName.startsWith('http://') && 
          !avatarFileName.startsWith('https://') &&
          !avatarFileName.startsWith('/') &&
          avatarFileName.length <= 200) {
        // Construct URL from filename (same as post/comment images)
        // Filename should be like "5cc3e441-95ed-4c64-bd06-e1371f6dff13.jpg"
        authorAvatarUrl = `${backendUrl}/images/${avatarFileName}`;
      }
    }
    
    const transformed = {
      id: comment.Id || comment.id,
      authorId: comment.AuthorId || comment.authorId,
      authorName: authorName,
      authorAvatar: authorAvatarUrl,
      content: comment.Content || comment.content,
      image: imageUrl,
      parentCommentId: comment.ParentCommentId || comment.parentCommentId || null,
      createdAt: comment.CreatedAt || comment.createdAt,
      reactionsCount: comment.ReactionsCount || comment.reactionsCount || 0,
      reactionCounts: comment.ReactionCounts || comment.reactionCounts || {},
      currentUserReaction: comment.CurrentUserReaction || comment.currentUserReaction || null,
      replies: Array.isArray(replies) ? replies.map(transformComment) : []
    };
    
    return transformed;
  };

  // Helper function to transform flat comments list into nested structure
  const transformComments = (comments) => {
    // First, transform all comments
    const transformed = comments.map(transformComment);
    
    // Build nested structure: group replies under their parent comments
    const commentMap = new Map();
    const topLevelComments = [];
    
    // First pass: create map of all comments
    transformed.forEach(comment => {
      // Create a new object with replies array to avoid reference issues
      commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass: build nested structure
    transformed.forEach(comment => {
      if (comment.parentCommentId) {
        // This is a reply - add it to its parent's replies array
        const parent = commentMap.get(comment.parentCommentId);
        const replyComment = commentMap.get(comment.id);
        if (parent && replyComment) {
          // Ensure we're not adding duplicates
          if (!parent.replies.some(r => r.id === replyComment.id)) {
            parent.replies.push(replyComment);
          }
        }
      } else {
        // This is a top-level comment
        const topComment = commentMap.get(comment.id);
        if (topComment && !topLevelComments.some(c => c.id === topComment.id)) {
          topLevelComments.push(topComment);
        }
      }
    });
    
    return topLevelComments;
  };

  // Handle comment reaction - same logic as post reactions
  const handleCommentReaction = async (postId, commentId, reactionType) => {
    // Find comment in nested structure
    const findAndUpdateComment = (comments, id, updateFn) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].id === id) {
          const updated = [...comments];
          updated[i] = updateFn(updated[i]);
          return updated;
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
          const updatedReplies = findAndUpdateComment(comments[i].replies, id, updateFn);
          if (updatedReplies) {
            const updated = [...comments];
            updated[i] = {
              ...updated[i],
              replies: updatedReplies
            };
            return updated;
          }
        }
      }
      return null;
    };

    const comments = loadedComments[postId] || [];
    const comment = findAndUpdateComment(comments, commentId, c => c);
    if (!comment) return;

    const currentReaction = comment.currentUserReaction;
    
    // Determine new reaction state (backend handles toggle, but we need to predict for UI)
    let newReaction = null;
    if (currentReaction === reactionType) {
      // Same reaction clicked - will be toggled off
      newReaction = null;
    } else {
      // Different reaction or no reaction - will be set to this type
      newReaction = reactionType;
    }

    // Update UI immediately
    const updatedComments = findAndUpdateComment(comments, commentId, (c) => {
      const oldReaction = c.currentUserReaction;
      let newReactionsCount = c.reactionsCount || 0;
      const newReactionCounts = { ...(c.reactionCounts || {}) };
      
      // Calculate new counts based on toggle logic
      if (oldReaction === reactionType) {
        // Toggle off - remove reaction
        newReactionsCount = Math.max(0, newReactionsCount - 1);
        if (newReactionCounts[oldReaction]) {
          newReactionCounts[oldReaction] = Math.max(0, newReactionCounts[oldReaction] - 1);
        }
      } else {
        // Toggle on or change reaction type
        // Remove old reaction count if exists
        if (oldReaction) {
          newReactionsCount = Math.max(0, newReactionsCount - 1);
          if (newReactionCounts[oldReaction]) {
            newReactionCounts[oldReaction] = Math.max(0, newReactionCounts[oldReaction] - 1);
          }
        }
        // Add new reaction count
        newReactionsCount += 1;
        newReactionCounts[reactionType] = (newReactionCounts[reactionType] || 0) + 1;
      }
      
      return {
        ...c,
        currentUserReaction: newReaction,
        reactionsCount: newReactionsCount,
        reactionCounts: newReactionCounts
      };
    });

    if (updatedComments) {
      setLoadedComments(prev => ({
        ...prev,
        [postId]: updatedComments
      }));
    }

    // Always call createReaction - backend handles toggle logic
    createReaction('COMMENT', commentId, reactionType)
      .then(response => {
        // Verify the API call was successful
        if (!response) {
          console.error('Comment reaction API returned no response');
          // Revert optimistic update if no response
          if (updatedComments) {
            setLoadedComments(prev => ({
              ...prev,
              [postId]: comments
            }));
          }
          return;
        }
        
        // Backend returns { deleted: true }, { updated: true }, or { created: true }
        // Optimistic update already applied, but verify backend confirmed it
        console.log('Comment reaction created successfully:', response);
      })
      .catch(err => {
        console.error('Error creating comment reaction:', err);
        
        // Always revert optimistic update on error
        if (updatedComments) {
          setLoadedComments(prev => ({
            ...prev,
            [postId]: comments
          }));
        }
        
        // Check if it's a unique constraint error (user already reacted)
        const errorMessage = err?.message || err?.details?.message || '';
        if (errorMessage.includes('đã reaction') || errorMessage.includes('already') || errorMessage.includes('unique')) {
          // User already has a reaction - refresh to get current state
          getCommentsByPostId(postId)
            .then(freshComments => {
              const commentsArray = Array.isArray(freshComments) ? freshComments : [];
              const transformedComments = transformComments(commentsArray);
              setLoadedComments(prev => ({
                ...prev,
                [postId]: transformedComments
              }));
            })
            .catch(refreshErr => {
              console.error('Error refreshing comments after reaction error:', refreshErr);
            });
        }
      });
  };

  const showReactionMenu = (postId) => {
    // Clear any pending hide timeout
    const currentTimeouts = hoverTimeouts[postId];
    if (currentTimeouts?.hideTimeout) {
      clearTimeout(currentTimeouts.hideTimeout);
    }

    // Clear any pending show timeout
    if (currentTimeouts?.showTimeout) {
      clearTimeout(currentTimeouts.showTimeout);
    }

    // Show menu immediately
      const menu = document.getElementById(`reaction-menu-${postId}`);
      if (menu) {
        menu.classList.add('visible');
      }

    setHoverTimeouts(prev => ({ 
      ...prev, 
      [postId]: { 
        showTimeout: null,
        hideTimeout: null
      } 
    }));
  };

  const hideReactionMenu = (postId) => {
    // Clear any pending show timeout
    const currentTimeouts = hoverTimeouts[postId];
    if (currentTimeouts?.showTimeout) {
      clearTimeout(currentTimeouts.showTimeout);
    }

    // Add delay before hiding to allow moving to menu
    const hideTimeoutId = setTimeout(() => {
      const menu = document.getElementById(`reaction-menu-${postId}`);
      if (menu) {
        menu.classList.remove('visible');
      }
      // Clear the timeout from state after hiding
      setHoverTimeouts(prev => {
        const newTimeouts = { ...prev };
        if (newTimeouts[postId]) {
          delete newTimeouts[postId].hideTimeout;
        }
        return newTimeouts;
      });
    }, 300); // Hide delay - gives time to move cursor to menu

    setHoverTimeouts(prev => {
      const newTimeouts = { ...prev };
      if (newTimeouts[postId]) {
        newTimeouts[postId].hideTimeout = hideTimeoutId;
      } else {
        newTimeouts[postId] = { hideTimeout: hideTimeoutId };
      }
      return newTimeouts;
    });
  };

  // Show comment reaction menu
  const showCommentReactionMenu = (postId, commentId) => {
    const menuId = `comment-reaction-menu-${postId}-${commentId}`;
    
    // Clear any pending hide timeout
    const hideTimeoutId = commentHideTimeouts[menuId];
    if (hideTimeoutId) {
      clearTimeout(hideTimeoutId);
      setCommentHideTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[menuId];
        return newTimeouts;
      });
    }

    // Clear any existing show timeout
    const existingTimeoutId = commentHoverTimeouts[menuId];
    if (existingTimeoutId) {
      clearTimeout(existingTimeoutId);
    }

    // Show menu immediately if it's already visible, otherwise show after delay
    const menu = document.getElementById(menuId);
    if (menu && menu.classList.contains('visible')) {
      // Already visible, do nothing
      return;
    }

    const timeoutId = setTimeout(() => {
      const menu = document.getElementById(menuId);
      if (menu) {
        menu.classList.add('visible');
      }
    }, 200); // Reduced delay for faster response

    setCommentHoverTimeouts(prev => ({ ...prev, [menuId]: timeoutId }));
  };

  // Hide comment reaction menu
  const hideCommentReactionMenu = (postId, commentId) => {
    const menuId = `comment-reaction-menu-${postId}-${commentId}`;
    
    // Clear any pending show timeout
    const showTimeoutId = commentHoverTimeouts[menuId];
    if (showTimeoutId) {
      clearTimeout(showTimeoutId);
      setCommentHoverTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[menuId];
        return newTimeouts;
      });
    }

    // Add delay before hiding to allow moving mouse to menu
    const hideTimeoutId = setTimeout(() => {
      const menu = document.getElementById(menuId);
      if (menu) {
        menu.classList.remove('visible');
      }
      setCommentHideTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[menuId];
        return newTimeouts;
      });
    }, 300); // Delay before hiding to allow mouse movement

    setCommentHideTimeouts(prev => ({ ...prev, [menuId]: hideTimeoutId }));
  };

  // Get reaction icon for comment
  const getCommentReactionIcon = (reaction) => {
    if (!reaction) return '👍';
    const icons = {
      'like': '👍',
      'dislike': '👎',
      'love': '❤️',
      'haha': '😂',
      'wow': '😮',
      'angry': '😠'
    };
    return icons[reaction] || '👍';
  };

  // Get reaction text for comment
  const getCommentReactionText = (reaction) => {
    if (!reaction) return 'Thích';
    const texts = {
      'like': 'Thích',
      'dislike': 'Không thích',
      'love': 'Thương thương',
      'haha': 'Haha',
      'wow': 'Wow',
      'angry': 'Tức giận'
    };
    return texts[reaction] || 'Thích';
  };

  const toggleCommentBox = async (postId) => {
    const isVisible = visibleComments[postId];

    // If comments are not visible and not loaded yet, fetch them
    if (!isVisible && !loadedComments[postId]) {
      try {
        const comments = await getCommentsByPostId(postId);
        // Handle both array and empty/null responses
        const commentsArray = Array.isArray(comments) ? comments : [];
        console.log('Fetched comments from API:', commentsArray);
        console.log('First comment structure:', commentsArray[0]);
        if (commentsArray[0]) {
          console.log('First comment has Replies property:', commentsArray[0].Replies);
          console.log('First comment has replies property:', commentsArray[0].replies);
        }
        const transformedComments = transformComments(commentsArray);
        console.log('Transformed comments:', transformedComments);
        if (transformedComments[0]) {
          console.log('First transformed comment has replies:', transformedComments[0].replies);
        }

        setLoadedComments(prev => ({
          ...prev,
          [postId]: transformedComments
        }));
      } catch (error) {
        console.error('Error fetching comments:', error);
        // Set empty array on error so UI doesn't break
        setLoadedComments(prev => ({
          ...prev,
          [postId]: []
        }));
      }
    }

    setVisibleComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const addComment = async (postId) => {
    const commentText = commentInputs[postId]?.trim();
    if (commentText) {
      const success = await createComment(postId, commentText);
      if (success) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = []; // Base64 previews
    const newImageFiles = []; // File objects

    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        // Store File object
        newImageFiles.push(file);
        
        // Create base64 preview for display
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target.result);
          if (newImages.length === files.length) {
            setPendingImages(newImages);
            setPendingImageFiles(newImageFiles);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
    setPendingImageFiles(prev => prev.filter((_, i) => i !== index));
    // Update file input
    const dt = new DataTransfer();
    const files = Array.from(fileInputRef.current.files);
    files.splice(index, 1);
    files.forEach(file => dt.items.add(file));
    fileInputRef.current.files = dt.files;
  };

  // Handle comment image upload
  const handleCommentImageUpload = (postId, event) => {
    const files = Array.from(event.target.files);
    const newImages = []; // Base64 previews
    const newImageFiles = []; // File objects

    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        // Store File object
        newImageFiles.push(file);
        
        // Create base64 preview for display
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target.result);
          if (newImages.length === files.length) {
            setCommentImages(prev => ({
              ...prev,
              [postId]: [...(prev[postId] || []), ...newImages]
            }));
            setCommentImageFiles(prev => ({
              ...prev,
              [postId]: [...(prev[postId] || []), ...newImageFiles]
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeCommentImage = (postId, index) => {
    setCommentImages(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((_, i) => i !== index)
    }));
    setCommentImageFiles(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((_, i) => i !== index)
    }));
    // Update file input
    const ref = commentFileInputRefs.current[postId];
    if (ref) {
      const dt = new DataTransfer();
      const files = Array.from(ref.files);
      files.splice(index, 1);
      files.forEach(file => dt.items.add(file));
      ref.files = dt.files;
    }
  };

  // Handle reply image upload
  const handleReplyImageUpload = (postId, commentId, event) => {
    const files = Array.from(event.target.files);
    const newImages = []; // Base64 previews
    const newImageFiles = []; // File objects

    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        // Store File object
        newImageFiles.push(file);
        
        // Create base64 preview for display
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target.result);
          if (newImages.length === files.length) {
            setReplyImages(prev => ({
              ...prev,
              [`${postId}-${commentId}`]: [...(prev[`${postId}-${commentId}`] || []), ...newImages]
            }));
            setReplyImageFiles(prev => ({
              ...prev,
              [`${postId}-${commentId}`]: [...(prev[`${postId}-${commentId}`] || []), ...newImageFiles]
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeReplyImage = (postId, commentId, index) => {
    setReplyImages(prev => ({
      ...prev,
      [`${postId}-${commentId}`]: (prev[`${postId}-${commentId}`] || []).filter((_, i) => i !== index)
    }));
    setReplyImageFiles(prev => ({
      ...prev,
      [`${postId}-${commentId}`]: (prev[`${postId}-${commentId}`] || []).filter((_, i) => i !== index)
    }));
    // Update file input
    const ref = replyFileInputRefs.current[`${postId}-${commentId}`];
    if (ref) {
      const dt = new DataTransfer();
      const files = Array.from(ref.files);
      files.splice(index, 1);
      files.forEach(file => dt.items.add(file));
      ref.files = dt.files;
    }
  };

  // Toggle reply box visibility
  // Delete comment handler
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    console.log('Deleting comment:', { postId, commentId, commentIdType: typeof commentId });
    
    // Ensure commentId is a number
    const numericCommentId = typeof commentId === 'string' ? parseInt(commentId, 10) : commentId;
    if (isNaN(numericCommentId)) {
      console.error('Invalid comment ID:', commentId);
      alert('ID bình luận không hợp lệ');
      return;
    }

    try {
      // Optimistically remove from UI
      setLoadedComments(prev => {
        const removeComment = (comments, targetId) => {
          return comments
            .filter(c => {
              // Compare both as numbers to handle string/number mismatches
              const cId = typeof c.id === 'string' ? parseInt(c.id, 10) : c.id;
              const tId = typeof targetId === 'string' ? parseInt(targetId, 10) : targetId;
              return cId !== tId;
            })
            .map(c => ({
              ...c,
              replies: c.replies ? removeComment(c.replies, targetId) : []
            }));
        };

        const updated = { ...prev };
        if (updated[postId]) {
          updated[postId] = removeComment(updated[postId], numericCommentId);
        }
        return updated;
      });

      // Find the comment to get its image URL for Firebase deletion
      const commentToDelete = loadedComments[postId]?.find(c => {
        const cId = typeof c.id === 'string' ? parseInt(c.id, 10) : c.id;
        return cId === numericCommentId;
      });
      const imageUrl = commentToDelete?.image;
      
      // Delete from Firebase Storage if it's a Firebase URL
      if (imageUrl && imageUrl.includes('firebasestorage')) {
        try {
          const { deleteImageFromFirebase } = await import('../../services/firebaseStorage');
          await deleteImageFromFirebase(imageUrl);
        } catch (firebaseErr) {
          console.error('Error deleting image from Firebase:', firebaseErr);
          // Continue with comment deletion even if image deletion fails
        }
      }
      
      // Delete via API
      await apiDeleteComment(numericCommentId);

      // Silently refresh comments from backend in background
      getCommentsByPostId(postId).then(comments => {
        const commentsArray = Array.isArray(comments) ? comments : [];
        const transformedComments = transformComments(commentsArray);
        setLoadedComments(prev => ({
          ...prev,
          [postId]: transformedComments
        }));
      }).catch(error => {
        console.error('Error refreshing comments after delete:', error);
      });

      // Silently refresh posts to update comment count
      getAllPosts().then(postsData => {
        const transformedPosts = postsData.map(post => {
          // Process images - backend returns filenames only
          let images = [];
          if (post.Images && post.Images.length > 0) {
            images = post.Images
              .filter(img => img && img.trim()) // Filter out empty strings
              .map(img => {
                const imgName = img.trim();
                
                // Skip base64 images (old posts) - they are no longer supported
                if (imgName.startsWith('data:image') || imgName.length > 200) {
                  return null; // Filter out old base64 images
                }
                
                // Treat as filename - construct URLs
                const candidates = [
                  `${backendUrl}/images/${imgName}`,
                  `${backendUrl}/img/uploads/${imgName}`,
                  `/img/uploads/${imgName}`
                ];
                
                return {
                  src: candidates[0] || '/img/stock_nimg.jpg',
                  candidates: candidates.length > 0 ? candidates : ['/img/stock_nimg.jpg']
                };
              })
              .filter(img => img !== null); // Filter out null entries
          }
          
          // Limit to only 1 image since program only supports 1
          const limitedImages = images.length > 0 ? [images[0]] : [];
          
          // Process poster avatar - backend returns filename, not base64
          let posterAvatarUrl = '/img/stock_nimg.jpg'; // Default
          const posterAvatarFileName = post.PosterAvatar || null;
          if (posterAvatarFileName && posterAvatarFileName.trim() !== '') {
            // Skip base64 avatars (old data) - they are no longer supported
            if (!posterAvatarFileName.startsWith('data:image') && posterAvatarFileName.length <= 200) {
              // Construct URL from filename (same as comment avatars)
              posterAvatarUrl = `${backendUrl}/images/${posterAvatarFileName}`;
            }
          }
          
          return {
            id: parseInt(post.PostId) || 0,
            username: post.PosterName || 'Unknown',
            authorId: parseInt(post.PosterId) || 0,
            avatar: posterAvatarUrl,
            images: limitedImages, // Array of image objects with src and candidates (max 1)
            image: limitedImages.length > 0 ? limitedImages[0].src : null, // First image src for backward compatibility
            text: post.PostContent || '',
            title: post.PostTitle || '',
          reaction: post.CurrentUserReaction || null,
          comments: [],
            createdAt: post.PublicDate ? (() => {
              // Parse PublicDate to Date object
              const dateParts = post.PublicDate.split(' ');
              if (dateParts.length === 2) {
                const [datePart, timePart] = dateParts;
                const [day, month, year] = datePart.split('/');
                const [hour, minute] = timePart.split(':');
                return new Date(year, month - 1, day, hour, minute);
              }
              return new Date();
            })() : new Date(),
            commentsCount: post.Comments ? post.Comments.length : 0,
            reactionsCount: post.Likes ? post.Likes.length : 0,
            reactionCounts: post.ReactionCounts || {},
            status: post.Status || 'Pending' // Include status from backend
          };
        });
        
        // Filter out posts with "pending" status
        let filteredPosts = transformedPosts.filter(post => {
          const status = (post.status || '').toLowerCase();
          return status !== 'pending';
        });
        
        // Filter by user if "Của bạn" is selected
        if (postFilter !== 'all') {
          filteredPosts = filteredPosts.filter(post => {
            const postAuthorId = typeof post.authorId === 'string' ? parseInt(post.authorId, 10) : post.authorId;
            const currentUserIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
            return postAuthorId === currentUserIdNum;
          });
        }
        
        const sortedPosts = sortPosts(filteredPosts, filterType);
        setPosts(sortedPosts);
      }).catch(err => {
        console.error('Error refreshing posts after comment delete:', err);
      });
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert(`Không thể xóa bình luận: ${err.message || 'Có lỗi xảy ra'}`);
      // Revert optimistic update on error - reload comments
      getCommentsByPostId(postId).then(comments => {
        const commentsArray = Array.isArray(comments) ? comments : [];
        const transformedComments = transformComments(commentsArray);
        setLoadedComments(prev => ({
          ...prev,
          [postId]: transformedComments
        }));
      }).catch(error => {
        console.error('Error reloading comments after delete error:', error);
      });
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
      return;
    }

    console.log('Deleting post with ID:', postId, 'Type:', typeof postId);
    
    // Find the post to get its image URL for Firebase deletion
    const postToDelete = posts.find(p => p.id === postId);
    const imageUrl = postToDelete?.images?.[0]?.src;
    
    // Optimistically remove from UI first
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));

    try {
      // Delete from Firebase Storage if it's a Firebase URL
      if (imageUrl && imageUrl.includes('firebasestorage')) {
        try {
          const { deleteImageFromFirebase } = await import('../../services/firebaseStorage');
          await deleteImageFromFirebase(imageUrl);
        } catch (firebaseErr) {
          console.error('Error deleting image from Firebase:', firebaseErr);
          // Continue with post deletion even if image deletion fails
        }
      }
      
      await apiDeletePost(postId);
      // Post is already removed from UI, no need to refresh
      // The optimistic update is sufficient
    } catch (err) {
      console.error('Error deleting post:', err);
      // Revert optimistic update on error - restore the post
      fetchPosts();
      alert(`Không thể xóa bài đăng: ${err.message || 'Có lỗi xảy ra'}`);
    }
  };

  // Edit post handler - opens pop-up and fetches post data
  const handleEditPost = async (postId) => {
    try {
      setEditingPostId(postId);
      const postData = await apiGetPostById(postId);
      
      console.log('Fetched post data for edit:', postData); // Debug log
      
      if (postData) {
        // Backend Post model has: Content, Title, Image properties
        const title = postData.Title || postData.title || '';
        const content = postData.Content || postData.content || '';
        let imagePreview = null;
        
        // Handle image - backend Post model has Image property (Firebase URL or old filename)
        const imageFileName = postData.Image || postData.image;
        console.log('Post image filename:', imageFileName); // Debug log
        if (imageFileName && imageFileName.trim() !== '') {
          // Check if it's a Firebase Storage URL (full URL)
          if (imageFileName.startsWith('https://') && imageFileName.includes('firebasestorage')) {
            imagePreview = imageFileName;
            console.log('Setting Firebase image preview URL:', imagePreview); // Debug log
          } else if (!imageFileName.startsWith('data:image') && imageFileName.length <= 200) {
            // Old local filename - construct URL for backward compatibility
            imagePreview = `${backendUrl}/images/${imageFileName}`;
            console.log('Setting local image preview URL:', imagePreview); // Debug log
          } else {
            console.log('Skipping base64 or invalid image'); // Debug log
          }
        } else {
          console.log('No image filename found in post data'); // Debug log
        }
        
        console.log('Setting edit post title:', title, 'content:', content, 'image preview:', imagePreview); // Debug log
        setEditPostTitle(title);
        setEditPostText(content);
        setEditPostImagePreview(imagePreview);
        setEditPostImageFile(null); // Reset file - user needs to select new one if they want to change
      }
    } catch (err) {
      console.error('Error fetching post for edit:', err);
      alert(`Không thể tải dữ liệu bài viết: ${err.message || 'Có lỗi xảy ra'}`);
      setEditingPostId(null);
    }
  };

  // Update post handler
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    
    if (!editingPostId) return;
    
    const title = editPostTitle.trim();
    const text = editPostText.trim();
    if ((!title && !text) && !editPostImageFile && !editPostImagePreview) {
      alert('Vui lòng nhập tiêu đề, nội dung hoặc chọn ảnh!');
      return;
    }

    try {
      // Find the current post to get old image URL for Firebase deletion
      const currentPost = posts.find(p => p.id === editingPostId);
      const oldImageUrl = currentPost?.images?.[0]?.src;
      
      console.log('Updating post:', {
        postId: editingPostId,
        title: title,
        text: text,
        hasNewImage: editPostImageFile instanceof File,
        hasExistingImage: !!editPostImagePreview,
        oldImageUrl: oldImageUrl
      }); // Debug log
      
      await apiUpdatePost(editingPostId, {
        title: title,
        text: text,
        image: editPostImageFile // Send File object if new image selected, null otherwise (backend preserves existing)
      });
      
      // Delete old Firebase image if a new one was uploaded and old one was from Firebase
      if (editPostImageFile instanceof File && oldImageUrl && oldImageUrl.includes('firebasestorage')) {
        try {
          const { deleteImageFromFirebase } = await import('../../services/firebaseStorage');
          await deleteImageFromFirebase(oldImageUrl);
        } catch (firebaseErr) {
          console.error('Error deleting old image from Firebase:', firebaseErr);
          // Continue even if old image deletion fails
        }
      }

      // Close edit
      setEditingPostId(null);
      setEditPostTitle('');
      setEditPostText('');
      setEditPostImagePreview(null);
      setEditPostImageFile(null);
      if (editPostFileInputRef.current) {
        editPostFileInputRef.current.value = '';
      }
      
      // Refresh posts
      await fetchPosts();
      alert('Đã cập nhật bài viết thành công!');
    } catch (err) {
      console.error('Error updating post:', err);
      alert(`Không thể cập nhật bài viết: ${err.message || 'Có lỗi xảy ra'}`);
    }
  };

  // Cancel edit post
  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditPostTitle('');
    setEditPostText('');
    setEditPostImagePreview(null);
    setEditPostImageFile(null);
    if (editPostFileInputRef.current) {
      editPostFileInputRef.current.value = '';
    }
  };

  // Handle edit image change for post
  const handleEditPostImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditPostImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPostImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove edit post image
  const handleRemoveEditPostImage = () => {
    setEditPostImagePreview(null);
    setEditPostImageFile(null);
    if (editPostFileInputRef.current) {
      editPostFileInputRef.current.value = '';
    }
  };

  // Edit comment/reply handler
  const handleEditComment = (postId, commentId, parentCommentId = null) => {
    // For replies: key is `${postId}-${parentCommentId}-${commentId}` (commentId is the reply's ID)
    // For comments: key is `${postId}-${commentId}`
    const key = parentCommentId ? `${postId}-${parentCommentId}-${commentId}` : `${postId}-${commentId}`;
    
    // Find the comment/reply to get its current content
    const comments = loadedComments[postId] || [];
    let commentData = null;
    
    if (parentCommentId) {
      // Find reply - parentCommentId is the parent comment's ID, commentId is the reply's ID
      const parentComment = comments.find(c => (c.id || c.Id) === parentCommentId);
      if (parentComment && parentComment.replies) {
        commentData = parentComment.replies.find(r => (r.id || r.Id) === commentId);
      }
      setEditingReplyId(key);
    } else {
      // Find comment
      commentData = comments.find(c => (c.id || c.Id) === commentId);
      setEditingCommentId(key);
    }
    
    if (commentData) {
      const content = commentData.content || commentData.Content || '';
      let imagePreview = null;
      
      // Handle image
      if (commentData.image) {
        imagePreview = commentData.image;
      } else if (commentData.Image) {
        const imageFileName = commentData.Image;
        if (imageFileName && !imageFileName.startsWith('data:image') && imageFileName.length <= 200) {
          imagePreview = `${backendUrl}/images/${imageFileName}`;
        }
      }
      
      setEditCommentInputs(prev => ({ ...prev, [key]: content }));
      setEditCommentImages(prev => ({ ...prev, [key]: imagePreview }));
      setEditCommentImageFiles(prev => ({ ...prev, [key]: null }));
    }
  };

  // Update comment/reply handler
  const handleUpdateComment = async (postId, commentId, parentCommentId = null) => {
    // For replies: key is `${postId}-${parentCommentId}-${commentId}` (commentId is the reply's ID)
    // For comments: key is `${postId}-${commentId}`
    const key = parentCommentId ? `${postId}-${parentCommentId}-${commentId}` : `${postId}-${commentId}`;
    const content = editCommentInputs[key] || '';
    const imageFile = editCommentImageFiles[key] || null;
    
    if (!content.trim() && !imageFile) {
      alert('Vui lòng nhập nội dung hoặc chọn ảnh!');
      return;
    }

    try {
      // commentId is the ID of the comment/reply being updated
      await apiUpdateComment(commentId, {
        content: content,
        images: imageFile ? [imageFile] : [],
        parentCommentId: parentCommentId // Include parentCommentId if this is a reply
      });

      // Cancel editing
      setEditingCommentId(null);
      setEditingReplyId(null);
      setEditCommentInputs(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      setEditCommentImages(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      setEditCommentImageFiles(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      
      // Refresh comments
      const comments = await getCommentsByPostId(postId);
      const commentsArray = Array.isArray(comments) ? comments : [];
      setLoadedComments(prev => ({
        ...prev,
        [postId]: commentsArray.map(transformComment)
      }));
    } catch (err) {
      console.error('Error updating comment:', err);
      alert(`Không thể cập nhật bình luận: ${err.message || 'Có lỗi xảy ra'}`);
    }
  };

  // Cancel edit comment/reply
  const handleCancelEditComment = (postId, commentId, parentCommentId = null) => {
    // For replies: key is `${postId}-${parentCommentId}-${commentId}` (commentId is the reply's ID)
    // For comments: key is `${postId}-${commentId}`
    const key = parentCommentId ? `${postId}-${parentCommentId}-${commentId}` : `${postId}-${commentId}`;
    
    if (parentCommentId) {
      setEditingReplyId(null);
    } else {
      setEditingCommentId(null);
    }
    
    setEditCommentInputs(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setEditCommentImages(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setEditCommentImageFiles(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    
    // Clear file input
    const ref = parentCommentId ? replyFileInputRefs.current[key] : commentFileInputRefs.current[key];
    if (ref) {
      ref.value = '';
    }
  };

  // Handle edit comment image change
  const handleEditCommentImageChange = (postId, commentId, parentCommentId = null, e) => {
    // For replies: key is `${postId}-${parentCommentId}-${commentId}` (commentId is the reply's ID)
    // For comments: key is `${postId}-${commentId}`
    const key = parentCommentId ? `${postId}-${parentCommentId}-${commentId}` : `${postId}-${commentId}`;
    const file = e.target.files[0];
    if (file) {
      setEditCommentImageFiles(prev => ({ ...prev, [key]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditCommentImages(prev => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove edit comment image
  const handleRemoveEditCommentImage = (postId, commentId, parentCommentId = null) => {
    // For replies: key is `${postId}-${parentCommentId}-${commentId}` (commentId is the reply's ID)
    // For comments: key is `${postId}-${commentId}`
    const key = parentCommentId ? `${postId}-${parentCommentId}-${commentId}` : `${postId}-${commentId}`;
    setEditCommentImageFiles(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setEditCommentImages(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Handle save post
  const handleSavePost = async (postId) => {
    try {
      // Optimistic update - mark as saved and increment savesCount
      setSavedPosts(prev => {
        const updated = new Set(prev);
        updated.add(postId);
        console.log('After save - savedPosts:', Array.from(updated));
        return updated;
      });
      setPostSavesCount(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1
      }));
      
      await apiSavePost(postId);
      // After successful save, refresh saved post IDs to ensure consistency
      await fetchSavedPostIds();
    } catch (err) {
      console.error('Error saving post:', err);
      // Revert on error
      setSavedPosts(prev => {
        const updated = new Set(prev);
        updated.delete(postId);
        return updated;
      });
      setPostSavesCount(prev => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 0) - 1)
      }));
      alert(`Không thể lưu bài đăng: ${err.message || 'Có lỗi xảy ra'}`);
    }
  };

  // Handle unsave post
  const handleUnsavePost = async (postId) => {
    try {
      // Optimistic update - mark as unsaved and decrement savesCount
      setSavedPosts(prev => {
        const updated = new Set(prev);
        updated.delete(postId);
        console.log('After unsave - savedPosts:', Array.from(updated));
        return updated;
      });
      setPostSavesCount(prev => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 0) - 1)
      }));
      
      await apiUnsavePost(postId);
      // After successful unsave, refresh saved post IDs to ensure consistency
      await fetchSavedPostIds();
    } catch (err) {
      console.error('Error unsaving post:', err);
      // Revert on error
      setSavedPosts(prev => {
        const updated = new Set(prev);
        updated.add(postId);
        return updated;
      });
      setPostSavesCount(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1
      }));
      alert(`Không thể bỏ lưu bài đăng: ${err.message || 'Có lỗi xảy ra'}`);
    }
  };

  const toggleReplyBox = (postId, commentId, commentAuthorName) => {
    const key = `${postId}-${commentId}`;
    const isVisible = visibleReplies[key];
    
    setVisibleReplies(prev => ({
      ...prev,
      [key]: !isVisible
    }));
    
    // If opening the reply box, prefill with @username
    if (!isVisible && commentAuthorName) {
      setReplyInputs(prev => ({
        ...prev,
        [key]: `@${commentAuthorName} `
      }));
    }
  };

  // Add reply to a comment
  const addReply = async (postId, commentId) => {
    const replyText = replyInputs[`${postId}-${commentId}`]?.trim();
    if (replyText || (replyImageFiles[`${postId}-${commentId}`] && replyImageFiles[`${postId}-${commentId}`].length > 0)) {
      const success = await createComment(postId, replyText, commentId);
      if (success) {
        setReplyInputs(prev => {
          const updated = { ...prev };
          delete updated[`${postId}-${commentId}`];
          return updated;
        });
        setVisibleReplies(prev => ({
          ...prev,
          [`${postId}-${commentId}`]: false
        }));
      }
    }
  };

  const handleReplyInputChange = (postId, commentId, value) => {
    setReplyInputs(prev => ({
      ...prev,
      [`${postId}-${commentId}`]: value
    }));
  };

  const handlePostSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent duplicate submissions
    if (isSubmittingPost) {
      console.log('Post submission already in progress, ignoring duplicate call');
      return;
    }
    
    console.log('handlePostSubmit called');
    const title = newPostTitle.trim();
    const text = newPostText.trim();
    if ((!title && !text) && pendingImages.length === 0) {
      alert('Vui lòng nhập tiêu đề, nội dung hoặc chọn ảnh!');
      return;
    }

    console.log('Submitting post with title:', title, 'text:', text, 'and image file:', pendingImageFiles.length > 0);
    
    setIsSubmittingPost(true);
    try {
      const success = await createPost({
        title: title,
        text: text,
        image: pendingImageFiles.length > 0 ? pendingImageFiles[0] : null // Send File object, not base64
      });

      if (success) {
        console.log('Post created successfully');
        setNewPostTitle('');
        setNewPostText('');
        setPendingImages([]);
        setPendingImageFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Show success message instead of refreshing posts
        setShowPostSuccessMessage(true);
      } else {
        console.log('Post creation returned false');
      }
    } catch (err) {
      console.error('Error in handlePostSubmit:', err);
      alert(`Không thể đăng bài: ${err.message || 'Có lỗi xảy ra'}`);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  return (
    <div className={`social-media-page ${editingPostId ? 'edit-overlay-active' : ''}`}>
      {/* Header */}
      <Header 
        showMenuButton={true}
        onMenuToggle={toggleSidebar}
        sidebarActive={sidebarActive}
      />

      <div className="feed-wrapper">
        {/* Sidebar Navigation */}
        <Sidebar 
          sidebarActive={sidebarActive} 
          userInfo={userInfo}
          additionalClassName={editingPostId ? 'overlay-active' : ''}
        />

        {/* Left Sidebar - User Profile */}
      <div className={`left-sidebar ${editingPostId ? 'overlay-active' : ''}`}>
        <img 
            src={(() => {
              // Process avatar - backend may return Firebase Storage URL or filename
              const avatarFileName = userInfo?.Avatar || userInfo?.avatar || null;
              if (avatarFileName && avatarFileName.trim() !== '') {
                // If it's already a full URL (Firebase Storage or HTTP/HTTPS), use it directly
                if (avatarFileName.startsWith('http://') || avatarFileName.startsWith('https://')) {
                  return avatarFileName;
                }
                // Skip base64 avatars (old data) - they are no longer supported
                if (!avatarFileName.startsWith('data:image') && 
                    !avatarFileName.startsWith('/') &&
                    avatarFileName.length <= 200) {
                  // Old filename format - no longer supported since we removed static file serving
                  // Fall back to default avatar
                  return DEFAULT_AVATAR_URL;
                }
              }
              return DEFAULT_AVATAR_URL;
            })()}
          alt="Ảnh đại diện" 
          className="sidebar-avatar"
          onError={(e) => {
              e.target.src = DEFAULT_AVATAR_URL;
            }}
        />
        <div className="sidebar-name">
          {userInfo?.Name || userInfo?.name || 'User'}
        </div>
          <button className="sidebar-button" onClick={() => navigate('/')}>🏠 Về trang chủ</button>
      </div>

      {/* Main Feed Section */}
      <div className="main-feed-section">
        {/* Filter Dropdown */}
        <div className="post-filter-container">
          <select 
            className="post-filter"
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="hottest">Nổi bật</option>
          </select>
          <select 
            className="post-filter post-filter-user"
            value={postFilter}
            onChange={(e) => handlePostFilterChange(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="yours">Của bạn</option>
          </select>
          <button
            className={`saved-posts-toggle ${showSavedPosts ? 'active' : ''}`}
            onClick={() => {
              const newShowSavedPosts = !showSavedPosts;
              setShowSavedPosts(newShowSavedPosts);
              // Fetch posts with the new saved posts state
              fetchPosts(null, newShowSavedPosts);
            }}
            title={showSavedPosts ? 'Hiển thị tất cả bài viết' : 'Xem bài viết đã lưu'}
          >
            <span className="saved-posts-icon">🔖</span> Bài lưu
          </button>
        </div>

        {/* Post Composer */}
        <div className="userpost-card">
          <div className="composer-header">
            <img 
              src={(() => {
                // Process avatar - backend may return filename or Firebase Storage URL
                const avatarFileName = userInfo?.Avatar || userInfo?.avatar || null;
                if (avatarFileName && avatarFileName.trim() !== '') {
                  // If it's already a full URL (Firebase Storage or HTTP/HTTPS), use it directly
                  if (avatarFileName.startsWith('http://') || avatarFileName.startsWith('https://')) {
                    return avatarFileName;
                  }
                  // Skip base64 avatars (old data) - they are no longer supported
                  if (!avatarFileName.startsWith('data:image') && 
                      !avatarFileName.startsWith('/') &&
                      avatarFileName.length <= 200) {
                    // Since we removed static file serving, try Firebase Storage path first
                    // If it's a filename, it might be in Firebase Storage under 'avatars' folder
                    // For now, fall back to default since we don't have static file serving
                    // TODO: If avatars are stored in Firebase, construct the Firebase URL here
                    return DEFAULT_AVATAR_URL;
                  }
                }
                return DEFAULT_AVATAR_URL;
              })()}
              alt="Ảnh đại diện" 
              className="user-avatar"
              onError={(e) => {
                e.target.src = DEFAULT_AVATAR_URL;
              }}
            />
            <span className="composer-username">{userInfo?.Name || userInfo?.name || 'User'}</span>
          </div>
          <div className="composer-fields">
            <div className="composer-field composer-field-title">
              <label htmlFor="composer-title">Tiêu đề:</label>
              <input
                id="composer-title"
                type="text"
                className="composer-title-input"
                placeholder="Nhập tiêu đề..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
            </div>
            <div className="composer-field">
              <label htmlFor="composer-content">Nội dung:</label>
              <textarea
                id="composer-content"
                className="composer-input"
                placeholder="Bạn đang nghĩ gì?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />
            </div>
          </div>
          <div className="composer-actions">
            <label htmlFor="composer-photo" className="photo-label">🖼️ Ảnh</label>
            <input
              type="file"
              accept="image/*"
              id="composer-photo"
              className="composer-photo-input"
              multiple
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <div id="image-preview-container">
              {pendingImages.map((imageData, index) => (
                <div key={index} className="image-preview-item">
                  <img src={imageData} className="image-preview" alt={`Preview ${index + 1}`} />
                  <button
                    className="image-remove-btn"
                    onClick={() => removeImage(index)}
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="post-btn" onClick={handlePostSubmit} disabled={isSubmittingPost}>
              {isSubmittingPost ? 'Đang đăng...' : 'Đăng bài'}
            </button>
          </div>
        </div>

        {/* Post Creation Success Message */}
        {showPostSuccessMessage && (
          <div className="post-success-message">
            <span className="post-success-text">Bài viết của bạn đã được tạo, vui lòng đợi admin duyệt!</span>
            <button 
              className="post-success-dismiss" 
              onClick={() => setShowPostSuccessMessage(false)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        )}

        {/* Edit Post - Pop-up dialog with editpost-card */}
        {editingPostId && (
          <div className="edit-post-overlay" onClick={handleCancelEditPost}>
            <div className="edit-post-popup" onClick={(e) => e.stopPropagation()}>
              <div className="editpost-card">
                <div className="composer-header">
                  <img 
                    src={(() => {
                      // Process avatar - backend may return Firebase Storage URL or filename
                      const avatarFileName = userInfo?.Avatar || userInfo?.avatar || null;
                      if (avatarFileName && avatarFileName.trim() !== '') {
                        // If it's already a full URL (Firebase Storage or HTTP/HTTPS), use it directly
                        if (avatarFileName.startsWith('http://') || avatarFileName.startsWith('https://')) {
                          return avatarFileName;
                        }
                        // Skip base64 avatars (old data) - they are no longer supported
                        if (!avatarFileName.startsWith('data:image') && 
                            !avatarFileName.startsWith('/') &&
                            avatarFileName.length <= 200) {
                          // Old filename format - no longer supported since we removed static file serving
                          // Fall back to default avatar
                          return DEFAULT_AVATAR_URL;
                        }
                      }
                      return DEFAULT_AVATAR_URL;
                    })()}
                    alt="Ảnh đại diện" 
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = DEFAULT_AVATAR_URL;
                    }}
                  />
                  <span className="composer-username">{userInfo?.Name || userInfo?.name || 'User'}</span>
                </div>
                <div className="composer-fields">
                  <div className="composer-field composer-field-title">
                    <label htmlFor="edit-composer-title">Tiêu đề:</label>
                    <input
                      id="edit-composer-title"
                      type="text"
                      className="composer-title-input"
                      placeholder="Nhập tiêu đề..."
                      value={editPostTitle}
                      onChange={(e) => setEditPostTitle(e.target.value)}
                    />
                  </div>
                  <div className="composer-field">
                    <label htmlFor="edit-composer-content">Nội dung:</label>
                    <textarea
                      id="edit-composer-content"
                      className="composer-input"
                      placeholder="Bạn đang nghĩ gì?"
                      value={editPostText}
                      onChange={(e) => setEditPostText(e.target.value)}
                    />
                  </div>
                </div>
                <div className="composer-actions">
                  <label htmlFor="edit-composer-photo" className="photo-label">🖼️ Ảnh</label>
                  <input
                    type="file"
                    accept="image/*"
                    id="edit-composer-photo"
                    className="composer-photo-input"
                    ref={editPostFileInputRef}
                    onChange={handleEditPostImageChange}
                  />
                  <div id="edit-image-preview-container">
                    {editPostImagePreview && (
                      <div className="image-preview-item">
                        <img src={editPostImagePreview} className="image-preview" alt="Preview" />
                        <button
                          className="image-remove-btn"
                          onClick={handleRemoveEditPostImage}
                          title="Xóa ảnh"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="post-btn edit-post-cancel-btn" onClick={handleCancelEditPost}>Hủy</button>
                    <button type="button" className="post-btn edit-post-submit-btn" onClick={handleUpdatePost}>Cập nhật</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchPosts}>Thử lại</button>
          </div>
        )}

        {/* Feed Container */}
        <div id="feed-list">
          {!loading && !error && posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-top">
                <img 
                  src={post.avatar || "/img/stock_nimg.jpg"} 
                  alt="avatar" 
                  className="post-avatar"
                  onError={(e) => {
                    // Extract just the filename from the URL (last part after /)
                    const currentSrc = e.target.src;
                    const urlParts = currentSrc.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    
                    // Only try fallback if we have a valid filename (not a full URL, not the default)
                    if (filename && filename !== 'stock_nimg.jpg' && !filename.includes('http://') && !filename.includes('://') && filename.length < 100) {
                      const candidates = [
                        `http://localhost:7267/img/uploads/${filename}`,
                        `/img/uploads/${filename}`,
                        '/img/stock_nimg.jpg'
                      ];
                      const currentIdx = candidates.findIndex(c => currentSrc === c || currentSrc.includes(c));
                      const nextIdx = currentIdx + 1;
                      if (nextIdx < candidates.length) {
                        e.target.src = candidates[nextIdx];
                      } else {
                        e.target.src = '/img/stock_nimg.jpg';
                      }
                    } else {
                      e.target.src = '/img/stock_nimg.jpg';
                    }
                  }}
                />
                <span className="post-username">{post.username}</span>
                <div className="post-menu-container">
                  <button
                    id={`post-menu-btn-${post.id}`}
                    className={`post-menu-btn ${openPostMenu === post.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenPostMenu(openPostMenu === post.id ? null : post.id);
                    }}
                    aria-label="Menu tùy chọn"
                  >
                    ⋯
                  </button>
                  {openPostMenu === post.id && (
                    <div 
                      id={`post-menu-${post.id}`}
                      className="post-menu-dropdown"
                    >
                      <button 
                        className="post-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isSaved = savedPosts.has(post.id);
                          console.log(`Post ${post.id} isSaved:`, isSaved, 'savedPosts:', Array.from(savedPosts));
                          if (isSaved) {
                            handleUnsavePost(post.id);
                          } else {
                            handleSavePost(post.id);
                          }
                          setOpenPostMenu(null);
                        }}
                      >
                        {savedPosts.has(post.id) ? 'Bỏ lưu' : 'Lưu'}
                      </button>
                      {post.authorId === userId && (
                        <button 
                          className="post-menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPost(post.id);
                            setOpenPostMenu(null);
                          }}
                        >
                          Chỉnh sửa
                        </button>
                      )}
                      {post.authorId !== userId && (
                        <button 
                          className="post-menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement report functionality
                            setOpenPostMenu(null);
                          }}
                        >
                          Báo cáo
                        </button>
                      )}
                      {post.authorId === userId && (
                        <button 
                          className="post-menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPostMenu(null);
                            handleDeletePost(post.id);
                          }}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="post-content">
                {post.title && (
                  <div className="post-title" style={{ margin: '0.6rem 0 0.3rem 0.1rem', fontWeight: 'bold', fontSize: '1.1em' }}>
                    {escapeHtml(post.title)}
                  </div>
                )}
                {post.text && (
                  <div style={{ margin: '0.3rem 0 0.3rem 0.1rem' }}>
                    {escapeHtml(post.text)}
                  </div>
                )}
              </div>
              {post.images && post.images.length > 0 ? (
                <div className="post-images">
                  {post.images.slice(0, 1).map((imgObj, idx) => {
                    const onImgError = (e) => {
                      // Try fallback candidates
                        try {
                          const list = JSON.parse(e.target.dataset.candidates || '[]');
                          const currentIdx = parseInt(e.target.dataset.idx || '0', 10);
                          const nextIdx = currentIdx + 1;
                          if (nextIdx < list.length) {
                            e.target.dataset.idx = String(nextIdx);
                            e.target.src = list[nextIdx];
                          } else {
                            e.target.src = '/img/stock_nimg.jpg';
                          }
                        } catch {
                        e.target.src = '/img/stock_nimg.jpg';
                      }
                    };
                    
                    return (
                      <img 
                        key={idx} 
                        src={imgObj.src} 
                        data-candidates={JSON.stringify(imgObj.candidates)}
                        data-idx="0"
                        className="post-image" 
                        alt="Bài đăng"
                        onError={onImgError}
                      />
                    );
                  })}
                </div>
              ) : null}
              <div className="post-actions">
                <div
                  className="reaction-container"
                  onMouseEnter={() => showReactionMenu(post.id)}
                  onMouseLeave={() => hideReactionMenu(post.id)}
                >
                  <button
                    className={`action-btn${post.reaction ? ' reacted' : ''}`}
                    onClick={() => {
                      // If there's a current reaction, toggle it off; otherwise set to 'like'
                      const reactionToToggle = post.reaction || 'like';
                      handleReaction(post.id, reactionToToggle);
                    }}
                  >
                    <span className="reaction-icon">{getReactionIcon(post.reaction)}</span> {getReactionText(post.reaction)}
                  </button>
                  <div 
                    className="reaction-menu" 
                    id={`reaction-menu-${post.id}`}
                    onMouseEnter={() => showReactionMenu(post.id)}
                    onMouseLeave={() => hideReactionMenu(post.id)}
                  >
                    <button className="reaction-option" onClick={() => handleReaction(post.id, 'like')} title="Thích">👍</button>
                    <button className="reaction-option" onClick={() => handleReaction(post.id, 'dislike')} title="Không thích">👎</button>
                    <button className="reaction-option" onClick={() => handleReaction(post.id, 'love')} title="Thương thương">❤️</button>
                    <button className="reaction-option" onClick={() => handleReaction(post.id, 'haha')} title="Haha">😂</button>
                    <button className="reaction-option" onClick={() => handleReaction(post.id, 'wow')} title="Wow">😮</button>
                  </div>
                </div>
                <button className="action-btn" onClick={() => toggleCommentBox(post.id)}>
                  💬 Bình luận ({post.commentsCount || 0})
                </button>
              </div>
              {(formatReactionCounts(post.reactionCounts) || (postSavesCount[post.id] || 0) > 0) && (
                <div className="post-counts-field">
                  <span>{formatReactionCounts(post.reactionCounts) || ''}</span>
                  {(postSavesCount[post.id] || 0) >= 0 && (
                    <span>{postSavesCount[post.id]} người đã lưu</span>
                  )}
                </div>
              )}
              <div className="comment-section" style={{ display: visibleComments[post.id] ? 'block' : 'none' }}>
                {/* Comment Input with Avatar */}
                <div className="comment-input-container">
                  <img 
                    src={(() => {
                      // Process avatar - backend may return Firebase Storage URL or filename
                      const avatarFileName = userInfo?.Avatar || userInfo?.avatar || null;
                      if (avatarFileName && avatarFileName.trim() !== '') {
                        // If it's already a full URL (Firebase Storage or HTTP/HTTPS), use it directly
                        if (avatarFileName.startsWith('http://') || avatarFileName.startsWith('https://')) {
                          return avatarFileName;
                        }
                        // Skip base64 avatars (old data) - they are no longer supported
                        if (!avatarFileName.startsWith('data:image') && 
                            !avatarFileName.startsWith('/') &&
                            avatarFileName.length <= 200) {
                          // Old filename format - no longer supported since we removed static file serving
                          // Fall back to default avatar
                          return DEFAULT_AVATAR_URL;
                        }
                      }
                      return DEFAULT_AVATAR_URL;
                    })} 
                    alt="Ảnh đại diện" 
                    className="comment-input-avatar"
                    onError={(e) => {
                      e.target.src = DEFAULT_AVATAR_URL;
                    }}
                  />
                  <div className="comment-input-wrapper">
                    <div className="comment-input-row">
                      <input
                        type="text"
                        className="comment-input"
                        maxLength="500"
                        placeholder="Viết bình luận..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                      />
                      <div className="comment-input-actions">
                        <label htmlFor={`comment-photo-${post.id}`} className="comment-photo-label" title="Thêm ảnh">
                          🖼️
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          id={`comment-photo-${post.id}`}
                          className="comment-photo-input"
                          ref={(el) => {
                            if (el) commentFileInputRefs.current[post.id] = el;
                          }}
                          onChange={(e) => handleCommentImageUpload(post.id, e)}
                        />
                        <button 
                          className="comment-send-btn" 
                          onClick={() => addComment(post.id)}
                          disabled={(!commentInputs[post.id]?.trim() && (!commentImageFiles[post.id] || commentImageFiles[post.id].length === 0))}
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                    {/* Comment Image Preview */}
                    {commentImages[post.id] && commentImages[post.id].length > 0 && (
                      <div className="comment-image-preview-container">
                        {commentImages[post.id].map((imageData, index) => (
                          <div key={index} className="comment-image-preview-item">
                            <img src={imageData} className="comment-image-preview" alt={`Preview ${index + 1}`} />
                            <button
                              className="comment-image-remove-btn"
                              onClick={() => removeCommentImage(post.id, index)}
                              title="Xóa ảnh"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments List */}
                <div className="comment-list">
                  {/* Recursive component to render comments and replies */}
                  {((loadedComments[post.id] || []).map((comment, idx) => {
                    const renderComment = (comment, isReply = false, isReplyToReply = false, commentKey = null, parentCommentId = null, depth = 0) => {
                      // Generate unique key: use comment.id if available, otherwise create a unique key based on post, parent, and index
                      const uniqueKey = commentKey || comment.id || `comment-${post.id}-${parentCommentId || 'root'}-${comment.createdAt || idx}`;
                      return (
                      <div key={uniqueKey} className={`comment-item ${isReply ? 'comment-reply' : ''}`}>
                        <img 
                          src={comment.authorAvatar || comment.AuthorAvatar || "/img/stock_nimg.jpg"} 
                          alt={comment.authorName || comment.AuthorName || "avatar"} 
                          className="comment-avatar"
                          onError={(e) => {
                            // Extract just the filename from the URL (last part after /)
                            const currentSrc = e.target.src;
                            const urlParts = currentSrc.split('/');
                            const filename = urlParts[urlParts.length - 1];
                            
                            // Only try fallback if we have a valid filename (not a full URL, not the default)
                            if (filename && filename !== 'stock_nimg.jpg' && !filename.includes('http://') && !filename.includes('://') && filename.length < 100) {
                              const candidates = [
                                `http://localhost:7267/img/uploads/${filename}`,
                                `/img/uploads/${filename}`,
                                '/img/stock_nimg.jpg'
                              ];
                              const currentIdx = candidates.findIndex(c => currentSrc === c || currentSrc.includes(c));
                              const nextIdx = currentIdx + 1;
                              if (nextIdx < candidates.length) {
                                e.target.src = candidates[nextIdx];
                              } else {
                                e.target.src = '/img/stock_nimg.jpg';
                              }
                            } else {
                              e.target.src = '/img/stock_nimg.jpg';
                            }
                          }}
                        />
                        <div className="comment-content-wrapper">
                          {/* Show edit form if editing, otherwise show comment content */}
                          {(() => {
                            const editKey = isReply ? `${post.id}-${parentCommentId}-${comment.id}` : `${post.id}-${comment.id}`;
                            const isEditing = editingCommentId === editKey || editingReplyId === editKey;
                            return isEditing ? (
                              <div className="edit-comment-container">
                                <img 
                                  src={(() => {
                                    // Process avatar - backend may return Firebase Storage URL or filename
                                    const avatarFileName = userInfo?.Avatar || userInfo?.avatar || null;
                                    if (avatarFileName && avatarFileName.trim() !== '') {
                                      // If it's already a full URL (Firebase Storage or HTTP/HTTPS), use it directly
                                      if (avatarFileName.startsWith('http://') || avatarFileName.startsWith('https://')) {
                                        return avatarFileName;
                                      }
                                      // Skip base64 avatars (old data) - they are no longer supported
                                      if (!avatarFileName.startsWith('data:image') && 
                                          !avatarFileName.startsWith('/') &&
                                          avatarFileName.length <= 200) {
                                        // Old filename format - no longer supported since we removed static file serving
                                        // Fall back to default avatar
                                        return DEFAULT_AVATAR_URL;
                                      }
                                    }
                                    return DEFAULT_AVATAR_URL;
                                  })} 
                                  alt="Ảnh đại diện" 
                                  className="comment-input-avatar"
                                  onError={(e) => {
                                    e.target.src = DEFAULT_AVATAR_URL;
                                  }}
                                />
                                <div className="edit-comment-input-wrapper">
                                  <textarea
                                    className="edit-comment-input"
                                    value={editCommentInputs[editKey] || ''}
                                    onChange={(e) => setEditCommentInputs(prev => ({
                                      ...prev,
                                      [editKey]: e.target.value
                                    }))}
                                    placeholder="Chỉnh sửa bình luận..."
                                    rows="3"
                                  />
                                  {editCommentImages[editKey] && (
                                    <div className="edit-comment-image-preview">
                                      <img src={editCommentImages[editKey]} alt="Preview" />
                                      <button 
                                        type="button"
                                        className="edit-comment-image-remove"
                                        onClick={() => handleRemoveEditCommentImage(post.id, comment.id, isReply ? parentCommentId : null)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )}
                                  <div className="edit-comment-actions">
                                    <label htmlFor={`edit-comment-image-${editKey}`} className="edit-comment-image-label">🖼️</label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      id={`edit-comment-image-${editKey}`}
                                      className="edit-comment-image-input"
                                      onChange={(e) => handleEditCommentImageChange(post.id, comment.id, isReply ? parentCommentId : null, e)}
                                      ref={(el) => {
                                        if (isReply) {
                                          replyFileInputRefs.current[editKey] = el;
                                        } else {
                                          commentFileInputRefs.current[editKey] = el;
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="edit-comment-cancel-btn"
                                      onClick={() => handleCancelEditComment(post.id, comment.id, isReply ? parentCommentId : null)}
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      type="button"
                                      className="edit-comment-submit-btn"
                                      onClick={() => handleUpdateComment(post.id, comment.id, isReply ? parentCommentId : null)}
                                    >
                                      Cập nhật
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                            <>
                          <div className="comment-bubble">
                                <div className="comment-author-name">{comment.authorName || comment.AuthorName || 'Unknown'}</div>
                            <div className="comment-text">{escapeHtml(comment.content)}</div>
                            {comment.image && (
                              <img 
                                src={comment.image} 
                                className="comment-image" 
                                alt="Comment image"
                                onError={(e) => {
                                      // Try fallback URLs if main URL fails
                                      const imgName = comment.image?.replace(`${backendUrl}/images/`, '') || '';
                                      if (imgName) {
                                        const candidates = [
                                          `${backendUrl}/img/uploads/${imgName}`,
                                          `/img/uploads/${imgName}`,
                                          '/img/stock_nimg.jpg'
                                        ];
                                        const currentSrc = e.target.src;
                                        const currentIdx = candidates.findIndex(c => currentSrc.includes(c.replace(backendUrl, '').replace(/^\//, '')));
                                        const nextIdx = currentIdx + 1;
                                        if (nextIdx < candidates.length) {
                                          e.target.src = candidates[nextIdx];
                                        } else {
                                  e.target.src = '/img/stock_nimg.jpg';
                                        }
                                      } else {
                                        e.target.src = '/img/stock_nimg.jpg';
                                      }
                                }}
                              />
                            )}
                          </div>
                          <div className="comment-actions">
                            <div
                              className="comment-reaction-container"
                              onMouseEnter={() => showCommentReactionMenu(post.id, comment.id)}
                              onMouseLeave={() => hideCommentReactionMenu(post.id, comment.id)}
                            >
                              <button 
                                className={`comment-action-btn ${comment.currentUserReaction ? 'reacted' : ''}`}
                                onClick={() => handleCommentReaction(post.id, comment.id, 'like')}
                              >
                                <span className="reaction-icon">{getCommentReactionIcon(comment.currentUserReaction)}</span> {getCommentReactionText(comment.currentUserReaction)}
                              </button>
                              <div 
                                className="comment-reaction-menu" 
                                id={`comment-reaction-menu-${post.id}-${comment.id}`}
                                onMouseEnter={() => showCommentReactionMenu(post.id, comment.id)}
                                onMouseLeave={() => hideCommentReactionMenu(post.id, comment.id)}
                              >
                                <button className="reaction-option" onClick={() => handleCommentReaction(post.id, comment.id, 'like')} title="Thích">👍</button>
                                <button className="reaction-option" onClick={() => handleCommentReaction(post.id, comment.id, 'dislike')} title="Không thích">👎</button>
                                <button className="reaction-option" onClick={() => handleCommentReaction(post.id, comment.id, 'love')} title="Thương thương">❤️</button>
                                <button className="reaction-option" onClick={() => handleCommentReaction(post.id, comment.id, 'haha')} title="Haha">😂</button>
                                <button className="reaction-option" onClick={() => handleCommentReaction(post.id, comment.id, 'wow')} title="Wow">😮</button>
                                <button className="reaction-option" onClick={() => handleCommentReaction(post.id, comment.id, 'angry')} title="Tức giận">😠</button>
                              </div>
                            </div>
                                {depth < 5 && (
                            <button 
                              className="comment-action-btn"
                              onClick={() => toggleReplyBox(post.id, comment.id, comment.authorName)}
                            >
                              Phản hồi
                            </button>
                                )}
                                {depth >= 5 && (
                                  <span className="comment-reply-limit-message">Đã đạt giới hạn 5 cấp độ phản hồi</span>
                                )}
                            {comment.authorId === userId && (
                              <>
                                <button 
                                  className="comment-action-btn comment-edit-btn"
                                  onClick={() => handleEditComment(post.id, comment.id, isReply ? parentCommentId : null)}
                                  title="Sửa bình luận"
                                >
                                  Sửa
                                </button>
                              <button 
                                className="comment-action-btn comment-delete-btn"
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                title="Xóa bình luận"
                              >
                                Xóa
                              </button>
                              </>
                            )}
                          </div>
                          </>
                            );
                          })()}
                          
                          {/* Reply box - show for both top-level comments and replies, but only if depth < 5 */}
                          {visibleReplies[`${post.id}-${comment.id}`] && depth < 5 && (
                            <div className="reply-input-container">
                              <img 
                                src={(() => {
                                  // Process avatar - backend may return Firebase Storage URL or filename
                                  const avatarFileName = userInfo?.Avatar || userInfo?.avatar || null;
                                  if (avatarFileName && avatarFileName.trim() !== '') {
                                    // If it's already a full URL (Firebase Storage or HTTP/HTTPS), use it directly
                                    if (avatarFileName.startsWith('http://') || avatarFileName.startsWith('https://')) {
                                      return avatarFileName;
                                    }
                                    // Skip base64 avatars (old data) - they are no longer supported
                                    if (!avatarFileName.startsWith('data:image') && 
                                        !avatarFileName.startsWith('/') &&
                                        avatarFileName.length <= 200) {
                                      // Old filename format - no longer supported since we removed static file serving
                                      // Fall back to default avatar
                                      return DEFAULT_AVATAR_URL;
                                    }
                                  }
                                  return DEFAULT_AVATAR_URL;
                                })} 
                                alt="Ảnh đại diện" 
                                className="comment-input-avatar"
                                onError={(e) => {
                                  e.target.src = DEFAULT_AVATAR_URL;
                                }}
                              />
                              <div className="comment-input-wrapper">
                                <div className="comment-input-row">
                                  <input
                                    type="text"
                                    className="comment-input"
                                    maxLength="500"
                                    placeholder="Viết phản hồi..."
                                    value={replyInputs[`${post.id}-${comment.id}`] || ''}
                                    onChange={(e) => handleReplyInputChange(post.id, comment.id, e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addReply(post.id, comment.id)}
                                  />
                                  <div className="comment-input-actions">
                                    <label htmlFor={`reply-photo-${post.id}-${comment.id}`} className="comment-photo-label" title="Thêm ảnh">
                                      🖼️
                                    </label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      id={`reply-photo-${post.id}-${comment.id}`}
                                      className="comment-photo-input"
                                      ref={(el) => {
                                        if (el) replyFileInputRefs.current[`${post.id}-${comment.id}`] = el;
                                      }}
                                      onChange={(e) => handleReplyImageUpload(post.id, comment.id, e)}
                                    />
                                    <button 
                                      className="comment-send-btn" 
                                      onClick={() => addReply(post.id, comment.id)}
                                      disabled={(!replyInputs[`${post.id}-${comment.id}`]?.trim() && (!replyImageFiles[`${post.id}-${comment.id}`] || replyImageFiles[`${post.id}-${comment.id}`].length === 0))}
                                    >
                                      Gửi
                                    </button>
                                    <button 
                                      className="comment-cancel-btn" 
                                      onClick={() => {
                                        // Close reply box and clear inputs
                                        setVisibleReplies(prev => {
                                          const updated = { ...prev };
                                          delete updated[`${post.id}-${comment.id}`];
                                          return updated;
                                        });
                                        setReplyInputs(prev => {
                                          const updated = { ...prev };
                                          delete updated[`${post.id}-${comment.id}`];
                                          return updated;
                                        });
                                        setReplyImages(prev => {
                                          const updated = { ...prev };
                                          delete updated[`${post.id}-${comment.id}`];
                                          return updated;
                                        });
                                        setReplyImageFiles(prev => {
                                          const updated = { ...prev };
                                          delete updated[`${post.id}-${comment.id}`];
                                          return updated;
                                        });
                                        // Clear file input
                                        const ref = replyFileInputRefs.current[`${post.id}-${comment.id}`];
                                        if (ref) {
                                          ref.value = '';
                                        }
                                      }}
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                                {/* Reply Image Preview */}
                                {replyImages[`${post.id}-${comment.id}`] && replyImages[`${post.id}-${comment.id}`].length > 0 && (
                                  <div className="comment-image-preview-container">
                                    {replyImages[`${post.id}-${comment.id}`].map((imageData, index) => (
                                      <div key={index} className="comment-image-preview-item">
                                        <img src={imageData} className="comment-image-preview" alt={`Preview ${index + 1}`} />
                                        <button
                                          className="comment-image-remove-btn"
                                          onClick={() => removeReplyImage(post.id, comment.id, index)}
                                          title="Xóa ảnh"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Render replies - can nest indefinitely, but indentation stops after 5 levels */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="comment-replies">
                              {comment.replies.map((reply, replyIdx) => {
                                // Generate unique key for each reply
                                const replyKey = reply.id || `reply-${post.id}-${comment.id}-${replyIdx}`;
                                return (
                                  <React.Fragment key={replyKey}>
                                    {renderComment(reply, true, false, replyKey, comment.id, depth + 1)}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    };

                    // Generate unique key for top-level comment
                    const commentKey = comment.id || `comment-${post.id}-${idx}`;
                    return (
                      <React.Fragment key={commentKey}>
                        {renderComment(comment, false, false, commentKey, null, 0)}
                      </React.Fragment>
                    );
                  }))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default SocialMedia;