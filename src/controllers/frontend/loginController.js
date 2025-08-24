class LoginController {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;

        if (!email || !password) {
            this.showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }

        // Check if Supabase is available
        if (!window.supabase?.auth) {
            console.error('Supabase client not initialized');
            this.showMessage('Erro na configuração do sistema. Tente novamente.', 'error');
            return;
        }

        this.showMessage('Fazendo login...', 'loading');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email, 
                password 
            });

            if (error) {
                console.error('Erro de login:', error.message);
                this.showMessage('Falha no login. Verifique suas credenciais.', 'error');
                return;
            }

            // Set user cookie for session management
            this.setUserCookie(data.user.id);
            
            this.showMessage('Login realizado com sucesso!', 'success');
            
            // Redirect to main application
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

        } catch (error) {
            console.error('Erro inesperado no login:', error);
            this.showMessage('Erro inesperado. Tente novamente.', 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const email = document.getElementById('registerEmail')?.value;
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (!email || !password || !confirmPassword) {
            this.showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('As senhas não coincidem.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        // Check if Supabase is available
        if (!window.supabase?.auth) {
            console.error('Supabase client not initialized');
            this.showMessage('Erro na configuração do sistema. Tente novamente.', 'error');
            return;
        }

        this.showMessage('Criando conta...', 'loading');

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) {
                console.error('Erro de registro:', error.message);
                this.showMessage('Falha ao criar conta. Tente novamente.', 'error');
                return;
            }

            if (data.user && !data.session) {
                this.showMessage('Conta criada! Verifique seu email para confirmar a conta.', 'success');
            } else if (data.session) {
                // Set user cookie for session management
                this.setUserCookie(data.user.id);
                this.showMessage('Conta criada e login realizado com sucesso!', 'success');
                
                // Redirect to main application
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }

        } catch (error) {
            console.error('Erro inesperado no registro:', error);
            this.showMessage('Erro inesperado. Tente novamente.', 'error');
        }
    }

    setUserCookie(userId) {
        if (typeof window !== 'undefined' && window.setUserId) {
            window.setUserId(userId);
        } else {
            // Fallback cookie setting
            document.cookie = `user_id=${userId}; path=/; max-age=${60 * 60 * 24 * 365}`;
        }
    }

    showMessage(message, type) {
        if (typeof window !== 'undefined' && window.showMessage) {
            window.showMessage(message, type);
        } else {
            // Fallback message display
            const messageEl = document.getElementById('message');
            if (messageEl) {
                messageEl.textContent = message;
                messageEl.className = `message ${type}`;
                messageEl.style.display = message ? 'block' : 'none';
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }
    }

    checkAuthAndRedirect() {
        // Check if user is already logged in
        if (typeof window !== 'undefined' && window.isAuthenticated && window.isAuthenticated()) {
            window.location.href = '/';
        }
    }

    initialize() {
        this.checkAuthAndRedirect();
    }
}

// Browser compatibility
if (typeof window === 'undefined') {
    module.exports = { LoginController };
} else {
    window.LoginController = LoginController;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const loginController = new LoginController();
            loginController.initialize();
        });
    } else {
        const loginController = new LoginController();
        loginController.initialize();
    }
}
