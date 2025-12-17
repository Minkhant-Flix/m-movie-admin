const API_URL = "https://script.google.com/macros/s/AKfycbyAqEcJV9zhQ8iOvbjG6xqVf6NnqbBVDxFGgoYXR_cRG9QMYZZWghS4fREQmtSkIf75/exec";
let allPosts = [];
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 3;
let paragraphValue = '';
let editParagraphValue = '';

// New variables for genres and rating
let selectedGenres = [];
let editSelectedGenres = [];
let currentRating = 0;
let editCurrentRating = 0;

// Debug logging
function debugLog(message, data = null) {
    console.log(`[Admin] ${message}`, data || '');
}

// ==================== RICH TEXT EDITOR FUNCTIONS ====================
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

// ==================== PASSWORD TOGGLE ====================
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

// ==================== GENRES FUNCTIONS ====================
function initGenres() {
    selectedGenres = [];
    editSelectedGenres = [];
    updateGenresDisplay();
    updateEditGenresDisplay();
}

function addGenreFromInput() {
    const input = document.getElementById('genreInput');
    const genre = input.value.trim();
    
    if (genre && !selectedGenres.includes(genre)) {
        selectedGenres.push(genre);
        updateGenresDisplay();
    }
    input.value = '';
    input.focus();
}

function addQuickGenre(genre) {
    if (!selectedGenres.includes(genre)) {
        selectedGenres.push(genre);
        updateGenresDisplay();
    }
}

function updateGenresDisplay() {
    const container = document.getElementById('selectedGenres');
    container.innerHTML = '';
    
    if (selectedGenres.length === 0) {
        container.innerHTML = '<span class="text-muted small">No genres selected</span>';
        return;
    }
    
    selectedGenres.forEach((genre, index) => {
        const tag = document.createElement('span');
        tag.className = 'genre-tag';
        tag.innerHTML = `
            ${genre}
            <button type="button" class="genre-remove" onclick="removeGenre(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
}

function removeGenre(index) {
    selectedGenres.splice(index, 1);
    updateGenresDisplay();
}

function addEditGenreFromInput() {
    const input = document.getElementById('editGenreInput');
    const genre = input.value.trim();
    
    if (genre && !editSelectedGenres.includes(genre)) {
        editSelectedGenres.push(genre);
        updateEditGenresDisplay();
    }
    input.value = '';
    input.focus();
}

function addEditQuickGenre(genre) {
    if (!editSelectedGenres.includes(genre)) {
        editSelectedGenres.push(genre);
        updateEditGenresDisplay();
    }
}

function updateEditGenresDisplay() {
    const container = document.getElementById('editSelectedGenres');
    container.innerHTML = '';
    
    if (editSelectedGenres.length === 0) {
        container.innerHTML = '<span class="text-muted small">No genres selected</span>';
        return;
    }
    
    editSelectedGenres.forEach((genre, index) => {
        const tag = document.createElement('span');
        tag.className = 'genre-tag';
        tag.innerHTML = `
            ${genre}
            <button type="button" class="genre-remove" onclick="removeEditGenre(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
}

function removeEditGenre(index) {
    editSelectedGenres.splice(index, 1);
    updateEditGenresDisplay();
}

// ==================== RATING FUNCTIONS ====================
function initRating() {
    currentRating = 0;
    editCurrentRating = 0;
    setupRatingStars();
    setupEditRatingStars();
}

function setupRatingStars() {
    const stars = document.querySelectorAll('#ratingStars .star');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            currentRating = value;
            updateRatingDisplay();
        });
        
        star.addEventListener('mouseover', () => {
            const value = parseInt(star.getAttribute('data-value'));
            highlightStars(value, 'ratingStars');
        });
    });
    
    document.getElementById('ratingStars').addEventListener('mouseleave', () => {
        highlightStars(currentRating, 'ratingStars');
    });
}

function setupEditRatingStars() {
    const stars = document.querySelectorAll('#editRatingStars .star');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            editCurrentRating = value;
            updateEditRatingDisplay();
        });
        
        star.addEventListener('mouseover', () => {
            const value = parseInt(star.getAttribute('data-value'));
            highlightStars(value, 'editRatingStars');
        });
    });
    
    document.getElementById('editRatingStars').addEventListener('mouseleave', () => {
        highlightStars(editCurrentRating, 'editRatingStars');
    });
}

function highlightStars(rating, containerId) {
    const stars = document.querySelectorAll(`#${containerId} .star i`);
    
    stars.forEach((star, index) => {
        const starValue = index + 1;
        
        if (starValue <= rating) {
            star.className = 'fas fa-star';
            star.style.color = '#ffc107';
        } else {
            star.className = 'far fa-star';
            star.style.color = '#ccc';
        }
    });
}

function updateRatingDisplay() {
    const input = document.getElementById('ratingValue');
    const text = document.getElementById('ratingText');
    
    input.value = currentRating;
    highlightStars(currentRating, 'ratingStars');
    
    if (currentRating > 0) {
        text.innerHTML = `<span class="text-warning"><i class="fas fa-star"></i> ${currentRating}/5</span>`;
    } else {
        text.textContent = 'No rating selected';
    }
}

function updateEditRatingDisplay() {
    const input = document.getElementById('editRatingValue');
    const text = document.getElementById('editRatingText');
    
    input.value = editCurrentRating;
    highlightStars(editCurrentRating, 'editRatingStars');
    
    if (editCurrentRating > 0) {
        text.innerHTML = `<span class="text-warning"><i class="fas fa-star"></i> ${editCurrentRating}/5</span>`;
    } else {
        text.textContent = 'No rating selected';
    }
}

function updateStarsFromInput() {
    const input = document.getElementById('ratingValue');
    let value = parseFloat(input.value);
    
    if (isNaN(value) || value < 0) value = 0;
    if (value > 5) value = 5;
    
    currentRating = value;
    updateRatingDisplay();
}

function updateEditStarsFromInput() {
    const input = document.getElementById('editRatingValue');
    let value = parseFloat(input.value);
    
    if (isNaN(value) || value < 0) value = 0;
    if (value > 5) value = 5;
    
    editCurrentRating = value;
    updateEditRatingDisplay();
}

function clearRating() {
    currentRating = 0;
    updateRatingDisplay();
}

function clearEditRating() {
    editCurrentRating = 0;
    updateEditRatingDisplay();
}

// ==================== LOGIN FUNCTIONS ====================
async function login() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    
    debugLog('Login attempt:', { user, pass });
    
    if (!user || !pass) {
        showAlert("Please enter both username and password", "warning");
        return;
    }
    
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        showAlert("Too many failed attempts. Please try again later.", "danger");
        return;
    }
    
    try {
        const loginSuccess = await loginWithJSONP(user, pass);
        
        if (loginSuccess) {
            loginAttempts = 0;
            document.getElementById("loginBox").style.display = "none";
            document.getElementById("uploadBox").style.display = "block";
            
            await loadPostsWithJSONP();
            await loadStats();
            
            showAlert("Login successful! Welcome back.", "success");
            
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

function loginWithJSONP(user, pass) {
    return new Promise((resolve, reject) => {
        const callbackName = 'loginCallback_' + Date.now();
        
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

function checkExistingLogin() {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    const username = localStorage.getItem('username');
    
    if (loggedIn === 'true' && loginTime && username) {
        const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60);
        
        if (hoursSinceLogin < 8) {
            debugLog('Auto-login detected for user:', username);
            document.getElementById("loginBox").style.display = "none";
            document.getElementById("uploadBox").style.display = "block";
            
            loadPostsWithJSONP().then(() => {
                loadStats();
                showAlert(`Welcome back, ${username}!`, "info");
            }).catch(e => {
                console.error('Auto-login posts load failed:', e);
                showAlert(`Welcome back, ${username}! Some features may not work properly.`, "warning");
            });
            
            return true;
        } else {
            localStorage.clear();
        }
    }
    return false;
}

function logout() {
    if(confirm("Are you sure you want to logout?")) {
        document.getElementById("uploadBox").style.display = "none";
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        
        document.getElementById('paragraph').innerHTML = '';
        paragraphValue = '';
        
        // Clear genres and rating
        selectedGenres = [];
        currentRating = 0;
        updateGenresDisplay();
        updateRatingDisplay();
        
        localStorage.clear();
        
        showAlert("You have been logged out successfully.", "info");
    }
}

// ==================== POST FUNCTIONS ====================
async function uploadPost() {
    const title = document.getElementById("title").value.trim();
    const imageURL = document.getElementById("imageURL").value.trim();
    const trailerLink = document.getElementById("trailerLink").value.trim();
    const downloadLink = document.getElementById("downloadLink").value.trim();
    const hasDownload = document.getElementById("hasDownload").checked;
    
    // Get genres and rating
    const genres = selectedGenres.join(', ');
    const rating = currentRating;
    
    if (!title || !paragraphValue || !imageURL) {
        showAlert("Please fill in all required fields: Title, Content, and Image URL", "warning");
        return;
    }
    
    if (imageURL.startsWith('data:image') && imageURL.length > 50000) {
        const shouldContinue = confirm('The image is very large (base64). This may cause upload issues.\n\nRecommendation: Use an external image URL instead.\n\nDo you want to continue?');
        if (!shouldContinue) {
            return;
        }
    }
    
    debugLog('Uploading post (title):', title);
    
    try {
        const formData = new FormData();
        formData.append('action', 'addPost');
        formData.append('title', title);
        formData.append('paragraph', paragraphValue);
        formData.append('imageURL', imageURL);
        formData.append('trailerLink', trailerLink);
        formData.append('downloadLink', downloadLink);
        formData.append('hasDownload', hasDownload ? 'true' : 'false');
        formData.append('genres', genres);
        formData.append('rating', rating);
        
        await submitFormData(formData);
        
        // Clear form
        document.getElementById("title").value = "";
        document.getElementById('paragraph').innerHTML = "";
        paragraphValue = "";
        document.getElementById("imageURL").value = "";
        document.getElementById("trailerLink").value = "";
        document.getElementById("downloadLink").value = "";
        document.getElementById("hasDownload").checked = false;
        document.getElementById("genreInput").value = "";
        
        // Clear genres and rating
        selectedGenres = [];
        currentRating = 0;
        updateGenresDisplay();
        updateRatingDisplay();
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadPostsWithJSONP();
        await loadStats();
        
        showAlert("Post published successfully!", "success");
        
    } catch (error) {
        console.error("Upload error:", error);
        showAlert("Error publishing post. Please try again.", "danger");
    }
}

async function submitFormData(formData) {
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        params.append(key, value);
    }
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = API_URL;
    form.target = '_blank';
    form.style.display = 'none';
    
    for (const [key, value] of formData.entries()) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }
    
    document.body.appendChild(form);
    form.submit();
    
    setTimeout(() => {
        if (form.parentElement) {
            document.body.removeChild(form);
        }
    }, 1000);
    
    return Promise.resolve({ success: true });
}

function loadPostsWithJSONP() {
    return new Promise((resolve, reject) => {
        const callbackName = 'postsCallback_' + Date.now();
        
        window[callbackName] = function(data) {
            delete window[callbackName];
            if (script.parentElement) {
                document.body.removeChild(script);
            }
            
            const historyContainer = document.getElementById("postHistory");
            historyContainer.innerHTML = "";
            
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
            
            if (Array.isArray(data)) {
                allPosts = data;
                renderPostHistory();
                resolve();
                return;
            }
            
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
            
            historyContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Unexpected response format
                    <button class="btn btn-sm btn-outline-warning ms-3" onclick="loadPostsWithJSONP()">
                        <i class="fas fa-redo me-1"></i>Retry
                    </div>
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
        
        let paragraphPreview = post.Paragraph || '';
        if (paragraphPreview.length > 150) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = paragraphPreview;
            paragraphPreview = tempDiv.textContent || tempDiv.innerText || '';
            paragraphPreview = paragraphPreview.substring(0, 147) + '...';
        }
        
        // Create genre badges
        let genreBadges = '';
        if (post.Genres) {
            const genres = post.Genres.split(',').map(g => g.trim()).filter(g => g);
            genres.forEach(genre => {
                genreBadges += `<span class="badge bg-purple me-1 mb-1"><i class="fas fa-tag me-1"></i>${genre}</span>`;
            });
        }
        
        // Create rating display
        let ratingDisplay = '';
        if (post.Rating && parseFloat(post.Rating) > 0) {
            const rating = parseFloat(post.Rating);
            ratingDisplay = `
                <div class="mt-2">
                    <small class="text-muted">
                        <i class="fas fa-star text-warning me-1"></i>
                        Rating: <strong>${rating}/5</strong>
                    </small>
                </div>
            `;
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
                        
                        ${genreBadges ? `
                            <div class="mb-2">
                                ${genreBadges}
                            </div>
                        ` : ''}
                        
                        ${ratingDisplay}
                        
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
                            
                        </div>
                    </div>
                </div>
            </div>
        `;
        historyContainer.appendChild(postCard);
    });
}

// ===================================

// <a href="?post=${post.ID}" target="_blank" class="btn btn-info btn-sm">
//                                 <i class="fas fa-eye me-1"></i>View Live
//                             </a>

// ===================================

async function loadStats() {
    const statsContainer = document.getElementById("statsContainer");
    
    const totalPosts = allPosts.length;
    const postsWithDownload = allPosts.filter(p => p.HasDownload === "TRUE" || p.HasDownload === true).length;
    const postsWithImages = allPosts.filter(p => p.ImageURL && p.ImageURL.trim() !== '').length;
    const postsWithTrailer = allPosts.filter(p => p.TrailerLink && p.TrailerLink.trim() !== '').length;
    const postsWithRating = allPosts.filter(p => p.Rating && parseFloat(p.Rating) > 0).length;
    const postsWithGenres = allPosts.filter(p => p.Genres && p.Genres.trim() !== '').length;
    
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
            <div class="col-6 col-md-3 mb-3">
                <div class="p-3 bg-light rounded">
                    <h3 class="text-danger">${postsWithRating}</h3>
                    <p class="mb-0 small">With Rating</p>
                </div>
            </div>
            <div class="col-6 col-md-3 mb-3">
                <div class="p-3 bg-light rounded">
                    <h3 class="text-purple">${postsWithGenres}</h3>
                    <p class="mb-0 small">With Genres</p>
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

// ==================== EDIT FUNCTIONS ====================
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
    document.getElementById("editTrailerLink").value = post.TrailerLink || '';
    document.getElementById("editDownloadLink").value = post.DownloadLink || '';
    
    const hasDownload = post.HasDownload === "TRUE" || post.HasDownload === true;
    document.getElementById("editHasDownload").checked = hasDownload;
    
    // Load genres
    editSelectedGenres = post.Genres ? post.Genres.split(',').map(g => g.trim()).filter(g => g) : [];
    updateEditGenresDisplay();
    
    // Load rating
    editCurrentRating = post.Rating ? parseFloat(post.Rating) : 0;
    updateEditRatingDisplay();
    
    const editModal = new bootstrap.Modal(document.getElementById("editModal"));
    editModal.show();
}

async function updatePost() {
    const postId = document.getElementById("editId").value;
    const title = document.getElementById("editTitle").value.trim();
    const imageURL = document.getElementById("editImageURL").value.trim();
    const trailerLink = document.getElementById("editTrailerLink").value.trim();
    const downloadLink = document.getElementById("editDownloadLink").value.trim();
    const hasDownload = document.getElementById("editHasDownload").checked;
    
    // Get genres and rating
    const genres = editSelectedGenres.join(', ');
    const rating = editCurrentRating;
    
    if (!title || !editParagraphValue || !imageURL) {
        showAlert("Please fill in all required fields", "warning");
        return;
    }
    
    debugLog('Updating post with genres:', genres, 'rating:', rating);
    
    try {
        const formData = new FormData();
        formData.append('action', 'updatePost');
        formData.append('id', postId);
        formData.append('title', title);
        formData.append('paragraph', editParagraphValue);
        formData.append('imageURL', imageURL);
        formData.append('trailerLink', trailerLink);
        formData.append('downloadLink', downloadLink);
        formData.append('hasDownload', hasDownload ? 'true' : 'false');
        formData.append('genres', genres);
        formData.append('rating', rating);
        
        await submitFormData(formData);
        
        showAlert("Post updated successfully!", "success");
        bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
        
        await new Promise(resolve => setTimeout(resolve, 1500));
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
        const formData = new FormData();
        formData.append('action', 'deletePost');
        formData.append('id', postId);
        
        await submitFormData(formData);
        
        showAlert("Post deleted successfully!", "success");
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        await loadPostsWithJSONP();
        await loadStats();
        
    } catch (error) {
        console.error("Delete error:", error);
        showAlert("Error deleting post. Please try again.", "danger");
    }
}

// ==================== UTILITY FUNCTIONS ====================
function showAlert(message, type) {
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
    
    const container = document.querySelector(".admin-container");
    if (container.firstChild) {
        container.insertBefore(alertDiv, container.firstChild);
    } else {
        container.appendChild(alertDiv);
    }
    
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

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        login();
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Admin panel loaded');
    
    // Initialize genres and rating
    initGenres();
    initRating();
    
    // Add Enter key support for genre input
    document.getElementById('genreInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addGenreFromInput();
        }
    });
    
    document.getElementById('editGenreInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEditGenreFromInput();
        }
    });
    
    const isLoggedIn = checkExistingLogin();
    
    if (!isLoggedIn) {
        document.getElementById('username').focus();
    }
    
    document.getElementById('password').addEventListener('keypress', handleKeyPress);

});
