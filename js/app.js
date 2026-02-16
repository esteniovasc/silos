// ================= ESTADO E DADOS =================
let activeSilos = [];
let appData = [];

// Dados Padrão (Caso não tenha nada salvo)
const defaultData = [
	{
		id: 'projetos', label: 'Projetos', icon: '🎭', type: 'project',
		items: [
			{ title: "Dramas de Caridade", desc: "Resgate histórico e vídeos.", link: "#" },
			{ title: "Museu Vivo", desc: "Rodas de conversa mensais.", link: "#" },
			{ title: "Revista 150 Anos", desc: "Diagramação finalizada.", link: "#" }
		]
	},
	{
		id: 'ativos', label: 'Ativos', icon: '📂', type: 'default',
		items: [
			{ title: "Logo & Identidade", desc: "Vetores e Manual de Marca.", link: "#" },
			{ title: "Fotos Eventos 2025", desc: "Pasta Drive organizada.", link: "#" }
		]
	},
	{
		id: 'pessoas', label: 'Pessoas', icon: '👥', type: 'person',
		items: [
			{ title: "Nágela Lopes", desc: "Currículo e Docs Pessoais.", link: "#" },
			{ title: "Voluntários", desc: "Escala e Onboarding.", link: "#" }
		]
	},
	{
		id: 'admin', label: 'Admin', icon: '🔐', type: 'default',
		items: [
			{ title: "Senhas Mestre", desc: "Acesso restrito.", link: "#" },
			{ title: "Financeiro", desc: "Planilhas de custos.", link: "#" }
		]
	}
];

// Carregar Dados
const savedData = localStorage.getItem('silos-app-data');
if (savedData) {
	appData = JSON.parse(savedData);
} else {
	appData = defaultData;
	saveData(); // Salva o padrão inicial
}

function saveData() {
	localStorage.setItem('silos-app-data', JSON.stringify(appData));
}

// ================= INICIALIZAÇÃO =================
const silosContainer = document.getElementById('silos-container');
const listsContainer = document.getElementById('lists-container');
const scrollContainer = document.getElementById('scrollable-lists');
const addBtn = document.querySelector('.add-silo-btn');

// Renderiza as Bolas (Silos)
function renderSilos() {
	// Limpa atuais (preservando botão + se quiser, ou recria tudo)
	// Vamos manter o botão + no final
	silosContainer.innerHTML = '';

	appData.forEach(siloData => {
		const silo = document.createElement('div');
		silo.className = 'silo-ball';
		silo.id = `silo-${siloData.id}`;
		// Se já estava ativo antes do render, mantem active?
		if (activeSilos.includes(siloData.id)) silo.classList.add('active');

		silo.onclick = () => toggleSilo(siloData.id);
		silo.innerHTML = `
            <div class="silo-icon">${siloData.icon}</div>
            <div class="silo-label">${siloData.label}</div>
        `;
		silosContainer.appendChild(silo);
	});
	silosContainer.appendChild(addBtn);
}
renderSilos();

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

	appData.forEach(siloData => {
		if (activeSilos.includes(siloData.id)) {
			const col = document.createElement('div');
			col.className = `list-column list-type-${siloData.type || 'default'}`; // Classe tipada
			col.id = `list-${siloData.id}`;

			let cardsHtml = '';
			siloData.items.forEach((item, index) => {
				cardsHtml += `
                <div class="item-card" data-silo-id="${siloData.id}" data-item-index="${index}">
                    <div class="item-title">${item.title}</div>
                    <div class="item-desc">${item.desc}</div>
                </div>
            `;
			});

			col.innerHTML = `
            <div class="list-header">
                <span>${siloData.label}</span>
                <span class="edit-silo-btn" data-id="${siloData.id}" style="cursor:pointer; opacity:0.5" title="Editar Silo">✏️</span>
            </div>
            ${cardsHtml}
            <button class="btn-add-item" onclick="openItemForm('${siloData.id}')">+ Novo Item</button>
        `;
			listsContainer.appendChild(col);
		}
	});

	// Força redesenho imediato
	requestAnimationFrame(drawLines);
	updateToggleAllBtn();
}

// Event Delegation for Lists Container (Items and Edit Button)
listsContainer.addEventListener('click', (e) => {
	// 1. Clique no card (Detalhes)
	const card = e.target.closest('.item-card');
	if (card) {
		const { siloId, itemIndex } = card.dataset;
		openModal(siloId, parseInt(itemIndex)); // Passa IDs para busca in-loco
		return;
	}

	// 2. Clique no botão de editar silo
	const editBtn = e.target.closest('.edit-silo-btn');
	if (editBtn) {
		openSiloModal(editBtn.dataset.id);
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

	// 1. Linhas da Raiz para os Silos
	appData.forEach(siloData => {
		const key = siloData.id;
		const silo = document.getElementById(`silo-${key}`);
		if (!silo) return; // continue
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
	});
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

// Redesenha ao rolar os silos (Novo)
if (silosContainer) {
	silosContainer.addEventListener('scroll', () => requestAnimationFrame(drawLines));
}

// Redesenha ao fim de transições CSS (ex: hover, aberturas)
listsContainer.addEventListener('transitionend', drawLines);

// CRÍTICO: Redesenha ao fim da animação de entrada (slideDown)
listsContainer.addEventListener('animationend', drawLines);

// Observer: Detecta se o tamanho do container mudou por qualquer motivo
const resizeObserver = new ResizeObserver(() => requestAnimationFrame(drawLines));
resizeObserver.observe(listsContainer);
resizeObserver.observe(silosContainer);


// ================= CRUD SILOS =================

let currentEditingSiloId = null;

// Abrir Modal (Criar ou Editar)
function openSiloModal(siloId = null) {
	currentEditingSiloId = siloId;
	const modal = document.getElementById('silo-modal');
	const title = document.getElementById('silo-modal-title');
	const nameInput = document.getElementById('silo-name');
	const iconInput = document.getElementById('silo-icon');
	const typeInput = document.getElementById('silo-type');
	const btnDelete = document.getElementById('btn-delete-silo');

	if (siloId) {
		// Modo Edição
		const silo = appData.find(s => s.id === siloId);
		if (!silo) return;

		title.innerText = 'Editar Silo';
		nameInput.value = silo.label;
		iconInput.value = silo.icon;
		typeInput.value = silo.type || 'default';
		btnDelete.style.display = 'block';
		btnDelete.onclick = () => deleteSilo(siloId);
	} else {
		// Modo Criação
		title.innerText = 'Novo Silo';
		nameInput.value = '';
		iconInput.value = '📁';
		typeInput.value = 'default';
		btnDelete.style.display = 'none';
	}

	modal.style.display = 'flex';
}

function closeSiloModal() {
	document.getElementById('silo-modal').style.display = 'none';
	currentEditingSiloId = null;
}

// Botões do Modal
window.closeSiloModal = closeSiloModal; // Expor para o HTML
document.getElementById('btn-save-silo').addEventListener('click', saveSilo);
addBtn.addEventListener('click', () => openSiloModal(null)); // Conectar botão +

function saveSilo() {
	const name = document.getElementById('silo-name').value;
	const icon = document.getElementById('silo-icon').value;
	const type = document.getElementById('silo-type').value;

	if (!name) return alert('Nome é obrigatório');

	if (currentEditingSiloId) {
		// Editar
		const silo = appData.find(s => s.id === currentEditingSiloId);
		if (silo) {
			silo.label = name;
			silo.icon = icon;
			silo.type = type;
		}
	} else {
		// Criar
		const newId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
		appData.push({
			id: newId,
			label: name,
			icon: icon,
			type: type,
			items: []
		});
	}

	saveData();
	renderSilos();
	renderLists(); // Atualiza cabeçalhos se algo mudou
	closeSiloModal();
}

// ================= DELETE SAFEGUARD =================
let siloToDeleteId = null;

function deleteSilo(id) {
	const silo = appData.find(s => s.id === id);
	if (!silo) return;

	// Se estiver vazio, deleta direto (ou com confirm simples)
	if (silo.items.length === 0) {
		if (confirm(`Excluir o silo "${silo.label}"?`)) {
			executeDelete(id);
		}
		return;
	}

	// Se tiver itens, abre modal de segurança
	siloToDeleteId = id;
	const modal = document.getElementById('delete-modal');
	const msg = document.getElementById('delete-msg');
	const preview = document.getElementById('delete-items-preview');

	msg.innerHTML = `O silo <strong>"${silo.label}"</strong> possui <strong>${silo.items.length} itens</strong>:`;

	// Lista os itens
	preview.innerHTML = silo.items.map(item => `• ${item.title}`).join('<br>');

	modal.style.display = 'flex';
	// Fecha o modal de edição (que está por baixo)
	document.getElementById('silo-modal').style.display = 'none';
}

function closeDeleteModal() {
	document.getElementById('delete-modal').style.display = 'none';
	siloToDeleteId = null;
	// Reabre o modal de edição caso cancelou? Ou fecha tudo? 
	// Melhor fechar tudo ou deixar o usuário decidir. Vamos deixar fechado.
}

document.getElementById('btn-confirm-delete').onclick = () => {
	if (siloToDeleteId) executeDelete(siloToDeleteId);
};

function executeDelete(id) {
	appData = appData.filter(s => s.id !== id);
	activeSilos = activeSilos.filter(sid => sid !== id);

	saveData();
	renderSilos();
	renderLists();

	closeDeleteModal();
	closeSiloModal(); // Garante que o de edição feche também
}

window.closeDeleteModal = closeDeleteModal;

// ================= CRUD ITENS =================
let currentItemSiloId = null;
let currentItemIndex = null;

function openItemForm(siloId, itemIndex = null) {
	currentItemSiloId = siloId;
	currentItemIndex = itemIndex;

	const modal = document.getElementById('item-form-modal');
	const titleHeader = document.getElementById('item-form-title');
	const titleInput = document.getElementById('item-title-input');
	const descInput = document.getElementById('item-desc-input');
	const linkInput = document.getElementById('item-link-input');
	const btnDelete = document.getElementById('btn-delete-item');

	if (itemIndex !== null) {
		// Editar
		const silo = appData.find(s => s.id === siloId);
		const item = silo.items[itemIndex];

		titleHeader.innerText = 'Editar Item';
		titleInput.value = item.title;
		descInput.value = item.desc;
		linkInput.value = item.link || '';

		btnDelete.style.display = 'block';
		btnDelete.onclick = () => deleteItem(siloId, itemIndex);
	} else {
		// Novo
		titleHeader.innerText = 'Novo Item';
		titleInput.value = '';
		descInput.value = '';
		linkInput.value = '';
		btnDelete.style.display = 'none';
	}

	modal.style.display = 'flex';
}

function closeItemForm() {
	document.getElementById('item-form-modal').style.display = 'none';
	currentItemSiloId = null;
	currentItemIndex = null;
}

function saveItem() {
	const title = document.getElementById('item-title-input').value;
	const desc = document.getElementById('item-desc-input').value;
	const link = document.getElementById('item-link-input').value;

	if (!title) return alert('Título é obrigatório');

	const silo = appData.find(s => s.id === currentItemSiloId);
	if (!silo) return;

	if (currentItemIndex !== null) {
		// Atualizar
		silo.items[currentItemIndex] = { title, desc, link };
	} else {
		// Criar
		silo.items.push({ title, desc, link });
	}

	saveData();
	renderLists();
	closeItemForm();
	closeModal(); // Fecha modal de detalhes se estiver aberto
}

function deleteItem(siloId, index) {
	if (!confirm('Excluir este item?')) return;

	const silo = appData.find(s => s.id === siloId);
	if (silo) {
		silo.items.splice(index, 1);
		saveData();
		renderLists();
		closeItemForm();
		closeModal();
	}
}

// Botões do Modal de Item
document.getElementById('btn-save-item').addEventListener('click', saveItem);
window.closeItemForm = closeItemForm;
window.openItemForm = openItemForm;

// ================= MODAL DE DETALHES (LEITURA) =================

function openModal(siloId, itemIndex) {
	const silo = appData.find(s => s.id === siloId);
	if (!silo || !silo.items[itemIndex]) return;

	const item = silo.items[itemIndex];

	document.getElementById('modal-title').innerText = item.title;
	document.getElementById('modal-desc').innerText = item.desc;
	document.getElementById('modal-link').href = item.link || '#';

	// Botão Editar no Modal de Detalhes
	const btnEdit = document.getElementById('btn-edit-item-details');
	btnEdit.onclick = () => {
		closeModal();
		openItemForm(siloId, itemIndex);
	};

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

// Expor funções globais necessárias para os onlick do HTML (módulos e escopo)
window.openModal = openModal;
window.closeModal = closeModal;
window.openSiloModal = openSiloModal;
window.closeSiloModal = closeSiloModal;

// ================= CUSTOMIZAÇÃO DA LOGO =================
const rootNode = document.getElementById('root');
const logoImg = document.getElementById('logo-img');
const logoInput = document.getElementById('logo-input');

// 1. Carregar logo salva (Já tratado no HTML para evitar flash)
// const savedLogo = localStorage.getItem('silos-custom-logo');
// if (savedLogo) {
// 	logoImg.src = savedLogo;
// }

// 2. Clique para alterar
rootNode.addEventListener('click', () => logoInput.click());

// 3. Ao selecionar arquivo
logoInput.addEventListener('change', (e) => {
	const file = e.target.files[0];
	handleLogoFile(file);
});

// 4. Drag & Drop
rootNode.addEventListener('dragover', (e) => {
	e.preventDefault();
	rootNode.style.borderColor = 'var(--accent)';
});

rootNode.addEventListener('dragleave', (e) => {
	e.preventDefault();
	rootNode.style.borderColor = 'var(--primary)';
});

rootNode.addEventListener('drop', (e) => {
	e.preventDefault();
	rootNode.style.borderColor = 'var(--primary)';

	if (e.dataTransfer.files && e.dataTransfer.files[0]) {
		handleLogoFile(e.dataTransfer.files[0]);
	}
});

function handleLogoFile(file) {
	if (!file || !file.type.startsWith('image/')) return;

	const reader = new FileReader();
	reader.onload = (e) => {
		const base64 = e.target.result;
		logoImg.src = base64;
		localStorage.setItem('silos-custom-logo', base64);

		// Efeito visual de confirmação
		rootNode.style.transform = 'scale(0.9)';
		setTimeout(() => rootNode.style.transform = 'scale(1)', 150);
	};
	reader.readAsDataURL(file);
}

// ================= NOME DO PROJETO =================
const projectTitle = document.getElementById('project-title');
const defaultTitle = "Meu Projeto Silos";

// 1. Carregar Nome Salvo
const savedProjectName = localStorage.getItem('silos-project-name');
if (savedProjectName) {
	projectTitle.innerText = savedProjectName;
	document.title = `${savedProjectName} | SilosApp`;
} else {
	projectTitle.innerText = defaultTitle;
	document.title = `${defaultTitle} | SilosApp`;
}

// 2. Salvar ao perder foco ou dar Enter
function saveProjectName() {
	const newName = projectTitle.innerText.trim() || defaultTitle;
	projectTitle.innerText = newName; // Remove quebras de linha extras
	localStorage.setItem('silos-project-name', newName);
	document.title = `${newName} | SilosApp`;
	projectTitle.style.borderBottomColor = 'transparent';
}

projectTitle.addEventListener('focus', () => {
	projectTitle.style.borderBottomColor = 'var(--accent)';
});

projectTitle.addEventListener('blur', saveProjectName);

projectTitle.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		e.preventDefault(); // Evita pular linha
		projectTitle.blur(); // Dispara o saveProjectName
	}
});

// ================= IMPORTAR / EXPORTAR JSON =================

const APP_VERSION = 1;

document.getElementById('btn-export-json').addEventListener('click', exportProject);
document.getElementById('json-input').addEventListener('change', importProject);
document.getElementById('btn-toggle-all').addEventListener('click', toggleAllSilos);

function toggleAllSilos() {
	const allSiloIds = appData.map(s => s.id);
	const areAllActive = allSiloIds.every(id => activeSilos.includes(id));

	if (areAllActive) {
		// Fechar Todos
		activeSilos = [];
	} else {
		// Abrir Todos
		activeSilos = [...allSiloIds];
	}

	// Atualiza UI
	const siloElements = document.querySelectorAll('.silo-ball');
	siloElements.forEach(el => {
		if (activeSilos.includes(el.id.replace('silo-', ''))) {
			el.classList.add('active');
		} else {
			el.classList.remove('active');
		}
	});

	renderLists();
}

function updateToggleAllBtn() {
	const btn = document.getElementById('btn-toggle-all');
	if (!btn) return;

	const allSiloIds = appData.map(s => s.id);
	// Verifica se TODOS os silos do appData estão em activeSilos
	const areAllActive = allSiloIds.length > 0 && allSiloIds.every(id => activeSilos.includes(id));

	if (areAllActive) {
		btn.innerHTML = '🙈 <span class="btn-text"></span>';
		btn.title = "Fechar Todos os Silos";
	} else {
		btn.innerHTML = '👁️ <span class="btn-text"></span>';
		btn.title = "Abrir Todos os Silos";
	}
}

function exportProject() {
	const projectData = {
		meta: {
			version: APP_VERSION,
			app: "SilosApp",
			timestamp: Date.now()
		},
		data: {
			projectName: localStorage.getItem('silos-project-name') || "Meu Projeto Silos",
			silos: appData,
			customLogo: localStorage.getItem('silos-custom-logo')
		}
	};

	const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = `${projectData.data.projectName.toLowerCase().replace(/\s+/g, '-')}-silos-app.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function importProject(event) {
	const file = event.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			const json = JSON.parse(e.target.result);

			// Validação Básica
			if (!json.meta || !json.data) {
				throw new Error("Formato de arquivo inválido.");
			}

			// Migração de Versão (Futuro)
			// if (json.meta.version < APP_VERSION) { ... }

			// Aplicar Dados
			if (json.data.projectName) {
				localStorage.setItem('silos-project-name', json.data.projectName);
				projectTitle.innerText = json.data.projectName;
				document.title = `${json.data.projectName} | SilosApp`;
			}

			if (json.data.customLogo) {
				localStorage.setItem('silos-custom-logo', json.data.customLogo);
				document.getElementById('logo-img').src = json.data.customLogo;
			}

			if (json.data.silos) {
				appData = json.data.silos;
				saveData(); // Salva silos no LocalStorage
			}

			renderSilos();
			renderLists();
			alert('Projeto carregado com sucesso!');

		} catch (err) {
			console.error(err);
			alert('Erro ao carregar projeto: ' + err.message);
		}
	};
	reader.readAsText(file);
	event.target.value = ''; // Resetar input
}

// ================= TEMA E PERSONALIZAÇÃO =================

// Variáveis de Elementos
const settingsModal = document.getElementById('settings-modal');
const btnSettings = document.getElementById('btn-settings');
const colorPrimaryInput = document.getElementById('color-primary');
const colorAccentInput = document.getElementById('color-accent');
const colorBgInput = document.getElementById('color-bg');
const valPrimary = document.getElementById('val-primary');
const valAccent = document.getElementById('val-accent');
const valBg = document.getElementById('val-bg');
const btnResetTheme = document.getElementById('btn-reset-theme');

// Valores Padrão
const defaultTheme = {
	primary: '#0067b8',
	accent: '#ff6f00',
	bg: '#f4f7f6'
};

// Inicialização do Tema
function initTheme() {
	const savedTheme = JSON.parse(localStorage.getItem('silosAppTheme'));
	if (savedTheme) {
		applyTheme(savedTheme.primary, savedTheme.accent, savedTheme.bg);
		updateInputs(savedTheme.primary, savedTheme.accent, savedTheme.bg);
	} else {
		// Se não tiver salvo, garante que os inputs estejam com o padrão
		updateInputs(defaultTheme.primary, defaultTheme.accent, defaultTheme.bg);
	}

	// Converter Logo para SVG Inline (para poder colorir dinamicamente)
	// Pequeno delay para garantir carregamento
	setTimeout(convertLogoToSvg, 100);
}

// Aplica as cores no CSS e salva
function applyTheme(primary, accent, bg) {
	const root = document.documentElement;
	root.style.setProperty('--primary', primary);
	root.style.setProperty('--accent', accent);
	root.style.setProperty('--bg', bg);

	// Salvar
	localStorage.setItem('silosAppTheme', JSON.stringify({ primary, accent, bg }));

	// Atualizar Logo SVG se já estiver inline
	const svgLogo = document.querySelector('#root svg');
	if (svgLogo) {
		svgLogo.querySelectorAll('*').forEach(el => {
			// Reaplicar cores baseadas nas variáveis (já que o SVG usa var(--primary))
			// Se o SVG já foi convertido, suas cores já são var(--...), então
			// mudar a variável no root já atualiza automaticamente!
			// Apenas precisamos garantir que a conversão inicial seta as vars.
		});
	} else {
		// Se ainda for IMG, converte (pode acontecer na primeira carga)
		convertLogoToSvg();
	}
}

// Atualiza os inputs do modal
function updateInputs(primary, accent, bg) {
	if (colorPrimaryInput) { colorPrimaryInput.value = primary; valPrimary.innerText = primary; }
	if (colorAccentInput) { colorAccentInput.value = accent; valAccent.innerText = accent; }
	if (colorBgInput) { colorBgInput.value = bg; valBg.innerText = bg; }
}

// Converte <img> para <svg> inline
async function convertLogoToSvg() {
	const img = document.getElementById('logo-img');
	if (!img) return;

	try {
		const res = await fetch(img.src);
		let text = await res.text();

		// Parse SVG
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'image/svg+xml');
		const svg = doc.querySelector('svg');

		if (svg) {
			// Substituir cores fixas por variáveis CSS
			svg.querySelectorAll('*').forEach(el => {
				const fill = el.getAttribute('fill');

				// Lógica de substituição inteligente
				if (fill) {
					const fillLower = fill.toLowerCase();
					if (fillLower === '#ff6f00') {
						el.style.fill = 'var(--accent)';
					} else if (fillLower !== 'none' && fillLower !== '#f4f7f6') {
						// Assume que qualquer outra cor (ex: azul original) vira Primária
						el.style.fill = 'var(--primary)';
					}
					// O fundo (#f4f7f6) mantemos ou deixamos transparente se quiser
					// Se o SVG tiver fundo, ele pode conflitar com o fundo do app se mudar
					// Vamos deixar o fundo do SVG fixo ou remover?
					// O usuario quer mudar bg da pagina. Se o SVG tiver rect bg, vai ficar quadrado.
					// Melhor: Se for a cor de fundo original, mudar para var(--bg) ou transparente.
					if (fillLower === '#f4f7f6') {
						el.style.fill = 'var(--bg)'; // ou 'transparent'
					}
				}
			});

			// Estilos para manter layout
			svg.setAttribute('id', 'logo-svg');
			svg.style.width = '100%';
			svg.style.height = '100%';
			svg.style.borderRadius = '50%';

			// Substitui a IMG pelo SVG
			img.replaceWith(svg);
		}
	} catch (e) {
		console.error('Erro ao converter logo para SVG:', e);
	}
}

// Event Listeners
if (btnSettings) {
	btnSettings.onclick = () => {
		settingsModal.style.display = 'flex';
	};
}

window.closeSettingsModal = function () {
	settingsModal.style.display = 'none';
};

if (colorPrimaryInput) {
	colorPrimaryInput.addEventListener('input', (e) => {
		const val = e.target.value;
		valPrimary.innerText = val;
		applyTheme(val, colorAccentInput.value, colorBgInput.value);
	});
}

if (colorAccentInput) {
	colorAccentInput.addEventListener('input', (e) => {
		const val = e.target.value;
		valAccent.innerText = val;
		applyTheme(colorPrimaryInput.value, val, colorBgInput.value);
	});
}

if (colorBgInput) {
	colorBgInput.addEventListener('input', (e) => {
		const val = e.target.value;
		valBg.innerText = val;
		applyTheme(colorPrimaryInput.value, colorAccentInput.value, val);
	});
}

if (btnResetTheme) {
	btnResetTheme.onclick = () => {
		// Reseta para os valores definidos no CSS ou hardcoded aqui
		const pads = { p: '#0067b8', a: '#ff6f00', b: '#f4f7f6' };
		applyTheme(pads.p, pads.a, pads.b);
		updateInputs(pads.p, pads.a, pads.b);
	};
}

// Iniciar Tema ao Carregar
document.addEventListener('DOMContentLoaded', initTheme);
