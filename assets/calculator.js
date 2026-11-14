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
    cat: '13–17 years',
    kitten: '13–17 years'
  };

  var root = document.querySelector('.calc');
  if (!root) return;

  var speciesAttr = root.dataset.species;
  var fixedSpecies = speciesAttr === 'dog' || speciesAttr === 'cat' || speciesAttr === 'kitten'
    ? speciesAttr
    : null;
  var compact = root.dataset.compact === 'true';

  var state = {
    pet: fixedSpecies || 'dog',
    size: root.dataset.size || 'medium'
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
    vetChecks: document.getElementById('vet-checks'),
    foodNote: document.getElementById('food-note'),
    dogChart: document.getElementById('dog-chart'),
    catChart: document.getElementById('cat-chart'),
    kittenChart: document.getElementById('kitten-chart'),
    dogFields: document.getElementById('dog-fields'),
    catFields: document.getElementById('cat-fields'),
    sizeSelect: document.getElementById('dog-size-select'),
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

  function kittenStages() {
    return [
      {
        label: 'Newborn',
        start: 0,
        startMonths: 0,
        note: 'Keep the kitten warm and with the queen if possible. Eyes may still be closed in the first days.',
        checks: 'Daily weight gain. See a vet promptly if orphaned or failing to thrive.',
        food: 'Queen’s milk or kitten milk replacer only. No cow’s milk.'
      },
      {
        label: 'Weaning',
        start: 1 / 12,
        startMonths: 1,
        note: 'Walking, play, and the first tastes of solid food usually begin in this window.',
        checks: 'First wellness exam. Deworming often starts around this month.',
        food: 'Mix kitten milk replacer with wet kitten food as solids are introduced.'
      },
      {
        label: 'Socialization',
        start: 2 / 12,
        startMonths: 2,
        note: 'The critical window for handling, play, and litter habits. Keep experiences calm and frequent.',
        checks: 'First core vaccines around 6–8 weeks, then boosters every 3–4 weeks.',
        food: 'Complete kitten food, wet and/or dry. Frequent small meals beat one large bowl.'
      },
      {
        label: 'Juvenile',
        start: 4 / 12,
        startMonths: 4,
        note: 'Rapid growth and teething. Play is how they learn bite inhibition and coordination.',
        checks: 'Continue vaccine boosters. Spay/neuter is often discussed from 4–6 months.',
        food: 'Kitten food only — adult food is too lean for this growth spurt.'
      },
      {
        label: 'Adolescent',
        start: 6 / 12,
        startMonths: 6,
        note: 'Looks grown, still filling out. Energy stays high; measured meals prevent early fat.',
        checks: 'Rabies as local law requires. FeLV testing if going outdoors. Finish the booster series.',
        food: 'Stay on kitten food until about 12 months. Measure meals instead of free-feeding.'
      },
      {
        label: 'Young adult',
        start: 1,
        startMonths: 12,
        note: 'Growth is mostly complete. Year two now adds about 9 human years on the adult cat curve.',
        checks: 'Annual exam from here, unless your vet wants a six-month visit after surgery.',
        food: 'Transition to adult cat food over 7–10 days.'
      }
    ];
  }

  function getStages() {
    if (state.pet === 'dog') return dogStages(state.size);
    if (state.pet === 'kitten') return kittenStages();
    return catStages();
  }

  function humanYears(age, rate) {
    if (age <= 0) return 0;
    if (age < 1) return 15 * age;
    if (age < 2) return 15 + 9 * (age - 1);
    return 24 + rate * (age - 2);
  }

  function formatHuman(value, precise) {
    if (precise) {
      var tenths = Math.round(value * 10) / 10;
      return tenths % 1 === 0 ? String(tenths) : tenths.toFixed(1);
    }
    return String(Math.round(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setText(node, value) {
    if (node) node.textContent = value;
  }

  function normalizeInputs() {
    if (state.pet === 'kitten') {
      if (!el.months) return;
      var kittenMonths = parseInt(el.months.value, 10);
      if (!isFinite(kittenMonths) || kittenMonths < 0) kittenMonths = 0;
      el.months.value = String(clamp(kittenMonths, 0, 24));
      return;
    }

    var years = el.years ? parseInt(el.years.value, 10) : 0;
    var months = el.months ? parseInt(el.months.value, 10) : 0;

    if (!isFinite(years) || years < 0) years = 0;
    if (!isFinite(months) || months < 0) months = 0;

    if (months >= 12) {
      years = clamp(years + Math.floor(months / 12), 0, 30);
      months = months % 12;
    }

    if (el.years) el.years.value = String(clamp(years, 0, 30));
    if (el.months) el.months.value = String(clamp(months, 0, 11));
  }

  function readAge() {
    if (state.pet === 'kitten') {
      var onlyMonths = el.months ? parseInt(el.months.value, 10) : 0;
      if (!isFinite(onlyMonths) || onlyMonths < 0) onlyMonths = 0;
      return clamp(onlyMonths, 0, 24) / 12;
    }

    var years = el.years ? parseInt(el.years.value, 10) : 0;
    var months = el.months ? parseInt(el.months.value, 10) : 0;

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

  function nextStageText(stage, next) {
    if (!next) return 'None';
    if (typeof next.startMonths === 'number') {
      var monthLabel = next.startMonths === 1 ? '1 month' : next.startMonths + ' months';
      return next.label + ' · ' + monthLabel;
    }
    return next.label + ' · age ' + next.start;
  }

  function syncSize() {
    el.sizeInputs.forEach(function (input) {
      input.checked = input.value === state.size;
    });
    if (el.sizeSelect) el.sizeSelect.value = state.size;
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
    var isKitten = state.pet === 'kitten';
    var size = SIZES[state.size];
    var stages = getStages();
    var index = currentStageIndex(stages, age);
    var stage = stages[index];
    var next = stages[index + 1];
    var rate = isDog ? size.rate : 4;
    var human = humanYears(age, rate);
    var hasAge = age > 0;
    var petLabel = isKitten ? 'Kitten' : (isDog ? 'Dog' : 'Cat');

    setText(el.resultLabel, 'Human equivalent · ' + petLabel);
    setText(el.humanAge, hasAge ? formatHuman(human, isKitten) : '—');
    setText(el.lifeStage, hasAge ? stage.label : '—');
    setText(el.nextStage, hasAge ? nextStageText(stage, next) : '—');
    setText(el.lifespan, LIFESPAN[state.pet]);
    setText(el.vetChecks, hasAge && stage.checks ? stage.checks : (hasAge ? '—' : '—'));
    setText(el.foodNote, hasAge && stage.food ? stage.food : (hasAge ? '—' : '—'));

    if (el.paceNote) {
      if (!hasAge) {
        el.paceNote.textContent = isKitten
          ? 'Enter the kitten’s age in months to see human years, the development stage, and what to do next.'
          : 'Enter your pet’s age above to see the estimate and life stage.';
      } else if (isKitten) {
        el.paceNote.textContent = stage.note + ' The first twelve months convert at about 1.25 human years per month.';
      } else {
        var rateLine = isDog
          ? 'After the second birthday, each dog year adds about ' + rate + ' human years for a ' + size.name + ' dog.'
          : 'After the second birthday, each cat year adds about 4 human years.';
        var lifestyleLine = isDog ? '' : ' Lifestyle is background only and does not change the conversion.';
        el.paceNote.textContent = stage.note + ' ' + rateLine + lifestyleLine;
      }
    }

    if (el.timeline) {
      el.timeline.innerHTML = '';
      stages.forEach(function (item, i) {
        var chip = document.createElement('span');
        chip.setAttribute('role', 'listitem');
        chip.textContent = item.label;
        if (hasAge && i === index) chip.classList.add('is-active');
        el.timeline.appendChild(chip);
      });
    }

    highlightChart(state.pet, age);

    if (animate && hasAge && el.humanAge) {
      el.humanAge.classList.remove('is-popping');
      void el.humanAge.offsetWidth;
      el.humanAge.classList.add('is-popping');
    }
  }

  function highlightChart(pet, age) {
    var chart = pet === 'dog' ? el.dogChart : pet === 'kitten' ? el.kittenChart : el.catChart;
    if (!chart) return;

    var rows = Array.prototype.slice.call(chart.querySelectorAll('tr'));
    rows.forEach(function (row) {
      row.classList.remove('is-current');
    });

    if (age <= 0) return;

    var key = pet === 'dog' ? 'dogAge' : pet === 'kitten' ? 'kittenMonths' : 'catAge';
    var compareAge = pet === 'kitten' ? age * 12 : age;
    var best = null;
    var bestDiff = Infinity;

    rows.forEach(function (row) {
      var value = Number(row.dataset[key]);
      if (!isFinite(value)) return;
      var diff = Math.abs(compareAge - value);
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

  if (el.sizeSelect) {
    el.sizeSelect.addEventListener('change', function () {
      state.size = el.sizeSelect.value;
      render(true);
    });
  }

  [el.years, el.months].forEach(function (input) {
    if (!input) return;
    input.addEventListener('input', function () {
      render(false);
    });
    input.addEventListener('change', function () {
      normalizeInputs();
      render(false);
    });
  });

  if (el.form) {
    el.form.addEventListener('submit', function (event) {
      event.preventDefault();
      normalizeInputs();
      render(true);
    });
  }

  if (el.reset) {
    el.reset.addEventListener('click', function () {
      state.pet = fixedSpecies || 'dog';
      state.size = 'medium';
      if (el.years) el.years.value = compact ? '4' : (state.pet === 'kitten' ? '0' : '4');
      if (el.months) el.months.value = state.pet === 'kitten' ? '4' : '0';
      if (el.lifestyle) el.lifestyle.value = 'indoor';
      syncSpecies();
      syncSize();
      render(true);
    });
  }

  syncSpecies();
  syncSize();
  render(false);
})();
