async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!window.supabase?.auth) {
    console.error('Supabase client not initialized');
    return;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Erro de login:', error.message);
    const errEl = document.getElementById('loginError');
    if (errEl) errEl.textContent = 'Falha no login';
    return;
  }
  setUserCookie(data.user.id);
  window.location.href = '/';
}

document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
