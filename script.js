/* =========================================================
   1. KONFIGURATION — datakilder
   ========================================================= */
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
   
   const DIVISION_ORDER = ["Herre RX", "Dame RX", "Herre Scaled", "Dame Scaled"];
   const HEAT_DIVISION_ORDER = ["Herre Scaled", "Dame Scaled", "Herre RX", "Dame RX"];
   
   const AUTO_REFRESH_MS = 300000; // 5 minutter
   const RETRY_ATTEMPTS = 3;
   const RETRY_DELAY_MS = 1500;
   const LOCAL_CACHE_KEY = "chkm_cache";
   
   /* =========================================================
      2. KONFIGURATION — statisk tidsplan og heats (Event 01+02)
      ========================================================= */
   const SCHEDULE = [
     { time: "08:30", title: "Åbning, registrering og opvarmning", note: "Atletterne tjekker ind", type: "default" },
     { time: "09:00", title: "Atletbriefing", note: "Alle atleter samles", type: "default" },
     { time: "09:30", title: "⚡ Event 01 — AMRAP + Max Løft", note: "5 heats × 15 min | 4 baner", type: "event" },
     { time: "11:05", title: "⚡ Event 02 — Stationer, rullende", note: "Alle 19 hold | 2 min forskydning", type: "event" },
     { time: "11:55", title: "⚡ Event 03 — Partner Workout", note: "5 heats × 7 min | 4 baner", type: "event" },
     { time: "12:51", title: "🍔 Frokostpause", note: "45 min", type: "break" },
     { time: "13:36", title: "⚡ Event 04 — Finale", note: "Top 3 pr. division | 4 heats × 15 min", type: "event" },
     { time: "15:32", title: "🏆 Præmieceremoni", note: "Saml alle atleter og tilskuere", type: "ceremony" },
     { time: "16:02", title: "🎉 Sommerfest begynder", note: "", type: "ceremony" }
   ];
   
   const EVENT_01_HEATS = [
     { time: "09:30", teams: ["404: Condition Not Found", "Old Men At Work", "Senior Cross", "Team123"] },
     { time: "09:49", teams: ["Bente/Benterne", "Besties in Beast Mode", "Still Standing", "We Don't Lift - We Last!"] },
     { time: "10:08", teams: ["Altid Mer Eller Mindre Skadet", "Banana Bros", "De Sidste Reps", "Frogboys"] },
     { time: "10:27", teams: ["M&M's", "Ohana", "Team Skaldepander", "Team Tyndarm/JK Cross"] },
     { time: "10:46", teams: ["Barbell Barbies", "Confused But Consistent", "Ungt og Dumt"] }
   ];
   
   const EVENT_02_TEAMS = [
     "404: Condition Not Found", "Old Men At Work", "Senior Cross", "Team123",
     "Bente/Benterne", "Besties in Beast Mode", "Still Standing", "We Don't Lift - We Last!",
     "Altid Mer Eller Mindre Skadet", "Banana Bros", "De Sidste Reps", "Frogboys",
     "M&M's", "Ohana", "Team Skaldepander", "Team Tyndarm/JK Cross",
     "Barbell Barbies", "Confused But Consistent", "Ungt og Dumt"
   ];
   
   /* =========================================================
      3. STATE — data der lever på tværs af genindlæsninger
      ========================================================= */
   let allTeams = [];
   let athletes = {};
   let rawScores = {};
   let eventTotalReps = {}; // eventTotalReps["03"] = 100, fx
   let currentDivision = "Herre RX";
   let previousPlacements = {};
   
   /* =========================================================
      4. INIT — køres kun ÉN gang, uanset auto-opdatering
      ========================================================= */
   setupPageNav();
   setupTabs();
   fetchEverything();
   setInterval(fetchEverything, AUTO_REFRESH_MS);
   
   /* =========================================================
      5. DATAHENTNING
      ========================================================= */
   function fetchWithRetry(url, attemptsLeft = RETRY_ATTEMPTS) {
     return fetch(url, { cache: "no-cache" })
       .then(res => {
         if (!res.ok) throw new Error("HTTP " + res.status);
         return res.text();
       })
       .then(text => {
         if (!text.includes("Hold")) {
           throw new Error("Uventet svar (ikke CSV)");
         }
         return text;
       })
       .catch(error => {
         if (attemptsLeft > 1) {
           return new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
             .then(() => fetchWithRetry(url, attemptsLeft - 1));
         }
         throw error;
       });
   }
   
   function fetchEverything() {
     const eventKeys = Object.keys(EVENT_CSV_URLS);
   
     const leaderboardFetch = fetchWithRetry(LEADERBOARD_CSV_URL);
     const configFetch = fetchWithRetry(CONFIG_CSV_URL);
     const eventFetches = eventKeys.map(key => fetchWithRetry(EVENT_CSV_URLS[key]));
   
     Promise.all([leaderboardFetch, configFetch, ...eventFetches])
       .then(results => {
         const leaderboardCsv = results[0];
         const configCsv = results[1];
         const eventCsvs = results.slice(2);
   
         const teams = parseCSV(leaderboardCsv, "Hold,");
         const configTeams = parseCSV(configCsv, "Hold Navn,");
         athletes = buildAthleteLookup(configTeams);
   
         eventKeys.forEach((key, i) => {
           const parsed = parseEventData(eventCsvs[i]);
           rawScores[key] = parsed.scores;
           eventTotalReps[key] = parsed.totalReps;
         });
   
         saveToLocalCache(teams, athletes, rawScores, eventTotalReps);
         handleDataLoaded(teams);
         updateTimestamp();
       })
       .catch(error => {
         console.error("Noget gik galt, forsøger at bruge gemte data:", error);
   
         const cached = loadFromLocalCache();
         if (cached) {
           athletes = cached.athletes;
           rawScores = cached.rawScores;
           eventTotalReps = cached.eventTotalReps || {};
           handleDataLoaded(cached.teams);
           showStaleDataWarning(cached.savedAt);
         } else {
           showError();
         }
       });
   }
   
   function saveToLocalCache(teams, athletesData, rawScoresData, eventTotalRepsData) {
     try {
       localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({
         teams: teams,
         athletes: athletesData,
         rawScores: rawScoresData,
         eventTotalReps: eventTotalRepsData,
         savedAt: Date.now()
       }));
     } catch (e) {
       // Ignorér stille — siden må bare klare sig uden cache, hvis localStorage fejler
     }
   }
   
   function loadFromLocalCache() {
     try {
       const raw = localStorage.getItem(LOCAL_CACHE_KEY);
       if (!raw) return null;
       return JSON.parse(raw);
     } catch (e) {
       return null;
     }
   }
   
   function updateTimestamp() {
     const el = document.getElementById("last-updated");
     if (!el) return;
     const now = new Date();
     const timeString = now.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
     el.style.color = "#999999";
     el.textContent = `Sidst opdateret: ${timeString}`;
   }
   
   function showStaleDataWarning(savedAt) {
     const el = document.getElementById("last-updated");
     if (!el) return;
     const time = new Date(savedAt).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
     el.style.color = "#C0392B";
     el.textContent = `⚠ Kunne ikke hente nye data — viser seneste kendte fra ${time}`;
   }
   
   function showError() {
     const container = document.getElementById("leaderboard-container");
     if (!container) return;
     container.innerHTML = `
       <div class="error-message">
         <h3>Kunne ikke hente data</h3>
         <p>Tjek din internetforbindelse, eller prøv at genindlæse siden.</p>
       </div>
     `;
   }
   
   /* =========================================================
      6. PARSING — CSV til JavaScript-objekter
      ========================================================= */
   function parseCSV(csvText, headerStartsWith) {
     const lines = csvText.trim().split("\n");
     const headerIndex = lines.findIndex(line => line.startsWith(headerStartsWith));
     if (headerIndex === -1) return [];
   
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
   
   // Event-sheets: Hold(A) | Division(B) | Tid(C) | P-Score(D) | Capped(E) | Reps ved cap(F)
   // "Total Reps"-målet (bruges kun ved capped hold) ligger i celle E5, uafhængigt af hold-tabellen.
   function parseEventData(csvText) {
     const lines = csvText.trim().split("\n");
     const headerIndex = lines.findIndex(line => line.startsWith("Hold,"));
     if (headerIndex === -1) return { scores: {}, totalReps: null };
   
     const dataLines = lines.slice(headerIndex + 1);
     const scores = {};
   
     dataLines.forEach(line => {
       const values = line.split(",");
       const hold = values[0] ? values[0].trim() : "";
       const raw = values[2] ? values[2].trim() : "";
       const cappedText = values[4] ? values[4].trim().toUpperCase() : "";
       const capped = cappedText === "TRUE";
       const repsAtCap = values[5] ? values[5].trim() : "";
       scores[hold] = { raw: raw, capped: capped, repsAtCap: repsAtCap };
     });
   
     // Total Reps står i række 5, kolonne E — samme værdi for alle divisioner i eventet.
     let totalReps = null;
     if (lines.length >= 5) {
       const row5 = lines[4].split(",");
       const val = row5[4] ? row5[4].trim() : "";
       totalReps = val !== "" ? Number(val) : null;
     }
   
     return { scores: scores, totalReps: totalReps };
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
   
   function formatValue(value) {
     if (value === undefined || value === null || value === "") {
       return "–";
     }
     return value;
   }
   
   /* =========================================================
      7. DATA-BEHANDLING — sortering + bevægelse ift. sidste hentning
      ========================================================= */
   function handleDataLoaded(teams) {
     teams.sort((a, b) => {
       const divA = DIVISION_ORDER.indexOf(a["Division"]);
       const divB = DIVISION_ORDER.indexOf(b["Division"]);
       if (divA !== divB) return divA - divB;
       return Number(a["Placering"]) - Number(b["Placering"]);
     });
   
     teams.forEach(team => {
       const holdNavn = team["Hold"];
       const nyPlacering = Number(team["Placering"]);
       const gammelPlacering = previousPlacements[holdNavn];
   
       if (gammelPlacering !== undefined && !isNaN(nyPlacering)) {
         team.movement = gammelPlacering - nyPlacering;
       } else {
         team.movement = 0;
       }
     });
   
     const nyePlaceringer = {};
     teams.forEach(team => {
       nyePlaceringer[team["Hold"]] = Number(team["Placering"]);
     });
     previousPlacements = nyePlaceringer;
   
     allTeams = teams;
   
     showDivision(currentDivision, false);
     renderSchedule();
     renderHeats();
   }
   
   function getSortedDivisionTeams(division) {
     return allTeams
       .filter(t => t["Division"] === division)
       .slice()
       .sort((a, b) => Number(b["Placering"]) - Number(a["Placering"]));
   }
   
   /* =========================================================
      8. RENDER — LEADERBOARD-SIDEN
      ========================================================= */
   function showDivision(division, animate) {
     currentDivision = division;
     const container = document.getElementById("leaderboard-container");
     if (!container) return;
   
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
   
   function buildMovementIndicator(movement) {
     if (!movement) return "";
     if (movement > 0) return `<span class="movement movement-up">▲${movement}</span>`;
     return `<span class="movement movement-down">▼${Math.abs(movement)}</span>`;
   }
   
   function buildDetailContent(holdNavn) {
     let html = `<div class="detail-grid">`;
   
     Object.keys(EVENT_META).forEach(key => {
       const meta = EVENT_META[key];
       const scoreObj = rawScores[key] ? rawScores[key][holdNavn] : undefined;
   
       let displayValue;
   
       if (scoreObj && scoreObj.capped) {
         const total = eventTotalReps[key];
         const reps = Number(scoreObj.repsAtCap);
         if (total !== null && total !== undefined && !isNaN(reps)) {
           const missing = total - reps;
           displayValue = `Capped +${missing}`;
         } else {
           displayValue = "Capped";
         }
       } else {
         const raw = scoreObj ? scoreObj.raw : undefined;
         const formatted = formatValue(raw);
         displayValue = formatted + (formatted !== "–" && meta.unit ? " " + meta.unit : "");
       }
   
       html += `<div class="detail-item">`;
       html += `<div class="detail-label">${meta.label}</div>`;
       html += `<div class="detail-value">${displayValue}</div>`;
       html += `</div>`;
     });
   
     html += `</div>`;
     return html;
   }
   
   /* =========================================================
      9. RENDER — TIDSPLAN-SIDEN
      ========================================================= */
   function renderSchedule() {
     const el = document.getElementById("schedule-list");
     if (!el) return;
   
     let html = "";
     SCHEDULE.forEach(item => {
       html += `<div class="schedule-row schedule-${item.type}">`;
       html += `<div class="schedule-time">${item.time}</div>`;
       html += `<div class="schedule-info"><div class="schedule-title">${item.title}</div>`;
       if (item.note) html += `<div class="schedule-note">${item.note}</div>`;
       html += `</div></div>`;
     });
     el.innerHTML = html;
   }
   
   /* =========================================================
      10. RENDER — HEATPLAN-SIDEN
      ========================================================= */
   function renderHeats() {
     const el = document.getElementById("heats-list");
     if (!el) return;
   
     let html = "";
   
     html += `<h3 class="heat-block-title">Event 01 — AMRAP + Max Løft</h3>`;
     EVENT_01_HEATS.forEach((heat, i) => {
       html += buildHeatCard(`Heat ${i + 1} — ${heat.time}`, heat.teams);
     });
   
     html += `<h3 class="heat-block-title">Event 02 — Stationer (rullende)</h3>`;
     html += buildRollingHeatCard(EVENT_02_TEAMS, "11:05", 2);
   
     html += `<h3 class="heat-block-title">Event 03 — Partner Workout</h3>`;
     buildEvent03Heats().forEach((heat, i) => {
       const time = addMinutes("11:55", i * 12);
       html += buildHeatCard(`Heat ${i + 1} — ${time}`, heat.map(t => t["Hold"]));
     });
   
     html += `<h3 class="heat-block-title">Event 04 — Finale</h3>`;
     buildEvent04Heats().forEach((heat, i) => {
       const time = addMinutes("13:36", i * 19);
       html += buildHeatCard(`Heat ${i + 1} — ${time} — Top 3 ${HEAT_DIVISION_ORDER[i]}`, heat.map(t => t["Hold"]));
     });
   
     el.innerHTML = html;
   }
   
   function buildEvent03Heats() {
     let flat = [];
     HEAT_DIVISION_ORDER.forEach(div => {
       flat = flat.concat(getSortedDivisionTeams(div));
     });
     const heats = [];
     for (let i = 0; i < flat.length; i += 4) {
       heats.push(flat.slice(i, i + 4));
     }
     return heats;
   }
   
   function buildEvent04Heats() {
     return HEAT_DIVISION_ORDER.map(div => {
       const sorted = getSortedDivisionTeams(div);
       return sorted.slice(Math.max(0, sorted.length - 3));
     });
   }
   
   function buildHeatCard(title, teamNames) {
     let html = `<div class="heat-card"><div class="heat-card-title">${title}</div><div class="heat-lanes">`;
     teamNames.forEach((name, i) => {
       html += `<div class="heat-lane"><span class="lane-number">Bane ${i + 1}</span><span class="lane-team">${name}</span></div>`;
     });
     html += `</div></div>`;
     return html;
   }
   
   function buildRollingHeatCard(teamNames, startTime, stepMinutes) {
     let html = `<div class="heat-card"><div class="heat-lanes rolling">`;
     teamNames.forEach((name, i) => {
       const time = addMinutes(startTime, i * stepMinutes);
       html += `<div class="heat-lane"><span class="lane-number">${time}</span><span class="lane-team">${name}</span></div>`;
     });
     html += `</div></div>`;
     return html;
   }
   
   /* =========================================================
      11. EVENT LISTENERS
      ========================================================= */
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
   
   function setupPageNav() {
     const navButtons = document.querySelectorAll(".nav-button");
     navButtons.forEach(button => {
       button.addEventListener("click", () => {
         navButtons.forEach(b => b.classList.remove("active"));
         button.classList.add("active");
   
         document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
         document.getElementById("page-" + button.dataset.page).classList.add("active");
       });
     });
   }
   
   /* =========================================================
      12. HJÆLPEFUNKTIONER
      ========================================================= */
   function addMinutes(timeStr, minsToAdd) {
     const [h, m] = timeStr.split(":").map(Number);
     const total = h * 60 + m + minsToAdd;
     const newH = Math.floor(total / 60) % 24;
     const newM = total % 60;
     return String(newH).padStart(2, "0") + ":" + String(newM).padStart(2, "0");
   }
   
