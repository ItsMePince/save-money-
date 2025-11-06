// cypress/e2e/Signup.cy.ts
/// <reference types="cypress" />

describe('SignUp Component', () => {
    // Define the API endpoint URL
    const signupApiUrl = 'http://localhost:8081/api/auth/signup';

    // Run this before each test in the block
    beforeEach(() => {
        // Visit the page where the SignUp component is rendered.
        // Update '/signup' if your route is different.
        cy.visit('/signup');
    });

    it('should allow a user to sign up successfully', () => {
        // 1. Mock the API request
        cy.intercept('POST', signupApiUrl, {
            statusCode: 200,
            body: {
                success: true,
                message: 'User registered successfully!',
                user: { // <-- 👈 ต้องมีส่วนนี้
                    username: 'testuser',
                    email: 'test@example.com',
                    role: 'user',
                },
            },
        }).as('signupRequest');

        // 2. Fill form
        cy.get('#email').type('test@example.com');
        cy.get('#username').type('testuser');
        cy.get('#password').type('password123');

        // 3. Submit the form
        cy.get('form').submit();

        // 4. Wait for the API request to complete
        // นี่คือการ assertion ที่สำคัญว่า backend ถูกเรียก
        cy.wait('@signupRequest');

        // 5. Assert redirection to the LOGIN page
        // นี่คือการ assertion ที่สำคัญว่า user flow ถูกต้อง
        cy.url().should('include', '/login');
    });

    it('should show an error for empty fields', () => {
        // 1. Submit the form without filling any fields
        cy.get('form').submit();

        // 2. Assert the validation error message is visible
        cy.contains('กรุณากรอกข้อมูลให้ครบถ้วน').should('be.visible');

        // 3. Assert no API call was made
        // We can't easily assert *no* call was made,
        // so we just confirm the URL hasn't changed.
        cy.url().should('include', '/signup');
    });

    it('should show an error for a password that is too short', () => {
        // 1. Fill fields with a short password
        cy.get('#email').type('test@example.com');
        cy.get('#username').type('testuser');
        cy.get('#password').type('12345'); // Less than 6 characters

        // 2. Submit the form
        cy.get('form').submit();

        // 3. Assert the password length error is visible
        cy.contains('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').should('be.visible');
    });

    it('should show an API error message if signup fails (e.g., user exists)', () => {
        // 1. Mock the API request for a failure response
        cy.intercept('POST', signupApiUrl, {
            statusCode: 400, // Or 409 (Conflict), 500, etc.
            body: {
                success: false,
                message: 'Username or email already taken', // Custom error from backend
            },
        }).as('signupFailRequest');

        // 2. Fill in the form with valid data
        cy.get('#email').type('existing@example.com');
        cy.get('#username').type('existinguser');
        cy.get('#password').type('password123');

        // 3. Submit the form
        cy.get('form').submit();

        // 4. Wait for the API request
        cy.wait('@signupFailRequest');

        // 5. Assert the error from the API response is displayed
        cy.contains('Username or email already taken').should('be.visible');

        // 6. Assert the user is still on the signup page
        cy.url().should('include', '/signup');
    });

    it('should show a generic error if the server cannot be reached', () => {
        // 1. Mock a network error
        cy.intercept('POST', signupApiUrl, {
            forceNetworkError: true,
        }).as('networkErrorRequest');

        // 2. Fill in the form
        cy.get('#email').type('test@example.com');
        cy.get('#username').type('testuser');
        cy.get('#password').type('password123');

        // 3. Submit the form
        cy.get('form').submit();

        // 4. Wait for the request to fail
        cy.wait('@networkErrorRequest');

        // 5. Assert the generic connection error message is shown
        cy.contains('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง').should('be.visible');
    });

    it('should navigate to the login page when the link is clicked', () => {
        // 1. Find the link by its text and click it
        cy.contains('a', 'Login').click();

        // 2. Assert the URL has changed to the login route
        cy.url().should('include', '/login');
    });
});