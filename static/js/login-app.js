async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!window.supabase?.auth) {
    console.error('Supabase client not initialized');
    return;
  }
  showMessage('Fazendo login...', 'loading');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Erro de login:', error.message);
    showMessage('Falha no login', 'error');
    return;
  }
  setUserCookie(data.user.id);
  window.location.href = '/';
}

document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
