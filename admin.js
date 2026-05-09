/**
 * Portfolio admin: login (session only — lost on page refresh), edit projects,
 * change password (stored hash in localStorage).
 */
(function () {
  var STORAGE_PWD = 'portfolio_admin_pwd_hash_v1';
  var STORAGE_PROJECTS = 'portfolio_projects_v1';

  /** In-memory only → logout on full page refresh/navigation */
  var sessionActive = false;

  var DEFAULT_PROJECTS = [
    {
      id: 'p1',
      featured: true,
      name: 'Portfolio Website',
      details: 'Responsive personal portfolio built with semantic HTML, modern CSS, and accessible JavaScript interactions.',
      github: '',
      tags: ['HTML', 'CSS', 'JavaScript']
    },
    {
      id: 'p2',
      featured: false,
      name: 'Task Tracker',
      details: 'Full‑stack task management app with authentication, status filters, and progress tracking dashboards.',
      github: '',
      tags: ['React', 'Node.js', 'REST API']
    },
    {
      id: 'p3',
      featured: false,
      name: 'API Explorer',
      details: 'Lightweight dashboard that fetches public APIs, surfaces key details, and lets users search endpoints in real‑time.',
      github: '',
      tags: ['JavaScript', 'Fetch API', 'Responsive UI']
    }
  ];

  function sha256Hex(str) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.reject(new Error('Crypto unavailable — open this site over http://localhost or https://'));
    }
    var enc = new TextEncoder();
    return crypto.subtle.digest('SHA-256', enc.encode(str)).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) {
          return b.toString(16).padStart(2, '0');
        })
        .join('');
    });
  }

  function ensureDefaultPassword() {
    if (localStorage.getItem(STORAGE_PWD)) return Promise.resolve();
    if (!window.crypto || !window.crypto.subtle) return Promise.resolve();
    return sha256Hex('yashqwerty').then(function (hash) {
      localStorage.setItem(STORAGE_PWD, hash);
    });
  }

  function loadProjects() {
    try {
      var raw = localStorage.getItem(STORAGE_PROJECTS);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
  }

  function saveProjects(list) {
    localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(list));
  }

  function escAttr(s) {
    return String(s == null ? '' : s).replace(/"/g, '&quot;');
  }

  function escText(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function isValidUrl(str) {
    if (!str || !str.trim()) return true;
    try {
      var u = new URL(str.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function renderProjectGrid() {
    var grid = document.getElementById('projectGrid');
    if (!grid) return;
    var projects = loadProjects();
    grid.innerHTML = '';
    projects.forEach(function (p) {
      var art = document.createElement('article');
      art.className = 'project';
      art.setAttribute('data-project-id', p.id);
      var head = document.createElement('div');
      head.className = 'project-header';
      var h4 = document.createElement('h4');
      h4.textContent = p.name || 'Untitled';
      head.appendChild(h4);
      if (p.featured) {
        var tag = document.createElement('span');
        tag.className = 'project-tag';
        tag.textContent = 'Featured';
        head.appendChild(tag);
      }
      art.appendChild(head);
      var para = document.createElement('p');
      para.textContent = p.details || '';
      art.appendChild(para);
      var meta = document.createElement('div');
      meta.className = 'project-meta';
      (p.tags || []).forEach(function (t) {
        var s = document.createElement('span');
        s.textContent = t;
        meta.appendChild(s);
      });
      art.appendChild(meta);
      var actions = document.createElement('div');
      actions.className = 'project-actions';
      if (p.github && p.github.trim() && isValidUrl(p.github)) {
        var ga = document.createElement('a');
        ga.className = 'project-link';
        ga.href = p.github.trim();
        ga.target = '_blank';
        ga.rel = 'noreferrer noopener';
        ga.textContent = 'GitHub';
        actions.appendChild(ga);
      }
      var ca = document.createElement('a');
      ca.className = 'project-link';
      ca.href = '#contact';
      ca.textContent = 'Contact';
      actions.appendChild(ca);
      art.appendChild(actions);
      grid.appendChild(art);
    });
  }

  function renderAdminEditor() {
    var panel = document.getElementById('projectsAdminPanel');
    if (!panel) return;
    if (!sessionActive) {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      return;
    }
    panel.classList.remove('hidden');
    var projects = loadProjects();
    var html =
      '<div class="admin-editor">' +
      '<h4 class="admin-editor-title">Manage projects</h4>' +
      '<p class="admin-editor-hint">Changes save to this browser only (local storage). Session ends if you refresh the page.</p>' +
      '<div class="admin-project-list" id="adminProjectList"></div>' +
      '<div class="admin-add-card card">' +
      '<h5>Add project</h5>' +
      '<label class="admin-field"><span>Featured</span><input type="checkbox" id="newFeatured" /></label>' +
      '<label class="admin-field"><span>Name</span><input type="text" id="newName" placeholder="Project name" /></label>' +
      '<label class="admin-field"><span>Details</span><textarea id="newDetails" rows="3" placeholder="Description"></textarea></label>' +
      '<label class="admin-field"><span>GitHub URL</span><input type="url" id="newGithub" placeholder="https://github.com/..." /></label>' +
      '<label class="admin-field"><span>Tags (comma-separated)</span><input type="text" id="newTags" placeholder="React, Node.js" /></label>' +
      '<button type="button" class="btn" id="btnAddProject">Add project</button>' +
      '</div></div>';
    panel.innerHTML = html;

    var listEl = document.getElementById('adminProjectList');
    projects.forEach(function (p, idx) {
      var card = document.createElement('div');
      card.className = 'admin-project-card card';
      card.innerHTML =
        '<div class="admin-project-card-head">' +
        '<span class="admin-project-num">#' +
        (idx + 1) +
        '</span>' +
        '<button type="button" class="admin-delete-btn" data-del="' +
        escAttr(p.id) +
        '">Remove</button>' +
        '</div>' +
        '<label class="admin-field"><span>Featured</span><input type="checkbox" data-f="' +
        escAttr(p.id) +
        '" ' +
        (p.featured ? 'checked' : '') +
        ' /></label>' +
        '<label class="admin-field"><span>Name</span><input type="text" data-n="' +
        escAttr(p.id) +
        '" value="' +
        escAttr(p.name) +
        '" /></label>' +
        '<label class="admin-field"><span>Details</span><textarea rows="3" data-d="' +
        escAttr(p.id) +
        '">' +
        escText(p.details) +
        '</textarea></label>' +
        '<label class="admin-field"><span>GitHub URL</span><input type="url" data-g="' +
        escAttr(p.id) +
        '" value="' +
        escAttr(p.github || '') +
        '" placeholder="https://github.com/..." /></label>' +
        '<label class="admin-field"><span>Tags (comma-separated)</span><input type="text" data-t="' +
        escAttr(p.id) +
        '" value="' +
        escAttr((p.tags || []).join(', ')) +
        '" /></label>' +
        '<button type="button" class="btn-ghost admin-save-one" data-save="' +
        escAttr(p.id) +
        '">Save this project</button>';
      listEl.appendChild(card);
    });

    listEl.querySelectorAll('.admin-save-one').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-save');
        var list = loadProjects();
        var ix = list.findIndex(function (x) {
          return x.id === id;
        });
        if (ix === -1) return;
        var card = btn.closest('.admin-project-card');
        if (!card) return;
        var ins = card.querySelectorAll('input');
        var ta = card.querySelector('textarea');
        var featured = ins[0];
        var name = ins[1];
        var gh = ins[2];
        var tg = ins[3];
        list[ix].featured = featured && featured.checked;
        list[ix].name = name ? name.value.trim() : '';
        list[ix].details = ta ? ta.value.trim() : '';
        var gval = gh ? gh.value.trim() : '';
        if (gval && !isValidUrl(gval)) {
          alert('Please enter a valid GitHub URL (https://...).');
          return;
        }
        list[ix].github = gval;
        list[ix].tags = tg
          ? tg.value
              .split(',')
              .map(function (s) {
                return s.trim();
              })
              .filter(Boolean)
          : [];
        saveProjects(list);
        renderProjectGrid();
      });
    });

    listEl.querySelectorAll('.admin-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-del');
        if (!confirm('Remove this project?')) return;
        var list = loadProjects().filter(function (x) {
          return x.id !== id;
        });
        saveProjects(list);
        renderAdminEditor();
        renderProjectGrid();
      });
    });

    document.getElementById('btnAddProject').addEventListener('click', function () {
      var featured = document.getElementById('newFeatured').checked;
      var name = document.getElementById('newName').value.trim();
      var details = document.getElementById('newDetails').value.trim();
      var github = document.getElementById('newGithub').value.trim();
      var tagsStr = document.getElementById('newTags').value;
      if (!name) {
        alert('Project name is required.');
        return;
      }
      if (github && !isValidUrl(github)) {
        alert('Please enter a valid GitHub URL (https://...).');
        return;
      }
      var list = loadProjects();
      list.push({
        id: 'p' + Date.now(),
        featured: featured,
        name: name,
        details: details,
        github: github,
        tags: tagsStr
          ? tagsStr
              .split(',')
              .map(function (s) {
                return s.trim();
              })
              .filter(Boolean)
          : []
      });
      saveProjects(list);
      document.getElementById('newFeatured').checked = false;
      document.getElementById('newName').value = '';
      document.getElementById('newDetails').value = '';
      document.getElementById('newGithub').value = '';
      document.getElementById('newTags').value = '';
      renderAdminEditor();
      renderProjectGrid();
    });
  }

  function updateAdminBarUI() {
    var guest = document.getElementById('adminGuest');
    var auth = document.getElementById('adminAuth');
    var loginPanel = document.getElementById('adminSplashModal');
    if (!guest || !auth) return;
    if (sessionActive) {
      guest.classList.add('hidden');
      auth.classList.remove('hidden');
      if (loginPanel) loginPanel.classList.add('hidden');
    } else {
      guest.classList.remove('hidden');
      auth.classList.add('hidden');
    }
    renderAdminEditor();
  }

  function openPwdModal() {
    var el = document.getElementById('adminPwdModal');
    if (!el) return;
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
  }

  function closePwdModal() {
    var el = document.getElementById('adminPwdModal');
    if (!el) return;
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  }

  function init() {
    var gridHost = document.getElementById('projectGrid');
    if (!gridHost) return;

    ensureDefaultPassword().then(function () {
      renderProjectGrid();
    });
    var btnToggle = document.getElementById('adminLoginToggle');
    var loginPanel = document.getElementById('adminSplashModal');
    var loginBackdrop = document.getElementById('adminSplashBackdrop');
    var pwInput = document.getElementById('adminPassword');
    var btnDoLogin = document.getElementById('adminDoLogin');
    var btnCancelLogin = document.getElementById('adminCancelLogin');
    var btnLogout = document.getElementById('adminLogout');
    var btnChangePwd = document.getElementById('adminChangePwd');

    if (btnToggle && loginPanel) {
      btnToggle.addEventListener('click', function () {
        loginPanel.classList.remove('hidden');
        loginPanel.setAttribute('aria-hidden', 'false');
        if (pwInput) pwInput.focus();
      });
    }
    if (btnCancelLogin && loginPanel) {
      btnCancelLogin.addEventListener('click', function () {
        loginPanel.classList.add('hidden');
        loginPanel.setAttribute('aria-hidden', 'true');
        if (pwInput) pwInput.value = '';
      });
    }
    if (loginBackdrop && loginPanel) {
      loginBackdrop.addEventListener('click', function () {
        loginPanel.classList.add('hidden');
        loginPanel.setAttribute('aria-hidden', 'true');
      });
    }

    function doLogin() {
      if (!pwInput) return;
      sha256Hex(pwInput.value)
          .then(function (hash) {
            var stored = localStorage.getItem(STORAGE_PWD);
            if (hash === stored) {
              sessionActive = true;
              pwInput.value = '';
              if (loginPanel) {
                loginPanel.classList.add('hidden');
                loginPanel.setAttribute('aria-hidden', 'true');
              }
              updateAdminBarUI();
              renderProjectGrid();
            } else {
              alert('Wrong password.');
            }
          })
          .catch(function (err) {
            alert(err.message || 'Login failed.');
          });
    }

    if (btnDoLogin && pwInput) {
      btnDoLogin.addEventListener('click', doLogin);
      pwInput.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') doLogin();
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', function () {
        sessionActive = false;
        updateAdminBarUI();
      });
    }

    if (btnChangePwd) {
      btnChangePwd.addEventListener('click', function () {
        if (!sessionActive) return;
        openPwdModal();
      });
    }

    var pwdOld = document.getElementById('pwdOld');
    var pwdNew = document.getElementById('pwdNew');
    var pwdConfirm = document.getElementById('pwdConfirm');
    var pwdSave = document.getElementById('pwdSave');
    var pwdClose = document.getElementById('pwdClose');

    if (pwdSave) {
      pwdSave.addEventListener('click', function () {
        if (!sessionActive) return;
        var o = pwdOld && pwdOld.value;
        var n = pwdNew && pwdNew.value;
        var c = pwdConfirm && pwdConfirm.value;
        if (!o || !n || n.length < 4) {
          alert('Enter current password and a new password (min 4 characters).');
          return;
        }
        if (n !== c) {
          alert('New passwords do not match.');
          return;
        }
        sha256Hex(o)
          .then(function (oldH) {
            if (oldH !== localStorage.getItem(STORAGE_PWD)) {
              alert('Current password is incorrect.');
              return null;
            }
            return sha256Hex(n);
          })
          .then(function (newH) {
            if (newH == null) return;
            localStorage.setItem(STORAGE_PWD, newH);
            if (pwdOld) pwdOld.value = '';
            if (pwdNew) pwdNew.value = '';
            if (pwdConfirm) pwdConfirm.value = '';
            closePwdModal();
            alert('Password updated.');
          })
          .catch(function (err) {
            alert(err.message || 'Could not change password.');
          });
      });
    }
    if (pwdClose) {
      pwdClose.addEventListener('click', closePwdModal);
    }

    var pwdBackdrop = document.getElementById('pwdBackdrop');
    if (pwdBackdrop) {
      pwdBackdrop.addEventListener('click', closePwdModal);
    }

    updateAdminBarUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
