const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const result = document.getElementById("result");
const swapButton = document.getElementById("swap");
const chartCanvas = document.getElementById("chart");

let rates = {};
let chart;

async function loadRates() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();
    rates = data.rates;
    fillSelects();
  } catch (error) {
    result.textContent = "تعذر جلب الأسعار، تأكد من الاتصال بالإنترنت";
  }
}

function fillSelects() {
  const currencies = Object.keys(rates);

  currencies.forEach((code) => {
    fromSelect.add(new Option(code, code));
    toSelect.add(new Option(code, code));
  });

  fromSelect.value = localStorage.getItem("from") || "USD";
  toSelect.value = localStorage.getItem("to") || "SAR";
  onCurrencyChange();
}

function saveChoice() {
  localStorage.setItem("from", fromSelect.value);
  localStorage.setItem("to", toSelect.value);
}

function convert() {
  saveChoice();

  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (isNaN(amount) || !rates[from] || !rates[to]) {
    result.textContent = "النتيجة تظهر هنا";
    return;
  }

  const converted = (amount / rates[from]) * rates[to];
  result.textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function fetchDayRate(date, from, to) {
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  const urls = [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${f}.json`,
    `https://${date}.currency-api.pages.dev/v1/currencies/${f}.json`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data[f] && data[f][t]) return data[f][t];
    } catch (error) {
      // نجرب الرابط الاحتياطي
    }
  }
  return null;
}

async function drawChart() {
  const from = fromSelect.value;
  const to = toSelect.value;

  const dates = [];
  for (let i = 7; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }

  const values = await Promise.all(
    dates.map((date) => fetchDayRate(date, from, to))
  );

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: `${from} → ${to}`,
          data: values,
          borderColor: "#0f766e",
          backgroundColor: "#d9efeb",
          tension: 0.3,
          spanGaps: true,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

function onCurrencyChange() {
  convert();
  drawChart();
}

amountInput.addEventListener("input", convert);
fromSelect.addEventListener("change", onCurrencyChange);
toSelect.addEventListener("change", onCurrencyChange);

swapButton.addEventListener("click", () => {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;
  onCurrencyChange();
});

loadRates();