/* =============================================
   SPENDSMART — app.js
   All app logic: routing, state, UI rendering
   ============================================= */

/* ---- STATE ---- */
const state = {
  user:       null,
  profile:    null,
  expenses:   [],
  filter:     'All',
  searchQ:    '',
  selectedCat:'',
  payType:    'upi',
  prevScreen: 'screen-dashboard'
};

/* ---- CATEGORY CONFIG ---- */
const CAT_CONFIG = {
  Food:     { emoji: '🍽', color: '#FAEEDA', bar: '#EF9F27' },
  Travel:   { emoji: '🚗', color: '#E6F1FB', bar: '#378ADD' },
  Shopping: { emoji: '🛍', color: '#FAECE7', bar: '#D85A30' },
  Milk:     { emoji: '🥛', color: '#E1F5EE', bar: '#1D9E75' },
  Bills:    { emoji: '📄', color: '#EEEDFE', bar: '#534AB7' },
  Health:   { emoji: '💊', color: '#FEF4E7', bar: '#F0A830' },
  Fun:      { emoji: '🎉', color: '#F5ECFE', bar: '#9B59B6' },
  Other:    { emoji: '📦', color: '#F1EFE8', bar: '#888780' }
};

/* =============================================
   ROUTING
============================================= */
function goTo(screenId) {
  state.prevScreen = document.querySelector('.screen.active')?.id || 'screen-dashboard';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const next = document.getElementById(screenId);
  if (next) next.classList.add('active');

  // Refresh data when navigating
  if (screenId === 'screen-dashboard') renderDashboard();
  if (screenId === 'screen-history')   renderHistory();
  if (screenId === 'screen-reports')   renderReports();
  if (screenId === 'screen-add')       initAddScreen();
  if (screenId === 'screen-settings')  renderSettings();
}

function goBack() {
  goTo(state.prevScreen || 'screen-dashboard');
}

/* =============================================
   TOAST
============================================= */
let toastTimer = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3000);
}

/* =============================================
   AUTH
============================================= */
function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('form-login').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('form-signup').style.display = tab === 'signup' ? 'block' : 'none';
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showToast('Please fill in all fields', 'error'); return; }
  try {
    showToast('Logging in…');
    await window.firebaseLogin(email, password);
  } catch (e) {
    showToast(friendlyError(e), 'error');
  }
}

async function handleSignup() {
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const budget   = document.getElementById('signup-budget').value;
  if (!name || !email || !password) { showToast('Please fill in all fields', 'error'); return; }
  if (password.length < 6)          { showToast('Password must be at least 6 characters', 'error'); return; }
  try {
    showToast('Creating account…');
    await window.firebaseSignup(email, password, name, budget || 15000);
  } catch (e) {
    showToast(friendlyError(e), 'error');
  }
}

async function handleGoogleLogin() {
  try {
    showToast('Opening Google login…');
    await window.firebaseGoogleLogin();
  } catch (e) {
    showToast(friendlyError(e), 'error');
  }
}

async function handleLogout() {
  if (!confirm('Are you sure you want to log out?')) return;
  await window.firebaseLogout();
  state.user     = null;
  state.profile  = null;
  state.expenses = [];
  goTo('screen-auth');
  showToast('Logged out');
}

function friendlyError(e) {
  const msg = e.message || '';
  if (msg.includes('user-not-found'))  return 'No account found with this email';
  if (msg.includes('wrong-password'))  return 'Incorrect password';
  if (msg.includes('email-already'))   return 'Email already in use — try logging in';
  if (msg.includes('invalid-email'))   return 'Please enter a valid email';
  if (msg.includes('popup-closed'))    return 'Google login cancelled';
  if (msg.includes('network'))         return 'Network error — check your connection';
  return 'Something went wrong. Please try again.';
}

/* =============================================
   AFTER LOGIN — load user data
============================================= */
async function onUserLoggedIn(user) {
  state.user = user;
  try {
    state.profile  = await window.getUserProfile(user.uid);
    state.expenses = await window.getExpenses(user.uid);
  } catch (e) {
    console.warn('Could not load data:', e);
    state.profile  = { name: user.displayName || user.email, budget: 15000 };
    state.expenses = [];
  }
  goTo('screen-dashboard');
  showToast(`Welcome back! 👋`);
}

/* =============================================
   DASHBOARD
============================================= */
function renderDashboard() {
  if (!state.profile) return;

  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  // This month's expenses
  const monthExp = state.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const spent  = monthExp.reduce((s, e) => s + e.amount, 0);
  const budget = state.profile.budget || 15000;
  const left   = Math.max(0, budget - spent);
  const pct    = Math.min(100, Math.round((spent / budget) * 100));

  const upiSpent  = monthExp.filter(e => e.payType === 'upi').reduce((s,e)  => s + e.amount, 0);
  const cashSpent = monthExp.filter(e => e.payType === 'cash').reduce((s,e) => s + e.amount, 0);

  // Greeting
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
  document.getElementById('dash-greeting').textContent = greeting;

  const name = state.profile.name || state.user.email;
  document.getElementById('dash-name').textContent = name;
  document.getElementById('dash-avatar').textContent = name.charAt(0).toUpperCase();

  // Budget card
  document.getElementById('dash-spent').textContent = '₹' + fmt(spent);
  document.getElementById('dash-budget-sub').textContent = `of ₹${fmt(budget)} budget`;
  document.getElementById('dash-remaining').textContent  = `₹${fmt(left)} left`;
  document.getElementById('dash-pct').textContent = `${pct}% used`;

  const bar = document.getElementById('dash-progress');
  bar.style.width = pct + '%';
  bar.className = 'progress-fill' + (pct >= 90 ? ' danger' : pct >= 75 ? ' warning' : '');

  const badge = document.getElementById('dash-status-badge');
  if (pct >= 90)      { badge.textContent = '⚠️ Near limit'; }
  else if (pct >= 75) { badge.textContent = '🟡 Watch out'; }
  else                { badge.textContent = '✅ On track'; }

  document.getElementById('dash-upi').textContent  = '₹' + fmt(upiSpent);
  document.getElementById('dash-cash').textContent = '₹' + fmt(cashSpent);

  // Recent 5 expenses
  renderExpenseList(
    document.getElementById('dash-recent'),
    monthExp.slice(0, 5),
    false
  );
}

/* =============================================
   EXPENSE LIST RENDERER
============================================= */
function renderExpenseList(container, expenses, grouped = true) {
  if (!expenses.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💸</div>
        <div class="empty-text">No expenses here yet.<br/>Tap + to add one!</div>
      </div>`;
    return;
  }

  if (!grouped) {
    container.innerHTML = expenses.map(e => expenseItemHTML(e)).join('');
    return;
  }

  // Group by date
  const groups = {};
  expenses.forEach(e => {
    const label = formatDateLabel(e.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  });

  container.innerHTML = Object.entries(groups).map(([label, items]) => `
    <div class="date-group-label">${label}</div>
    ${items.map(e => expenseItemHTML(e)).join('')}
  `).join('');
}

function expenseItemHTML(e) {
  const cat  = CAT_CONFIG[e.category] || CAT_CONFIG['Other'];
  const badge = e.payType === 'cash'
    ? '<span class="exp-badge badge-cash">Cash</span>'
    : '<span class="exp-badge badge-upi">UPI</span>';
  return `
    <div class="expense-item" onclick="confirmDelete('${e.id}')">
      <div class="exp-icon" style="background:${cat.color}">${cat.emoji}</div>
      <div class="exp-info">
        <div class="exp-name">${e.category}${e.note ? ' — ' + e.note : ''}</div>
        <div class="exp-meta">${formatTime(e.createdAt)}</div>
      </div>
      <div class="exp-right">
        <div class="exp-amount">₹${fmt(e.amount)}</div>
        ${badge}
      </div>
    </div>`;
}

async function confirmDelete(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    await window.deleteExpense(id);
    state.expenses = state.expenses.filter(e => e.id !== id);
    showToast('Expense deleted');
    renderDashboard();
    renderHistory();
    renderReports();
  } catch(e) {
    showToast('Could not delete', 'error');
  }
}

/* =============================================
   ADD EXPENSE
============================================= */
function initAddScreen() {
  document.getElementById('add-amount').value = '';
  document.getElementById('add-note').value   = '';
  document.getElementById('add-date').value   = todayStr();
  state.selectedCat = '';
  state.payType     = 'upi';
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  selectPay('upi');
  setTimeout(() => document.getElementById('add-amount').focus(), 200);
}

function selectCat(el) {
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  state.selectedCat = el.dataset.cat;
}

function selectPay(type) {
  state.payType = type;
  document.getElementById('pay-cash').classList.toggle('active', type === 'cash');
  document.getElementById('pay-upi').classList.toggle('active',  type === 'upi');
}

async function saveExpense() {
  const amount = parseFloat(document.getElementById('add-amount').value);
  if (!amount || amount <= 0)  { showToast('Enter a valid amount', 'error'); return; }
  if (!state.selectedCat)      { showToast('Please select a category', 'error'); return; }

  const expense = {
    amount,
    category: state.selectedCat,
    payType:  state.payType,
    note:     document.getElementById('add-note').value.trim(),
    date:     document.getElementById('add-date').value || todayStr()
  };

  try {
    showToast('Saving…');
    const ref = await window.addExpense(state.user.uid, expense);
    state.expenses.unshift({ id: ref.id, ...expense, createdAt: new Date().toISOString() });
    showToast(`₹${fmt(amount)} saved! 🎉`);
    goTo('screen-dashboard');
  } catch (e) {
    showToast('Could not save — check connection', 'error');
  }
}

/* =============================================
   HISTORY
============================================= */
function renderHistory() {
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  let expenses = state.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Apply category/type filter
  if (state.filter !== 'All') {
    if (state.filter === 'Cash') {
      expenses = expenses.filter(e => e.payType === 'cash');
    } else if (state.filter === 'UPI') {
      expenses = expenses.filter(e => e.payType === 'upi');
    } else {
      expenses = expenses.filter(e => e.category === state.filter);
    }
  }

  // Apply search
  if (state.searchQ) {
    const q = state.searchQ.toLowerCase();
    expenses = expenses.filter(e =>
      e.category.toLowerCase().includes(q) ||
      (e.note || '').toLowerCase().includes(q)
    );
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  document.getElementById('hist-count').textContent = expenses.length;
  document.getElementById('hist-total').textContent = '₹' + fmt(total);
  document.getElementById('hist-month').textContent = now.toLocaleString('default', { month: 'short' });

  renderExpenseList(document.getElementById('history-list'), expenses, true);
}

function setFilter(el) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  state.filter = el.dataset.filter;
  renderHistory();
}

function filterHistory() {
  state.searchQ = document.getElementById('history-search').value.trim();
  renderHistory();
}

/* =============================================
   REPORTS
============================================= */
function renderReports() {
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  const monthExp = state.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const total  = monthExp.reduce((s,e) => s + e.amount, 0);
  const budget = state.profile?.budget || 15000;
  const saved  = Math.max(0, budget - total);

  const upiTotal  = monthExp.filter(e => e.payType === 'upi').reduce((s,e)  => s + e.amount, 0);
  const cashTotal = monthExp.filter(e => e.payType === 'cash').reduce((s,e) => s + e.amount, 0);
  const upiPct    = total ? Math.round((upiTotal / total) * 100) : 0;
  const cashPct   = total ? 100 - upiPct : 0;

  document.getElementById('rpt-total').textContent    = '₹' + fmt(total);
  document.getElementById('rpt-saved').textContent    = '₹' + fmt(saved);
  document.getElementById('rpt-count').textContent    = monthExp.length;
  document.getElementById('rpt-upi').textContent      = '₹' + fmt(upiTotal);
  document.getElementById('rpt-upi-pct').textContent  = upiPct + '%';
  document.getElementById('rpt-cash').textContent     = '₹' + fmt(cashTotal);
  document.getElementById('rpt-cash-pct').textContent = cashPct + '%';

  // Category breakdown
  const catTotals = {};
  monthExp.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const sorted = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
  const maxAmt = sorted[0]?.[1] || 1;

  document.getElementById('rpt-cats').innerHTML = sorted.length
    ? sorted.map(([cat, amt]) => {
        const cfg = CAT_CONFIG[cat] || CAT_CONFIG['Other'];
        const pct = Math.round((amt / total) * 100);
        const barW = Math.round((amt / maxAmt) * 100);
        return `
          <div class="cat-bar-row">
            <div class="cat-bar-top">
              <span class="cat-bar-name">${cfg.emoji} ${cat}</span>
              <span class="cat-bar-amount">₹${fmt(amt)} · ${pct}%</span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" style="width:${barW}%;background:${cfg.bar}"></div>
            </div>
          </div>`;
      }).join('')
    : '<div class="empty-text" style="padding:16px 0;">No expenses this month</div>';

  // Week bar chart
  renderWeekChart(monthExp);
}

function renderWeekChart(expenses) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date().getDay();
  const weekAmts = [0,0,0,0,0,0,0];

  expenses.forEach(e => {
    const d   = new Date(e.date);
    const dow = d.getDay();
    // Only count this week (last 7 days from today)
    const diff = (today - dow + 7) % 7;
    if (diff < 7) weekAmts[dow] += e.amount;
  });

  const maxAmt = Math.max(...weekAmts, 1);
  document.getElementById('rpt-week-chart').innerHTML = `
    <div class="week-bar-chart">
      ${days.map((day, i) => {
        const h = Math.max(4, Math.round((weekAmts[i] / maxAmt) * 80));
        const isToday = i === today;
        return `
          <div class="wbc-col">
            <div class="wbc-bar${isToday ? ' today' : ''}" style="height:${h}px"></div>
            <div class="wbc-lbl${isToday ? ' today' : ''}">${day}</div>
          </div>`;
      }).join('')}
    </div>
    <div style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:6px;">
      Week total: ₹${fmt(weekAmts.reduce((s,a)=>s+a,0))}
    </div>`;
}

/* =============================================
   SETTINGS
============================================= */
function renderSettings() {
  if (!state.profile) return;
  const name = state.profile.name || state.user?.email || 'User';
  document.getElementById('settings-name').textContent  = name;
  document.getElementById('settings-email').textContent = state.user?.email || '';
  document.getElementById('settings-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('settings-budget').value = state.profile.budget || 15000;
}

async function saveBudget() {
  const val = parseFloat(document.getElementById('settings-budget').value);
  if (!val || val < 0) return;
  try {
    await window.updateBudget(state.user.uid, val);
    state.profile.budget = val;
    showToast('Budget updated!');
    renderDashboard();
  } catch(e) {
    showToast('Could not save budget', 'error');
  }
}

/* =============================================
   HELPERS
============================================= */
function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDateLabel(dateStr) {
  const d     = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today))     return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/* =============================================
   INIT — wait for Firebase auth state
============================================= */
document.addEventListener('DOMContentLoaded', () => {

  // Set today's date as default in add screen
  const dateInput = document.getElementById('add-date');
  if (dateInput) dateInput.value = todayStr();

  // Wait for Firebase to be ready
  const waitForFirebase = setInterval(() => {
    if (typeof window.onAuthReady === 'function') {
      clearInterval(waitForFirebase);

      window.onAuthReady(async (user) => {
        if (user) {
          await onUserLoggedIn(user);
        } else {
          goTo('screen-auth');
        }
      });
    }
  }, 100);

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

});
