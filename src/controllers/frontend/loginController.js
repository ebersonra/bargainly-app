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
            this.showMessage('Aguarde a inicialização do sistema...', 'loading');
            
            // Wait a bit and try again
            setTimeout(() => {
                if (window.supabase?.auth) {
                    this.handleLogin(event);
                } else {
                    this.showMessage('Erro na configuração do sistema. Recarregue a página.', 'error');
                }
            }, 2000);
            return;
        }

        this.showMessage('Fazendo login...', 'loading');

        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({ 
                email, 
                password 
            });

            if (error) {
                console.error('Erro de login:', error.message);
                let errorMessage = 'Falha no login. Verifique suas credenciais.';
                
                // Provide more specific error messages
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Email ou senha incorretos.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Por favor, confirme seu email antes de fazer login.';
                }
                
                this.showMessage(errorMessage, 'error');
                return;
            }

            if (data.user) {
                // Set user ID using the auth utility
                this.setUserCookie(data.user.id);
                
                this.showMessage('Login realizado com sucesso!', 'success');
                
                // Redirect to main application
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }

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
            this.showMessage('Aguarde a inicialização do sistema...', 'loading');
            
            // Wait a bit and try again
            setTimeout(() => {
                if (window.supabase?.auth) {
                    this.handleRegister(event);
                } else {
                    this.showMessage('Erro na configuração do sistema. Recarregue a página.', 'error');
                }
            }, 2000);
            return;
        }

        this.showMessage('Criando conta...', 'loading');

        try {
            const { data, error } = await window.supabase.auth.signUp({
                email,
                password
            });

            if (error) {
                console.error('Erro de registro:', error.message);
                let errorMessage = 'Falha ao criar conta. Tente novamente.';
                
                // Provide more specific error messages
                if (error.message.includes('User already registered')) {
                    errorMessage = 'Este email já está cadastrado. Tente fazer login.';
                } else if (error.message.includes('Password should be at least')) {
                    errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
                }
                
                this.showMessage(errorMessage, 'error');
                return;
            }

            if (data.user && !data.session) {
                this.showMessage('Conta criada! Verifique seu email para confirmar a conta.', 'success');
            } else if (data.session) {
                // Set user ID using the auth utility
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

    async checkAuthAndRedirect() {
        // Check if user is already logged in
        try {
            const isAuth = await (window.isAuthenticated ? window.isAuthenticated() : false);
            if (isAuth) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            // If there's an error, just continue to show login page
        }
    }

    async initialize() {
        await this.checkAuthAndRedirect();
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
