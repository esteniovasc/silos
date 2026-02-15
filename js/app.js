import { data } from './data.js';

// Estado: Quais silos estão abertos?
let activeSilos = [];

// ================= INICIALIZAÇÃO =================
const silosContainer = document.getElementById('silos-container');
const listsContainer = document.getElementById('lists-container');
const addBtn = document.querySelector('.add-silo-btn');

// Renderiza as Bolas (Silos)
for (const [key, value] of Object.entries(data)) {
	const silo = document.createElement('div');
	silo.className = 'silo-ball';
	silo.id = `silo-${key}`;
	silo.onclick = () => toggleSilo(key); // Closure works here
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
		// Se já está aberto, fecha
		activeSilos.splice(index, 1);
		siloElement.classList.remove('active');
	} else {
		// Se está fechado, abre
		activeSilos.push(key);
		siloElement.classList.add('active');
	}
	renderLists();
}

function renderLists() {
	listsContainer.innerHTML = '';

	// Percorre a ordem original dos dados para manter a sequência das colunas
	Object.keys(data).forEach(key => {
		if (activeSilos.includes(key)) {
			const info = data[key];
			const col = document.createElement('div');
			col.className = 'list-column';
			col.id = `list-${key}`; // ID para desenhar a linha depois

			let cardsHtml = '';
			info.items.forEach(item => {
				// Using data attributes for event delegation instead of onclick string with complex args
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

	// Após renderizar o HTML, desenha as linhas
	setTimeout(drawLines, 50);
}

// Event Delegation for Lists Container (handling .item-card clicks)
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
	svg.innerHTML = ''; // Limpa linhas antigas

	const root = document.getElementById('root');
	const rootRect = root.getBoundingClientRect();
	const rootX = rootRect.left + rootRect.width / 2;
	const rootY = rootRect.bottom;

	// 1. Linhas da Raiz para os Silos
	for (const key of Object.keys(data)) {
		const silo = document.getElementById(`silo-${key}`);
		if (!silo) continue;
		const siloRect = silo.getBoundingClientRect();
		const siloX = siloRect.left + siloRect.width / 2;
		const siloY = siloRect.top;

		createPath(svg, rootX, rootY, siloX, siloY, '#ccc', 2);

		// 2. Linhas dos Silos para as Listas (se abertas)
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

// Função auxiliar para criar curva Bezier
function createPath(svg, x1, y1, x2, y2, color, width) {
	// Ajuste para coordenadas relativas ao scroll do container
	const container = document.getElementById('canvas');
	const offsetX = container.scrollLeft;
	const offsetY = container.scrollTop;

	const canvasRect = container.getBoundingClientRect();

	const startX = x1 - canvasRect.left + container.scrollLeft;
	const startY = y1 - canvasRect.top + container.scrollTop;
	const endX = x2 - canvasRect.left + container.scrollLeft;
	const endY = y2 - canvasRect.top + container.scrollTop;

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	const midY = (startY + endY) / 2;

	// Curva suave
	const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

	path.setAttribute("d", d);
	path.setAttribute("stroke", color);
	path.setAttribute("stroke-width", width);
	path.setAttribute("fill", "none");
	svg.appendChild(path);
}

// Redesenha linhas se mudar tamanho da tela
window.addEventListener('resize', drawLines);
// Redesenha ao rolar
document.getElementById('canvas').addEventListener('scroll', drawLines);

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

// Expose closeModal for the onclick in HTML (or could attach listener below)
window.closeModal = closeModal;
// Attach close event programmatically to avoid window usage if element exists
const closeBtn = document.querySelector('.close-btn');
if (closeBtn) closeBtn.onclick = closeModal;


// Inicia desenhando as linhas iniciais
setTimeout(drawLines, 100);
