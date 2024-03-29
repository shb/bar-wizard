const canvas = Snap.select("#canvas");

/**
 * Cocktail diagram object
 *
 * Represents the visible diagram.
 */
const diagram = {
  glass: null,
  details: null,
  mixers: null,

  loadGlass(url) {
    this.glass = null;
    canvas.children().forEach((child) => child.remove());
    Snap.load(url, svg => {
      const glass = svg.select("svg");
      canvas.append(glass);
      this.glass = glass;
      this.mixers = diagram.glass.select("#mixers");
      this.details = diagram.glass.select("#details");
      this.updateMixers(recipe.mixers);
    });
  },

  updateMixers(mixlist) {
    this.mixers.clear();

    const { x, y, w, h } = this.glass.select("#inner").getBBox();

    let tv = 0;
    mixlist.forEach((mix, i) => {
      const mv = h * 0.9 * mix.vol;
      tv += mv;
      this.mixers.rect(x, y + h - tv, w, mv).attr({
        ["data-mixer"]: i,
        fill: mix.fill,
        fillOpacity: 1,
      });
    });
  },

  addGarnish (url) {
    Snap.load(url, svg => {
      const garnish = svg.select("svg");
      this.details.append(garnish)
    })
  }
};

/**
 * Recipe
 *
 * Represents the recipe concocted by the user.
 */
const recipe = {
  _mixers: [],
  _tot: 0,

  get mixers() {
    return this._mixers.map((mix) => ({
      ...mix,
      vol: mix.qty / this._tot,
    }));
  },

  addMixer(def) {
    this._mixers.push(def);
    this._tot += Number(def.qty ?? 1);

    this.selectMixer(this._mixers.length - 1);

    diagram.updateMixers(this.mixers);
  },

  selectMixer(i) {
    state.mixer = i;
    const mixer = recipe.mixers[state.mixer];

    Object.entries(mixer).forEach(([name, value]) => {
      const input = document.forms["recipe"].elements[name];
      if (input) input.value = value;
    });
  },

  editMixer(i, update) {
    this._tot -= Number(this._mixers[i].qty);
    Object.assign(this._mixers[i], update);
    this._tot += Number(this._mixers[i].qty);

    diagram.updateMixers(this.mixers);
  },

  removeMixer(i) {
    this._tot -= this.mixers[i];
    this._mixers.splice(i);

    diagram.updateMixers(this.mixers);
  },
};

const state = {
  pouring: false,
  mixer: null,
  step: null,
};

canvas.node.addEventListener("click", (e) => {
  state.mixer = e.target.dataset["mixer"];
  if (!state.mixer) return;

  e.stopPropagation();

  recipe.selectMixer(state.mixer);
});

document.forms["recipe"].addEventListener("change", (e) => {
  recipe.editMixer(state.mixer, { [e.target.name]: e.target.value });
});

pages.addEventListener("dragenter", onDrag);
pages.addEventListener("dragover", onDrag);
pages.addEventListener("drop", onDrop);

document.querySelectorAll(".page").forEach((page, i) => {
  page.addEventListener("click", () => {
    selectPage(i);
  });
});

diagram.loadGlass("glasses/tumbler.svg");
selectPage(2);

function onDrag(e) {
  switch (state.step) {
    case "details":
    case "mixers":
      if (!diagram.glass) return;
      e.dataTransfer.dropEffect = "copy";
      break;
    case "glasses":
      e.dataTransfer.dropEffect = "move";
      break;
    default:
      return;
  }
  e.preventDefault();
}

function onDrop(e) {
  switch (state.step) {
    case "details":
      if (!diagram.glass) return;
      diagram.addGarnish(e.dataTransfer.getData("url"));
      break;
    case "mixers":
      if (!diagram.glass) return;
      addMixer(e.dataTransfer.getData("url"));
      break;
    case "glasses":
      diagram.loadGlass(e.dataTransfer.getData("url"));
      break;
    default:
      return;
  }
  e.preventDefault();
}

function addMixer(url) {
  if (state.pouring) return;
  if (!diagram.glass) return;

  Snap.load(url, (svg) => {
    let fill = "#888888";
    let name = "Mixer";

    const inner = svg.select("#inner");
    if (inner) {
      fill =
        inner.node.style["fill"] || inner.node.getAttribute("fill") || fill;
      name = svg.select("svg > title").node.innerHTML || name;
    }

    // Normalize color to HEX representation
    fill = Snap.color(fill).hex;

    recipe.addMixer({
      name,
      fill,
      qty: 1,
    });
  });
}

function selectPage(activeIndex) {
  pages.querySelectorAll(".page").forEach((page, i) => {
    const ri = i - activeIndex;
    const ni = -Math.abs(ri);

    const plusMinursOne = Math.random() * 2 - 1;

    const left = ri * 12 + "mm";
    const top = plusMinursOne + "mm";
    const transform = `rotateZ(${plusMinursOne}deg) translateZ(${ni}mm)`;

    Object.assign(page.style, { left, top, transform });

    page.classList.remove("active", "left", "right");
    if (ri === 0) {
      page.classList.add("active");
      page.appendChild(canvas.node);
      selectStep(page.dataset["step"]);
    } else {
      page.classList.add(ri < 0 ? "left" : "right");
    }
  });
}

function selectStep(step) {
  state.step = step;
  document.querySelectorAll("body > aside > *").forEach((toolbar) => {
    const steps = toolbar.dataset["step"]?.split(",") ?? [];
    toolbar.style.display = steps.includes(step) ? "block" : "none";
  });
}
