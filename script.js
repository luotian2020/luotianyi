const datasets = [
  { filename: "data1.js", name: "洛天依cosplay服装参考", varName: "jsonData1" },
  { filename: "data2.js", name: "嘉宾信息 B", varName: "jsonData2" }
];

let currentData = null;
let typeMap = {};
let textKeys = [];

window.onload = () => {
  buildSidebar();
  loadDataset(datasets[0].filename);
};

function buildSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = "";
  datasets.forEach((ds, i) => {
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.textContent = ds.name;
    tab.dataset.filename = ds.filename;
    tab.onclick = () => {
      setActiveTab(i);
      loadDataset(ds.filename);
    };
    sidebar.appendChild(tab);
  });
  setActiveTab(0);
}

function setActiveTab(index) {
  const sidebar = document.getElementById("sidebar");
  const tabs = sidebar.querySelectorAll(".tab");
  tabs.forEach((tab, i) => {
    tab.classList.toggle("active", i === index);
  });
}

function loadDataset(filename) {
  const oldScript = document.getElementById("data-script");
  if (oldScript) oldScript.remove();

  currentData = null;
  typeMap = {};
  textKeys = [];
  clearUI();

  const script = document.createElement("script");
  script.src = filename;
  script.id = "data-script";
  script.onload = () => {
    const ds = datasets.find(d => d.filename === filename);
    currentData = window[ds.varName];
    if (!currentData) {
      alert("数据加载失败: " + ds.name);
      return;
    }
    setupData(currentData);
  };
  document.body.appendChild(script);
}

function clearUI() {
  document.getElementById("title").textContent = "";
  document.getElementById("description").textContent = "";
  document.getElementById("search-area").innerHTML = "";
  document.getElementById("results").innerHTML = "";
}

function setupData(data) {
  if (data.typeMap) {
    typeMap = {};
    for (const key in data.typeMap) {
      const info = data.typeMap[key];
      typeMap[key] = {
        type: info.type,
        label: info.label || key
      };
    }
  } else if (data.list.length > 0) {
    const inferred = inferFieldTypes(data.list[0]);
    typeMap = {};
    for (const k in inferred) {
      typeMap[k] = { type: inferred[k], label: k };
    }
  }

  textKeys = Object.keys(typeMap).filter(k => typeMap[k].type === "text");

  document.getElementById("title").textContent = data.struct?.title || "数据展示";
  document.getElementById("description").textContent = data.struct?.description || "";

  createSearchInputs();
  renderList(data.list.slice(0, 10));
}

function inferFieldTypes(item) {
  const types = {};
  for (const key in item) {
    const value = item[key];
    if (typeof value === "string") {
      if (value.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
        types[key] = "image";
      } else if (value.match(/^https?:\/\//i)) {
        types[key] = "url";
      } else {
        types[key] = "text";
      }
    } else {
      types[key] = "text";
    }
  }
  return types;
}

function createSearchInputs() {
  const container = document.getElementById("search-area");
  container.innerHTML = "";
  textKeys.forEach(key => {
    const label = typeMap[key].label;

    const div = document.createElement("div");

    const span = document.createElement("span");
    span.textContent = label + ": ";
    div.appendChild(span);

    const input = document.createElement("input");
    input.type = "text";
    input.id = "search-" + key;
    input.placeholder = "请输入" + label;
    div.appendChild(input);

    container.appendChild(div);
  });
}

function doSearch() {
  const filters = {};
  textKeys.forEach(key => {
    const val = document.getElementById("search-" + key).value.trim().toLowerCase();
    if (val) {
      filters[key] = val;
    }
  });

  const filtered = currentData.list.filter(item => {
    return Object.entries(filters).every(([key, val]) => {
      return typeof item[key] === "string" && item[key].toLowerCase().includes(val);
    });
  });

  renderList(filtered);
}

function renderList(list) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>未找到匹配项</p>";
    return;
  }

  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

    Object.keys(typeMap).forEach(key => {
      const { type, label } = typeMap[key];
      const value = item[key];
      if (!value) return;

      if (type === "text") {
        const p = document.createElement("p");
        p.textContent = `${label}: ${value}`;
        div.appendChild(p);
      } else if (type === "url") {
        const a = document.createElement("a");
        a.href = value;
        a.target = "_blank";
        a.className = "url";
        a.textContent = `${label}: ${value}`;
        div.appendChild(a);
      } else if (type === "image") {
        const img = document.createElement("img");
        img.src = value;
        img.alt = label;
        img.className = "image";
        div.appendChild(img);
      }
    });

    container.appendChild(div);
  });
}
