// ------------------- Firebase Initialization -------------------
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig); // firebaseConfig is now global
    console.log("Firebase initialized");
}

console.log("Gemini URL:", GEMINI_URL); // GEMINI_URL is now global

// Get Firestore instance
var db = firebase.firestore();

// ---------------- SIGNUP ----------------
function signupUser() {
    let name = document.getElementById("signupName").value.trim();
    let email = document.getElementById("signupEmail").value.trim();
    let password = document.getElementById("signupPassword").value.trim();
    let branch = document.getElementById("signupBranch").value;
    let year = document.getElementById("signupYear").value;
    let section = document.getElementById("signupSection").value.trim();

    // Validation
    if (!name || !email || !password || !branch || !year || !section) {
        alert("Please fill all fields");
        return;
    }

    // College email check
    if (!email.endsWith("@bvrit.ac.in")) {
        alert("Please use your college email address!");
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            let uid = userCredential.user.uid;
            return db.collection('users').doc(uid).set({
                name: name,
                email: email,
                branch: branch,
                year: year,
                section: section,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert("Signup successful!");
            window.location = "dashboard.html";
        })
        .catch(error => {
            if (error.code === 'auth/email-already-in-use') {
                alert("This email is already registered. Try logging in.");
            } else {
                alert(error.message);
            }
        });
}


// --- GENERAL AI CHATBOX LOGIC (Updated with your Key & Model) ---

// 1. Toggle Chat Window Visibility
function toggleChatWindow() {
    const window = document.getElementById("aiChatWindow");
    const btn = document.getElementById("aiToggleBtn");
    
    // Safety check if elements exist
    if (!window || !btn) {
        console.error("Chat window elements not found in HTML.");
        return;
    }

    if (window.style.display === "none" || window.style.display === "") {
        window.style.display = "flex";
    } else {
        window.style.display = "none";
        btn.innerHTML = "🤖 AI Help";
    }
}

// 2. Allow "Enter" key to send
function checkEnter(event) {
    if (event.key === "Enter") {
        sendToGemini();
    }
}

// 3. Send Message to Gemini
async function sendToGemini() {
    const inputField = document.getElementById("aiUserInput");
    const messagesDiv = document.getElementById("aiChatMessages");
    
    if (!inputField || !messagesDiv) return;

    const userText = inputField.value.trim();
    if (!userText) return;

    // A. Show User Message
    messagesDiv.innerHTML += `
        <div class="ai-message-bubble user-msg">
            ${escapeHtml(userText)}
        </div>
    `;
    inputField.value = ""; // Clear input
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll down

    // B. Show "Thinking..." Bubble
    const loadingId = "loading-" + Date.now();
    messagesDiv.innerHTML += `
        <div id="${loadingId}" class="ai-message-bubble bot-msg" style="color: #888; font-style: italic;">
            Thinking...
        </div>
    `;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `You are a helpful assistant for engineering students. Answer this concisely: ${userText}` 
                    }]
                }]
            })
        });

        const data = await response.json();

        // Error Handling
        if (data.error) {
            throw new Error(`Google API Error: ${data.error.message}`);
        }
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No answer generated.");
        }

        const aiText = data.candidates[0].content.parts[0].text;

        // D. Replace "Thinking..." with Real Answer
        const loadingBubble = document.getElementById(loadingId);
        if (loadingBubble) loadingBubble.remove();
        
        // Convert **Bold** to HTML bold (simple formatter)
        const formattedText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        messagesDiv.innerHTML += `
            <div class="ai-message-bubble bot-msg">
                ${formattedText}
            </div>
        `;

    } catch (error) {
        const loadingBubble = document.getElementById(loadingId);
        if (loadingBubble) {
            loadingBubble.innerHTML = "⚠️ Error connecting to AI.";
            loadingBubble.style.color = "red";
        }
        console.error("Chat Error:", error);
    }

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Simple security helper
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------- AI ASSISTANT (Fixed Version) ----------------
// ---------------- AI ASSISTANT (With Your Key) ----------------
// ---------------- AI ASSISTANT (Fixed Model Name) ----------------
// ---------------- AI ASSISTANT (Using Standard 'gemini-pro') ----------------
// ---------------- AI ASSISTANT (Using Your Available Model: gemini-2.5-flash) ----------------
// ---------------- AI ASSISTANT (Gemini 2.5 Flash - 4 Sections) ----------------
async function openAIGuide(ideaId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in first.");
        return;
    }

    const modal = document.getElementById("aiAssistantModal");
    const contentDiv = document.getElementById("aiResponseContent");
    
    if (!modal) {
        alert("Error: Modal HTML missing.");
        return;
    }
    
    modal.style.display = "block";
    contentDiv.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 40px; margin-bottom: 10px;">✨</div>
            <h3>Asking Gemini...</h3>
            <p>Analyzing project requirements...</p>
        </div>
    `;

    try {
        const ideaDoc = await db.collection("ideas").doc(ideaId).get();
        const userDoc = await db.collection("users").doc(user.uid).get();
        
        if (!ideaDoc.exists || !userDoc.exists) throw new Error("Data not found");

        const idea = ideaDoc.data();
        const userData = userDoc.data();
        const userBranch = userData.branch || "General Engineering";
        let departments = idea.department || idea.departments || [];
        if (!Array.isArray(departments)) departments = [departments];

        // --- UPDATED PROMPT WITH 4 SECTIONS ---
        const promptText = `
        Act as a Senior Project Mentor.
        Context: A student from '${userBranch}' wants to join the project "${idea.title}".
        Project Description: "${idea.description}"
        Other Branches Involved: ${departments.join(", ")}
        
        Task: Explain 4 things to this student in simple HTML format (use <h3>, <ul>, <li>, <b> tags only):
        1. <h3>🎯 Your Core Role</h3>: What specifically does a ${userBranch} student do here?
        2. <h3>🛠️ Skills Needed</h3>: List 3 technical skills from their syllabus to use.
        3. <h3>🤝 Cross-Branch Tip</h3>: One thing they need to know to work with the other branches.
        4. <h3>📚 Where to Learn</h3>: List 2 specific free resources (Youtube channels, documentation, or websites) to learn these skills.
        `;

        const API_KEY = "AIzaSyD021Ydn2GkDS9vVNOTFHwgslE2RMTrcuw"; 
        
    

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(`Google API Error: ${data.error.message}`);
        }
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No answer generated.");
        }

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanHtml = aiText.replace(/```html/g, '').replace(/```/g, '');

        contentDiv.innerHTML = cleanHtml;

    } catch (error) {
        console.error("AI Error:", error);
        contentDiv.innerHTML = `
            <div style="color: red; text-align: center; padding: 20px;">
                <h3>⚠️ Error</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}
// ---------------- IDEA CREATION ----------------
function createIdea(event) {
    if (event) event.preventDefault();

    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in before posting an idea.");
        window.location = "login.html";
        return;
    }

    const title = document.getElementById("ideaTitle").value.trim();
    const description = document.getElementById("ideaDescription").value.trim();
    const totalMembersInput = document.getElementById("totalMembers").value;

    // Basic validation
    if (!title || !description || !totalMembersInput) {
        alert("Please fill all fields.");
        return;
    }

    const totalMembers = parseInt(totalMembersInput, 10);
    if (isNaN(totalMembers) || totalMembers <= 0) {
        alert("Please enter a valid team size (number of members).");
        return;
    }

    // Get selected departments from checkboxes
    const departmentCheckboxes = document.querySelectorAll('input[name="ideaDepartments"]:checked');
    const selectedDepartments = Array.from(departmentCheckboxes).map(cb => cb.value);

    if (selectedDepartments.length === 0) {
        alert("Please select at least one department.");
        return;
    }

    // Build idea object
    const ideaData = {
        title: title,
        description: description,
        department: selectedDepartments,       // e.g. ["CSE", "ECE"] - stored as department (singular)
        totalMembers: totalMembers,           // team size
        ownerUid: user.uid,
        ownerEmail: user.email || "",
        status: "open",                       // open for collaboration
        members: [user.uid],                  // owner is first member
        joinRequests: [],                     // array of user IDs who requested to join
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    console.log("Creating idea with ownerUid:", user.uid);
    
    db.collection("ideas")
        .add(ideaData)
        .then((docRef) => {
            console.log("Idea created successfully with ID:", docRef.id);
            alert("Idea posted successfully!");
            // Reset form
            const form = document.getElementById("createIdeaForm");
            if (form) form.reset();
            // Close modal
            closeModal("createIdeaModal");
            // Reload ideas if on my-ideas page
            if (typeof loadMyIdeasPage === 'function') {
                console.log("Reloading my ideas page...");
                setTimeout(() => loadMyIdeasPage(), 500); // Small delay to ensure Firestore write is complete
            }
            // Also update dashboard count
            if (typeof loadMyIdeas === 'function') {
                loadMyIdeas();
            }
        })
        .catch((error) => {
            console.error("Error posting idea:", error);
            alert("Failed to post idea: " + error.message);
        });
}

// ---------------- LOGIN ----------------
function loginUser() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const messageDiv = document.getElementById("loginMessage");

    if (!email || !password) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "Please enter email and password";
        return;
    }

    firebase.auth()
        .signInWithEmailAndPassword(email, password)
        .then(() => {
            messageDiv.style.color = "green";
            messageDiv.innerText = "Login successful! Redirecting...";
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            messageDiv.style.color = "red";
            messageDiv.innerText = error.message;
        });
}

// ---------------- LOAD AVAILABLE PROJECTS ----------------
function loadAvailableProjects() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log("User not logged in");
        return;
    }

    // Show loading state
    const loadingState = document.getElementById("loadingProjectsState");
    const emptyState = document.getElementById("emptyProjectsState");
    const projectsGrid = document.getElementById("availableProjectsGrid");
    
    if (loadingState) {
        loadingState.style.display = "block";
        loadingState.innerHTML = `
            <div class="empty-icon">⏳</div>
            <h3>Loading Projects...</h3>
            <p style="font-size: 12px; color: #666;">Please wait while we fetch available projects.</p>
        `;
    }
    if (emptyState) emptyState.style.display = "none";
    if (projectsGrid) projectsGrid.style.display = "none";

    // Get user's branch from Firestore
    db.collection("users").doc(user.uid).get()
        .then(userDoc => {
            if (!userDoc.exists) {
                console.error("User profile not found. Please complete your profile.");
                if (loadingState) loadingState.style.display = "none";
                if (emptyState) {
                    emptyState.innerHTML = `
                        <div class="empty-icon">⚠️</div>
                        <h3>Profile Incomplete</h3>
                        <p>Your profile is missing branch information. Please update your profile.</p>
                        <button class="btn-primary" onclick="window.location.href='profile.html'">Complete Profile</button>
                    `;
                    emptyState.style.display = "block";
                }
                return;
            }

            const userData = userDoc.data();
            let userBranch = userData.branch;
            
            if (!userBranch) {
                console.error("User branch not found in profile");
                if (loadingState) loadingState.style.display = "none";
                if (emptyState) {
                    emptyState.innerHTML = `
                        <div class="empty-icon">⚠️</div>
                        <h3>Branch Not Set</h3>
                        <p>Please set your branch in your profile to see available projects.</p>
                        <button class="btn-primary" onclick="window.location.href='profile.html'">Update Profile</button>
                    `;
                    emptyState.style.display = "block";
                }
                return;
            }

            // Handle legacy branch names (migrate old names to new ones)
            const branchMapping = {
                "ME": "MECH",
                "CE": "CIVIL"
            };
            if (branchMapping[userBranch]) {
                console.log(`Migrating branch name: ${userBranch} -> ${branchMapping[userBranch]}`);
                userBranch = branchMapping[userBranch];
                // Update user's branch in Firestore
                db.collection("users").doc(user.uid).update({ branch: userBranch })
                    .catch(err => console.error("Error updating branch:", err));
            }

            console.log("Loading projects for branch:", userBranch);

            // Query ideas where user's branch is in the departments array
            // Note: Firestore doesn't support array-contains with multiple values directly
            // So we'll fetch all open ideas and filter client-side
            // Try with orderBy first, if it fails (no index), try without orderBy
            let query = db.collection("ideas").where("status", "==", "open");
            
            // Try to order by createdAt, but handle index errors gracefully
            query.orderBy("createdAt", "desc").get()
                .then(querySnapshot => {
                    processProjects(querySnapshot, userBranch, user.uid, loadingState, emptyState, projectsGrid);
                })
                .catch(error => {
                    console.log("OrderBy failed (might need index), trying without orderBy:", error);
                    // If orderBy fails, try without it
                    db.collection("ideas").where("status", "==", "open").get()
                        .then(querySnapshot => {
                            if (querySnapshot.empty) {
                                console.log("No open ideas found, trying to get all ideas for debugging...");
                                // If no open ideas, try getting all ideas (might be status field issue)
                                return db.collection("ideas").get();
                            }
                            return querySnapshot;
                        })
                        .then(querySnapshot => {
                            processProjects(querySnapshot, userBranch, user.uid, loadingState, emptyState, projectsGrid);
                        })
                        .catch(err => {
                            console.error("Error loading projects:", err);
                            if (loadingState) loadingState.style.display = "none";
                            if (emptyState) {
                                emptyState.innerHTML = `
                                    <div class="empty-icon">❌</div>
                                    <h3>Error Loading Projects</h3>
                                    <p>${err.message}</p>
                                    <p style="font-size: 12px; color: #666; margin-top: 10px;">Check browser console (F12) for details.</p>
                                    <button class="btn-primary" onclick="loadAvailableProjects()">Retry</button>
                                `;
                                emptyState.style.display = "block";
                            }
                        });
                });
        })
        .catch(error => {
            console.error("Error loading user profile:", error);
            if (loadingState) loadingState.style.display = "none";
            if (emptyState) {
                emptyState.innerHTML = `
                    <div class="empty-icon">❌</div>
                    <h3>Error Loading Profile</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="window.location.href='profile.html'">Update Profile</button>
                `;
                emptyState.style.display = "block";
            }
        });
}

// Helper function to process projects
function processProjects(querySnapshot, userBranch, currentUserId, loadingState, emptyState, projectsGrid) {
    if (loadingState) loadingState.style.display = "none";

    const availableIdeas = [];
    let totalIdeas = 0;
    let ideasWithDepartments = 0;
    let matchingIdeas = 0;
    let ownIdeas = 0;
    let wrongStatus = 0;
    
    querySnapshot.forEach(doc => {
        totalIdeas++;
        const idea = doc.data();
        
        // Filter by status if not "open" (for debugging fallback)
        if (idea.status && idea.status !== "open") {
            wrongStatus++;
            console.log(`Idea ${doc.id} has status "${idea.status}" (not "open"):`, idea.title);
            return; // Skip non-open ideas
        }
        
        // Handle both department (singular) and departments (plural) for backward compatibility
        const ideaDepartment = idea.department || idea.departments;
        
        console.log(`Idea ${doc.id}:`, {
            title: idea.title,
            department: ideaDepartment,
            ownerUid: idea.ownerUid,
            status: idea.status || "undefined"
        });
        
        // Filter: show if user's branch is in the department array
        // Handle both array and single string values
        let departmentArray = [];
        if (Array.isArray(ideaDepartment)) {
            departmentArray = ideaDepartment;
        } else if (typeof ideaDepartment === 'string') {
            // If it's a single string, convert to array
            departmentArray = [ideaDepartment];
        }
        
        if (departmentArray.length > 0) {
            ideasWithDepartments++;
            // Normalize for comparison (both should be uppercase, but be safe)
            const normalizedUserBranch = String(userBranch).toUpperCase().trim();
            const normalizedDepartments = departmentArray.map(d => String(d).toUpperCase().trim());
            
            // Check if user's branch matches any department in the idea
            if (normalizedDepartments.includes(normalizedUserBranch)) {
                matchingIdeas++;
                // Don't show user's own ideas in available projects
                if (idea.ownerUid !== currentUserId) {
                    availableIdeas.push({
                        id: doc.id,
                        ...idea,
                        department: departmentArray // Normalize to array format
                    });
                } else {
                    ownIdeas++;
                    console.log(`Skipping own idea: ${idea.title}`);
                }
            } else {
                console.log(`Branch ${normalizedUserBranch} not in departments [${normalizedDepartments.join(", ")}]`);
            }
        } else {
            console.log(`Idea ${doc.id} has no department field or it's empty:`, ideaDepartment);
        }
    });

    console.log(`Summary: ${totalIdeas} total ideas, ${wrongStatus} wrong status, ${ideasWithDepartments} with departments, ${matchingIdeas} matching branch, ${ownIdeas} own ideas, ${availableIdeas.length} available`);

    if (availableIdeas.length === 0) {
        if (emptyState) {
            if (totalIdeas === 0) {
                emptyState.innerHTML = `
                    <div class="empty-icon">💡</div>
                    <h3>No Projects Available</h3>
                    <p>There are no open projects right now. Be the first to create one!</p>
                    <button class="btn-primary" onclick="window.location.href='my-ideas.html'">Create Your Own Project</button>
                `;
            } else {
                let debugInfo = `Found ${totalIdeas} project(s) total. `;
                if (wrongStatus > 0) debugInfo += `${wrongStatus} have wrong status. `;
                if (ideasWithDepartments < totalIdeas) debugInfo += `${totalIdeas - ideasWithDepartments} missing departments. `;
                if (matchingIdeas > 0) {
                    debugInfo += `${matchingIdeas} matched your branch (${userBranch}), but ${ownIdeas > 0 ? ownIdeas + ' ' + (ownIdeas === 1 ? 'is' : 'are') + ' your own' : 'none available'}.`;
                } else {
                    debugInfo += `None match your branch (${userBranch}).`;
                }
                
                emptyState.innerHTML = `
                    <div class="empty-icon">🔍</div>
                    <h3>No Projects Match Your Branch</h3>
                    <p>Found ${totalIdeas} project(s), but none are available for your branch (${userBranch}).</p>
                    <p style="font-size: 12px; color: #666; margin-top: 10px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">${debugInfo}</p>
                    <p style="font-size: 11px; color: #999; margin-top: 10px;">Check browser console (F12) for detailed logs.</p>
                    <button class="btn-primary" onclick="window.location.href='my-ideas.html'">Create Your Own Project</button>
                `;
            }
            emptyState.style.display = "block";
        }
        if (projectsGrid) projectsGrid.style.display = "none";
    } else {
        if (emptyState) emptyState.style.display = "none";
        if (projectsGrid) {
            projectsGrid.style.display = "grid";
            displayAvailableProjects(availableIdeas, currentUserId);
        }
    }
}
// ---------------- POPULATE DASHBOARD LISTS ----------------
function populateDashboardLists() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const progressListEl = document.getElementById("ideasProgressList");
    const requirementsListEl = document.getElementById("requirementsStatusList");
    
    // Empty states
    const emptyProgress = document.getElementById("emptyIdeasState");
    const emptyReqs = document.getElementById("emptyRequirementsState");

    // Clear current lists
    if (progressListEl) progressListEl.innerHTML = "";
    if (requirementsListEl) requirementsListEl.innerHTML = "";

    db.collection("ideas")
        .where("ownerUid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .get()
        .catch(error => {
            // Fallback if index missing
             if (error.code === 'failed-precondition' || error.message.includes('index')) {
                return db.collection("ideas").where("ownerUid", "==", user.uid).get();
            }
            throw error;
        })
        .then(querySnapshot => {
            let hasProgressItems = false;
            let hasRequirementItems = false;

            querySnapshot.forEach(doc => {
                const idea = doc.data();
                const total = parseInt(idea.totalMembers) || 1;
                const current = (idea.members && idea.members.length) || 0;
                const percent = Math.min(100, Math.round((current / total) * 100));
                
                // 1. POPULATE "MY IDEAS PROGRESS"
                if (progressListEl) {
                    hasProgressItems = true;
                    const item = document.createElement("div");
                    item.className = "idea-progress-item";
                    item.innerHTML = `
                        <div class="idea-progress-header">
                            <h4>${escapeHtml(idea.title)}</h4>
                            <span class="status-badge ${idea.status === 'in-progress' ? 'status-in-progress' : 'status-open'}">${idea.status}</span>
                        </div>
                        <div class="requirements-status">
                            <div class="req-progress-bar">
                                <div class="req-progress-fill" style="width: ${percent}%"></div>
                            </div>
                            <span class="req-progress-text">${percent}% Team Filled</span>
                        </div>
                        <div class="idea-progress-actions">
                             <button class="btn-secondary" onclick="viewIdeaDetails('${doc.id}')">View Details</button>
                        </div>
                    `;
                    progressListEl.appendChild(item);
                }

                // 2. POPULATE "REQUIREMENTS STATUS" (Only if looking for members)
                if (requirementsListEl && idea.status === 'open' && current < total) {
                    hasRequirementItems = true;
                    const needed = total - current;
                    const reqItem = document.createElement("div");
                    reqItem.className = "requirement-status-item";
                    
                    // Count join requests
                    const requestsCount = (idea.joinRequests && idea.joinRequests.length) || 0;

                    reqItem.innerHTML = `
                        <div class="req-item-header">
                            <h4>${escapeHtml(idea.title)}</h4>
                            <span class="req-status-badge unmet">Requirements Unmet</span>
                        </div>
                        <div class="req-item-details">
                            <p><strong>Status:</strong> Needs ${needed} more member${needed !== 1 ? 's' : ''}</p>
                            <p><strong>Requests Pending:</strong> ${requestsCount}</p>
                        </div>
                        <div class="req-item-actions">
                            <button class="btn-secondary" onclick="viewJoinRequests('${doc.id}')">Review Requests (${requestsCount})</button>
                        </div>
                    `;
                    requirementsListEl.appendChild(reqItem);
                }
            });

            // Toggle Empty States
            if (progressListEl) {
                progressListEl.style.display = hasProgressItems ? "block" : "none";
                if (emptyProgress) emptyProgress.style.display = hasProgressItems ? "none" : "block";
            }

            if (requirementsListEl) {
                requirementsListEl.style.display = hasRequirementItems ? "block" : "none";
                if (emptyReqs) emptyReqs.style.display = hasRequirementItems ? "none" : "block";
            }
        })
        .catch(err => console.error("Error populating lists:", err));
}

// ---------------- DISPLAY AVAILABLE PROJECTS ----------------
function displayAvailableProjects(ideas, currentUserId) {
    const projectsGrid = document.getElementById("availableProjectsGrid");
    if (!projectsGrid) return;

    projectsGrid.innerHTML = "";

    ideas.forEach(idea => {
        // Get current team size (count members/requests)
        const teamSize = (idea.members && idea.members.length) || 0;
        const isJoined = idea.members && idea.members.includes(currentUserId);
        const hasRequested = idea.joinRequests && idea.joinRequests.includes(currentUserId);

        const ideaCard = document.createElement("div");
        ideaCard.className = "card idea-card";
        ideaCard.innerHTML = `
            <div class="idea-header">
                <h3>${escapeHtml(idea.title)}</h3>
                <span class="status-badge status-open">Open</span>
            </div>
            <p class="idea-description">${escapeHtml(idea.description.substring(0, 150))}${idea.description.length > 150 ? '...' : ''}</p>
            <div class="idea-tags">
                ${(idea.department || idea.departments || []).map(dept => `<span class="tag">${escapeHtml(dept)}</span>`).join('')}
            </div>
            <div class="idea-meta-info">
                <p><strong>Team Size:</strong> ${teamSize} / ${idea.totalMembers} members</p>
                <p><strong>Posted by:</strong> ${escapeHtml(idea.ownerEmail || 'Unknown')}</p>
            </div>
            <div class="idea-actions">
                ${isJoined 
                    ? '<button class="btn-secondary" disabled>Already Joined</button>'
                    : hasRequested
                    ? '<button class="btn-secondary" disabled>Request Sent</button>'
                    : `<button class="btn-primary" onclick="joinTeam('${idea.id}')">Join Team</button>`
                }
                <button class="btn-secondary" onclick="viewIdeaDetails('${idea.id}')">View Details</button>
                <button class="btn-secondary" style="background: #e3f2fd; color: #0d47a1;" onclick="openAIGuide('${idea.id}')">✨ What's my role?</button>
            </div>
        `;
        projectsGrid.appendChild(ideaCard);
    });
}

// ---------------- JOIN TEAM ----------------
function joinTeam(ideaId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to join a team.");
        window.location = "login.html";
        return;
    }

    // Get idea details
    db.collection("ideas").doc(ideaId).get()
        .then(ideaDoc => {
            if (!ideaDoc.exists) {
                alert("Project not found.");
                return;
            }

            const idea = ideaDoc.data();
            const currentTeamSize = (idea.members && idea.members.length) || 0;

            // Check if team is full
            if (currentTeamSize >= idea.totalMembers) {
                alert("This team is already full!");
                return;
            }

            // Check if user already joined
            if (idea.members && idea.members.includes(user.uid)) {
                alert("You are already a member of this team!");
                return;
            }

            // Check if user already requested
            if (idea.joinRequests && idea.joinRequests.includes(user.uid)) {
                alert("You have already sent a join request!");
                return;
            }

            // Add join request
            const updateData = {
                joinRequests: firebase.firestore.FieldValue.arrayUnion(user.uid)
            };

            db.collection("ideas").doc(ideaId).update(updateData)
                .then(() => {
                    alert("Join request sent! The project owner will review your request.");
                    // Reload available projects
                    loadAvailableProjects();
                })
                .catch(error => {
                    console.error("Error joining team:", error);
                    alert("Failed to send join request: " + error.message);
                });
        })
        .catch(error => {
            console.error("Error getting idea:", error);
            alert("Failed to join team: " + error.message);
        });
}

// ---------------- VIEW IDEA DETAILS ----------------
function viewIdeaDetails(ideaId) {
    // Store idea ID in sessionStorage and navigate to idea detail page
    sessionStorage.setItem("viewIdeaId", ideaId);
    window.location.href = "idea-detail.html";
}

// ---------------- LOAD MY IDEAS ----------------
// ---------------- LOAD MY IDEAS (Fixed with Counts) ----------------
function loadMyIdeas() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Elements to update
    const totalCountEl = document.getElementById("ideasCount");
    const pendingCountEl = document.getElementById("pendingRequirements");
    const readyCountEl = document.getElementById("readyIdeas");

    // Default to 0 while loading
    if(totalCountEl) totalCountEl.textContent = "-";
    if(pendingCountEl) pendingCountEl.textContent = "-";
    if(readyCountEl) readyCountEl.textContent = "-";

    const processSnapshot = (querySnapshot) => {
        let total = 0;
        let pending = 0;
        let ready = 0;

        querySnapshot.forEach(doc => {
            const idea = doc.data();
            total++;

            // Calculate Counts
            const membersCount = (idea.members && idea.members.length) || 0;
            const totalNeeded = idea.totalMembers || 0;
            const isFull = totalNeeded > 0 && membersCount >= totalNeeded;
            const status = idea.status || 'open';

            // Logic for "Ready to Proceed" (Team is full OR Status is in-progress/completed)
            if (isFull || status === 'in-progress' || status === 'completed') {
                ready++;
            } 
            // Logic for "Pending Requirements" (Still open and needs members)
            else {
                pending++;
            }
        });

        // Update UI
        if (totalCountEl) totalCountEl.textContent = total;
        if (pendingCountEl) pendingCountEl.textContent = pending;
        if (readyCountEl) readyCountEl.textContent = ready;
    };

    // Main Query
    db.collection("ideas")
        .where("ownerUid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .get()
        .then(processSnapshot)
        .catch(error => {
            // Index Error Fallback
            if (error.code === 'failed-precondition' || error.message.includes('index')) {
                console.warn("Index missing, falling back to simple query...");
                db.collection("ideas")
                    .where("ownerUid", "==", user.uid)
                    .get()
                    .then(processSnapshot)
                    .catch(err => console.error("Error loading counts:", err));
            } else {
                console.error("Error loading dashboard counts:", error);
            }
        });
}

// ---------------- LOAD MY IDEAS PAGE ----------------
function loadMyIdeasPage() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }

    console.log("Loading my ideas for user:", user.uid);

    const ideasGrid = document.getElementById("ideasGrid");
    const emptyState = document.getElementById("emptyIdeasState");
    
    if (!ideasGrid) {
        console.error("Ideas grid element not found");
        return;
    }

    // Show loading state
    if (emptyState) {
        emptyState.innerHTML = `
            <div class="empty-icon-large">⏳</div>
            <h3>Loading Your Ideas...</h3>
            <p>Please wait while we fetch your ideas.</p>
        `;
        emptyState.style.display = "block";
    }

    // Try with orderBy first, fallback if index missing
    db.collection("ideas")
        .where("ownerUid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .get()
        .then(querySnapshot => {
            console.log(`Found ${querySnapshot.size} ideas for user ${user.uid}`);
            
            if (querySnapshot.empty) {
                console.log("No ideas found for this user");
                // Show empty state
                if (emptyState) {
                    emptyState.innerHTML = `
                        <div class="empty-icon-large">💡</div>
                        <h3>No Ideas Yet</h3>
                        <p>You haven't created any ideas yet. Start by posting your first idea!</p>
                        <button class="btn-primary" onclick="openModal('createIdeaModal')">+ Create Your First Idea</button>
                    `;
                    emptyState.style.display = "block";
                }
                return;
            }

            // Hide empty state
            if (emptyState) emptyState.style.display = "none";

            // Clear existing ideas (except empty state)
            const existingIdeas = ideasGrid.querySelectorAll('.idea-card');
            existingIdeas.forEach(card => card.remove());

            // Display each idea
            let ideasAdded = 0;
            querySnapshot.forEach(doc => {
                const idea = doc.data();
                console.log(`Displaying idea ${doc.id}:`, idea.title);
                const ideaCard = createIdeaCard(doc.id, idea, user.uid);
                ideasGrid.appendChild(ideaCard);
                ideasAdded++;
            });
            
            console.log(`Successfully displayed ${ideasAdded} ideas`);
        })
        .catch(error => {
            console.error("Error loading my ideas:", error);
            // Try without orderBy if index error
            if (error.code === 'failed-precondition' || error.message.includes('index') || error.code === 9) {
                console.log("Trying without orderBy...");
                db.collection("ideas")
                    .where("ownerUid", "==", user.uid)
                    .get()
                    .then(querySnapshot => {
                        console.log(`Found ${querySnapshot.size} ideas (without orderBy)`);
                        
                        if (querySnapshot.empty) {
                            if (emptyState) {
                                emptyState.innerHTML = `
                                    <div class="empty-icon-large">💡</div>
                                    <h3>No Ideas Yet</h3>
                                    <p>You haven't created any ideas yet. Start by posting your first idea!</p>
                                    <button class="btn-primary" onclick="openModal('createIdeaModal')">+ Create Your First Idea</button>
                                `;
                                emptyState.style.display = "block";
                            }
                            return;
                        }
                        
                        if (emptyState) emptyState.style.display = "none";
                        const existingIdeas = ideasGrid.querySelectorAll('.idea-card');
                        existingIdeas.forEach(card => card.remove());
                        
                        let ideasAdded = 0;
                        querySnapshot.forEach(doc => {
                            const idea = doc.data();
                            console.log(`Displaying idea ${doc.id}:`, idea.title);
                            const ideaCard = createIdeaCard(doc.id, idea, user.uid);
                            ideasGrid.appendChild(ideaCard);
                            ideasAdded++;
                        });
                        
                        console.log(`Successfully displayed ${ideasAdded} ideas`);
                    })
                    .catch(err => {
                        console.error("Error loading ideas:", err);
                        if (emptyState) {
                            emptyState.innerHTML = `
                                <div class="empty-icon-large">❌</div>
                                <h3>Error Loading Ideas</h3>
                                <p>${err.message}</p>
                                <button class="btn-primary" onclick="loadMyIdeasPage()">Retry</button>
                            `;
                            emptyState.style.display = "block";
                        }
                    });
            } else {
                console.error("Unexpected error:", error);
                if (emptyState) {
                    emptyState.innerHTML = `
                        <div class="empty-icon-large">❌</div>
                        <h3>Error Loading Ideas</h3>
                        <p>${error.message}</p>
                        <p style="font-size: 12px; color: #666;">Check browser console (F12) for details.</p>
                        <button class="btn-primary" onclick="loadMyIdeasPage()">Retry</button>
                    `;
                    emptyState.style.display = "block";
                }
            }
        });
}

// ---------------- CREATE IDEA CARD ----------------
function createIdeaCard(ideaId, idea, currentUserId) {
    const ideaCard = document.createElement("div");
    ideaCard.className = "card idea-card";
    
    // Get department array (handle both department and departments)
    const departments = idea.department || idea.departments || [];
    const departmentArray = Array.isArray(departments) ? departments : [departments];
    
    // Get team size
    const teamSize = (idea.members && idea.members.length) || 0;
    const joinRequestsCount = (idea.joinRequests && idea.joinRequests.length) || 0;
    
    // Format date
    let dateStr = "Recently";
    if (idea.createdAt) {
        if (idea.createdAt.toDate) {
            dateStr = idea.createdAt.toDate().toLocaleDateString();
        } else if (idea.createdAt.seconds) {
            dateStr = new Date(idea.createdAt.seconds * 1000).toLocaleDateString();
        }
    }
    
    // Status badge
    let statusBadge = '';
    if (idea.status === 'open') {
        statusBadge = '<span class="status-badge status-open">Open</span>';
    } else if (idea.status === 'in-progress') {
        statusBadge = '<span class="status-badge status-in-progress">In Progress</span>';
    } else if (idea.status === 'completed') {
        statusBadge = '<span class="status-badge status-completed">Completed</span>';
    } else {
        statusBadge = '<span class="status-badge status-open">Open</span>';
    }
    
    ideaCard.innerHTML = `
        <div class="idea-header">
            <h3>${escapeHtml(idea.title)}</h3>
            ${statusBadge}
        </div>
        <p class="idea-description">${escapeHtml(idea.description.substring(0, 150))}${idea.description.length > 150 ? '...' : ''}</p>
        <div class="idea-tags">
            ${departmentArray.map(dept => `<span class="tag">${escapeHtml(dept)}</span>`).join('')}
        </div>
        <div class="idea-meta-info">
            <p><strong>Team Size:</strong> ${teamSize} / ${idea.totalMembers || 0} members</p>
            <p><strong>Join Requests:</strong> ${joinRequestsCount}</p>
            <p><strong>Posted:</strong> ${dateStr}</p>
        </div>
        <div class="idea-actions">
            <button class="btn-secondary" onclick="viewIdeaDetails('${ideaId}')">View Details</button>
            <button class="btn-secondary" onclick="viewJoinRequests('${ideaId}')">Requests (${joinRequestsCount})</button>
            <button class="btn-primary" onclick="openProjectChat('${ideaId}')">Open Chat</button>
        </div>
    `;
    
    return ideaCard;
}

// ---------------- VIEW JOIN REQUESTS ----------------
function viewJoinRequests(ideaId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to view join requests.");
        window.location = "login.html";
        return;
    }

    const ideaRef = db.collection("ideas").doc(ideaId);
    ideaRef.get()
        .then(async (ideaDoc) => {
            if (!ideaDoc.exists) {
                alert("Idea not found.");
                return;
            }

            const idea = ideaDoc.data();
            if (idea.ownerUid !== user.uid) {
                alert("Only the idea owner can manage join requests.");
                return;
            }

            const joinRequests = idea.joinRequests || [];
            const ideaTitleEl = document.getElementById("joinRequestsIdeaTitle");
            if (ideaTitleEl) {
                ideaTitleEl.textContent = `Idea: ${idea.title || 'Untitled'} (${joinRequests.length} request${joinRequests.length === 1 ? '' : 's'})`;
            }

            const listEl = document.getElementById("joinRequestsList");
            const emptyStateEl = document.getElementById("joinRequestsEmptyState");

            if (!listEl || !emptyStateEl) {
                alert("Join requests UI not found on this page.");
                return;
            }

            listEl.innerHTML = "";

            if (joinRequests.length === 0) {
                emptyStateEl.style.display = "block";
                listEl.style.display = "none";
                openModal("joinRequestsModal");
                return;
            }

            emptyStateEl.style.display = "none";
            listEl.style.display = "grid";

            // Fetch requester profiles in parallel
            const requesterProfiles = await Promise.all(joinRequests.map(uid => {
                return db.collection("users").doc(uid).get()
                    .then(doc => ({ uid, exists: doc.exists, data: doc.data() || {} }))
                    .catch(() => ({ uid, exists: false, data: {} }));
            }));

            requesterProfiles.forEach(profile => {
                const details = profile.data || {};
                const card = document.createElement("div");
                card.className = "role-item";

                const name = details.name || "Unknown";
                const email = details.email || "";
                const branch = details.branch || "Branch N/A";
                const year = details.year ? `Year ${details.year}` : "Year N/A";
                const section = details.section ? `Sec ${details.section}` : "";

                card.innerHTML = `
                    <div class="role-status-icon unmet">👤</div>
                    <div class="role-info">
                        <div class="role-name">${escapeHtml(name)}</div>
                        <div class="role-status">${escapeHtml(email)}</div>
                        <div class="role-status">${escapeHtml(branch)} • ${escapeHtml(year)} ${escapeHtml(section)}</div>
                    </div>
                    <div class="idea-actions">
                        <button class="btn-primary" onclick="approveRequest('${ideaId}', '${profile.uid}')">Accept</button>
                        <button class="btn-secondary" onclick="rejectRequest('${ideaId}', '${profile.uid}')">Reject</button>
                    </div>
                `;

                listEl.appendChild(card);
            });

            openModal("joinRequestsModal");
        })
        .catch(error => {
            console.error("Error loading join requests:", error);
            alert("Failed to load join requests: " + error.message);
        });
}

// ---------------- APPROVE REQUEST ----------------
function approveRequest(ideaId, requesterId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to accept requests.");
        window.location = "login.html";
        return;
    }

    const ideaRef = db.collection("ideas").doc(ideaId);
    db.runTransaction(async (transaction) => {
        const ideaDoc = await transaction.get(ideaRef);
        if (!ideaDoc.exists) {
            throw new Error("Idea not found.");
        }
        const idea = ideaDoc.data();
        if (idea.ownerUid !== user.uid) {
            throw new Error("Only the idea owner can approve requests.");
        }

        const members = idea.members || [];
        const joinRequests = idea.joinRequests || [];
        const totalMembers = idea.totalMembers || 0;

        if (!joinRequests.includes(requesterId)) {
            throw new Error("Request no longer pending.");
        }

        if (members.includes(requesterId)) {
            throw new Error("User is already a member.");
        }

        if (members.length >= totalMembers) {
            throw new Error("Team is already full.");
        }

        const newMembersCount = members.length + 1;
        const updates = {
            members: firebase.firestore.FieldValue.arrayUnion(requesterId),
            joinRequests: firebase.firestore.FieldValue.arrayRemove(requesterId)
        };

        // Auto-move to in-progress when team is full
        if (totalMembers > 0 && newMembersCount >= totalMembers) {
            updates.status = "in-progress";
        }

        transaction.update(ideaRef, updates);
    }).then(() => {
        alert("Request accepted and member added.");
        // Refresh UI
        if (typeof loadMyIdeasPage === 'function') {
            loadMyIdeasPage();
        }
        viewJoinRequests(ideaId);
    }).catch(error => {
        console.error("Error approving request:", error);
        alert(error.message);
    });
}

// ---------------- REJECT REQUEST ----------------
function rejectRequest(ideaId, requesterId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to reject requests.");
        window.location = "login.html";
        return;
    }

    const ideaRef = db.collection("ideas").doc(ideaId);
    ideaRef.get()
        .then(ideaDoc => {
            if (!ideaDoc.exists) {
                throw new Error("Idea not found.");
            }
            const idea = ideaDoc.data();
            if (idea.ownerUid !== user.uid) {
                throw new Error("Only the idea owner can reject requests.");
            }
            return ideaRef.update({
                joinRequests: firebase.firestore.FieldValue.arrayRemove(requesterId)
            });
        })
        .then(() => {
            alert("Request rejected.");
            if (typeof loadMyIdeasPage === 'function') {
                loadMyIdeasPage();
            }
            viewJoinRequests(ideaId);
        })
        .catch(error => {
            console.error("Error rejecting request:", error);
            alert(error.message);
        });
}

// ---------------- UTILITY FUNCTION ----------------
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ---------------- PROJECT CHAT NAVIGATION ----------------
function openProjectChat(ideaId) {
    sessionStorage.setItem("projectChatIdeaId", ideaId);
    window.location = "project-workspace.html";
}

// ---------------- LOAD MY PROJECTS (owner or member) ----------------
// ---------------- LOAD MY PROJECTS (owner or member) ----------------
// ---------------- LOAD MY PROJECTS (owner or member) ----------------
async function loadMyProjects(providedUser = null) {
    const user = providedUser || firebase.auth().currentUser;
    const listEl = document.getElementById("myProjectsList");
    const myProjectsEmpty = document.getElementById("myProjectsEmpty"); // Small empty state in list
    const workspaceEmpty = document.getElementById("emptyWorkspaceState"); // Big empty state
    const chatEmpty = document.getElementById("chatEmptyState"); // "Select a chat" message

    if (!user || !listEl) return;

    listEl.innerHTML = "";
    if (myProjectsEmpty) myProjectsEmpty.style.display = "none";

    try {
        const ownerQuery = db.collection("ideas").where("ownerUid", "==", user.uid);
        const memberQuery = db.collection("ideas").where("members", "array-contains", user.uid);

        const [ownerSnap, memberSnap] = await Promise.all([ownerQuery.get(), memberQuery.get()]);

        const seen = new Set();
        const projects = [];

        function pushIdea(doc) {
            if (seen.has(doc.id)) return;
            seen.add(doc.id);
            const data = doc.data();
            const membersCount = (data.members && data.members.length) || 0;
            const totalMembers = data.totalMembers || membersCount;
            const isFull = totalMembers > 0 && membersCount >= totalMembers;
            const rawStatus = (data.status || (isFull ? "in-progress" : "open")).toString().trim();
            const status = rawStatus || "open";

            projects.push({ id: doc.id, ...data, status, membersCount, totalMembers, isFull });
        }

        ownerSnap.forEach(pushIdea);
        memberSnap.forEach(pushIdea);

        // --- FIX: Logic to handle Empty States correctly ---
        if (projects.length === 0) {
            // Truly no projects
            if (myProjectsEmpty) myProjectsEmpty.style.display = "block";
            if (workspaceEmpty) workspaceEmpty.style.display = "block";
            if (chatEmpty) chatEmpty.style.display = "none"; // Hide "select a chat" since there are none
            return;
        }

        // Projects exist!
        if (workspaceEmpty) workspaceEmpty.style.display = "none"; // HIDE the confusing "No Active Project" message
        // Note: chatEmpty is handled by initializeWorkspaceChat logic
        
        projects.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        projects.forEach(project => {
            const normalizedStatus = (project.status || "open").toString().trim();
            const effectiveStatus = project.isFull && normalizedStatus === "open"
                ? "in-progress"
                : normalizedStatus || "open";

            const card = document.createElement("div");
            card.className = "card project-mini-card";
            let statusBadge = '';
            if (effectiveStatus === "completed") {
                statusBadge = '<span class="status-badge status-completed">Completed</span>';
            } else if (effectiveStatus === "in-progress") {
                statusBadge = '<span class="status-badge status-in-progress">In Progress</span>';
            } else {
                statusBadge = '<span class="status-badge status-open">Open</span>';
            }

            card.innerHTML = `
                <div class="project-mini-header">
                    <div>
                        <h3>${escapeHtml(project.title || "Project")}</h3>
                        <p class="project-mini-meta">${escapeHtml(project.ownerEmail || "")}</p>
                    </div>
                    ${statusBadge}
                </div>
                <p class="project-mini-desc">${escapeHtml((project.description || "").slice(0, 140))}${(project.description || "").length > 140 ? "..." : ""}</p>
                <div class="project-mini-footer">
                    <span>${project.membersCount} / ${project.totalMembers || project.membersCount} members</span>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn-secondary" onclick="viewProjectDetails('${project.id}')">View Details</button>
                        <button class="btn-primary" onclick="openProjectChat('${project.id}')">Open Chat</button>
                    </div>
                </div>
            `;
            listEl.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading projects:", err);
        if (myProjectsEmpty) {
            myProjectsEmpty.style.display = "block";
            myProjectsEmpty.innerHTML = `
                <div class="empty-icon-large">❌</div>
                <h3>Error Loading Projects</h3>
                <p>${escapeHtml(err.message)}</p>
            `;
        }
    }
}

// ---------------- WORKSPACE CHAT INITIALIZATION ----------------
// ---------------- WORKSPACE CHAT INITIALIZATION ----------------
// ---------------- WORKSPACE CHAT INITIALIZATION ----------------
function initializeWorkspaceChat() {
    const emptyState = document.getElementById("emptyWorkspaceState");
    const chatCard = document.getElementById("chatCard");
    const chatEmptyState = document.getElementById("chatEmptyState");
    const ideaIdInStorage = sessionStorage.getItem("projectChatIdeaId");

    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            alert("Please log in to access the project workspace.");
            window.location = "login.html";
            return;
        }

        loadMyProjects(user);

        if (!ideaIdInStorage) {
            // No project selected yet
            if (chatCard) chatCard.style.display = "none";
            
            // Show "Select a chat" instruction
            if (chatEmptyState) chatEmptyState.style.display = "block";
            
            // FIX: Do NOT show "No Active Project" (emptyState) here by default. 
            // loadMyProjects will decide to show it ONLY if the list is empty.
            if (emptyState) emptyState.style.display = "none"; 
            
            return;
        }

        loadWorkspaceForIdea(ideaIdInStorage, user);
    });
}
function loadWorkspaceForIdea(ideaId, user) {
    const emptyState = document.getElementById("emptyWorkspaceState");
    const chatCard = document.getElementById("chatCard");
    const chatEmptyState = document.getElementById("chatEmptyState");

    db.collection("ideas").doc(ideaId).get()
        .then(doc => {
            if (!doc.exists) {
                if (emptyState) {
                    emptyState.innerHTML = `
                        <div class="empty-icon-large">❌</div>
                        <h3>Project Not Found</h3>
                        <p>The project you tried to open does not exist.</p>
                    `;
                    emptyState.style.display = "block";
                }
                return;
            }

            const idea = doc.data();
            const members = idea.members || [];
            const isMember = idea.ownerUid === user.uid || members.includes(user.uid);

            if (!isMember) {
                if (emptyState) {
                    emptyState.innerHTML = `
                        <div class="empty-icon-large">🚫</div>
                        <h3>Access Denied</h3>
                        <p>You must be a member of this project to open the chat.</p>
                    `;
                    emptyState.style.display = "block";
                }
                return;
            }

            // Populate workspace header
            const titleEl = document.getElementById("projectTitle");
            const subtitleEl = document.getElementById("projectSubtitle");
            const descEl = document.getElementById("projectDescription");
            const statusBadge = document.getElementById("projectStatusBadge");
            const teamSize = document.getElementById("teamSize");

            if (titleEl) titleEl.textContent = idea.title || "Project Workspace";
            if (subtitleEl) subtitleEl.textContent = "Team chat and collaboration space";
            if (descEl) descEl.textContent = idea.description || "No description provided.";

            const memberCount = members.length || 0;
            const totalMembers = idea.totalMembers || memberCount;
            if (teamSize) teamSize.textContent = `${memberCount} / ${totalMembers} members`;

            if (statusBadge) {
                const status = idea.status || "open";
                statusBadge.textContent = status === "in-progress" ? "In Progress" : status === "completed" ? "Completed" : "Open for Collaboration";
                statusBadge.className = "status-badge " + (status === "in-progress" ? "status-in-progress" : status === "completed" ? "status-completed" : "status-open-for-collaboration");
            }

            // Show chat UI
            if (emptyState) emptyState.style.display = "none";
            if (chatEmptyState) chatEmptyState.style.display = "none";
            if (chatCard) chatCard.style.display = "block";

            const chatIdeaTitle = document.getElementById("chatIdeaTitle");
            if (chatIdeaTitle) chatIdeaTitle.textContent = idea.title || "Project Chat";

            currentChatIdeaId = ideaId;
            subscribeToChatMessages(ideaId);
        })
        .catch(error => {
            console.error("Error loading project workspace:", error);
            if (emptyState) {
                emptyState.innerHTML = `
                    <div class="empty-icon-large">❌</div>
                    <h3>Error Loading Project</h3>
                    <p>${error.message}</p>
                `;
                emptyState.style.display = "block";
            }
        });
}

// ---------------- CHAT LISTENER ----------------
// ---------------- CHAT LISTENER (Updated to show Name) ----------------
function subscribeToChatMessages(ideaId) {
    const messagesEl = document.getElementById("chatMessages");
    if (!messagesEl) return;

    if (chatUnsubscribe) {
        chatUnsubscribe();
        chatUnsubscribe = null;
    }

    chatUnsubscribe = db.collection("ideas").doc(ideaId)
        .collection("messages")
        .orderBy("createdAt", "asc")
        .onSnapshot(snapshot => {
            messagesEl.innerHTML = "";
            if (snapshot.empty) {
                messagesEl.innerHTML = `<div class="chat-placeholder">No messages yet. Start the conversation!</div>`;
                return;
            }

            const currentUid = (firebase.auth().currentUser || {}).uid;
            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMine = msg.senderUid === currentUid;
                const bubble = document.createElement("div");
                bubble.className = "chat-message" + (isMine ? " mine" : "");
                
                // USE NAME IF AVAILABLE, ELSE EMAIL
                const senderLabel = msg.senderName || msg.senderEmail || "Someone";
                
                const timeLabel = formatTimestamp(msg.createdAt);
                bubble.innerHTML = `
                    <div class="chat-meta">
                        <span class="chat-sender">${escapeHtml(senderLabel)}</span>
                        <span class="chat-time">${escapeHtml(timeLabel)}</span>
                    </div>
                    <div class="chat-text">${escapeHtml(msg.text || "")}</div>
                `;
                messagesEl.appendChild(bubble);
            });
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }, error => {
            console.error("Chat listener error:", error);
        });
}

// ---------------- SEND CHAT MESSAGE ----------------
// ---------------- SEND CHAT MESSAGE (Updated to send Name) ----------------
function sendChatMessage(event) {
    if (event) event.preventDefault();
    const input = document.getElementById("chatInput");
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to send messages.");
        window.location = "login.html";
        return;
    }

    const ideaId = currentChatIdeaId || sessionStorage.getItem("projectChatIdeaId");
    if (!ideaId) {
        alert("No project chat selected.");
        return;
    }

    // 1. Fetch User Name from Profile
    db.collection("users").doc(user.uid).get().then((doc) => {
        const userData = doc.exists ? doc.data() : {};
        // Use the name from profile, or fallback to email prefix if missing
        const userName = userData.name || user.email.split('@')[0];

        // 2. Send Message with Name
        return db.collection("ideas").doc(ideaId).collection("messages").add({
            text: text,
            senderUid: user.uid,
            senderEmail: user.email || "",
            senderName: userName, // <--- SAVING THE NAME HERE
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(() => {
        input.value = "";
    }).catch(error => {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
    });
}

// ---------------- FORMAT TIMESTAMP ----------------
function formatTimestamp(ts) {
    if (!ts) return "";
    if (ts.toDate) {
        return ts.toDate().toLocaleString();
    }
    if (ts.seconds) {
        return new Date(ts.seconds * 1000).toLocaleString();
    }
    return "";
}

// ---------------- PROJECT DETAILS MODAL ----------------
function viewProjectDetails(ideaId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to view project details.");
        window.location = "login.html";
        return;
    }

    const titleEl = document.getElementById("projectDetailsTitle");
    const metaEl = document.getElementById("projectDetailsMeta");
    const descEl = document.getElementById("projectDetailsDesc");
    const membersEl = document.getElementById("projectMembersList");
    if (!titleEl || !metaEl || !descEl || !membersEl) return;

    // Show placeholder
    membersEl.innerHTML = `<div class="chat-placeholder">Loading team...</div>`;

    db.collection("ideas").doc(ideaId).get()
        .then(async doc => {
            if (!doc.exists) {
                throw new Error("Project not found.");
            }
            const idea = doc.data();
            const members = idea.members || [];
            const isMember = idea.ownerUid === user.uid || members.includes(user.uid);
            if (!isMember) {
                throw new Error("You must be a project member to view details.");
            }

            const memberIds = Array.from(new Set([idea.ownerUid, ...members]));
            const profiles = await Promise.all(memberIds.map(uid => {
                return db.collection("users").doc(uid).get()
                    .then(p => ({ uid, exists: p.exists, data: p.data() || {} }))
                    .catch(() => ({ uid, exists: false, data: {} }));
            }));

            titleEl.textContent = idea.title || "Project Details";
            metaEl.textContent = `${profiles.length} member${profiles.length === 1 ? "" : "s"} • Status: ${(idea.status || "in-progress")}`;
            descEl.textContent = idea.description || "No description provided.";

            membersEl.innerHTML = "";
            profiles.forEach(profile => {
                const info = profile.data || {};
                const name = info.name || "Unknown";
                const email = info.email || profile.uid;
                const branch = info.branch || "";
                const year = info.year ? `Year ${info.year}` : "";
                const section = info.section ? `Sec ${info.section}` : "";
                const card = document.createElement("div");
                card.className = "project-mini-card";
                card.innerHTML = `
                    <div class="project-mini-header">
                        <div>
                            <h3>${escapeHtml(name)}</h3>
                            <p class="project-mini-meta">${escapeHtml(email)}</p>
                        </div>
                        <span class="status-badge status-open">${profile.uid === idea.ownerUid ? "Owner" : "Member"}</span>
                    </div>
                    <p class="project-mini-desc">${escapeHtml([branch, year, section].filter(Boolean).join(" • "))}</p>
                `;
                membersEl.appendChild(card);
            });

            openModal("projectDetailsModal");
        })
        .catch(err => {
            console.error("Error loading project details:", err);
            alert(err.message);
        });
}

// Clean up chat listener on unload
// Clean up chat listener when page is closed or refreshed
window.addEventListener("beforeunload", () => {
    if (chatUnsubscribe) {
        chatUnsubscribe();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // 🔥 LOGIN BUTTON
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", loginUser);
        console.log("Login button connected");
    }

    // 🔥 SIGNUP BUTTON
    const signupBtn = document.getElementById("signupBtn");
    if (signupBtn) {
        signupBtn.addEventListener("click", signupUser);
        console.log("Signup button connected");
    }
});
