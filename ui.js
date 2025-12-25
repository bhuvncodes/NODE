// ============================================
// UI INTERACTIONS - Minimal JavaScript
// ============================================

// Sidebar Toggle - Works on all screen sizes
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        console.error('Sidebar not found');
        return;
    }
    
    // Toggle active class for smooth left/right animation
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        // Hide sidebar - slide left
        sidebar.classList.remove('active');
        sidebar.classList.remove('sidebar-visible');
        sidebar.classList.add('sidebar-hidden');
        sidebar.style.transform = 'translateX(-100%)';
    } else {
        // Show sidebar - slide right
        sidebar.classList.add('active');
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
        sidebar.style.transform = 'translateX(0)';
    }
}

// Close sidebar when clicking outside (mobile only)
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (sidebar && window.innerWidth <= 768) {
        if (!sidebar.contains(event.target) && sidebarToggle && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('active');
            sidebar.classList.remove('sidebar-visible');
            sidebar.classList.add('sidebar-hidden');
        }
    }
});

// Handle window resize to maintain sidebar state
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth > 768) {
        // On desktop, always show sidebar
        sidebar.classList.add('active');
        sidebar.classList.add('sidebar-visible');
        sidebar.classList.remove('sidebar-hidden');
        sidebar.style.transform = 'translateX(0)';
    } else if (sidebar && window.innerWidth <= 768) {
        // On mobile, hide by default unless active
        if (!sidebar.classList.contains('active')) {
            sidebar.classList.remove('sidebar-visible');
            sidebar.classList.add('sidebar-hidden');
            sidebar.style.transform = 'translateX(-100%)';
        } else {
            sidebar.style.transform = 'translateX(0)';
        }
    }
});

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.classList.contains('active')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});

// Handle generic form submissions (UI only - no backend) except forms with their own handlers
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Skip forms that have explicit handlers or onsubmit attributes
        if (
            form.hasAttribute('onsubmit') ||
            form.id === 'createIdeaForm' ||
            form.id === 'chatForm' ||
            form.id === 'profileForm' ||
            form.id === 'changePasswordForm'
        ) {
            return;
        }

        form.addEventListener('submit', function(event) {
            event.preventDefault();
            // UI placeholder - backend will handle actual submission
            // Removed noisy alert; keep as silent no-op so default submit doesn't fire
            // Close modal if inside one
            const modal = form.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active state to navigation items based on current page
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'dashboard.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Initialize sidebar state based on screen size
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        if (window.innerWidth > 768) {
            // Desktop: show sidebar by default
            sidebar.classList.add('active');
            sidebar.classList.add('sidebar-visible');
            sidebar.classList.remove('sidebar-hidden');
            // Force visible on desktop
            sidebar.style.transform = 'translateX(0)';
        } else {
            // Mobile: hide sidebar by default
            sidebar.classList.remove('active');
            sidebar.classList.remove('sidebar-visible');
            sidebar.classList.add('sidebar-hidden');
            // Force hidden on mobile
            sidebar.style.transform = 'translateX(-100%)';
        }
    }

    // Theme toggle setup
    initializeTheme();

    // Initialize workspace state on page load
    if (document.getElementById('workspaceStatus')) {
        toggleWorkspaceState();
        updateRequirementsProgress(); // Update progress on load
    }

    // Initialize dashboard data (placeholder - backend will populate)
    initializeDashboard();
});

// ============================================
// DASHBOARD INITIALIZATION
// ============================================
function initializeDashboard() {
    // This function will be called to populate dashboard with backend data
    // For now, it shows empty states
    
    // Example: Check if user has ideas (backend will provide this)
    // const hasIdeas = false; // Backend will set this
    
    // If no ideas, show empty state
    // If ideas exist, populate ideasProgressList and requirementsStatusList
    
    // Placeholder: Show empty states by default
    // Backend integration will replace this logic
}

// ============================================
// THEME TOGGLE
// ============================================
function initializeTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    applyTheme(saved);

    if (!document.querySelector('.theme-toggle')) {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'theme-toggle-container';
        
        const toggleSwitch = document.createElement('div');
        toggleSwitch.className = 'theme-toggle-switch';
        toggleSwitch.setAttribute('data-theme', saved);
        
        const toggleSlider = document.createElement('div');
        toggleSlider.className = 'theme-toggle-slider';
        
        const lightIcon = document.createElement('span');
        lightIcon.className = 'theme-icon light-icon';
        lightIcon.innerHTML = '☀️';
        
        const darkIcon = document.createElement('span');
        darkIcon.className = 'theme-icon dark-icon';
        darkIcon.innerHTML = '🌙';
        
        toggleSwitch.appendChild(lightIcon);
        toggleSwitch.appendChild(toggleSlider);
        toggleSwitch.appendChild(darkIcon);
        toggleContainer.appendChild(toggleSwitch);
        
        // Set initial position
        if (saved === 'dark') {
            toggleSwitch.classList.add('dark-active');
        }
        
        toggleSwitch.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            
            // Animate toggle
            if (next === 'dark') {
                toggleSwitch.classList.add('dark-active');
                toggleSwitch.setAttribute('data-theme', 'dark');
            } else {
                toggleSwitch.classList.remove('dark-active');
                toggleSwitch.setAttribute('data-theme', 'light');
            }
        });
        
        document.body.appendChild(toggleContainer);
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// ============================================
// WORKSPACE STATE TOGGLE
// ============================================
function toggleWorkspaceState() {
    const statusSelect = document.getElementById('workspaceStatus');
    if (!statusSelect) return;

    const status = statusSelect.value;
    const lockedWorkspace = document.getElementById('lockedWorkspace');
    const requiredRolesCard = document.getElementById('requiredRolesCard');
    const teamSection = document.getElementById('teamSection');
    const taskBoardSection = document.getElementById('taskBoardSection');
    const statusBadge = document.getElementById('projectStatusBadge');
    const startDate = document.getElementById('startDate');
    const teamSize = document.getElementById('teamSize');

    if (status === 'open') {
        // Show locked state
        if (lockedWorkspace) lockedWorkspace.style.display = 'block';
        if (requiredRolesCard) requiredRolesCard.style.display = 'block';
        if (teamSection) teamSection.style.display = 'none';
        if (taskBoardSection) taskBoardSection.style.display = 'none';
        if (statusBadge) {
            statusBadge.textContent = 'Open for Collaboration';
            statusBadge.className = 'status-badge status-open-for-collaboration';
        }
        if (startDate) startDate.textContent = 'Not started';
        if (teamSize) teamSize.textContent = '0 members';
        updateRequirementsProgress(); // Update progress when showing open state
    } else if (status === 'in-progress') {
        // Show active workspace (requirements fulfilled)
        if (lockedWorkspace) lockedWorkspace.style.display = 'none';
        if (requiredRolesCard) requiredRolesCard.style.display = 'none';
        if (teamSection) teamSection.style.display = 'block';
        if (taskBoardSection) taskBoardSection.style.display = 'block';
        if (statusBadge) {
            statusBadge.textContent = 'In Progress';
            statusBadge.className = 'status-badge status-in-progress';
        }
        if (startDate) startDate.textContent = 'March 1, 2024';
        if (teamSize) teamSize.textContent = '6 members';
    }
}

// ============================================
// REQUIREMENTS PROGRESS TRACKER
// ============================================
function updateRequirementsProgress() {
    const checklistItems = document.querySelectorAll('.checklist-item');
    if (checklistItems.length === 0) return;

    let totalNeeded = 0;
    let totalFilled = 0;

    checklistItems.forEach(item => {
        const needed = parseInt(item.getAttribute('data-needed')) || 0;
        const filled = parseInt(item.getAttribute('data-filled')) || 0;
        totalNeeded += needed;
        totalFilled += filled;

        // Update individual role status
        const filledCount = item.querySelector('.filled-count');
        if (filledCount) filledCount.textContent = filled;

        // Update role status display
        const statusText = item.querySelector('.checklist-status');
        if (statusText) {
            const neededCount = item.getAttribute('data-needed');
            statusText.innerHTML = `${neededCount} position${neededCount > 1 ? 's' : ''} needed • <span class="filled-count">${filled}</span> filled`;
        }

        // Update icon and badge based on filled status
        const icon = item.querySelector('.checklist-icon');
        const badge = item.querySelector('.checklist-badge');
        
        if (filled >= needed) {
            // Requirement met
            if (icon) {
                icon.className = 'checklist-icon met';
                icon.textContent = '✓';
            }
            if (badge) {
                badge.className = 'checklist-badge met';
                badge.textContent = 'Met';
            }
            item.style.borderLeftColor = '#4caf50';
        } else {
            // Requirement unmet
            if (icon) {
                icon.className = 'checklist-icon unmet';
                icon.textContent = '⏳';
            }
            if (badge) {
                badge.className = 'checklist-badge unmet';
                badge.textContent = 'Unmet';
            }
            item.style.borderLeftColor = '#e0e0e0';
        }
    });
}
// ============================================
// DRAGGABLE CHAT WINDOW LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const chatCard = document.getElementById("chatCard");
    const chatHeader = document.getElementById("chatHeader");

    if (chatCard && chatHeader) {
        makeElementDraggable(chatCard, chatHeader);
    }
});

function makeElementDraggable(elmnt, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        
        // Remove 'bottom' and 'right' so 'top' and 'left' take priority
        elmnt.style.bottom = "auto";
        elmnt.style.right = "auto";
    }

    function closeDragElement() {
        // Stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}