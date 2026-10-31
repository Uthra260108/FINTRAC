/* ==========================================================================
   FINTRAC — Role-Based Authentication & Session Simulator
   ========================================================================== */

const AUTH_STORAGE_KEY = 'fintrac_session_user';

const DEMO_USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'AICTE Administrator',
    roleKey: 'admin',
    displayName: 'Dr. R. K. Soni',
    designation: 'Advisor & Bureau Chief, AICTE',
    institutionId: null,
    avatarText: 'AB',
    redirectUrl: 'admin.html'
  },
  mit: {
    username: 'mit',
    password: 'mit123',
    role: 'Institution Administrator',
    roleKey: 'institution',
    displayName: 'Dr. S. K. Kulkarni',
    designation: 'Registrar, MIT World Peace University',
    institutionId: 'INST-AICTE-1001',
    institutionName: 'Maharashtra Institute of Technology (MIT-WPU)',
    avatarText: 'MIT',
    redirectUrl: 'institution.html'
  },
  reviewer: {
    username: 'reviewer',
    password: 'review123',
    role: 'Authorized Reviewer',
    roleKey: 'reviewer',
    displayName: 'Smt. Ananya Rao',
    designation: 'Senior Scrutiny Officer (Empanelled)',
    institutionId: null,
    avatarText: 'AR',
    redirectUrl: 'reviewer.html'
  }
};

const FINTRAC_AUTH = {
  // Get active session
  getCurrentUser() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Login simulation
  login(username, password, roleHint) {
    const user = DEMO_USERS[username.trim().toLowerCase()];
    if (!user) {
      return { success: false, message: 'Invalid username. Please use demo credentials.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Incorrect password for this user.' };
    }

    if (roleHint && user.roleKey !== roleHint) {
      return {
        success: false,
        message: `Credentials belong to ${user.role}. Please select the matching role tab.`
      };
    }

    // Save session
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

    // Audit log
    if (window.FINTRAC_STORAGE) {
      FINTRAC_STORAGE.addAuditLog(
        'User Signed In',
        user.role,
        'N/A',
        'Signed Out',
        'Active Session',
        `Simulated session started for ${user.displayName}`
      );
    }

    return { success: true, user, redirectUrl: user.redirectUrl };
  },

  // Switch role directly (very helpful for hackathon judges!)
  quickSwitchRole(roleKey) {
    const user = Object.values(DEMO_USERS).find(u => u.roleKey === roleKey);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      window.location.href = user.redirectUrl;
    }
  },

  // Logout
  logout() {
    const user = this.getCurrentUser();
    if (user && window.FINTRAC_STORAGE) {
      FINTRAC_STORAGE.addAuditLog(
        'User Signed Out',
        user.role,
        'N/A',
        'Active Session',
        'Signed Out',
        `Session ended for ${user.displayName}`
      );
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = 'login.html';
  },

  // Require Login Guard for internal pages
  guard(allowedRoles = []) {
    const user = this.getCurrentUser();
    if (!user) {
      // Auto default to Admin for easy initial click-through if navigating directly,
      // but let's redirect to login if completely unauthenticated
      window.location.href = 'login.html';
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.roleKey)) {
      alert(`Access restricted. You are currently logged in as ${user.role}. Redirecting to your assigned workspace.`);
      window.location.href = user.redirectUrl;
      return null;
    }

    this.renderHeaderUserInfo(user);
    return user;
  },

  // Render User profile info dynamically
  renderHeaderUserInfo(user) {
    const avatarEls = document.querySelectorAll('.user-avatar');
    const nameEls = document.querySelectorAll('.user-name');
    const roleEls = document.querySelectorAll('.user-subtext, .user-role-label');

    avatarEls.forEach(el => { el.textContent = user.avatarText; });
    nameEls.forEach(el => { el.textContent = user.displayName; });
    roleEls.forEach(el => { el.textContent = user.role; });
  }
};
