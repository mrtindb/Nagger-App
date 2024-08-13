var theme = undefined;
var params = new URLSearchParams(window.location.search);

// Set the theme based on the URL
function setTheme() {
  theme = params.get('theme');
  if (!theme) theme = 'light';
  if(theme==='light') theme='light';
  else theme = 'dark';
  document.body.setAttribute('data-bs-theme', theme);
  params.set('theme', theme); 
  let newURL = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + params.toString();
  window.history.pushState({ path: newURL }, '', newURL);
  document.addEventListener("DOMContentLoaded", () => updateLinks());
}

// Changes theme and updates URL
function changeTheme() {
  if (theme === 'light') theme = 'dark';
  else theme = 'light';
  document.body.setAttribute('data-bs-theme', theme);
  params.set('theme', theme); 
  let newURL = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + params.toString();
  window.history.pushState({ path: newURL }, '', newURL);
  updateLinks();
}

// Update the links to reflect the current theme
function updateLinks() {
  if (theme === 'light') theme = 'light';
  else theme = 'dark';
  document.getElementById('home-link').setAttribute('href', `/home?theme=${theme}`);
  document.getElementById('account-link').setAttribute('href', `/account?theme=${theme}`);
  document.getElementById('setup-link').setAttribute('href', `/setup?theme=${theme}`);
  document.getElementById('devices-link').setAttribute('href', `/devices?theme=${theme}`);
  document.getElementById('about-link').setAttribute('href', `/about?theme=${theme}`);
}