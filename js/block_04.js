    (function () {
      'use strict';

      /* ─────────────────────────────────────────────
         1. STATUS REFRESH — runs every 1.5 s
            Swaps icon & text based on connection state
         ───────────────────────────────────────────── */
      function dpRefreshStatus() {
        var card = document.getElementById('dp-card-usb');
        var status = document.getElementById('dp-usb-status');
        var icon = document.getElementById('dp-usb-icon');
        if (!card || !status || !icon) return;

        var usbOk = (typeof isUSBConnected === 'function') && isUSBConnected();
        var bleOk = (typeof isBLEConnected === 'function') && isBLEConnected();
        var connected = usbOk || bleOk;

        card.classList.toggle('dp-connected', connected);

        if (usbOk) {
          status.textContent = 'USB Connected';
        } else if (bleOk) {
          status.textContent = 'Bluetooth Connected';
        } else {
          status.textContent = 'Not connected';
        }

        icon.src = connected ? './icons/power.png' : './icons/unplug.svg';
        icon.alt = connected ? 'connected' : 'not connected';
      }

      /* ─────────────────────────────────────────────
         2. POSITION — mirrors toolbox left + width
         ───────────────────────────────────────────── */
      function dpPosition() {
        var tb = document.querySelector('.blocklyToolboxDiv, .blocklyToolbox');
        var dp = document.getElementById('devices-panel');
        var ws = document.querySelector('.workspace');
        if (!dp || !ws) return;

        var isCollapsed = localStorage.getItem('blockly_toolbox_collapsed') === 'true';
        var ref = isCollapsed ? document.getElementById('toolbox-icon-panel') : tb;
        if (!ref) ref = tb;
        if (!ref) return;

        var refR = ref.getBoundingClientRect();
        var wsR = ws.getBoundingClientRect();
        var gap = 8;

        var leftVal = refR.left - wsR.left;
        var widthVal = refR.width;

        if (isCollapsed) {
          widthVal = 72;
        } else if (widthVal < 50) {
          widthVal = 205; // default expanded width
        }

        dp.style.left = leftVal + 'px';
        dp.style.width = widthVal + 'px';

        var refBottom = refR.bottom - wsR.top;
        var dpH = dp.offsetHeight;

        if (isCollapsed) {
          dp.style.top = 'auto';
          dp.style.bottom = gap + 'px';
        } else {
          if (refBottom + gap + dpH < wsR.height - gap) {
            dp.style.top = (refBottom + gap) + 'px';
            dp.style.bottom = 'auto';
          } else {
            dp.style.top = 'auto';
            dp.style.bottom = gap + 'px';
          }
        }
      }

      /* ─────────────────────────────────────────────
         3. COLLAPSE SYNC — mirrors toolbox collapsed state
         ───────────────────────────────────────────── */
      function dpSyncCollapse() {
        var dp = document.getElementById('devices-panel');
        if (!dp) return;
        var isCollapsed = localStorage.getItem('blockly_toolbox_collapsed') === 'true';
        dp.classList.toggle('dp-collapsed', isCollapsed);
      }

      window.dpSyncCollapse = dpSyncCollapse;
      window.dpPosition = dpPosition;

      /* ─────────────────────────────────────────────
         4. OBSERVE toolbox mutations & resize
         ───────────────────────────────────────────── */
      function dpObserve() {
        var tb = document.querySelector('.blocklyToolboxDiv, .blocklyToolbox');
        if (!tb) { setTimeout(dpObserve, 300); return; }

        var mo = new MutationObserver(function () {
          dpSyncCollapse();
          dpPosition();
        });
        mo.observe(tb, { attributes: true, attributeFilter: ['class', 'style'] });

        new ResizeObserver(dpPosition).observe(tb);

        dpSyncCollapse();
        dpPosition();
      }

      /* ─────────────────────────────────────────────
         5. MODAL helpers
         ───────────────────────────────────────────── */
      window.dpOpenAddModal = function () {
        document.getElementById('addDeviceModal').classList.add('open');
      };
      window.dpCloseAddModal = function () {
        document.getElementById('addDeviceModal').classList.remove('open');
      };

      /* ─────────────────────────────────────────────
         6. INIT
         ───────────────────────────────────────────── */
      function dpInit() {
        /* "+" button opens modal (onclick also set in HTML, this is a safety net) */
        var addBtn = document.getElementById('dpAddBtn');
        if (addBtn) addBtn.onclick = dpOpenAddModal;

        /* Close modal on backdrop click */
        var modal = document.getElementById('addDeviceModal');
        if (modal) modal.addEventListener('click', function (e) {
          if (e.target === modal) dpCloseAddModal();
        });

        dpObserve();
        window.addEventListener('resize', dpPosition);

        /* Poll position during Blockly init (toolbox may shift) */
        var ticks = 0;
        var t = setInterval(function () {
          dpPosition();
          if (++ticks >= 12) clearInterval(t);
        }, 400);

        /* Status refresh loop */
        setInterval(dpRefreshStatus, 1500);
        dpRefreshStatus();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', dpInit);
      } else {
        dpInit();
      }

    })();
  