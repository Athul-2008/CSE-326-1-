// TripNest is a CSE326 practice project made with plain browser JavaScript.
// The demo profile and plans are saved only in this browser, not on a server.

const STORAGE_KEY = "tripnest-cse326-data";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The main data is an object. Its arrays hold user, trip, and place objects.
function loadData() {
  const savedText = localStorage.getItem(STORAGE_KEY);

  if (savedText) {
    try {
      const savedData = JSON.parse(savedText);
      if (Array.isArray(savedData.users) && Array.isArray(savedData.trips) && Array.isArray(savedData.places)) {
        return savedData;
      }
    } catch (error) {
      console.log("Saved TripNest data could not be read.");
    }
  }

  return { users: [], trips: [], places: [], currentEmail: "" };
}

const appData = loadData();
let accountMode = "login";
let currentView = "trips";
let openTripId = "";
let toastTimer;

// Select the page elements once so the functions below can update them.
const loginPanel = document.querySelector("#loginPanel");
const workspace = document.querySelector("#workspace");
const tripsView = document.querySelector("#tripsView");
const placesView = document.querySelector("#placesView");
const courseView = document.querySelector("#courseView");
const tripForm = document.querySelector("#tripForm");
const tripFormPanel = document.querySelector("#tripFormPanel");
const placeForm = document.querySelector("#placeForm");

function saveData() {
  // JSON changes JavaScript objects into text that localStorage can save.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function makeId() {
  return Date.now().toString() + Math.random().toString(16).slice(2, 6);
}

function escapeHTML(value) {
  // Keep text entered in a form as text when adding it to the page.
  return String(value || "").replace(/[&<>"']/g, function (character) {
    const safeCharacters = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return safeCharacters[character];
  });
}

function currentUser() {
  return appData.users.find(function (user) {
    return user.email === appData.currentEmail;
  });
}

function userTrips() {
  return appData.trips.filter(function (trip) {
    return trip.owner === appData.currentEmail;
  });
}

function userPlaces() {
  return appData.places.filter(function (place) {
    return place.owner === appData.currentEmail;
  });
}

function showMessage(message, isSuccess) {
  const messageBox = document.querySelector("#accountMessage");
  messageBox.textContent = message;
  messageBox.classList.toggle("success", Boolean(isSuccess));
}

function setAccountMode(mode) {
  accountMode = mode;
  const isRegistering = mode === "register";
  document.querySelector("#accountTitle").textContent = isRegistering ? "Make a travel profile" : "Good to see you";
  document.querySelector("#accountHelp").textContent = isRegistering
    ? "Choose a name and email for this browser demo."
    : "Sign in to open your saved plans in this browser.";
  document.querySelector("#accountSubmit").textContent = isRegistering ? "Create profile" : "Sign in";
  document.querySelector("#nameField").hidden = !isRegistering;
  document.querySelector("#accountName").required = isRegistering;
  showMessage("", false);

  document.querySelectorAll("[data-account-mode]").forEach(function (button) {
    const selected = button.dataset.accountMode === mode;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected);
  });
}

function handleAccountForm(event) {
  event.preventDefault();
  const email = document.querySelector("#accountEmail").value.trim().toLowerCase();
  const name = document.querySelector("#accountName").value.trim();
  const isRegistering = accountMode === "register";

  // This regular expression checks for a simple email-like format.
  if (!emailPattern.test(email)) {
    showMessage("Enter an email address in the format name@example.com.", false);
    return;
  }

  let account = appData.users.find(function (user) {
    return user.email === email;
  });

  if (isRegistering) {
    if (account) {
      showMessage("This email already has a profile here. Choose Sign in instead.", false);
      return;
    }

    account = { id: makeId(), email: email, name: name };
    appData.users.push(account);
  } else if (!account) {
    showMessage("No profile found in this browser. Choose Create profile first.", false);
    return;
  }

  appData.currentEmail = email;
  saveData();
  document.querySelector("#accountForm").reset();
  setAccountMode("login");
  renderApp();
  showToast(isRegistering ? "Your local demo profile is ready." : "You're signed in to this browser demo.");
}

function showView(viewName) {
  currentView = viewName;
  tripsView.hidden = viewName !== "trips";
  placesView.hidden = viewName !== "places";
  courseView.hidden = viewName !== "course";

  document.querySelectorAll("[data-view]").forEach(function (button) {
    const selected = button.dataset.view === viewName;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-current", selected ? "page" : "false");
  });

  if (viewName === "trips") renderTrips();
  if (viewName === "places") renderPlaces();
}

function renderApp() {
  const user = currentUser();
  const signedIn = Boolean(user);
  loginPanel.hidden = signedIn;
  workspace.hidden = !signedIn;
  document.querySelector("#mainNav").hidden = !signedIn;
  document.querySelector("#accountBar").hidden = !signedIn;
  document.querySelector("#siteFooter").hidden = !signedIn;

  if (!signedIn) return;

  document.querySelector("#signedInLabel").textContent = user.name || user.email;
  showView(currentView);
  renderSummary();
  renderPlacesDatalist();
}

function renderSummary() {
  const trips = userTrips();
  document.querySelector("#tripCount").textContent = trips.length;
  document.querySelector("#placeCount").textContent = userPlaces().length;
  document.querySelector("#favoriteCount").textContent = trips.filter(function (trip) {
    return trip.favorite;
  }).length;
  renderNextTrip();
}

function today() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatDate(dateText) {
  if (!dateText) return "Date to be decided";
  const date = new Date(dateText + "T12:00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateRange(startDate, endDate) {
  if (!startDate) return "Dates to be decided";
  if (!endDate || startDate === endDate) return formatDate(startDate);
  return formatDate(startDate) + " – " + formatDate(endDate);
}

function formatMoney(amount, currency) {
  const number = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "INR" }).format(number);
  } catch (error) {
    return (currency || "INR") + " " + number.toFixed(2);
  }
}

function activityEstimate(activity) {
  return Number(activity.estimatedCost) || 0;
}

function activityActual(activity) {
  if (activity.actualCost === "" || activity.actualCost === undefined) return null;
  return Number(activity.actualCost) || 0;
}

function tripCosts(trip) {
  let estimated = 0;
  let actual = 0;
  let workingTotal = 0;

  // A loop adds each itinerary cost to the trip totals.
  for (let index = 0; index < trip.activities.length; index += 1) {
    const activity = trip.activities[index];
    const estimate = activityEstimate(activity);
    const recordedCost = activityActual(activity);
    estimated += estimate;

    if (recordedCost === null) {
      workingTotal += estimate;
    } else {
      actual += recordedCost;
      workingTotal += recordedCost;
    }
  }

  return { estimated: estimated, actual: actual, total: workingTotal };
}

function renderNextTrip() {
  const nextTrip = userTrips()
    .filter(function (trip) { return trip.endDate >= today(); })
    .sort(function (first, second) { return first.startDate.localeCompare(second.startDate); })[0];
  const box = document.querySelector("#nextTrip");

  if (!nextTrip) {
    box.innerHTML = '<p class="next-trip-empty">The next one is waiting to be planned.</p>';
    return;
  }

  box.innerHTML = '<p class="next-trip-title">' + escapeHTML(nextTrip.title) + '</p>' +
    '<p class="next-trip-destination">⌖ ' + escapeHTML(nextTrip.destination) + '</p>' +
    '<p class="next-trip-date">' + escapeHTML(formatDateRange(nextTrip.startDate, nextTrip.endDate)) + '</p>';
}

function tripMatchesSearch(trip, searchText) {
  const activities = trip.activities.map(function (activity) {
    return activity.title + " " + activity.location;
  }).join(" ");
  const allWords = (trip.title + " " + trip.destination + " " + trip.notes + " " + activities).toLowerCase();
  return allWords.includes(searchText);
}

function renderTrips() {
  const list = document.querySelector("#tripList");
  const searchText = document.querySelector("#tripSearch").value.trim().toLowerCase();
  const filterChoice = document.querySelector("#tripFilter").value;
  let trips = userTrips();

  if (filterChoice === "upcoming") {
    trips = trips.filter(function (trip) { return trip.endDate >= today(); });
  } else if (filterChoice === "past") {
    trips = trips.filter(function (trip) { return trip.endDate < today(); });
  } else if (filterChoice === "favorites") {
    trips = trips.filter(function (trip) { return trip.favorite; });
  }

  if (searchText) {
    trips = trips.filter(function (trip) { return tripMatchesSearch(trip, searchText); });
  }

  trips.sort(function (first, second) {
    return first.startDate.localeCompare(second.startDate);
  });

  let cards = "";
  trips.forEach(function (trip, index) {
    cards += makeTripCard(trip, index);
  });
  list.innerHTML = cards;
  document.querySelector("#visibleTripCount").textContent = trips.length;
  document.querySelector("#emptyTrips").hidden = trips.length > 0;
  list.hidden = trips.length === 0;

  if (trips.length === 0) {
    const hasFilter = searchText || filterChoice !== "all";
    document.querySelector("#emptyTripTitle").textContent = hasFilter ? "No trips found" : "Your first trip starts here";
    document.querySelector("#emptyTripText").textContent = hasFilter
      ? "Try another search or filter to find your plans."
      : "Add a destination, set a budget, and keep the details in one place.";
    document.querySelector("#emptyTripButton").hidden = Boolean(hasFilter);
  }
}

function activitiesInOrder(activities) {
  const orderedActivities = activities.slice();
  orderedActivities.sort(function (first, second) {
    const firstDateTime = first.date + " " + first.time;
    const secondDateTime = second.date + " " + second.time;
    return firstDateTime.localeCompare(secondDateTime);
  });
  return orderedActivities;
}

function makeTripCard(trip, index) {
  const costs = tripCosts(trip);
  const budget = Number(trip.budget) || 0;
  const progress = budget > 0 ? Math.min(costs.total / budget * 100, 100) : 0;
  const overBudget = budget > 0 && costs.total > budget;
  const status = trip.endDate >= today() ? "ON THE HORIZON" : "A LOVELY MEMORY";
  const artClass = "art-" + (index % 4 + 1);
  const orderedActivities = activitiesInOrder(trip.activities);
  let activityHTML = "";

  if (orderedActivities.length === 0) {
    activityHTML = '<p class="no-activities">No activities yet. Add the first stop below.</p>';
  } else {
    activityHTML = "<ul class=\"activity-list\">";
    orderedActivities.forEach(function (activity) {
      const actual = activityActual(activity);
      activityHTML += '<li class="activity-item"><div><strong>' + escapeHTML(activity.title) + '</strong>' +
        '<span class="activity-meta">' + escapeHTML(formatDate(activity.date)) + ' · ' + escapeHTML(activity.time) +
        (activity.location ? ' · ' + escapeHTML(activity.location) : "") + '</span>' +
        '<span class="activity-cost">Estimate ' + formatMoney(activity.estimatedCost, trip.currency) +
        (actual === null ? "" : " · Actual " + formatMoney(activity.actualCost, trip.currency)) +
        '</span></div><div class="activity-actions"><button class="small-action" type="button" data-action="edit-activity" data-trip-id="' + escapeHTML(trip.id) + '" data-activity-id="' + escapeHTML(activity.id) + '" aria-label="' + escapeHTML("Edit " + activity.title + " in " + trip.title) + '">Edit</button><button class="small-action" type="button" data-action="delete-activity" data-trip-id="' + escapeHTML(trip.id) + '" data-activity-id="' + escapeHTML(activity.id) + '" aria-label="' + escapeHTML("Remove " + activity.title + " from " + trip.title) + '">Remove</button></div></li>';
    });
    activityHTML += "</ul>";
  }

  const totalLabel = budget > 0 ? "ESTIMATE / ACTUAL TOTAL" : "ACTIVITY COSTS";
  const budgetText = budget > 0 ? formatMoney(costs.total, trip.currency) + " / " + formatMoney(budget, trip.currency) : formatMoney(costs.total, trip.currency);

  return '<article class="trip-card" data-trip-card="' + escapeHTML(trip.id) + '">' +
    '<div class="trip-art ' + artClass + '"><span class="trip-art-label">' + status + '</span></div>' +
    '<div class="trip-card-content"><div class="trip-card-top"><div><p class="trip-destination">⌖ ' + escapeHTML(trip.destination) + '</p><h3>' + escapeHTML(trip.title) + '</h3></div>' +
    '<div class="card-actions"><button class="favorite-button ' + (trip.favorite ? "is-favorite" : "") + '" type="button" data-action="favorite" data-trip-id="' + escapeHTML(trip.id) + '" aria-label="' + escapeHTML((trip.favorite ? "Remove " : "Save ") + trip.title + " " + (trip.favorite ? "from saved trips" : "to saved trips")) + '" aria-pressed="' + Boolean(trip.favorite) + '">' + (trip.favorite ? "★" : "☆") + '</button>' +
    '<button class="small-action" type="button" data-action="edit-trip" data-trip-id="' + escapeHTML(trip.id) + '" aria-label="' + escapeHTML("Edit " + trip.title) + '">Edit</button>' +
    '<button class="small-action" type="button" data-action="delete-trip" data-trip-id="' + escapeHTML(trip.id) + '" aria-label="' + escapeHTML("Remove " + trip.title) + '">Remove</button></div></div>' +
    '<p class="trip-dates">' + escapeHTML(formatDateRange(trip.startDate, trip.endDate)) + '</p>' +
    '<div class="cost-row"><span class="cost-label" title="Uses actual cost when entered, otherwise the estimate">' + totalLabel + '</span><span class="cost-value">' + budgetText + '</span></div>' +
    '<div class="progress-track" aria-label="Budget progress"><div class="progress-fill ' + (overBudget ? "over-budget" : "") + '" style="width:' + progress + '%"></div></div>' +
    '<details class="trip-details" data-trip-details="' + escapeHTML(trip.id) + '" ' + (openTripId === trip.id ? "open" : "") + '><summary>Trip notes, budget and itinerary</summary>' +
    '<p class="trip-notes">' + escapeHTML(trip.notes || "No notes added yet.") + '</p>' +
    '<p class="activity-heading">Itinerary · Estimated ' + formatMoney(costs.estimated, trip.currency) + ' · Actual ' + formatMoney(costs.actual, trip.currency) + '</p>' +
    activityHTML + makeActivityForm(trip) +
    '<div class="form-buttons"><button class="button button-light button-small" type="button" data-action="share-trip" data-trip-id="' + escapeHTML(trip.id) + '">Copy trip summary</button><button class="button button-light button-small" type="button" data-action="print-trip" data-trip-id="' + escapeHTML(trip.id) + '">Print plan</button></div>' +
    '</details></div></article>';
}

function makeActivityForm(trip) {
  return '<form class="activity-form" data-activity-form="' + escapeHTML(trip.id) + '">' +
    '<input type="hidden" name="activityId" value="">' +
    '<div class="field-group field-wide"><label>Activity<input name="title" type="text" maxlength="80" placeholder="e.g. Visit the morning market" required></label></div>' +
    '<div class="field-group"><label>Place or address<input name="location" type="text" maxlength="80" placeholder="Optional"></label></div>' +
    '<div class="field-group"><label>Date<input name="date" type="date" min="' + escapeHTML(trip.startDate) + '" max="' + escapeHTML(trip.endDate) + '" required></label></div>' +
    '<div class="field-group"><label>Time<input name="time" type="time" required></label></div>' +
    '<div class="field-group"><label>Estimated cost<input name="estimatedCost" type="number" min="0" step="0.01" placeholder="0.00"></label></div>' +
    '<div class="field-group"><label>Actual cost<input name="actualCost" type="number" min="0" step="0.01" placeholder="Not recorded yet"></label></div>' +
    '<div class="form-buttons field-wide"><button class="button button-light button-small cancel-activity" type="button" hidden>Cancel edit</button><button class="button button-primary button-small" type="submit">Add activity</button></div>' +
    '</form>';
}

function renderPlaces() {
  const list = document.querySelector("#placeList");
  const places = userPlaces().sort(function (first, second) { return first.name.localeCompare(second.name); });
  document.querySelector("#placesTotal").textContent = places.length;
  document.querySelector("#emptyPlaces").hidden = places.length > 0;
  list.hidden = places.length === 0;
  let cards = "";

  places.forEach(function (place) {
    cards += '<article class="place-card"><span class="place-mark" aria-hidden="true">⌖</span><h3>' + escapeHTML(place.name) + '</h3>' +
      '<p class="place-region">' + escapeHTML(place.region || "Somewhere to explore") + '</p>' +
      '<p class="place-note">' + escapeHTML(place.note || "A place to look forward to.") + '</p>' +
      '<div class="place-actions"><button class="small-action" type="button" data-place-action="edit" data-place-id="' + escapeHTML(place.id) + '" aria-label="' + escapeHTML("Edit " + place.name) + '">Edit</button><button class="small-action" type="button" data-place-action="remove" data-place-id="' + escapeHTML(place.id) + '" aria-label="' + escapeHTML("Remove " + place.name) + '">Remove</button></div></article>';
  });
  list.innerHTML = cards;
}

function renderPlacesDatalist() {
  let options = "";
  userPlaces().forEach(function (place) {
    options += '<option value="' + escapeHTML(place.name) + '">' + escapeHTML(place.region) + '</option>';
  });
  document.querySelector("#savedPlaces").innerHTML = options;
}

function addPlaceIfNeeded(placeName) {
  const name = placeName.trim();
  const alreadySaved = userPlaces().some(function (place) {
    return place.name.toLowerCase() === name.toLowerCase();
  });
  if (name && !alreadySaved) {
    appData.places.push({ id: makeId(), owner: appData.currentEmail, name: name, region: "", note: "" });
  }
}

function findTrip(tripId) {
  return userTrips().find(function (trip) { return trip.id === tripId; });
}

function setTripForm(trip) {
  tripForm.reset();
  document.querySelector("#tripId").value = trip ? trip.id : "";
  document.querySelector("#tripTitle").value = trip ? trip.title : "";
  document.querySelector("#tripDestination").value = trip ? trip.destination : "";
  document.querySelector("#tripStart").value = trip ? trip.startDate : "";
  document.querySelector("#tripEnd").value = trip ? trip.endDate : "";
  document.querySelector("#tripBudget").value = trip ? trip.budget : "";
  document.querySelector("#tripCurrency").value = trip ? trip.currency : "INR";
  document.querySelector("#tripNotes").value = trip ? trip.notes : "";
  document.querySelector("#tripFormSummary").textContent = trip ? "Edit trip: " + trip.title : "＋ Plan a new trip";
  document.querySelector("#saveTripButton").textContent = trip ? "Save changes" : "Save trip";
  document.querySelector("#cancelTripEdit").hidden = !trip;
  tripFormPanel.open = true;
  document.querySelector("#tripTitle").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearTripForm() {
  tripForm.reset();
  document.querySelector("#tripId").value = "";
  document.querySelector("#tripFormSummary").textContent = "＋ Plan a new trip";
  document.querySelector("#saveTripButton").textContent = "Save trip";
  document.querySelector("#cancelTripEdit").hidden = true;
  tripFormPanel.open = false;
}

function saveTrip(event) {
  event.preventDefault();
  const tripId = document.querySelector("#tripId").value;
  const startDate = document.querySelector("#tripStart").value;
  const endDate = document.querySelector("#tripEnd").value;

  if (endDate < startDate) {
    showToast("The end date must be the same as or later than the start date.");
    return;
  }

  const tripDetails = {
    title: document.querySelector("#tripTitle").value.trim(),
    destination: document.querySelector("#tripDestination").value.trim(),
    startDate: startDate,
    endDate: endDate,
    budget: document.querySelector("#tripBudget").value,
    currency: document.querySelector("#tripCurrency").value,
    notes: document.querySelector("#tripNotes").value.trim()
  };
  let trip = tripId ? findTrip(tripId) : null;

  if (trip) {
    const activityOutsideNewDates = trip.activities.some(function (activity) {
      return activity.date < startDate || activity.date > endDate;
    });
    if (activityOutsideNewDates) {
      showToast("Edit or remove itinerary activities outside the new dates first.");
      return;
    }

    trip.title = tripDetails.title;
    trip.destination = tripDetails.destination;
    trip.startDate = tripDetails.startDate;
    trip.endDate = tripDetails.endDate;
    trip.budget = tripDetails.budget;
    trip.currency = tripDetails.currency;
    trip.notes = tripDetails.notes;
  } else {
    trip = {
      id: makeId(),
      owner: appData.currentEmail,
      favorite: false,
      activities: [],
      title: tripDetails.title,
      destination: tripDetails.destination,
      startDate: tripDetails.startDate,
      endDate: tripDetails.endDate,
      budget: tripDetails.budget,
      currency: tripDetails.currency,
      notes: tripDetails.notes
    };
    appData.trips.push(trip);
  }

  addPlaceIfNeeded(tripDetails.destination);
  saveData();
  clearTripForm();
  renderApp();
  showToast(tripId ? "Trip details updated." : "Trip added to your plans.");
}

function saveActivity(event) {
  if (!event.target.matches(".activity-form")) return;
  event.preventDefault();
  const form = event.target;
  const trip = findTrip(form.dataset.activityForm);
  if (!trip) return;

  const date = form.elements.date.value;
  if (date < trip.startDate || date > trip.endDate) {
    showToast("Choose an activity date within your trip dates.");
    return;
  }

  const activityId = form.elements.activityId.value;
  const activityDetails = {
    title: form.elements.title.value.trim(),
    location: form.elements.location.value.trim(),
    date: date,
    time: form.elements.time.value,
    estimatedCost: form.elements.estimatedCost.value,
    actualCost: form.elements.actualCost.value
  };
  const oldActivity = trip.activities.find(function (activity) { return activity.id === activityId; });

  if (oldActivity) {
    oldActivity.title = activityDetails.title;
    oldActivity.location = activityDetails.location;
    oldActivity.date = activityDetails.date;
    oldActivity.time = activityDetails.time;
    oldActivity.estimatedCost = activityDetails.estimatedCost;
    oldActivity.actualCost = activityDetails.actualCost;
  } else {
    const newActivity = {
      id: makeId(),
      title: activityDetails.title,
      location: activityDetails.location,
      date: activityDetails.date,
      time: activityDetails.time,
      estimatedCost: activityDetails.estimatedCost,
      actualCost: activityDetails.actualCost
    };
    trip.activities.push(newActivity);
  }

  openTripId = trip.id;
  saveData();
  renderApp();
  showToast(activityId ? "Activity updated." : "Activity added to the itinerary.");
}

function editActivity(tripId, activityId) {
  const trip = findTrip(tripId);
  if (!trip) return;
  const activity = trip.activities.find(function (item) { return item.id === activityId; });
  const card = document.querySelector('[data-trip-card="' + tripId + '"]');
  if (!activity || !card) return;

  openTripId = tripId;
  const form = card.querySelector(".activity-form");
  form.elements.activityId.value = activity.id;
  form.elements.title.value = activity.title;
  form.elements.location.value = activity.location;
  form.elements.date.value = activity.date;
  form.elements.time.value = activity.time;
  form.elements.estimatedCost.value = activity.estimatedCost;
  form.elements.actualCost.value = activity.actualCost;
  form.querySelector('button[type="submit"]').textContent = "Save activity";
  form.querySelector(".cancel-activity").hidden = false;
  form.elements.title.focus();
}

function resetActivityForm(form) {
  form.reset();
  form.elements.activityId.value = "";
  form.querySelector('button[type="submit"]').textContent = "Add activity";
  form.querySelector(".cancel-activity").hidden = true;
}

function handleTripClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const tripId = button.dataset.tripId;
  const trip = findTrip(tripId);
  if (!trip) return;

  if (action === "favorite") {
    trip.favorite = !trip.favorite;
    openTripId = trip.id;
    saveData();
    renderApp();
    showToast(trip.favorite ? "Trip saved for later." : "Trip removed from saved trips.");
  }

  if (action === "edit-trip") setTripForm(trip);

  if (action === "delete-trip" && window.confirm("Remove “" + trip.title + "” and its itinerary?")) {
    appData.trips = appData.trips.filter(function (item) { return item.id !== trip.id; });
    openTripId = "";
    saveData();
    renderApp();
    showToast("Trip removed.");
  }

  if (action === "edit-activity") editActivity(trip.id, button.dataset.activityId);

  if (action === "delete-activity" && window.confirm("Remove this activity from the itinerary?")) {
    trip.activities = trip.activities.filter(function (item) { return item.id !== button.dataset.activityId; });
    openTripId = trip.id;
    saveData();
    renderApp();
    showToast("Activity removed.");
  }

  if (action === "share-trip") copyTripSummary(trip);
  if (action === "print-trip") printTrip(trip.id);
}

function tripSummary(trip) {
  const costs = tripCosts(trip);
  const lines = [
    trip.title + " — " + trip.destination,
    formatDateRange(trip.startDate, trip.endDate),
    "Budget: " + (trip.budget ? formatMoney(trip.budget, trip.currency) : "not set"),
    "Estimated activities: " + formatMoney(costs.estimated, trip.currency),
    "Actual recorded: " + formatMoney(costs.actual, trip.currency),
    "Notes: " + (trip.notes || "none"),
    "Itinerary:"
  ];

  activitiesInOrder(trip.activities).forEach(function (activity) {
    lines.push("- " + formatDate(activity.date) + " at " + activity.time + ": " + activity.title);
  });
  return lines.join("\n");
}

function copyTripSummary(trip) {
  const summary = tripSummary(trip);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(summary).then(function () {
      showToast("Trip summary copied. Paste it into a message to share.");
    }).catch(function () {
      window.prompt("Copy this trip summary to share:", summary);
    });
  } else {
    window.prompt("Copy this trip summary to share:", summary);
  }
}

function printTrip(tripId) {
  document.querySelectorAll("[data-trip-card]").forEach(function (card) {
    card.dataset.printTarget = card.dataset.tripCard === tripId ? "yes" : "no";
  });
  document.body.dataset.printingTrip = "true";
  window.print();
}

window.addEventListener("afterprint", function () {
  delete document.body.dataset.printingTrip;
  document.querySelectorAll("[data-trip-card]").forEach(function (card) {
    delete card.dataset.printTarget;
  });
});

function handlePlaceForm(event) {
  event.preventDefault();
  const placeId = document.querySelector("#placeId").value;
  const name = document.querySelector("#placeName").value.trim();
  const duplicate = userPlaces().some(function (place) {
    return place.name.toLowerCase() === name.toLowerCase() && place.id !== placeId;
  });

  if (duplicate) {
    showToast("That place is already in your collection.");
    return;
  }

  const placeDetails = {
    name: name,
    region: document.querySelector("#placeRegion").value.trim(),
    note: document.querySelector("#placeNote").value.trim()
  };
  const place = userPlaces().find(function (item) { return item.id === placeId; });

  if (place) {
    place.name = placeDetails.name;
    place.region = placeDetails.region;
    place.note = placeDetails.note;
  } else {
    const newPlace = {
      id: makeId(),
      owner: appData.currentEmail,
      name: placeDetails.name,
      region: placeDetails.region,
      note: placeDetails.note
    };
    appData.places.push(newPlace);
  }

  saveData();
  placeForm.reset();
  document.querySelector("#placeId").value = "";
  document.querySelector("#placeFormTitle").textContent = "ADD A PLACE";
  document.querySelector("#savePlaceButton").textContent = "Save place";
  document.querySelector("#cancelPlaceEdit").hidden = true;
  renderApp();
  showToast(place ? "Place updated." : "Place added to your collection.");
}

function handlePlaceClick(event) {
  const button = event.target.closest("button[data-place-action]");
  if (!button) return;
  const place = userPlaces().find(function (item) { return item.id === button.dataset.placeId; });
  if (!place) return;

  if (button.dataset.placeAction === "edit") {
    document.querySelector("#placeId").value = place.id;
    document.querySelector("#placeName").value = place.name;
    document.querySelector("#placeRegion").value = place.region;
    document.querySelector("#placeNote").value = place.note;
    document.querySelector("#placeFormTitle").textContent = "EDIT THIS PLACE";
    document.querySelector("#savePlaceButton").textContent = "Save changes";
    document.querySelector("#cancelPlaceEdit").hidden = false;
    document.querySelector("#placeName").focus();
  }

  if (button.dataset.placeAction === "remove" && window.confirm("Remove " + place.name + " from your places? Trips keep their destination.")) {
    appData.places = appData.places.filter(function (item) { return item.id !== place.id; });
    saveData();
    renderApp();
    showToast("Place removed. Existing trips are unchanged.");
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    toast.classList.remove("visible");
  }, 2500);
}

// Events connect the HTML controls to these functions.
document.querySelectorAll("[data-account-mode]").forEach(function (button) {
  button.addEventListener("click", function () {
    setAccountMode(button.dataset.accountMode);
  });
});

document.querySelectorAll("[data-view]").forEach(function (button) {
  button.addEventListener("click", function () {
    showView(button.dataset.view);
  });
});

document.querySelector("#accountForm").addEventListener("submit", handleAccountForm);

document.querySelector("#signOutButton").addEventListener("click", function () {
  appData.currentEmail = "";
  saveData();
  currentView = "trips";
  renderApp();
  showToast("Signed out of this browser demo.");
});

document.querySelector("#showTripForm").addEventListener("click", function () {
  setTripForm(null);
});
document.querySelector("#emptyTripButton").addEventListener("click", function () {
  setTripForm(null);
});
document.querySelector("#cancelTripEdit").addEventListener("click", clearTripForm);
tripForm.addEventListener("submit", saveTrip);

document.querySelector("#tripSearch").addEventListener("input", renderTrips);
document.querySelector("#tripFilter").addEventListener("change", renderTrips);
document.querySelector("#tripList").addEventListener("click", handleTripClick);
document.querySelector("#tripList").addEventListener("submit", saveActivity);
document.querySelector("#tripList").addEventListener("click", function (event) {
  if (event.target.matches(".cancel-activity")) {
    const form = event.target.closest(".activity-form");
    resetActivityForm(form);
  }
});
document.querySelector("#tripList").addEventListener("toggle", function (event) {
  if (event.target.matches("details[data-trip-details]")) {
    if (event.target.open) {
      openTripId = event.target.dataset.tripDetails;
    } else if (openTripId === event.target.dataset.tripDetails) {
      openTripId = "";
    }
  }
}, true);

placeForm.addEventListener("submit", handlePlaceForm);
document.querySelector("#placeList").addEventListener("click", handlePlaceClick);
document.querySelector("#cancelPlaceEdit").addEventListener("click", function () {
  placeForm.reset();
  document.querySelector("#placeId").value = "";
  document.querySelector("#placeFormTitle").textContent = "ADD A PLACE";
  document.querySelector("#savePlaceButton").textContent = "Save place";
  document.querySelector("#cancelPlaceEdit").hidden = true;
});

renderApp();
