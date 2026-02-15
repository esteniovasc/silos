import { data } from './data.js';

// Estado: Quais silos estão abertos?
let activeSilos = [];

// ================= INICIALIZAÇÃO =================
const silosContainer = document.getElementById('silos-container');
const listsContainer = document.getElementById('lists-container');
const scrollContainer = document.getElementById('scrollable-lists');
const addBtn = document.querySelector('.add-silo-btn');

// Renderiza as Bolas (Silos)
for (const [key, value] of Object.entries(data)) {
	const silo = document.createElement('div');
	silo.className = 'silo-ball';
	silo.id = `silo-${key}`;
	silo.onclick = () => toggleSilo(key);
	silo.innerHTML = `
        <div class="silo-icon">${value.icon}</div>
        <div class="silo-label">${value.label}</div>
    `;
	silosContainer.insertBefore(silo, addBtn);
}

// ================= LÓGICA DE INTERAÇÃO =================

function toggleSilo(key) {
	const index = activeSilos.indexOf(key);
	const siloElement = document.getElementById(`silo-${key}`);

	if (index > -1) {
		activeSilos.splice(index, 1);
		siloElement.classList.remove('active');
	} else {
		activeSilos.push(key);
		siloElement.classList.add('active');
	}
	renderLists();
}

function renderLists() {
	listsContainer.innerHTML = '';

	Object.keys(data).forEach(key => {
		if (activeSilos.includes(key)) {
			const info = data[key];
			const col = document.createElement('div');
			col.className = 'list-column';
			col.id = `list-${key}`;

			let cardsHtml = '';
			info.items.forEach(item => {
				cardsHtml += `
                <div class="item-card" data-title="${item.title}" data-desc="${item.desc}" data-link="${item.link}">
                    <div class="item-title">${item.title}</div>
                    <div class="item-desc">${item.desc}</div>
                </div>
            `;
			});

			col.innerHTML = `
            <div class="list-header">
                <span>${info.label}</span>
                <span>...</span>
            </div>
            ${cardsHtml}
            <button class="btn-add-item" onclick="alert('Abre formulário de cadastro novo item')">+ Novo Item</button>
        `;
			listsContainer.appendChild(col);
		}
	});

	// Força redesenho imediato
	requestAnimationFrame(drawLines);
}

// Event Delegation for Lists Container
listsContainer.addEventListener('click', (e) => {
	const card = e.target.closest('.item-card');
	if (card) {
		const { title, desc, link } = card.dataset;
		openModal(title, desc, link);
	}
});

// ================= DESENHO DAS LINHAS (SVG) =================
function drawLines() {
	const svg = document.getElementById('svg-layer');
	if (!svg) return;
	svg.innerHTML = '';

	const root = document.getElementById('root');
	if (!root) return;

	const rootRect = root.getBoundingClientRect();
	const rootX = rootRect.left + rootRect.width / 2;
	const rootY = rootRect.bottom;

	for (const key of Object.keys(data)) {
		const silo = document.getElementById(`silo-${key}`);
		if (!silo) continue;
		const siloRect = silo.getBoundingClientRect();
		const siloX = siloRect.left + siloRect.width / 2;
		const siloY = siloRect.top;

		createPath(svg, rootX, rootY, siloX, siloY, '#ccc', 2);

		if (activeSilos.includes(key)) {
			const list = document.getElementById(`list-${key}`);
			if (list) {
				const listRect = list.getBoundingClientRect();
				const listX = listRect.left + listRect.width / 2;
				const listY = listRect.top;
				const siloBottom = siloRect.bottom;

				createPath(svg, siloX, siloBottom, listX, listY, 'var(--accent)', 3);
			}
		}
	}
}

function createPath(svg, x1, y1, x2, y2, color, width) {
	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	const midY = (y1 + y2) / 2;
	const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
	path.setAttribute("d", d);
	path.setAttribute("stroke", color);
	path.setAttribute("stroke-width", width);
	path.setAttribute("fill", "none");
	svg.appendChild(path);
}

// ================= LISTENERS PARA GRID/LAYOUT ROBUSTO =================

// Redesenha se redimensionar a janela
window.addEventListener('resize', drawLines);

// Redesenha ao rolar a lista (requestAnimationFrame para performance)
if (scrollContainer) {
	scrollContainer.addEventListener('scroll', () => requestAnimationFrame(drawLines));
}

// Redesenha ao fim de transições CSS (ex: hover, aberturas)
listsContainer.addEventListener('transitionend', drawLines);

// CRÍTICO: Redesenha ao fim da animação de entrada (slideDown)
listsContainer.addEventListener('animationend', drawLines);

// Observer: Detecta se o tamanho do container mudou por qualquer motivo
const resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawLines));
resizeObserver.observe(listsContainer);
resizeObserver.observe(silosContainer);


// ================= MODAL =================
function openModal(title, desc, link) {
	document.getElementById('modal-title').innerText = title;
	document.getElementById('modal-desc').innerText = desc;
	document.getElementById('modal-link').href = link;
	document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
	document.getElementById('modal').style.display = 'none';
}

window.closeModal = closeModal;
const closeBtn = document.querySelector('.close-btn');
if (closeBtn) closeBtn.onclick = closeModal;

// Inicia desenhando
requestAnimationFrame(drawLines);
