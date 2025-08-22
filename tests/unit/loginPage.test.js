import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'fs';
import path from 'path';

test('Login page HTML structure and styling', () => {
  const loginHtmlPath = path.join(process.cwd(), 'login.html');
  const loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');

  // Verify essential elements exist
  assert(loginHtml.includes('<title>Login - Barganha App</title>'), 'Page title should be present');
  assert(loginHtml.includes('class="logo"'), 'Logo container should be present');
  assert(loginHtml.includes('class="login-form"'), 'Login form should be present');
  assert(loginHtml.includes('type="email"'), 'Email input should be present');
  assert(loginHtml.includes('type="password"'), 'Password input should be present');
  assert(loginHtml.includes('type="submit"'), 'Submit button should be present');

  // Verify improved styling is present
  assert(loginHtml.includes('shopping-belt'), 'Shopping belt animation should be present');
  assert(loginHtml.includes('Barganhα'), 'Modern logo text should be present');
  assert(loginHtml.includes('backdrop-filter: blur'), 'Glassmorphism effect should be present');
  assert(loginHtml.includes('color: #374151 !important'), 'Label visibility fix should be present');

  // Verify responsive design
  assert(loginHtml.includes('@media (max-width: 480px)'), 'Mobile responsive styles should be present');
});

test('Login page CSS animations and transitions', () => {
  const loginHtmlPath = path.join(process.cwd(), 'login.html');
  const loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');

  // Verify animations are defined
  assert(loginHtml.includes('@keyframes shopping-belt'), 'Shopping belt animation keyframes should be defined');
  assert(loginHtml.includes('@keyframes slideUp'), 'Slide up animation keyframes should be defined');
  assert(loginHtml.includes('animation: shopping-belt'), 'Shopping belt animation should be applied');
  assert(loginHtml.includes('animation: slideUp'), 'Slide up animation should be applied');

  // Verify transitions are present
  assert(loginHtml.includes('transition: all'), 'Smooth transitions should be defined');
});

test('Login page accessibility and semantic structure', () => {
  const loginHtmlPath = path.join(process.cwd(), 'login.html');
  const loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');

  // Verify proper label associations
  assert(loginHtml.includes('for="email"'), 'Email label should have proper for attribute');
  assert(loginHtml.includes('for="password"'), 'Password label should have proper for attribute');
  assert(loginHtml.includes('id="email"'), 'Email input should have proper id');
  assert(loginHtml.includes('id="password"'), 'Password input should have proper id');

  // Verify semantic HTML structure
  assert(loginHtml.includes('<form'), 'Proper form element should be used');
  assert(loginHtml.includes('<label'), 'Proper label elements should be used');
  assert(loginHtml.includes('required'), 'Required fields should be marked');
});