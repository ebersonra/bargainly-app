function setUserCookie(userId) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `user_id=${userId}; expires=${expires}; path=/`;
}

function getUserIdFromCookie() {
  const match = document.cookie.match(/(?:^|; )user_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function getUserId() {
  const cookieId = getUserIdFromCookie();
  if (cookieId) return cookieId;
  if (!window.supabase?.auth) {
    console.error('Supabase client not initialized');
    return null;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
  setUserCookie(data.user.id);
  return data.user.id;
}

function ensureAuth() {
  if (window.location.pathname.endsWith('/login.html')) return;
  if (!getUserIdFromCookie()) {
    window.location.href = '/login.html';
  }
}

document.addEventListener('DOMContentLoaded', ensureAuth);
