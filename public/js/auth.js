// Mpanel Authentication Controller
class AuthController {
  showLoginModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div id="login-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative">
          <div class="text-center space-y-2 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <i data-lucide="lock" class="w-6 h-6"></i>
            </div>
            <h3 class="text-xl font-extrabold text-white">Sign In to Mpanel</h3>
            <p class="text-xs text-slate-400">Enter your credentials to access your servers</p>
          </div>

          <form onsubmit="auth.handleLogin(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Username or Email</label>
              <input type="text" id="login-username" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs" placeholder="admin" required autofocus>
            </div>
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-xs font-semibold text-slate-300">Password</label>
                <a href="javascript:void(0)" onclick="auth.showForgotPassword()" class="text-[11px] text-cyan-400 hover:underline">Forgot password?</a>
              </div>
              <input type="password" id="login-password" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs" placeholder="••••••••" required>
            </div>

            <!-- 2FA Input (Shown only when required) -->
            <div id="login-2fa-container" class="hidden space-y-1 bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/30">
              <label class="block text-xs font-bold text-cyan-300">Two-Factor Authenticator Code</label>
              <input type="text" id="login-2fa-code" class="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono tracking-widest text-center" placeholder="123456" maxlength="6">
            </div>

            <button type="submit" id="login-submit-btn" class="btn-cyber w-full py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/25">
              Sign In
            </button>
          </form>

          <div class="mt-6 text-center pt-4 border-t border-white/10 text-xs text-slate-400">
            Don't have an account? 
            <a href="javascript:void(0)" onclick="auth.showRegisterModal()" class="text-cyan-400 font-semibold hover:underline">Create Account</a>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  showRegisterModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div id="register-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative">
          <div class="text-center space-y-2 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <i data-lucide="user-plus" class="w-6 h-6"></i>
            </div>
            <h3 class="text-xl font-extrabold text-white">Create Mpanel Account</h3>
            <p class="text-xs text-slate-400">Join and start deploying game & app servers</p>
          </div>

          <form onsubmit="auth.handleRegister(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input type="text" id="reg-username" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs" placeholder="e.g. shadow_player" required minlength="3">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input type="email" id="reg-email" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs" placeholder="you@example.com" required>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input type="password" id="reg-password" class="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs" placeholder="••••••••" required minlength="6">
            </div>

            <button type="submit" class="btn-cyber-purple w-full py-2.5 rounded-xl text-xs font-bold shadow-lg">
              Create Account
            </button>
          </form>

          <div class="mt-6 text-center pt-4 border-t border-white/10 text-xs text-slate-400">
            Already have an account? 
            <a href="javascript:void(0)" onclick="auth.showLoginModal()" class="text-cyan-400 font-semibold hover:underline">Sign In</a>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const twoFaInput = document.getElementById('login-2fa-code');
    const twoFactorCode = twoFaInput ? twoFaInput.value.trim() : null;

    try {
      const data = await app.api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, twoFactorCode })
      });

      if (data.requires2FA) {
        document.getElementById('login-2fa-container').classList.remove('hidden');
        document.getElementById('login-2fa-code').focus();
        app.toast('Please enter your 6-digit 2FA code.', 'info');
        return;
      }

      if (data.success && data.token) {
        localStorage.setItem('mpanel_token', data.token);
        app.token = data.token;
        app.user = data.user;
        app.updateAuthUI(data.user);
        document.getElementById('modal-container').innerHTML = '';
        app.toast(`Welcome back, ${data.user.username}!`, 'success');
        app.navigate('user-overview');
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      const data = await app.api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });

      if (data.success && data.token) {
        localStorage.setItem('mpanel_token', data.token);
        app.token = data.token;
        app.user = data.user;
        app.updateAuthUI(data.user);
        document.getElementById('modal-container').innerHTML = '';
        app.toast(`Account created! Welcome, ${data.user.username}`, 'success');
        app.navigate('user-overview');
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async handleProfileUpdate(e) {
    e.preventDefault();
    const username = document.getElementById('prof-username').value.trim();
    const email = document.getElementById('prof-email').value.trim();
    const currentPassword = document.getElementById('prof-current-pass').value;
    const newPassword = document.getElementById('prof-new-pass').value;

    try {
      const data = await app.api('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ username, email, currentPassword, newPassword })
      });

      if (data.success) {
        app.user = data.user;
        app.updateAuthUI(data.user);
        app.toast('Profile updated successfully!', 'success');
        app.renderUserProfile();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async start2FASetup() {
    try {
      const data = await app.api('/api/auth/2fa/setup', { method: 'POST' });
      const box = document.getElementById('2fa-setup-box');
      if (box && data.qrCodeUrl) {
        box.classList.remove('hidden');
        box.innerHTML = `
          <div class="text-center space-y-3">
            <p class="text-xs text-slate-300 font-semibold">1. Scan this QR code with Google Authenticator or Authy:</p>
            <div class="bg-white p-2 rounded-xl inline-block shadow">
              <img src="${data.qrCodeUrl}" alt="2FA QR Code" class="w-40 h-40">
            </div>
            <p class="text-[11px] font-mono text-cyan-400 select-all">Secret: ${data.secret}</p>
            <p class="text-xs text-slate-300 font-semibold">2. Enter the 6-digit code to verify:</p>
            <div class="flex gap-2">
              <input type="text" id="verify-2fa-code" placeholder="123456" maxlength="6" class="glass-input flex-1 px-3 py-2 rounded-xl text-center font-mono text-xs">
              <button onclick="auth.confirm2FA()" class="btn-cyber px-4 py-2 rounded-xl text-xs font-semibold">Verify & Enable</button>
            </div>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  async confirm2FA() {
    const code = document.getElementById('verify-2fa-code').value.trim();
    if (!code) {
      app.toast('Please enter 6-digit verification code.', 'warning');
      return;
    }

    try {
      const data = await app.api('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code })
      });

      if (data.success) {
        app.toast('Two-Factor Authentication is now ENABLED!', 'success');
        app.user.two_factor_enabled = true;
        app.renderUserProfile();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  showDisable2FAModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <div class="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="shield-alert" class="w-5 h-5 text-rose-400"></i> Disable Two-Factor Auth
          </h3>
          <p class="text-xs text-slate-300">Enter your account password to confirm disabling 2FA:</p>
          <input type="password" id="disable-2fa-pass" placeholder="Account password" class="w-full glass-input px-3 py-2 rounded-xl text-xs">
          <div class="flex gap-2">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-2 rounded-xl text-xs bg-slate-700 text-slate-300">Cancel</button>
            <button onclick="auth.disable2FA()" class="flex-1 py-2 rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold">Disable 2FA</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  async disable2FA() {
    const password = document.getElementById('disable-2fa-pass').value;
    try {
      const data = await app.api('/api/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password })
      });

      if (data.success) {
        document.getElementById('modal-container').innerHTML = '';
        app.toast('Two-Factor Authentication disabled.', 'info');
        app.user.two_factor_enabled = false;
        app.renderUserProfile();
      }
    } catch (err) {
      app.toast(err.message, 'error');
    }
  }

  showForgotPassword() {
    app.toast('Please contact your administrator to reset your password or run "npm run createuser".', 'info');
  }

  logout() {
    app.logout();
  }
}

window.auth = new AuthController();

