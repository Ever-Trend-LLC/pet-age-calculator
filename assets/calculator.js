(function () {
  'use strict';

  var SIZES = {
    small: { name: 'small', rate: 4, mature: 4, senior: 8, advanced: 12 },
    medium: { name: 'medium', rate: 5, mature: 4, senior: 7, advanced: 11 },
    large: { name: 'large', rate: 6, mature: 3, senior: 6, advanced: 10 },
    giant: { name: 'giant', rate: 7, mature: 3, senior: 5, advanced: 9 }
  };

  var LIFESPAN = {
    dog: '10–13 years',
    cat: '13–17 years'
  };

  var root = document.querySelector('.calc');
  var fixedSpecies = root && (root.dataset.species === 'dog' || root.dataset.species === 'cat')
    ? root.dataset.species
    : null;

  var state = {
    pet: fixedSpecies || 'dog',
    size: root && root.dataset.size ? root.dataset.size : 'medium'
  };

  var el = {
    form: document.getElementById('age-form'),
    years: document.getElementById('age-years'),
    months: document.getElementById('age-months'),
    lifestyle: document.getElementById('lifestyle'),
    reset: document.getElementById('reset'),
    resultLabel: document.getElementById('result-label'),
    humanAge: document.getElementById('human-age'),
    lifeStage: document.getElementById('life-stage'),
    nextStage: document.getElementById('next-stage'),
    lifespan: document.getElementById('lifespan'),
    paceNote: document.getElementById('pace-note'),
    timeline: document.getElementById('timeline'),
    dogChart: document.getElementById('dog-chart'),
    catChart: document.getElementById('cat-chart'),
    dogFields: document.getElementById('dog-fields'),
    catFields: document.getElementById('cat-fields'),
    speciesButtons: Array.prototype.slice.call(document.querySelectorAll('.segmented button[data-pet]')),
    sizeInputs: Array.prototype.slice.call(document.querySelectorAll('input[name="dog-size"]'))
  };

  function dogStages(size) {
    var s = SIZES[size];
    return [
      { label: 'Puppy', start: 0, note: 'Rapid growth and social development — about 15 human years by the first birthday.' },
      { label: 'Young adult', start: 1, note: 'Physical and social maturity. Growth slows sharply after the second birthday.' },
      { label: 'Mature adult', start: s.mature, note: 'A quiet aging stage. Keep muscle, joints, and weight steady.' },
      { label: 'Senior', start: s.senior, note: 'Slower recovery, more rest, and shifting weight become easier to spot.' },
      { label: 'Advanced senior', start: s.advanced, note: 'Comfort, cognition, and routine matter more than ever.' }
    ];
  }

  function catStages() {
    return [
      { label: 'Kitten', start: 0, note: 'Fast growth: the first year is roughly 15 human years.' },
      { label: 'Young adult', start: 1, note: 'A long, steady stage. The second year adds about 9 human years.' },
      { label: 'Mature adult', start: 7, note: 'Start watching weight, muscle, hydration, and dental health more closely.' },
      { label: 'Senior', start: 11, note: 'Aging becomes more visible, and checkups usually become more frequent.' },
      { label: 'Advanced senior', start: 15, note: 'Comfort, hydration, and a gentle daily routine matter most.' }
    ];
  }

  function getStages() {
    return state.pet === 'dog' ? dogStages(state.size) : catStages();
  }

  function humanYears(age, rate) {
    if (age <= 0) return 0;
    if (age < 1) return 15 * age;
    if (age < 2) return 15 + 9 * (age - 1);
    return 24 + rate * (age - 2);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeInputs() {
    var years = parseInt(el.years.value, 10);
    var months = parseInt(el.months.value, 10);

    if (!isFinite(years) || years < 0) years = 0;
    if (!isFinite(months) || months < 0) months = 0;

    if (months >= 12) {
      years = clamp(years + Math.floor(months / 12), 0, 30);
      months = months % 12;
    }

    el.years.value = String(clamp(years, 0, 30));
    el.months.value = String(clamp(months, 0, 11));
  }

  function readAge() {
    var years = parseInt(el.years.value, 10);
    var months = parseInt(el.months.value, 10);

    if (!isFinite(years) || years < 0) years = 0;
    if (!isFinite(months) || months < 0) months = 0;

    years = clamp(years, 0, 30);
    months = clamp(months, 0, 11);

    return years + months / 12;
  }

  function currentStageIndex(stages, age) {
    var index = 0;
    for (var i = 0; i < stages.length; i += 1) {
      if (age >= stages[i].start) index = i;
    }
    return index;
  }

  function syncSize() {
    el.sizeInputs.forEach(function (input) {
      input.checked = input.value === state.size;
    });
  }

  function syncSpecies() {
    if (el.dogFields) el.dogFields.hidden = state.pet !== 'dog';
    if (el.catFields) el.catFields.hidden = state.pet !== 'cat';
    el.speciesButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.pet === state.pet));
    });
  }

  function render(animate) {
    var age = readAge();
    var isDog = state.pet === 'dog';
    var size = SIZES[state.size];
    var stages = getStages();
    var index = currentStageIndex(stages, age);
    var stage = stages[index];
    var next = stages[index + 1];
    var rate = isDog ? size.rate : 4;
    var human = Math.round(humanYears(age, rate));
    var hasAge = age > 0;

    el.resultLabel.textContent = 'Human equivalent · ' + (isDog ? 'Dog' : 'Cat');
    el.humanAge.textContent = hasAge ? String(human) : '—';
    el.lifeStage.textContent = hasAge ? stage.label : '—';
    el.nextStage.textContent = hasAge
      ? (next ? next.label + ' · age ' + next.start : 'None')
      : '—';
    el.lifespan.textContent = LIFESPAN[state.pet];

    if (!hasAge) {
      el.paceNote.textContent = 'Enter your pet’s age above to see the estimate and life stage.';
    } else {
      var rateLine = isDog
        ? 'After the second birthday, each dog year adds about ' + rate + ' human years for a ' + size.name + ' dog.'
        : 'After the second birthday, each cat year adds about 4 human years.';
      var lifestyleLine = isDog ? '' : ' Lifestyle is background only and does not change the conversion.';
      el.paceNote.textContent = stage.note + ' ' + rateLine + lifestyleLine;
    }

    el.timeline.innerHTML = '';
    stages.forEach(function (item, i) {
      var chip = document.createElement('span');
      chip.setAttribute('role', 'listitem');
      chip.textContent = item.label;
      if (hasAge && i === index) chip.classList.add('is-active');
      el.timeline.appendChild(chip);
    });

    highlightChart(state.pet, age);

    if (animate && hasAge) {
      el.humanAge.classList.remove('is-popping');
      void el.humanAge.offsetWidth;
      el.humanAge.classList.add('is-popping');
    }
  }

  function highlightChart(pet, age) {
    var chart = pet === 'dog' ? el.dogChart : el.catChart;
    if (!chart) return;

    var rows = Array.prototype.slice.call(chart.querySelectorAll('tr'));
    rows.forEach(function (row) {
      row.classList.remove('is-current');
    });

    if (age <= 0) return;

    var key = pet === 'dog' ? 'dogAge' : 'catAge';
    var best = null;
    var bestDiff = Infinity;

    rows.forEach(function (row) {
      var value = Number(row.dataset[key]);
      if (!isFinite(value)) return;
      var diff = Math.abs(age - value);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = row;
      }
    });

    if (best) best.classList.add('is-current');
  }

  el.speciesButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      state.pet = button.dataset.pet;
      syncSpecies();
      render(true);
    });
  });

  el.sizeInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      if (!input.checked) return;
      state.size = input.value;
      render(true);
    });
  });

  [el.years, el.months].forEach(function (input) {
    input.addEventListener('input', function () {
      render(false);
    });
    input.addEventListener('change', function () {
      normalizeInputs();
      render(false);
    });
  });

  el.form.addEventListener('submit', function (event) {
    event.preventDefault();
    normalizeInputs();
    render(true);
  });

  el.reset.addEventListener('click', function () {
    state.pet = fixedSpecies || 'dog';
    state.size = 'medium';
    el.years.value = '4';
    el.months.value = '0';
    if (el.lifestyle) el.lifestyle.value = 'indoor';
    syncSpecies();
    syncSize();
    render(true);
  });

  syncSpecies();
  syncSize();
  render(false);
})();
