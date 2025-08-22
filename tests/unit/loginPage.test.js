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
  assert(loginHtml.includes('floating-items'), 'Floating items container should be present');
  assert(loginHtml.includes('Barganhα'), 'Modern logo text should be present');
  assert(loginHtml.includes('login.css'), 'External CSS file should be linked');
  assert(loginHtml.includes('🛒'), 'Shopping cart emoji should be present in floating items');

  // Verify responsive design
  assert(loginHtml.includes('href="/static/css/login.css"'), 'External login CSS should be linked');
});

test('Login page CSS animations and transitions', () => {
  const loginCssPath = path.join(process.cwd(), 'static/css/login.css');
  const loginCss = fs.readFileSync(loginCssPath, 'utf8');

  // Verify meteor shower animations are defined
  assert(loginCss.includes('@keyframes meteor-shower'), 'Meteor shower animation keyframes should be defined');
  assert(loginCss.includes('@keyframes meteor-trails'), 'Meteor trails animation keyframes should be defined');
  assert(loginCss.includes('@keyframes float'), 'Float animation keyframes should be defined');
  assert(loginCss.includes('@keyframes slideUp'), 'Slide up animation keyframes should be defined');
  assert(loginCss.includes('animation: meteor-shower'), 'Meteor shower animation should be applied');
  assert(loginCss.includes('animation: float'), 'Float animation should be applied');

  // Verify transitions are present
  assert(loginCss.includes('transition: all'), 'Smooth transitions should be defined');
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