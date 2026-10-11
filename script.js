const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
}

const fixturesApp = document.querySelector("[data-fixtures-app]");
const fixturesDataNode = document.querySelector("#fixtures-data");

if (fixturesApp && fixturesDataNode) {
  const fixturesData = JSON.parse(fixturesDataNode.textContent);
  const tabs = Array.from(document.querySelectorAll("[data-fixtures-team]"));
  const summary = document.querySelector("[data-fixtures-summary]");
  const scheduleHeading = document.querySelector("[data-schedule-heading]");
  const scheduleCaption = document.querySelector("[data-schedule-caption]");
  const scheduleBody = document.querySelector("[data-schedule-body]");
  const scheduleCards = document.querySelector("[data-schedule-cards]");
  const resultsHeading = document.querySelector("[data-results-heading]");
  const resultsList = document.querySelector("[data-results-list]");
  const falconsAchievements = document.querySelector("[data-falcons-achievements]");

  const clubTeams = new Set(Object.values(fixturesData.teams).map((team) => team.name));

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    })[character]);

  const mapUrl = (venue) => {
    const postcode = fixturesData.venues[venue];
    const query = fixturesData.venueQueries?.[venue] || `${venue} ${postcode || ""}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const venueLink = (venue) => {
    const postcode = fixturesData.venues[venue];
    const label = postcode ? `${venue} (${postcode})` : venue;
    return `<a class="text-link" href="${mapUrl(venue)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
  };

  const teamName = (name) =>
    clubTeams.has(name) ? `<strong class="club-team">${escapeHtml(name)}</strong>` : escapeHtml(name);

  const resultText = (fixture) =>
    fixture.status === "completed" ? `${fixture.homeSets}-${fixture.awaySets}` : "Upcoming";

  const matchLocation = (fixture, team) => fixture.homeTeam === team.name ? "Home" : "Away";

  const opponentName = (fixture, team) =>
    fixture.homeTeam === team.name ? fixture.awayTeam : fixture.homeTeam;

  const homeAwayMarkup = (fixture, team) => {
    const location = matchLocation(fixture, team);
    return `<span class="home-away home-away--${location.toLowerCase()}" aria-label="${location} match" title="${location} match"></span>`;
  };

  const statusMarkup = (fixture) => {
    if (fixture.status === "completed") {
      return `<span class="match-status match-status--win">Won ${resultText(fixture)}</span>`;
    }

    return `<span class="match-status">Upcoming</span>`;
  };

  const setScores = (fixture) => {
    if (!fixture.setScores) {
      return "";
    }

    return fixture.setScores
      .map((set, index) => `<span>Set ${index + 1}: ${set.home}-${set.away}</span>`)
      .join("");
  };

  const render = (teamKey) => {
    const team = fixturesData.teams[teamKey];
    const fixtures = fixturesData.fixtures.filter((fixture) => fixture.team === teamKey);
    const results = fixtures
      .filter((fixture) => fixture.status === "completed")
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    tabs.forEach((tab) => {
      const isActive = tab.dataset.fixturesTeam === teamKey;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-pressed", String(isActive));
    });

    summary.innerHTML = `
      <article class="fixtures-team-card">
        <p class="eyebrow">${escapeHtml(team.name)}</p>
        <h2>${escapeHtml(team.division)}</h2>
        <p>${escapeHtml(team.summary)}</p>
        <div class="fixtures-team-card__meta" aria-label="${escapeHtml(team.shortName)} fixture summary">
          <span>${fixtures.length} fixtures</span>
          <span>${results.length} result${results.length === 1 ? "" : "s"}</span>
        </div>
      </article>
    `;

    scheduleHeading.textContent = `${team.shortName} full season schedule`;
    scheduleCaption.textContent = `${team.name} 2026-27 ${team.division} full season schedule.`;
    resultsHeading.textContent = `${team.shortName} results`;
    if (falconsAchievements) {
      falconsAchievements.hidden = teamKey !== "falcons";
    }

    scheduleBody.innerHTML = fixtures.map((fixture) => `
      <tr class="fixture-row fixture-row--${fixture.status}">
        <td>${escapeHtml(fixture.displayDate)}</td>
        <td>${escapeHtml(fixture.time)}</td>
        <td>${escapeHtml(opponentName(fixture, team))}</td>
        <td>${homeAwayMarkup(fixture, team)}</td>
        <td>${venueLink(fixture.venue)}</td>
        <td>${statusMarkup(fixture)}</td>
      </tr>
    `).join("");

    scheduleCards.innerHTML = fixtures.map((fixture) => `
      <article class="fixture-card fixture-card--${fixture.status}">
        <div class="fixture-card__topline">
          <span>${escapeHtml(fixture.displayDate)}</span>
          <span>${escapeHtml(fixture.time)}</span>
        </div>
        <div class="fixture-card__teams">
          <span>${escapeHtml(opponentName(fixture, team))}</span>
          ${homeAwayMarkup(fixture, team)}
        </div>
        <div class="fixture-card__meta">
          <span>${venueLink(fixture.venue)}</span>
          ${statusMarkup(fixture)}
        </div>
      </article>
    `).join("");

    if (results.length === 0) {
      resultsList.innerHTML = `<article class="result-card result-card--empty"><p>${escapeHtml(team.noResultsMessage)}</p></article>`;
      return;
    }

    resultsList.innerHTML = results.map((fixture) => `
      <article class="result-card result-card--win">
        <div class="result-card__header">
          <div>
            <p class="card-label">${escapeHtml(fixture.displayDate)} | ${escapeHtml(fixture.division)}</p>
            <h3>Match result</h3>
          </div>
          ${homeAwayMarkup(fixture, team)}
        </div>
        <div class="result-scoreline" aria-label="${escapeHtml(fixture.homeTeam)} ${fixture.homeSets} to ${fixture.awaySets} ${escapeHtml(fixture.awayTeam)}">
          <span class="result-scoreline__team">${teamName(fixture.homeTeam)}</span>
          <strong class="result-scoreline__score">${fixture.homeSets}-${fixture.awaySets}</strong>
          <span class="result-scoreline__team result-scoreline__team--right">${teamName(fixture.awayTeam)}</span>
        </div>
        <p class="result-card__venue">${venueLink(fixture.venue)}</p>
        <div class="set-breakdown" aria-label="Individual set scores">
          <p>Set scores</p>
          <div>${setScores(fixture)}</div>
        </div>
      </article>
    `).join("");
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const teamKey = tab.dataset.fixturesTeam;
      const url = new URL(window.location.href);
      url.searchParams.set("team", teamKey);
      window.history.replaceState({}, "", url);
      render(teamKey);
    });
  });

  const requestedTeam = new URLSearchParams(window.location.search).get("team");
  render(fixturesData.teams[requestedTeam] ? requestedTeam : "falcons");
}
