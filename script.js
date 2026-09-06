const LEADERBOARD_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNJhOJXW7pZQEXEN7Y19cdJnk42RYhHkBhv0TeD1rHohgC4pHPUOU-smRBQqSKzg/pub?gid=1848510219&single=true&output=csv";
const CONFIG_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNJhOJXW7pZQEXEN7Y19cdJnk42RYhHkBhv0TeD1rHohgC4pHPUOU-smRBQqSKzg/pub?gid=2037495977&single=true&output=csv";

const EVENT_CSV_URLS = {
  "01a": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNJhOJXW7pZQEXEN7Y19cdJnk42RYhHkBhv0TeD1rHohgC4pHPUOU-smRBQqSKzg/pub?gid=104630089&single=true&output=csv",
  "01b": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNJhOJXW7pZQEXEN7Y19cdJnk42RYhHkBhv0TeD1rHohgC4pHPUOU-smRBQqSKzg/pub?gid=206749641&single=true&output=csv",
  "02": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNJhOJXW7pZQEXEN7Y19cdJnk42RYhHkBhv0TeD1rHohgC4pHPUOU-smRBQqSKzg/pub?gid=683307392&single=true&output=csv",
  "03": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNJhOJXW7pZQEXEN7Y19cdJnk42RYhHkBhv0TeD1rHohgC4pHPUOU-smRBQqSKzg/pub?gid=678524671&single=true&output=csv",
  "04": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNJhOJXW7pZQEXEN7Y19cdJnk42RYhHkBhv0TeD1rHohgC4pHPUOU-smRBQqSKzg/pub?gid=119104343&single=true&output=csv"
};

const EVENT_META = {
  "01a": { label: "Event 01a", unit: "reps" },
  "01b": { label: "Event 01b", unit: "kg" },
  "02":  { label: "Event 02", unit: "reps" },
  "03":  { label: "Event 03", unit: "" },
  "04":  { label: "Event 04", unit: "" }
};

let allTeams = [];
let athletes = {};
let rawScores = {};
let currentDivision = "Herre RX";
let previousPlacements = {}; // { "Ohana": 2, "Banana Bros": 1, ... } fra sidste opdatering

fetchEverything();
setInterval(fetchEverything, 30000);

function fetchEverything() {
  const eventKeys = Object.keys(EVENT_CSV_URLS);

  const leaderboardFetch = fetch(LEADERBOARD_CSV_URL, { cache: "no-store" }).then(res => res.text());
  const configFetch = fetch(CONFIG_CSV_URL, { cache: "no-store" }).then(res => res.text());
  const eventFetches = eventKeys.map(key => fetch(EVENT_CSV_URLS[key], { cache: "no-store" }).then(res => res.text()));

  Promise.all([leaderboardFetch, configFetch, ...eventFetches])
    .then(results => {
      const leaderboardCsv = results[0];
      const configCsv = results[1];
      const eventCsvs = results.slice(2);

      const teams = parseCSV(leaderboardCsv, "Hold,");
      const configTeams = parseCSV(configCsv, "Hold Navn,");
      athletes = buildAthleteLookup(configTeams);

      eventKeys.forEach((key, i) => {
        rawScores[key] = parseEventRawScores(eventCsvs[i]);
      });

      renderLeaderboard(teams);
      updateTimestamp();
    })
    .catch(error => {
      console.error("Noget gik galt:", error);
      showError();
    });
}

function updateTimestamp() {
  const el = document.getElementById("last-updated");
  const now = new Date();
  const timeString = now.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  el.textContent = `Sidst opdateret: ${timeString}`;
}

function showError() {
  const container = document.getElementById("leaderboard-container");
  container.innerHTML = `
    <div class="error-message">
      <h3>Kunne ikke hente data</h3>
      <p>Tjek din internetforbindelse, eller prøv at genindlæse siden.</p>
    </div>
  `;
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") {
    return "–";
  }
  return value;
}

function parseCSV(csvText, headerStartsWith) {
  const lines = csvText.trim().split("\n");
  const headerIndex = lines.findIndex(line => line.startsWith(headerStartsWith));
  const headers = lines[headerIndex].split(",");
  const dataLines = lines.slice(headerIndex + 1);

  return dataLines.map(line => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, i) => {
      row[header.trim()] = values[i] ? values[i].trim() : "";
    });
    return row;
  });
}

function parseEventRawScores(csvText) {
  const lines = csvText.trim().split("\n");
  const headerIndex = lines.findIndex(line => line.startsWith("Hold,"));
  const dataLines = lines.slice(headerIndex + 1);

  const lookup = {};
  dataLines.forEach(line => {
    const values = line.split(",");
    const hold = values[0] ? values[0].trim() : "";
    const rawScore = values[2] ? values[2].trim() : "";
    lookup[hold] = rawScore;
  });
  return lookup;
}

function buildAthleteLookup(configTeams) {
  const lookup = {};
  configTeams.forEach(team => {
    lookup[team["Hold Navn"]] = {
      atlet1: team["Atlet 1"],
      atlet2: team["Atlet 2"]
    };
  });
  return lookup;
}

function renderLeaderboard(teams) {
  const DIVISION_ORDER = ["Herre RX", "Dame RX", "Herre Scaled", "Dame Scaled"];

  teams.sort((a, b) => {
    const divA = DIVISION_ORDER.indexOf(a["Division"]);
    const divB = DIVISION_ORDER.indexOf(b["Division"]);
    if (divA !== divB) return divA - divB;
    return Number(a["Placering"]) - Number(b["Placering"]);
  });

  // Beregn bevægelse ift. forrige hentning, FØR vi overskriver previousPlacements
  teams.forEach(team => {
    const holdNavn = team["Hold"];
    const nyPlacering = Number(team["Placering"]);
    const gammelPlacering = previousPlacements[holdNavn];

    if (gammelPlacering !== undefined && !isNaN(nyPlacering)) {
      team.movement = gammelPlacering - nyPlacering; // positiv = rykket op, negativ = rykket ned
    } else {
      team.movement = 0; // ingen tidligere data at sammenligne med endnu
    }
  });

  // Gem denne omgangs placeringer til NÆSTE sammenligning
  const nyePlaceringer = {};
  teams.forEach(team => {
    nyePlaceringer[team["Hold"]] = Number(team["Placering"]);
  });
  previousPlacements = nyePlaceringer;

  allTeams = teams;
  setupTabs();
  showDivision(currentDivision, false);
}

function buildMovementIndicator(movement) {
  if (!movement) return "";
  if (movement > 0) return `<span class="movement movement-up">▲${movement}</span>`;
  return `<span class="movement movement-down">▼${Math.abs(movement)}</span>`;
}

function showDivision(division, animate) {
  currentDivision = division;
  const container = document.getElementById("leaderboard-container");
  const divisionTeams = allTeams.filter(team => team["Division"] === division);

  const tableClass = animate ? "animate-unfold" : "";

  let html = `<table class="${tableClass}">`;
  html += "<tr><th style=\"text-align:center\">Placering</th><th>Hold</th><th>01a</th><th>01b</th><th>02</th><th>03</th><th>04</th><th>Total</th></tr>";

  divisionTeams.forEach((team, index) => {
    const placering = Number(team["Placering"]);
    let rankClass = "";
    if (placering === 1) rankClass = "rank-1";
    else if (placering === 2) rankClass = "rank-2";
    else if (placering === 3) rankClass = "rank-3";

    const holdInfo = athletes[team["Hold"]];
    const athleteLine = holdInfo ? `<div class="athlete-names">${holdInfo.atlet1} &amp; ${holdInfo.atlet2}</div>` : "";
    const rowId = `detail-row-${index}`;
    const movementIndicator = buildMovementIndicator(team.movement);

    html += `<tr class="team-row" data-target="${rowId}">`;
    html += `<td class="${rankClass}">${formatValue(team["Placering"])}${movementIndicator}</td>`;
    html += `<td class="hold-cell">${team["Hold"]}${athleteLine}</td>`;
    html += `<td>${formatValue(team["01a P"])}</td>`;
    html += `<td>${formatValue(team["01b P"])}</td>`;
    html += `<td>${formatValue(team["02 P"])}</td>`;
    html += `<td>${formatValue(team["03 P"])}</td>`;
    html += `<td>${formatValue(team["04 P"])}</td>`;
    html += `<td>${formatValue(team["Total P"])}</td>`;
    html += `</tr>`;

    html += `<tr id="${rowId}" class="detail-row ${rankClass}">`;
    html += `<td class="${rankClass}"></td>`;
    html += `<td colspan="7">${buildDetailContent(team["Hold"])}</td>`;
    html += `</tr>`;
  });

  html += "</table>";
  container.innerHTML = html;
  setupRowToggles();
}

function buildDetailContent(holdNavn) {
  let html = `<div class="detail-grid">`;
  Object.keys(EVENT_META).forEach(key => {
    const meta = EVENT_META[key];
    const raw = rawScores[key] ? rawScores[key][holdNavn] : undefined;
    const displayValue = formatValue(raw);
    const unitText = displayValue === "–" ? "" : (meta.unit ? " " + meta.unit : "");

    html += `<div class="detail-item">`;
    html += `<div class="detail-label">${meta.label}</div>`;
    html += `<div class="detail-value">${displayValue}${unitText}</div>`;
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}

function setupRowToggles() {
  const rows = document.querySelectorAll(".team-row");
  rows.forEach(row => {
    row.addEventListener("click", () => {
      const targetId = row.dataset.target;
      const detailRow = document.getElementById(targetId);
      detailRow.classList.toggle("open");
      row.classList.toggle("expanded");
    });
  });
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      showDivision(button.dataset.division, true);
    });
  });
}