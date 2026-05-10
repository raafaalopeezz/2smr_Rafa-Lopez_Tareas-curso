
    // ======= Persistencia =======
    const LS_KEY = "tareasHogar_v1";
    // Estructura:
    // state = {
    //   opcionesTareas: string[],
    //   porMiembro: {
    //     "Ana": [{ id, texto, hecha }, ...],
    //     ...
    //   }
    // }

    const defaultState = () => ({
      opcionesTareas: [
        "Hacer la cama",
        "Poner lavadora",
        "Sacar la basura",
        "Poner/recoger mesa"
      ],
      porMiembro: {}
    });

    function loadState() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return defaultState();
        const parsed = JSON.parse(raw);
        // “parche” por si faltan claves
        return {
          opcionesTareas: Array.isArray(parsed.opcionesTareas) ? parsed.opcionesTareas : defaultState().opcionesTareas,
          porMiembro: parsed.porMiembro && typeof parsed.porMiembro === "object" ? parsed.porMiembro : {}
        };
      } catch {
        return defaultState();
      }
    }

    function saveState() {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    }

    let state = loadState();

    // ======= DOM refs =======
    const form = document.querySelector("#formTareas");
    const selMiembro = document.querySelector("#miembro");
    const selTarea = document.querySelector("#tareaSelect");
    const inpNueva = document.querySelector("#tareaNueva");
    const contFamilia = document.querySelector("#contenedorFamilia");

    // Mapa: miembro -> { ul, card }
    const uiPorMiembro = new Map();

    function normaliza(txt) {
      return txt.trim().replace(/\s+/g, " ");
    }

    function getTareaElegida() {
      const escrita = normaliza(inpNueva.value);
      if (escrita) return escrita;
      const seleccionada = selTarea.value;
      return seleccionada ? normaliza(seleccionada) : "";
    }

    // ======= Render select opciones =======
    function renderOpcionesSelect() {
      const keepFirst = selTarea.querySelector("option[value='']");
      selTarea.innerHTML = "";
      // opción placeholder
      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.disabled = true;
      opt0.selected = true;
      opt0.textContent = "Elige…";
      selTarea.appendChild(opt0);

      state.opcionesTareas
        .map(normaliza)
        .filter(Boolean)
        .sort((a,b) => a.localeCompare(b, "es"))
        .forEach(t => {
          const opt = document.createElement("option");
          opt.value = t;
          opt.textContent = t;
          selTarea.appendChild(opt);
        });
    }

    function aseguraOpcionTarea(tarea) {
      tarea = normaliza(tarea);
      const existe = state.opcionesTareas.some(t => normaliza(t) === tarea);
      if (!existe) {
        state.opcionesTareas.push(tarea);
        saveState();
        renderOpcionesSelect();
      }
    }

    // ======= UI por miembro =======
    function aseguraPanelMiembro(nombre) {
      if (uiPorMiembro.has(nombre)) return uiPorMiembro.get(nombre);

      const card = document.createElement("article");
      card.className = "miembro";
      card.dataset.miembro = nombre;


      const div_avatar = document.createElement("div");
      div_avatar.className = "contenedor_avatar";

      const h3 = document.createElement("h3");
      h3.textContent = nombre;
      h3.className = nombre;

      const avatar = document.createElement("img");
      avatar.src = "./img/"+nombre+".jpg";
      avatar.className = "avatar";

      const ul = document.createElement("ul");
      ul.setAttribute("role", "list");

      div_avatar.append(avatar, h3);
      card.append(div_avatar, ul);
      contFamilia.appendChild(card);

      const obj = { card, ul };
      uiPorMiembro.set(nombre, obj);
      return obj;
    }

    // ======= Crear <li> =======
    function creaItemTarea(miembro, tareaObj) {
      const li = document.createElement("li");
      li.dataset.id = tareaObj.id;
      if (tareaObj.hecha) li.classList.add("hecha");

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = !!tareaObj.hecha;
      chk.title = "Marcar hecha";

      const span = document.createElement("span");
      span.className = "txt";
      span.textContent = tareaObj.texto;

      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn-del";
      btnDel.textContent = "✕";
      btnDel.title = "Eliminar";

      // Marcar hecha (checkbox)
      chk.addEventListener("change", () => {
        toggleHecha(miembro, tareaObj.id, chk.checked);
      });

      // Click en texto también alterna
      span.addEventListener("click", () => {
        chk.checked = !chk.checked;
        toggleHecha(miembro, tareaObj.id, chk.checked);
      });

      // Eliminar
      btnDel.addEventListener("click", () => {
        eliminarTarea(miembro, tareaObj.id);
      });

      li.append(chk, span, btnDel);
      return li;
    }

    // ======= Mutaciones de estado =======
    function addTarea(miembro, texto) {
      texto = normaliza(texto);
      if (!texto) return;

      if (!state.porMiembro[miembro]) state.porMiembro[miembro] = [];

      // evitar duplicado por texto en ese miembro
      const ya = state.porMiembro[miembro].some(t => normaliza(t.texto) === texto);
      if (ya) {
        alert("Esa tarea ya está añadida para " + miembro + ".");
        return;
      }

      const tareaObj = { id: crypto.randomUUID(), texto, hecha: false };
      state.porMiembro[miembro].push(tareaObj);
      saveState();

      // UI
      const { ul } = aseguraPanelMiembro(miembro);
      ul.appendChild(creaItemTarea(miembro, tareaObj));
    }

    function toggleHecha(miembro, id, hecha) {
      const arr = state.porMiembro[miembro] || [];
      const t = arr.find(x => x.id === id);
      if (!t) return;
      t.hecha = !!hecha;
      saveState();

      // actualizar UI
      const { ul } = aseguraPanelMiembro(miembro);
      const li = ul.querySelector(`li[data-id="${CSS.escape(id)}"]`);
      if (li) li.classList.toggle("hecha", t.hecha);
    }

    function eliminarTarea(miembro, id) {
      const arr = state.porMiembro[miembro] || [];
      const idx = arr.findIndex(x => x.id === id);
      if (idx === -1) return;

      arr.splice(idx, 1);
      // si se queda vacío, puedes optar por borrar el miembro del state
      if (arr.length === 0) delete state.porMiembro[miembro];

      saveState();

      // UI
      const ui = uiPorMiembro.get(miembro);
      if (!ui) return;

      const li = ui.ul.querySelector(`li[data-id="${CSS.escape(id)}"]`);
      if (li) li.remove();

      // si el panel se queda sin tareas, lo quitamos
      if (ui.ul.children.length === 0) {
        ui.card.remove();
        uiPorMiembro.delete(miembro);
      }
    }

    // ======= Render inicial desde localStorage =======
    function renderInicial() {
      renderOpcionesSelect();

      // Orden al renderizar los miembros (alfabético)
      const miembros = Object.keys(state.porMiembro).sort((a,b) => a.localeCompare(b, "es"));

      miembros.forEach(miembro => {
        const { ul } = aseguraPanelMiembro(miembro);
        state.porMiembro[miembro].forEach(tareaObj => {
          ul.appendChild(creaItemTarea(miembro, tareaObj));
        });
      });
    }

    // ======= Submit =======
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const miembro = selMiembro.value;
      const tarea = getTareaElegida();

      if (!miembro) return alert("Selecciona un miembro.");
      if (!tarea) return alert("Selecciona una tarea o escribe una nueva.");

      // si venía escrita, la guardamos como opción
      aseguraOpcionTarea(tarea);

      addTarea(miembro, tarea);

      // limpiar
      inpNueva.value = "";
      selTarea.selectedIndex = 0;
    });

    // Arranque
    renderInicial();
