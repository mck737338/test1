/* =============================================================
   Portfolio - script.js (모든 페이지 공통)

   1. 페이지 순서 정의 + 현재 페이지 탭 자동 활성화
   2. 푸터 연도 자동 표시
   3. 스크롤 등장 애니메이션
   4. 페이지 끝까지 스크롤 → 다음 페이지로 전환
   5. 프로젝트 필터 (portfolio.html)
   6. 이메일 클립보드 복사 (contact.html)
   7. 문의 폼 → 메일 작성 화면 열기 (contact.html)
   ============================================================= */

(function () {
  'use strict';

  /* ---------- 1. 페이지 순서 정의 ---------- */
  // 전환 순서: Home → About → Portfolio → Contact
  // (dday.html, random.html은 Portfolio에서 들어가는 실습 페이지라 전환 순서에서 제외)
  var PAGES = [
    { file: 'index.html',     label: 'Home' },
    { file: 'about.html',     label: 'About' },
    { file: 'portfolio.html', label: 'Portfolio' },
    { file: 'contact.html',   label: 'Contact' }
  ];

  var prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 현재 파일 이름 (루트 접속 시 index.html로 처리)
  var currentFile = window.location.pathname.split('/').pop() || 'index.html';

  var currentIndex = -1;
  PAGES.forEach(function (page, i) {
    if (page.file === currentFile) currentIndex = i;
  });

  /* ---------- 현재 페이지 탭 활성화 ---------- */
  (function setActiveTab() {
    var links = document.querySelectorAll('.nav-item, .top-nav__item');

    Array.prototype.forEach.call(links, function (link) {
      var href = (link.getAttribute('href') || '').split('/').pop();
      if (href === currentFile) {
        link.classList.add('is-active');

        // 모바일 상단 바에서 활성 탭이 화면 밖이면 보이도록 스크롤
        if (link.closest('.top-nav__list')) {
          link.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
      }
    });
  })();

  /* ---------- 2. 푸터 연도 자동 표시 ---------- */
  (function setYear() {
    var year = new Date().getFullYear();
    var spans = document.querySelectorAll('.year, #year');
    Array.prototype.forEach.call(spans, function (el) {
      el.textContent = year;
    });
  })();

  /* ---------- 3. 스크롤 등장 애니메이션 ---------- */
  (function initReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    Array.prototype.forEach.call(targets, function (el) {
      observer.observe(el);
    });
  })();

  /* =============================================================
     4. 페이지 끝까지 스크롤 → 다음 페이지로 전환
     - 화면 맨 아래에 닿은 뒤 아래로 더 스크롤하면 다음 페이지로 이동
     - 맨 위에서 위로 더 스크롤하면 이전 페이지로 이동
     - 실수로 넘어가지 않도록 일정량(THRESHOLD) 이상 스크롤해야 동작
     ============================================================= */
  (function initPageScrollNav() {
    if (currentIndex === -1) return;

    var THRESHOLD = 260;   // 전환에 필요한 추가 스크롤 양(px)
    var EDGE = 3;          // 끝에 닿았다고 판단할 여유(px)
    var GRACE = 500;       // 페이지 로드 직후 오작동 방지 시간(ms)

    var next = PAGES[currentIndex + 1] || null;
    var prev = PAGES[currentIndex - 1] || null;

    var acc = 0;           // 아래 방향 누적량
    var accUp = 0;         // 위 방향 누적량
    var locked = false;    // 전환 중 중복 실행 방지
    var ready = false;
    var resetTimer = null;

    setTimeout(function () { ready = true; }, GRACE);

    /* --- 하단 안내 UI 생성 (HTML 수정 없이 JS로 삽입) --- */
    var hint = null;
    if (next) {
      hint = document.createElement('div');
      hint.className = 'page-jump';
      hint.innerHTML =
        '<a class="page-jump__link" href="' + next.file + '">' +
          '<span class="page-jump__text">계속 스크롤하면 <strong>' +
            next.label + '</strong> 페이지로 이동</span>' +
          '<span class="page-jump__arrow" aria-hidden="true">↓</span>' +
          '<span class="page-jump__bar"><i></i></span>' +
        '</a>';
      document.body.appendChild(hint);
    }

    var barFill = hint ? hint.querySelector('.page-jump__bar i') : null;

    function atBottom() {
      var doc = document.documentElement;
      return window.innerHeight + window.scrollY >= doc.scrollHeight - EDGE;
    }

    function atTop() {
      return window.scrollY <= EDGE;
    }

    function updateHint() {
      if (!hint) return;
      hint.classList.toggle('is-visible', atBottom() && !locked);
    }

    function setProgress(ratio) {
      if (barFill) barFill.style.width = Math.min(ratio, 1) * 100 + '%';
    }

    function go(file) {
      if (locked) return;
      locked = true;
      setProgress(1);
      document.body.classList.add('is-leaving');

      if (prefersReducedMotion) {
        window.location.href = file;
      } else {
        setTimeout(function () { window.location.href = file; }, 260);
      }
    }

    // 일정 시간 입력이 없으면 누적량 초기화
    function scheduleReset() {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        acc = 0;
        accUp = 0;
        setProgress(0);
      }, 600);
    }

    function handleDelta(delta) {
      if (!ready || locked) return;

      if (delta > 0) {
        // 아래로 스크롤
        accUp = 0;
        if (atBottom() && next) {
          acc += delta;
          setProgress(acc / THRESHOLD);
          if (acc >= THRESHOLD) go(next.file);
        } else {
          acc = 0;
          setProgress(0);
        }
      } else if (delta < 0) {
        // 위로 스크롤
        acc = 0;
        setProgress(0);
        if (atTop() && prev) {
          accUp += -delta;
          if (accUp >= THRESHOLD) go(prev.file);
        } else {
          accUp = 0;
        }
      }

      scheduleReset();
    }

    /* --- 마우스 휠 / 트랙패드 --- */
    window.addEventListener('wheel', function (e) {
      handleDelta(e.deltaY);
    }, { passive: true });

    /* --- 모바일 터치 --- */
    var touchStartY = 0;
    window.addEventListener('touchstart', function (e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      var y = e.touches[0].clientY;
      handleDelta(touchStartY - y);   // 위로 밀면(아래로 스크롤) 양수
      touchStartY = y;
    }, { passive: true });

    /* --- 키보드 (PageDown / End / 방향키) --- */
    window.addEventListener('keydown', function (e) {
      if (locked || !ready) return;
      if ((e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === 'End') &&
          atBottom() && next) {
        e.preventDefault();
        go(next.file);
      }
      if ((e.key === 'PageUp' || e.key === 'ArrowUp' || e.key === 'Home') &&
          atTop() && prev) {
        e.preventDefault();
        go(prev.file);
      }
    });

    window.addEventListener('scroll', function () {
      updateHint();
      if (!atBottom()) { acc = 0; setProgress(0); }
      if (!atTop()) { accUp = 0; }
    }, { passive: true });

    window.addEventListener('resize', updateHint);
    updateHint();
  })();

  /* ---------- 5. 프로젝트 필터 ---------- */
  (function initFilter() {
    var buttons = document.querySelectorAll('.filter__btn');
    var cards = document.querySelectorAll('#projectGrid .card');
    if (!buttons.length || !cards.length) return;

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.dataset.filter;

        Array.prototype.forEach.call(buttons, function (b) {
          b.classList.toggle('is-active', b === btn);
        });

        Array.prototype.forEach.call(cards, function (card) {
          var categories = (card.dataset.category || '').split(/\s+/);
          var show = filter === 'all' || categories.indexOf(filter) !== -1;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  })();

  /* ---------- 토스트 알림 (공통 함수) ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2000);
  }

  /* ---------- 6. 이메일 클립보드 복사 ---------- */
  (function initEmailCopy() {
    var btn = document.getElementById('emailCopy');
    if (!btn) return;

    var email = btn.dataset.email || '';
    var action = btn.querySelector('.contact__action');

    // navigator.clipboard를 쓸 수 없는 환경(http, 구형 브라우저)용 대체 복사
    function fallbackCopy(text) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(area);
      return ok;
    }

    function onSuccess() {
      btn.classList.add('is-copied');
      if (action) action.textContent = '복사됨';
      showToast('이메일 주소가 복사되었습니다');

      setTimeout(function () {
        btn.classList.remove('is-copied');
        if (action) action.textContent = '복사';
      }, 2000);
    }

    function onFail() {
      showToast('복사 실패: ' + email);
    }

    btn.addEventListener('click', function () {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(onSuccess).catch(function () {
          if (fallbackCopy(email)) { onSuccess(); } else { onFail(); }
        });
      } else {
        if (fallbackCopy(email)) { onSuccess(); } else { onFail(); }
      }
    });
  })();

  /* ---------- 7. 문의 폼 → 메일 작성 화면 열기 ---------- */
  (function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var email = form.dataset.email || '';
      var name = (form.querySelector('[name="name"]') || {}).value || '';
      var message = (form.querySelector('[name="message"]') || {}).value || '';

      if (!name.trim() || !message.trim()) {
        showToast('이름과 메시지를 모두 입력해 주세요');
        return;
      }

      var subject = '포트폴리오 문의 - ' + name.trim();
      var body = message.trim() + '\n\n보낸 사람: ' + name.trim();

      window.location.href =
        'mailto:' + email +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });
  })();

})();
