const zones = [
  {
    id: "fondo",
    name: "Fondo",
    sector: "FONDO",
    className: "zone-fondo",
    prices: { general: 349, senior: 289, youth: 175, child: 91, baby: 40, reduced: 269 },
  },
  {
    id: "tribuna2",
    name: "Tribuna 2",
    sector: "3/4/5",
    className: "zone-tribuna",
    prices: { general: 469, senior: 375, youth: 235, child: 120, baby: 57, reduced: 349 },
  },
  {
    id: "trib1-lateral",
    name: "Trib. 1 Lateral",
    sector: "1/7",
    className: "zone-tribuna",
    prices: { general: 559, senior: 445, youth: 278, child: 140, baby: 66, reduced: 415 },
  },
  {
    id: "trib1-medio",
    name: "Trib. 1 Medio",
    sector: "2/6",
    className: "zone-tribuna",
    prices: { general: 589, senior: 469, youth: 295, child: 150, baby: 71, reduced: 429 },
  },
  {
    id: "trib1-central",
    name: "Trib. 1 Central",
    sector: "3/4/5",
    className: "zone-tribuna",
    prices: { general: 615, senior: 489, youth: 309, child: 154, baby: 77, reduced: 449 },
  },
  {
    id: "retractil-lateral",
    name: "Retráctil Lateral",
    sector: "1/4",
    className: "zone-retractil",
    prices: { general: 679, senior: 535, youth: 338, child: 170, baby: 80, reduced: 489 },
  },
  {
    id: "retractil-central",
    name: "Retráctil Central",
    sector: "2/3",
    className: "zone-retractil",
    prices: { general: 705, senior: 555, youth: 355, child: 173, baby: 87, reduced: 515 },
  },
  {
    id: "pmr",
    name: "PMR",
    sector: "PMR",
    className: "",
    prices: { general: 255 },
  },
];

const tariffs = [
  { id: "general", name: "General", detail: "18-64 años" },
  { id: "senior", name: ">65 años", detail: "Mayores de 65" },
  { id: "youth", name: "Xuvenil", detail: "13-17 años" },
  { id: "child", name: "Infantil", detail: "5-12 años" },
  { id: "baby", name: "Baby", detail: "<4 años" },
  { id: "reduced", name: "Reducida", detail: "Condiciones especiales" },
];

const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const form = document.querySelector("#calculator");
const zoneSelect = document.querySelector("#zone");
const tariffSelect = document.querySelector("#tariff");
const senioritySelect = document.querySelector("#seniority");
const obradouroInput = document.querySelector("#obradouro");
const tableBody = document.querySelector("#priceTable tbody");
const infoButtons = document.querySelectorAll("[data-info-trigger]");

function formatEuro(value) {
  return euro.format(Math.max(0, Math.floor(value)));
}

function optionText(tariff) {
  return `${tariff.name} (${tariff.detail})`;
}

function selectedZone() {
  return zones.find((zone) => zone.id === zoneSelect.value) || zones[0];
}

function availableTariffs(zone) {
  return tariffs.filter((tariff) => Number.isFinite(zone.prices[tariff.id]));
}

function fillZones() {
  zoneSelect.innerHTML = zones
    .map((zone) => `<option value="${zone.id}">${zone.name} - Sector ${zone.sector}</option>`)
    .join("");
}

function fillTariffs() {
  const zone = selectedZone();
  const current = tariffSelect.value;
  const available = availableTariffs(zone);

  tariffSelect.innerHTML = available
    .map((tariff) => `<option value="${tariff.id}">${optionText(tariff)}</option>`)
    .join("");

  tariffSelect.value = available.some((tariff) => tariff.id === current) ? current : available[0].id;
}

function fillTable() {
  tableBody.innerHTML = zones
    .map((zone) => {
      const priceCells = tariffs
        .map((tariff) => `<td>${Number.isFinite(zone.prices[tariff.id]) ? formatEuro(zone.prices[tariff.id]) : "-"}</td>`)
        .join("");

      return `
        <tr>
          <td class="${zone.className}">${zone.name}</td>
          <td>${zone.sector}</td>
          ${priceCells}
        </tr>
      `;
    })
    .join("");
}

function numberValue(id) {
  const value = Number(document.querySelector(`#${id}`).value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function seniorityDiscount(tariffId) {
  const value = senioritySelect.value;
  if (tariffId === "reduced" && (value === "current" || value === "old")) return 0;

  if (value === "current") return 15;
  if (value === "old") return 5;
  if (value === "friend") return 5;
  return 0;
}

function familyDiscount() {
  const member = numberValue("familyMember");
  return member >= 2 ? (member - 1) * 10 : 0;
}

function obradouroRules() {
  const type = obradouroTypeForTariff(tariffSelect.value);
  return type === "minor"
    ? { unit: 80, label: "menor de edad" }
    : { unit: 200, label: "adulto" };
}

function validObradouroAmount(amount) {
  const rules = obradouroRules();
  const minimum = isRenewalDiscountSelected() ? rules.unit : 0;
  const validAmount = amount >= minimum ? Math.floor(amount / rules.unit) * rules.unit : minimum;
  return { ...rules, validAmount };
}

function isRenewalDiscountSelected() {
  return senioritySelect.value === "current" || senioritySelect.value === "old";
}

function obradouroTypeForTariff(tariffId) {
  return ["baby", "child", "youth"].includes(tariffId) ? "minor" : "adult";
}

function syncRenewalObradouro() {
  const type = obradouroTypeForTariff(tariffSelect.value);
  const requiredAmount = type === "minor" ? 80 : 200;
  const currentAmount = numberValue("obradouro");
  const wasAutoAmount = obradouroInput.dataset.autoValue === "true";

  obradouroInput.step = String(requiredAmount);
  obradouroInput.min = isRenewalDiscountSelected() ? String(requiredAmount) : "0";

  if (!isRenewalDiscountSelected()) {
    if (obradouroInput.dataset.autoValue === "true") {
      obradouroInput.value = 0;
      obradouroInput.dataset.autoValue = "false";
    }
    normalizeObradouroToStep();
    return;
  }

  if (wasAutoAmount || currentAmount === 0 || currentAmount < requiredAmount) {
    obradouroInput.value = requiredAmount;
    obradouroInput.dataset.autoValue = "true";
    return;
  }

  normalizeObradouroToStep();
}

function normalizeObradouroToStep() {
  const rules = obradouroRules();
  const amount = numberValue("obradouro");
  const minimum = isRenewalDiscountSelected() ? rules.unit : 0;

  if (amount < minimum) {
    obradouroInput.value = minimum;
    obradouroInput.dataset.autoValue = String(minimum > 0);
    return;
  }

  const normalized = Math.floor(amount / rules.unit) * rules.unit;
  obradouroInput.value = normalized;
}

function updateCalculation() {
  const zone = selectedZone();
  const tariffId = tariffSelect.value;
  const tariff = tariffs.find((item) => item.id === tariffId);
  const base = zone.prices[tariffId] || 0;
  const friendsBrought = Math.floor(numberValue("friendsBrought"));
  const donation = numberValue("donation");
  const obradouro = numberValue("obradouro");
  const obradouroResult = validObradouroAmount(obradouro);

  const seniorityPercent = seniorityDiscount(tariffId);
  let benefitsPercent = familyDiscount();
  benefitsPercent += document.querySelector("#loyalty").checked ? 5 : 0;
  benefitsPercent += document.querySelector("#attendance").checked ? 5 : 0;
  benefitsPercent += friendsBrought * 5;

  const seniorityDiscountAmount = base * (Math.min(seniorityPercent, 100) / 100);
  const priceAfterSeniority = base - seniorityDiscountAmount;
  const benefitsDiscount = priceAfterSeniority * (Math.min(benefitsPercent, 100) / 100);
  const percentDiscount = seniorityDiscountAmount + benefitsDiscount;
  const obradouroDiscount = obradouroResult.validAmount;
  const donationDiscount = Math.floor(donation / 150) * 100;
  const subscriptionTotal = Math.max(0, Math.floor(base - percentDiscount - obradouroDiscount - donationDiscount));
  const contributionTotal = obradouroResult.validAmount + donation;
  const total = subscriptionTotal + contributionTotal;

  document.querySelector("#totalPrice").textContent = formatEuro(total);
  document.querySelector("#selectedSummary").textContent = `${zone.name} · ${tariff.name} · total con aportaciones`;
  document.querySelector("#basePrice").textContent = formatEuro(base);
  document.querySelector("#percentDiscount").textContent = `-${formatEuro(percentDiscount)} (${seniorityPercent}% + ${benefitsPercent}%)`;
  document.querySelector("#obradouroDiscount").textContent = `-${formatEuro(obradouroDiscount)}`;
  document.querySelector("#donationDiscount").textContent = `-${formatEuro(donationDiscount)}`;
  document.querySelector("#subscriptionTotal").textContent = formatEuro(subscriptionTotal);
  document.querySelector("#contributionTotal").textContent = formatEuro(contributionTotal);
  document.querySelector("#totalBreakdown").textContent = formatEuro(total);

  const notes = [];
  const seniority = senioritySelect.value;
  if (tariffId === "reduced" && (seniority === "current" || seniority === "old")) {
    notes.push("La tarifa reducida no aplica descuento por renovación o antiguo abonado.");
  }
  if (isRenewalDiscountSelected()) {
    notes.push(`La renovación con descuento incluye automáticamente la aportación mínima Obrad'ouro de ${formatEuro(obradouroResult.unit)}.`);
  }
  if (benefitsPercent > 0) {
    notes.push("Los beneficios acumulables se calculan sobre el precio ya rebajado por antigüedad o renovación.");
  }
  if (obradouro > 0) {
    if (obradouroResult.validAmount === obradouro) {
      notes.push(`Obrad'ouro es un préstamo que se devolverá en 2032 y descuenta ahora el 100% de la aportación válida para ${obradouroResult.label}.`);
    } else if (obradouroResult.validAmount > 0) {
      notes.push(`Obrad'ouro es un préstamo que se devolverá en 2032. Para el descuento solo cuenta ${formatEuro(obradouroResult.validAmount)}: mínimo ${formatEuro(obradouroResult.unit)} y múltiplos de ${formatEuro(obradouroResult.unit)} para ${obradouroResult.label}.`);
    } else {
      notes.push(`Obrad'ouro es un préstamo que se devolverá en 2032. No se aplica al descuento porque el mínimo es ${formatEuro(obradouroResult.unit)} para ${obradouroResult.label}.`);
    }
  }
  if (donation > 0) {
    notes.push("La donación descuenta 100 € por cada tramo completo de 150 €, genera 50 € en entradas para la temporada 26-27 y puede tener deducción fiscal legal de entre el 40% y el 80%.");
  }
  if (contributionTotal > 0) {
    notes.push("El total a pagar suma el abono final y las aportaciones introducidas.");
  }
  notes.push("El resultado elimina decimales, como indica la campaña.");
  document.querySelector("#calculationNote").textContent = notes.join(" ");

  const obradouroHelp = document.querySelector("#obradouroHelp");
  obradouroHelp.textContent = `Préstamo a devolver en 2032. ${obradouroResult.label === "menor de edad" ? "Menores" : "General y mayores de 65"}: mínimo ${formatEuro(obradouroResult.unit)} y múltiplos exactos de ${formatEuro(obradouroResult.unit)}. Descuenta el 100% del importe válido.`;
  obradouroHelp.classList.toggle("warning", obradouro > 0 && obradouro !== obradouroResult.validAmount);
}

fillZones();
fillTariffs();
syncRenewalObradouro();
fillTable();
updateCalculation();

zoneSelect.addEventListener("change", () => {
  fillTariffs();
  syncRenewalObradouro();
  updateCalculation();
});

tariffSelect.addEventListener("change", () => {
  syncRenewalObradouro();
  updateCalculation();
});

senioritySelect.addEventListener("change", () => {
  syncRenewalObradouro();
  updateCalculation();
});

obradouroInput.addEventListener("input", () => {
  obradouroInput.dataset.autoValue = "false";
});

obradouroInput.addEventListener("change", () => {
  syncRenewalObradouro();
  updateCalculation();
});

obradouroInput.addEventListener("keydown", (event) => {
  if (!["Tab", "Shift", "ArrowUp", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
  }
});

obradouroInput.addEventListener("paste", (event) => event.preventDefault());
obradouroInput.addEventListener("drop", (event) => event.preventDefault());
obradouroInput.addEventListener("wheel", (event) => event.preventDefault(), { passive: false });

form.addEventListener("input", updateCalculation);
form.addEventListener("change", updateCalculation);

function closeInfoPopovers(exceptId = "") {
  infoButtons.forEach((button) => {
    const popover = document.querySelector(`#${button.dataset.infoTrigger}`);
    const shouldKeepOpen = button.dataset.infoTrigger === exceptId;
    if (!shouldKeepOpen) {
      button.setAttribute("aria-expanded", "false");
      popover?.classList.remove("is-open");
    }
  });
}

infoButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const id = button.dataset.infoTrigger;
    const popover = document.querySelector(`#${id}`);
    const willOpen = button.getAttribute("aria-expanded") !== "true";

    closeInfoPopovers(id);
    button.setAttribute("aria-expanded", String(willOpen));
    popover?.classList.toggle("is-open", willOpen);
  });
});

document.addEventListener("click", () => closeInfoPopovers());
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeInfoPopovers();
});
