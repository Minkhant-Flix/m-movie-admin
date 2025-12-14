const API_URL = "https://script.google.com/macros/s/AKfycbyEHRDgn3RSRJJoV5537TjotyVju0PnWabYRVzI8L0Kvpb47baVwmdw_Cxo40EdmmAaWA/exec";
let allPosts = [];
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 3;
let paragraphValue = '';
let editParagraphValue = '';

// Debug logging
function debugLog(message, data = null) {
    console.log(`[Admin] ${message}`, data || '');
}

// Rich Text Editor Functions
function formatText(command, value = null) {
    document.getElementById('paragraph').focus();
    document.execCommand(command, false, value);
    updateParagraphValue();
}

function formatEditText(command, value = null) {
    document.getElementById('editParagraph').focus();
    document.execCommand(command, false, value);
    updateEditParagraphValue();
}

function clearFormatting() {
    document.getElementById('paragraph').focus();
    document.execCommand('removeFormat', false, null);
    document.execCommand('unlink', false, null);
    updateParagraphValue();
}

function clearEditFormatting() {
    document.getElementById('editParagraph').focus();
    document.execCommand('removeFormat', false, null);
    document.execCommand('unlink', false, null);
    updateEditParagraphValue();
}

function updateParagraphValue() {
    paragraphValue = document.getElementById('paragraph').innerHTML;
}

function updateEditParagraphValue() {
    editParagraphValue = document.getElementById('editParagraph').innerHTML;
}

// Password visibility toggle
function togglePassword() {
    const passwordField = document.getElementById("password");
    const toggleIcon = document.querySelector(".password-toggle i");
    
    if (passwordField.type === "password") {
        passwordField.type = "text";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
    } else {
        passwordField.type = "password";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    }
}

// Enhanced login function
async function login() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    
    debugLog('Login attempt:', { user, pass });
    
    // Basic validation
    if (!user || !pass) {
        showAlert("Please enter both username and password", "warning");
        return;
    }
    
    // Check login attempts
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        showAlert("Too many failed attempts. Please try again later.", "danger");
        return;
    }
    
    try {
        // Use JSONP for login (bypass CORS)
        const loginSuccess = await loginWithJSONP(user, pass);
        
        if (loginSuccess) {
            loginAttempts = 0;
            document.getElementById("loginBox").style.display = "none";
            document.getElementById("uploadBox").style.display = "block";
            
            // Load posts and stats
            await loadPostsWithJSONP();
            await loadStats();
            
            showAlert("Login successful! Welcome back.", "success");
            
            // Store login state
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('loginTime', Date.now());
            localStorage.setItem('username', user);
            
        } else {
            loginAttempts++;
            const remaining = MAX_LOGIN_ATTEMPTS - loginAttempts;
            showAlert(`Invalid credentials. ${remaining} attempt(s) remaining.`, "danger");
            document.getElementById("password").value = "";
        }
        
    } catch (error) {
        console.error("Login error:", error);
        loginAttempts++;
        const remaining = MAX_LOGIN_ATTEMPTS - loginAttempts;
        showAlert(`Login failed: ${error.message}. ${remaining} attempt(s) remaining.`, "danger");
        document.getElementById("password").value = "";
    }
}

// JSONP login method - FIXED VERSION
function loginWithJSONP(user, pass) {
    return new Promise((resolve, reject) => {
        const callbackName = 'loginCallback_' + Date.now();
        
        // Define callback function BEFORE creating script
        window[callbackName] = function(data) {
            delete window[callbackName];
            if (script.parentElement) {
                document.body.removeChild(script);
            }
            
            debugLog('JSONP login response:', data);
            
            if (data && data.success) {
                resolve(true);
            } else {
                resolve(false);
            }
        };
        
        const script = document.createElement('script');
        
        const jsonpUrl = `${API_URL}?action=login&username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&callback=${callbackName}`;
        debugLog('JSONP login URL:', jsonpUrl);
        script.src = jsonpUrl;
        
        script.onerror = () => {
            if (script.parentElement) {
                document.body.removeChild(script);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
            reject(new Error('JSONP request failed'));
        };
        
        // Timeout
        setTimeout(() => {
            if (script.parentElement) {
                document.body.removeChild(script);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
            reject(new Error('JSONP timeout'));
        }, 10000);
        
        document.body.appendChild(script);
    });
}

// Check for existing login session
function checkExistingLogin() {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    const username = localStorage.getItem('username');
    
    if (loggedIn === 'true' && loginTime && username) {
        const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60);
        
        // Auto-login if less than 8 hours
        if (hoursSinceLogin < 8) {
            debugLog('Auto-login detected for user:', username);
            document.getElementById("loginBox").style.display = "none";
            document.getElementById("uploadBox").style.display = "block";
            
            // Load posts using JSONP
            loadPostsWithJSONP().then(() => {
                loadStats();
                showAlert(`Welcome back, ${username}!`, "info");
            }).catch(e => {
                console.error('Auto-login posts load failed:', e);
                // Show warning but stay logged in
                showAlert(`Welcome back, ${username}! Some features may not work properly.`, "warning");
            });
            
            return true;
        } else {
            // Session expired
            localStorage.clear();
        }
    }
    return false;
}

// Logout function
function logout() {
    if(confirm("Are you sure you want to logout?")) {
        document.getElementById("uploadBox").style.display = "none";
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        
        // Clear editor content
        document.getElementById('paragraph').innerHTML = '';
        paragraphValue = '';
        
        // Clear login session
        localStorage.clear();
        
        showAlert("You have been logged out successfully.", "info");
    }
}

// Enhanced upload post - UPDATED to use form submission
async function uploadPost() {
    const title = document.getElementById("title").value.trim();
    const imageURL = document.getElementById("imageURL").value.trim();
    const trailerLink = document.getElementById("trailerLink").value.trim(); // New field
    const downloadLink = document.getElementById("downloadLink").value.trim();
    const hasDownload = document.getElementById("hasDownload").checked;
    
    if (!title || !paragraphValue || !imageURL) {
        showAlert("Please fill in all required fields: Title, Content, and Image URL", "warning");
        return;
    }
    
    // Check if image is base64 and warn user
    if (imageURL.startsWith('data:image') && imageURL.length > 50000) {
        const shouldContinue = confirm('The image is very large (base64). This may cause upload issues.\n\nRecommendation: Use an external image URL instead.\n\nDo you want to continue?');
        if (!shouldContinue) {
            return;
        }
    }
    
    debugLog('Uploading post (title):', title);
    
    try {
        // Use SIMPLE form submission - individual fields
        const formData = new FormData();
        formData.append('action', 'addPost');
        formData.append('title', title);
        formData.append('paragraph', paragraphValue);
        formData.append('imageURL', imageURL);
        formData.append('trailerLink', trailerLink); // Add trailer link
        formData.append('downloadLink', downloadLink);
        formData.append('hasDownload', hasDownload ? 'true' : 'false');
        
        await submitFormData(formData);
        
        // Clear form
        document.getElementById("title").value = "";
        document.getElementById('paragraph').innerHTML = "";
        paragraphValue = "";
        document.getElementById("imageURL").value = "";
        document.getElementById("trailerLink").value = "";
        document.getElementById("downloadLink").value = "";
        document.getElementById("hasDownload").checked = false;
        
        // Wait a moment for the post to be saved
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reload posts to see the new one
        await loadPostsWithJSONP();
        await loadStats();
        
        showAlert("Post published successfully!", "success");
        
    } catch (error) {
        console.error("Upload error:", error);
        showAlert("Error publishing post. Please try again.", "danger");
    }
}

// Submit form data using fetch with no-cors
async function submitFormData(formData) {
    // Convert FormData to URL-encoded string
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        params.append(key, value);
    }
    
    // Create a form and submit it (bypasses CORS)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = API_URL;
    form.target = '_blank'; // Open in new tab/window to avoid CORS
    form.style.display = 'none';
    
    // Add all parameters as hidden inputs
    for (const [key, value] of formData.entries()) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }
    
    document.body.appendChild(form);
    form.submit();
    
    // Remove form after submission
    setTimeout(() => {
        if (form.parentElement) {
            document.body.removeChild(form);
        }
    }, 1000);
    
    // Since we can't get response due to CORS, assume success
    return Promise.resolve({ success: true });
}

// Load posts with JSONP - FIXED VERSION
function loadPostsWithJSONP() {
    return new Promise((resolve, reject) => {
        const callbackName = 'postsCallback_' + Date.now();
        
        // Define callback function BEFORE creating script
        window[callbackName] = function(data) {
            delete window[callbackName];
            if (script.parentElement) {
                document.body.removeChild(script);
            }
            
            const historyContainer = document.getElementById("postHistory");
            
            // Clear previous content
            historyContainer.innerHTML = "";
            
            // Handle error response
            if (data && data.success === false) {
                historyContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${data.message || 'Error loading posts'}
                        <button class="btn btn-sm btn-outline-warning ms-3" onclick="loadPostsWithJSONP()">
                            <i class="fas fa-redo me-1"></i>Retry
                        </button>
                    </div>
                `;
                reject(new Error(data.message || 'Error loading posts'));
                return;
            }
            
            // Handle array response (posts)
            if (Array.isArray(data)) {
                allPosts = data;
                renderPostHistory();
                resolve();
                return;
            }
            
            // No posts found
            if (!data || (Array.isArray(data) && data.length === 0)) {
                historyContainer.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
                        <h5 class="text-muted">No posts yet</h5>
                        <p class="text-muted">Create your first post to get started</p>
                        <button class="btn btn-primary mt-3" onclick="document.getElementById('title').focus()">
                            <i class="fas fa-plus me-1"></i>Create First Post
                        </button>
                    </div>
                `;
                allPosts = [];
                resolve();
                return;
            }
            
            // Unexpected response format
            historyContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Unexpected response format
                    <button class="btn btn-sm btn-outline-warning ms-3" onclick="loadPostsWithJSONP()">
                        <i class="fas fa-redo me-1"></i>Retry
                    </button>
                </div>
            `;
            reject(new Error('Unexpected response format'));
        };
        
        const script = document.createElement('script');
        
        const jsonpUrl = `${API_URL}?action=getPosts&callback=${callbackName}`;
        debugLog('Loading posts via JSONP:', jsonpUrl);
        script.src = jsonpUrl;
        
        script.onerror = () => {
            if (script.parentElement) {
                document.body.removeChild(script);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
            
            const historyContainer = document.getElementById("postHistory");
            historyContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load posts. Network error.
                    <button class="btn btn-sm btn-outline-danger ms-3" onclick="loadPostsWithJSONP()">
                        <i class="fas fa-redo me-1"></i>Retry
                    </button>
                </div>
            `;
            reject(new Error('JSONP request failed'));
        };
        
        // Timeout
        setTimeout(() => {
            if (script.parentElement) {
                document.body.removeChild(script);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
            reject(new Error('JSONP timeout'));
        }, 10000);
        
        document.body.appendChild(script);
    });
}

// Load post history (public function)
async function loadPostHistory() {
    const historyContainer = document.getElementById("postHistory");
    historyContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p class="mt-2 text-muted">Loading posts...</p>
        </div>
    `;
    
    debugLog('Loading post history...');
    
    try {
        await loadPostsWithJSONP();
    } catch (error) {
        console.error("Error loading post history:", error);
    }
}

// Render post history
function renderPostHistory() {
    const historyContainer = document.getElementById("postHistory");
    
    if (!allPosts || allPosts.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No posts yet</h5>
                <p class="text-muted">Create your first post to get started</p>
                <button class="btn btn-primary mt-3" onclick="document.getElementById('title').focus()">
                    <i class="fas fa-plus me-1"></i>Create First Post
                </button>
            </div>
        `;
        return;
    }

    historyContainer.innerHTML = "";
    
    // Sort posts by date (newest first)
    allPosts.sort((a, b) => {
        try {
            return new Date(b.CreatedAt) - new Date(a.CreatedAt);
        } catch (e) {
            return 0;
        }
    });

    allPosts.forEach((post, index) => {
        const postCard = document.createElement("div");
        postCard.className = "card post-card mb-3";
        
        const hasDownload = post.HasDownload === "TRUE" || post.HasDownload === true;
        const downloadStatus = hasDownload ? 'Download Enabled' : 'No Download';
        const badgeClass = hasDownload ? 'bg-success' : 'bg-secondary';
        const iconClass = hasDownload ? 'fa-download' : 'fa-ban';
        
        // Format date
        let displayDate = post.CreatedAt;
        try {
            const date = new Date(post.CreatedAt);
            if (!isNaN(date.getTime())) {
                displayDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (e) {
            console.warn('Date formatting error:', e);
        }
        
        // Truncate paragraph for preview
        let paragraphPreview = post.Paragraph || '';
        if (paragraphPreview.length > 150) {
            // Remove HTML tags for preview
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = paragraphPreview;
            paragraphPreview = tempDiv.textContent || tempDiv.innerText || '';
            paragraphPreview = paragraphPreview.substring(0, 147) + '...';
        }
        
        postCard.innerHTML = `
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h5 class="card-title">${post.Title || 'Untitled Post'}</h5>
                        <p class="text-muted small mb-2">
                            <i class="far fa-calendar me-1"></i>${displayDate}
                            <span class="ms-3">
                                <i class="fas fa-hashtag me-1"></i>ID: ${post.ID || index + 1}
                            </span>
                        </p>
                        <div class="card-text mb-2">${paragraphPreview}</div>
                        <div class="d-flex flex-wrap gap-2 align-items-center">
                            <span class="badge ${badgeClass}">
                                <i class="fas ${iconClass} me-1"></i>
                                ${downloadStatus}
                            </span>
                            ${post.ImageURL ? `
                                <span class="badge bg-info">
                                    <i class="fas fa-image me-1"></i>Has Image
                                </span>
                            ` : ''}
                            ${post.TrailerLink ? `
                                <span class="badge bg-warning">
                                    <i class="fas fa-play-circle me-1"></i>Has Trailer
                                </span>
                            ` : ''}
                        </div>
                        ${hasDownload && post.DownloadLink ? `
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="fas fa-link me-1"></i>
                                    Download: <a href="${post.DownloadLink}" target="_blank" class="text-decoration-none">${post.DownloadLink.substring(0, 40)}...</a>
                                </small>
                            </div>
                        ` : ''}
                        ${post.TrailerLink ? `
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="fas fa-video me-1"></i>
                                    Trailer: <a href="${post.TrailerLink}" target="_blank" class="text-decoration-none">${post.TrailerLink.substring(0, 40)}...</a>
                                </small>
                            </div>
                        ` : ''}
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="d-flex flex-column gap-2">
                            <button class="btn btn-warning btn-sm" onclick="editPost('${post.ID}')">
                                <i class="fas fa-edit me-1"></i>Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deletePost('${post.ID}')">
                                <i class="fas fa-trash me-1"></i>Delete
                            </button>
                            <a href="?post=${post.ID}" target="_blank" class="btn btn-info btn-sm">
                                <i class="fas fa-eye me-1"></i>View Live
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        historyContainer.appendChild(postCard);
    });
}

// Load stats for dashboard
async function loadStats() {
    const statsContainer = document.getElementById("statsContainer");
    
    // Use the allPosts array that should already be loaded
    const totalPosts = allPosts.length;
    const postsWithDownload = allPosts.filter(p => p.HasDownload === "TRUE" || p.HasDownload === true).length;
    const postsWithImages = allPosts.filter(p => p.ImageURL && p.ImageURL.trim() !== '').length;
    const postsWithTrailer = allPosts.filter(p => p.TrailerLink && p.TrailerLink.trim() !== '').length;
    
    statsContainer.innerHTML = `
        <div class="row text-center">
            <div class="col-6 col-md-3 mb-3">
                <div class="p-3 bg-light rounded">
                    <h3 class="text-primary">${totalPosts}</h3>
                    <p class="mb-0 small">Total Posts</p>
                </div>
            </div>
            <div class="col-6 col-md-3 mb-3">
                <div class="p-3 bg-light rounded">
                    <h3 class="text-success">${postsWithDownload}</h3>
                    <p class="mb-0 small">With Downloads</p>
                </div>
            </div>
            <div class="col-6 col-md-3 mb-3">
                <div class="p-3 bg-light rounded">
                    <h3 class="text-info">${postsWithImages}</h3>
                    <p class="mb-0 small">With Images</p>
                </div>
            </div>
            <div class="col-6 col-md-3 mb-3">
                <div class="p-3 bg-light rounded">
                    <h3 class="text-warning">${postsWithTrailer}</h3>
                    <p class="mb-0 small">With Trailer</p>
                </div>
            </div>
        </div>
        <div class="mt-3">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Last updated: ${new Date().toLocaleTimeString()}
            </small>
            <button class="btn btn-sm btn-outline-secondary ms-2" onclick="loadStats()">
                <i class="fas fa-sync-alt"></i>
            </button>
        </div>
    `;
}

// Enhanced alert system
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => {
        if (alert.parentElement) {
            alert.remove();
        }
    });
    
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${getAlertIcon(type)} me-2"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Add to page
    const container = document.querySelector(".admin-container");
    if (container.firstChild) {
        container.insertBefore(alertDiv, container.firstChild);
    } else {
        container.appendChild(alertDiv);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

function getAlertIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'danger': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

// Edit post function
function editPost(postId) {
    const post = allPosts.find(p => p.ID == postId);
    if (!post) {
        showAlert("Post not found", "danger");
        return;
    }

    document.getElementById("editId").value = post.ID;
    document.getElementById("editTitle").value = post.Title || '';
    document.getElementById("editParagraph").innerHTML = post.Paragraph || '';
    editParagraphValue = post.Paragraph || '';
    document.getElementById("editImageURL").value = post.ImageURL || '';
    document.getElementById("editTrailerLink").value = post.TrailerLink || ''; // Add trailer link
    document.getElementById("editDownloadLink").value = post.DownloadLink || '';
    
    const hasDownload = post.HasDownload === "TRUE" || post.HasDownload === true;
    document.getElementById("editHasDownload").checked = hasDownload;

    const editModal = new bootstrap.Modal(document.getElementById("editModal"));
    editModal.show();
}

async function updatePost() {
    const postId = document.getElementById("editId").value;
    const title = document.getElementById("editTitle").value.trim();
    const imageURL = document.getElementById("editImageURL").value.trim();
    const trailerLink = document.getElementById("editTrailerLink").value.trim(); // Add trailer link
    const downloadLink = document.getElementById("editDownloadLink").value.trim();
    const hasDownload = document.getElementById("editHasDownload").checked;
    
    if (!title || !editParagraphValue || !imageURL) {
        showAlert("Please fill in all required fields", "warning");
        return;
    }
    
    debugLog('Updating post ID:', postId);
    
    try {
        // Use SIMPLE form submission - individual fields
        const formData = new FormData();
        formData.append('action', 'updatePost');
        formData.append('id', postId);
        formData.append('title', title);
        formData.append('paragraph', editParagraphValue);
        formData.append('imageURL', imageURL);
        formData.append('trailerLink', trailerLink); // Add trailer link
        formData.append('downloadLink', downloadLink);
        formData.append('hasDownload', hasDownload ? 'true' : 'false');
        
        await submitFormData(formData);
        
        showAlert("Post updated successfully!", "success");
        bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
        
        // Wait a moment for the update to be saved
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Reload posts
        await loadPostsWithJSONP();
        await loadStats();
        
    } catch (error) {
        console.error("Update error:", error);
        showAlert("Error updating post. Please try again.", "danger");
    }
}

async function deletePost(postId) {
    if(!confirm("Are you sure you want to delete this post?\n\nThis action cannot be undone and the post will be permanently removed from the blog.")) {
        return;
    }

    debugLog('Deleting post ID:', postId);
    
    try {
        // Use SIMPLE form submission - individual fields
        const formData = new FormData();
        formData.append('action', 'deletePost');
        formData.append('id', postId);
        
        await submitFormData(formData);
        
        showAlert("Post deleted successfully!", "success");
        
        // Wait a moment for the delete to be processed
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Reload posts
        await loadPostsWithJSONP();
        await loadStats();
        
    } catch (error) {
        console.error("Delete error:", error);
        showAlert("Error deleting post. Please try again.", "danger");
    }
}

// Enter key to login
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        login();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Admin panel loaded');
    
    // Check for existing login session
    const isLoggedIn = checkExistingLogin();
    
    // If not auto-logged in, focus on username
    if (!isLoggedIn) {
        document.getElementById('username').focus();
    }
    
    // Add enter key listener
    document.getElementById('password').addEventListener('keypress', handleKeyPress);
    
    // Auto-fill test credentials in development
    // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    //     document.getElementById('username').value = 'admin';
    //     document.getElementById('password').value = 'password123';
    //     showAlert('Test credentials filled. Click Login to continue.', 'info');
    // }
});