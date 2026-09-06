import { CROPS, BUILDINGS, WEAPONS } from "./world.js";
export function setupSettlement(world, { save, onBuild }) {
  const shop = document.getElementById("shop"),
    content = document.getElementById("shop-content");
  let category = "crops";
  function refresh() {
    const s = world.state,
      f = s.family;
    document.getElementById("shop-balance").textContent =
      `${s.coins} farm coins · ${world.population} residents · Threat level ${world.threat}`;
    content.innerHTML = `<h3>Seeds & harvest</h3><div class="shop-grid">${Object.entries(
      CROPS,
    )
      .map(
        ([id, c]) =>
          `<article><h3>${c.name}</h3><p>${s.seeds[id]} seeds · ${s.produce[id]} harvested<br>Yield ${c.yield} · grows in ${Math.ceil(100 / c.growRate)}s</p><button data-buy="${id}">Seed · ${c.seedPrice} coins</button><button data-sell="${id}" ${!s.produce[id] ? "disabled" : ""}>Sell all · ${s.produce[id] * c.salePrice} coins</button></article>`,
      )
      .join(
        "",
      )}</div><button data-feed ${!s.produce.clover ? "disabled" : ""}>Keep clover as animal feed</button><h3>A place to call home</h3><div class="shop-grid">${Object.entries(
      BUILDINGS,
    )
      .map(
        ([id, b]) =>
          `<article><h3>${b.name}</h3><p>${id === "house" ? "A small home. Adds 3 residents and a helpful neighbor." : id === "barn" ? "Shelter for your herd. Cows recover faster nearby." : "A defensive barrier. Enemies must break through it."}</p><button data-build="${id}">Place · ${b.price} coins</button></article>`,
      )
      .join(
        "",
      )}</div><h3>Household stories</h3><p>${f.partner ? `Companion: ${f.partner === "robot" ? "Ari-7" : "Lena"} · Bond ${f.bond}/100` : "Build a small cottage, then invite an adult companion to share life in the valley."}</p>${!f.partner ? '<button data-partner="human">Invite Lena · free</button><button data-partner="robot">Build Ari-7 · 100 coins</button>' : `<button data-bond>Share a meal · 2 feed</button><button data-family ${f.bond < 100 || world.level < 3 || f.child || f.arrival !== null ? "disabled" : ""}>Start a family · 80 coins</button><p>${f.child ? `A ${f.child === "hybrid" ? "human–robot" : "human"} child has joined your household.` : f.arrival !== null ? `A new family member arrives in ${Math.ceil(f.arrival)}s.` : "Reach level 3 and bond 100. Both companions agree before this chapter begins. A robot partnership opens a fictional hybrid family story."}</p>`}`;
  }
  const rawRefresh = refresh;
  refresh = () => {
    rawRefresh();
    let html = content.innerHTML;
    html = html
      .replace(
        "<h3>Seeds &amp; harvest</h3>",
        '<section data-category="crops"><h3>Seeds &amp; harvest</h3>',
      )
      .replace(
        "<h3>A place to call home</h3>",
        '</section><section data-category="buildings"><h3>A place to call home</h3>',
      )
      .replace(
        "<h3>Household stories</h3>",
        '</section><section data-category="household"><h3>Household stories</h3>',
      );
    html +=
      '</section><section data-category="weapons"><h3>Protect the valley</h3><p>Equip a weapon, approach wolves and press F or Attack. No animals in your herd are targeted.</p><div class="shop-grid">' +
      Object.entries(WEAPONS)
        .map(
          ([id, w]) =>
            `<article><h3>${w.name}</h3><p>Range ${w.range} · strength ${w.power}</p><button data-equip="${id}">${world.state.weapon === id ? "Equipped" : world.state.weapons.includes(id) ? "Equip" : `${w.price} coins`}</button></article>`,
        )
        .join("") +
      "</div></section>";
    content.innerHTML =
      '<div class="store-tabs" aria-label="Store categories">' +
      [
        ["crops", "Seeds & produce"],
        ["buildings", "Homes & defenses"],
        ["weapons", "Weapons"],
        ["household", "Household"],
      ]
        .map(
          ([id, label]) =>
            `<button data-category-tab="${id}" aria-pressed="${category === id}">${label}</button>`,
        )
        .join("") +
      "</div>" +
      html;
    content
      .querySelectorAll("section[data-category]")
      .forEach((el) => (el.hidden = el.dataset.category !== category));
  };
  document.getElementById("shop-open").onclick = () => {
    refresh();
    shop.showModal();
  };
  content.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.buy) world.buySeed(b.dataset.buy);
    if (b.dataset.sell) world.sellProduce(b.dataset.sell);
    if (b.hasAttribute("data-feed")) world.makeFeed();
    if (b.dataset.build) {
      const item = BUILDINGS[b.dataset.build];
      if (!world.canAfford(item.price, item.name)) return;
      shop.close();
      onBuild(b.dataset.build);
      world.notify("Click open ground to place your building. Escape cancels.");
      return;
    }
    if (b.dataset.partner) world.invitePartner(b.dataset.partner);
    if (b.hasAttribute("data-bond")) world.bond();
    if (b.hasAttribute("data-family")) world.startFamily();
    save();
    refresh();
  };
  const actions = content.onclick;
  content.onclick = (e) => {
    const b = e.target.closest("button");
    if (b?.dataset.categoryTab) {
      category = b.dataset.categoryTab;
      refresh();
      return;
    }
    if (b?.dataset.equip) {
      world.equip(b.dataset.equip);
      save();
      refresh();
      return;
    }
    actions(e);
  };
  const storeActions = content.onclick;
  const feedback = document.createElement('p');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.className = 'store-feedback';
  content.before(feedback);
  content.onclick = e => {
    const previous = world.state.notices[0];
    storeActions(e);
    const notice = world.state.notices[0];
    if (notice && notice !== previous) feedback.textContent = notice.text;
  };
  return { refresh };
}
