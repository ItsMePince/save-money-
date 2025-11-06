/// <reference types="cypress" />

describe('Login Component', () => {
    const loginApiUrl = 'http://localhost:8081/api/auth/login';

    const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
    };

    // Clear sessionStorage before each test using cy.window()
    beforeEach(() => {
        cy.window().invoke('sessionStorage.clear');
    });

    it('should allow a user to log in successfully and redirect to /home', () => {
        // 1. Mock API request for a successful login
        cy.intercept('POST', loginApiUrl, {
            statusCode: 200,
            body: {
                success: true,
                user: mockUser,
            },
        }).as('loginRequest');

        // 2. Visit the login page
        cy.visit('/login');

        // 3. Fill out the form
        cy.get('input[autoComplete="username"]').type(mockUser.username);
        cy.get('input[autoComplete="current-password"]').type('password123');

        // 4. Submit the form
        cy.get('form').submit();


        // 6. Wait for the API call to complete
        cy.wait('@loginRequest');

        // 7. Assert sessionStorage is set using cy.window()
        cy.window().its('sessionStorage').invoke('getItem', 'isAuthenticated').should('eq', 'true');
        cy.window().its('sessionStorage').invoke('getItem', 'user').should('include', mockUser.username);

        // 8. Assert redirection
        cy.url().should('include', '/home');
    });

    it('should show an error message on failed login (wrong password)', () => {
        // 1. Mock API request for a failed login
        cy.intercept('POST', loginApiUrl, {
            statusCode: 400,
            body: {
                success: false,
                message: 'รหัสผ่านไม่ถูกต้อง', // Message from backend
            },
        }).as('loginFailRequest');

        cy.visit('/login');

        // 2. Fill out the form
        cy.get('input[autoComplete="username"]').type('testuser');
        cy.get('input[autoComplete="current-password"]').type('wrongpassword');
        cy.get('form').submit();

        // 3. Wait for the API call
        cy.wait('@loginFailRequest');

        // 4. Assert the error message
        cy.get('[data-testid="login-error"]')
            .should('be.visible')
            .and('contain.text', 'รหัสผ่านไม่ถูกต้อง');

        // 5. Assert the button is enabled again
        cy.get('button[type="submit"]').should('not.be.disabled');

        // 6. Assert still on the login page
        cy.url().should('include', '/login');
        cy.window().its('sessionStorage').invoke('getItem', 'isAuthenticated').should('be.null');
    });

    it('should show a generic error message on network failure', () => {
        // 1. Mock network error
        cy.intercept('POST', loginApiUrl, {
            forceNetworkError: true,
        }).as('networkError');

        cy.visit('/login');

        // 2. Fill out the form
        cy.get('input[autoComplete="username"]').type('testuser');
        cy.get('input[autoComplete="current-password"]').type('password123');
        cy.get('form').submit();

        // 3. Wait for the API call
        cy.wait('@networkError');

        // 4. Assert the error message (will show the message from the catch block)
        cy.get('[data-testid="login-error"]')
            .should('be.visible')
            .and('contain.text', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');

        // 5. Assert still on the login page
        cy.url().should('include', '/login');
    });

    it('should redirect to /home if already authenticated', () => {
        // 1. Set sessionStorage before visiting using cy.window()
        cy.window().invoke('sessionStorage.setItem', 'isAuthenticated', 'true');
        cy.window().invoke('sessionStorage.setItem', 'user', JSON.stringify(mockUser));

        // 2. Visit the login page
        cy.visit('/login');

        // 3. Assert redirection to /home (from useEffect)
        cy.url().should('include', '/home');
    });
});

