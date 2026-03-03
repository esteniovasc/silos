// ================= ESTADO E DADOS =================
// Recuperar estado da UI (Silos abertos, etc)
const savedUiState = JSON.parse(localStorage.getItem('silos-ui-state')) || {};
let activeSilos = (savedUiState.activeSilos || []).filter(id => id !== null && id !== undefined);

let modalReturnStack = [];
let appData = [];

// ================= ESTADO DE EDIÇÃO (DIRTY CHECK) =================
let initialSiloFormState = null;
let initialItemFormState = null;
let discardCallback = null; // Função a ser executada se confirmar o descarte

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

// Recuperar dados do App com Segurança
const savedAppData = localStorage.getItem('silos-app-data');
if (savedAppData) {
	try {
		const parsed = JSON.parse(savedAppData);
		appData = Array.isArray(parsed) ? parsed.filter(item => item && item.id) : [];
		if (appData.length === 0) appData = [...defaultData];
	} catch (e) {
		console.error("Erro ao ler dados salvos, resetando.", e);
		appData = [...defaultData];
	}
} else {
	appData = [...defaultData];
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
// Renderiza as Bolas (Silos) e Drop Zones
function renderSilos() {
	silosContainer.innerHTML = '';

	// Drop Zone Inicial (Índice 0)
	createDropZone(0);

	appData.forEach((siloData, index) => {
		const silo = document.createElement('div');
		silo.className = 'silo-ball';
		silo.id = `silo-${siloData.id}`;
		silo.draggable = true;
		silo.title = siloData.label;

		// Event Listeners de Drag & Drop no Silo
		silo.addEventListener('dragstart', handleDragStart);
		silo.addEventListener('dragover', handleDragOver);
		silo.addEventListener('dragenter', handleDragEnter);
		silo.addEventListener('dragleave', handleDragLeave);
		silo.addEventListener('drop', handleDrop);
		silo.addEventListener('dragend', handleDragEnd);

		if (activeSilos.includes(siloData.id)) silo.classList.add('active');

		silo.onclick = (e) => {
			toggleSilo(siloData.id);
		};

		// Ícone
		let iconHtml = '';
		const iconType = siloData.iconType || 'emoji';
		const iconValue = siloData.iconValue || siloData.icon;

		if (iconType === 'emoji') {
			iconHtml = `<div class="silo-icon">${iconValue || '📁'}</div>`;
		} else if (iconType === 'image') {
			iconHtml = `<img src="${iconValue}" class="silo-image-icon" alt="icon">`;
		} else if (iconType === 'full') {
			iconHtml = `<img src="${iconValue}" class="silo-full-image" alt="cover">`;
		}

		silo.innerHTML = `
            ${iconHtml}
            ${iconType !== 'full' ? `<div class="silo-label">${siloData.label}</div>` : ''}
        `;
		silosContainer.appendChild(silo);

		// Drop Zone pós-item (Índice atual + 1)
		createDropZone(index + 1);
	});

	silosContainer.appendChild(addBtn);
}

function createDropZone(index) {
	const zone = document.createElement('div');
	zone.className = 'drop-zone';
	zone.dataset.index = index;

	// Eventos da Zona
	zone.addEventListener('dragover', handleZoneDragOver);
	zone.addEventListener('dragleave', handleZoneDragLeave);
	zone.addEventListener('drop', handleZoneDrop);

	silosContainer.appendChild(zone);
}
renderSilos();
renderLists();

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
	// Removed extra brace

	// Salvar estado da UI
	localStorage.setItem('silos-ui-state', JSON.stringify({ activeSilos }));

	renderLists();
	animateLines(); // Inicia loop de redesenho para acompanhar animação CSS
}

// Loop de animação para garantir que as linhas acompanhem transições CSS
let animationFrameId;
const ANIMATION_DURATION = 500; // ms (deve ser maior que a transição CSS de 0.3s)

function animateLines() {
	const startTime = performance.now();

	function loop(currentTime) {
		const elapsed = currentTime - startTime;

		drawLines(); // Redesenha a cada frame

		if (elapsed < ANIMATION_DURATION) {
			animationFrameId = requestAnimationFrame(loop);
		}
	}

	// Cancela anterior se houver (para não empilhar loops)
	if (animationFrameId) cancelAnimationFrame(animationFrameId);

	animationFrameId = requestAnimationFrame(loop);
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
                <span class="edit-silo-btn" data-id="${siloData.id}" title="Editar Silo">✏️</span>
            </div>
            <div class="items-list">
                ${cardsHtml}
            </div>
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

// ================= DRAG & DROP SILOS (HÍBRIDO: SWAP + INSERT) =================
let draggedSiloId = null;

function handleDragStart(e) {
	draggedSiloId = this.id.replace('silo-', '');
	this.style.opacity = '0.4';
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/plain', draggedSiloId);

	// Identificar índice do item arrastado
	const currentIndex = appData.findIndex(s => String(s.id) === String(draggedSiloId));

	// Visual: Manter opacidade reduzida (já definido no início)

	// Destaque visual nas zonas (exceto as adjacentes ao item)
	document.querySelectorAll('.drop-zone').forEach(z => {
		const zoneIndex = parseInt(z.dataset.index);
		// Zona antes do item (currentIndex) e Zona depois do item (currentIndex + 1) são inúteis
		if (zoneIndex !== currentIndex && zoneIndex !== currentIndex + 1) {
			z.classList.add('active-zone');
			z.style.pointerEvents = 'all';
		} else {
			z.style.pointerEvents = 'none'; // Desabilita interação com zonas inúteis
		}
	});
}

function handleDragEnd(e) {
	this.style.opacity = '1';
	draggedSiloId = null;

	// Remove estilos das zonas
	document.querySelectorAll('.drop-zone').forEach(z => {
		z.classList.remove('active-zone');
		z.classList.remove('drag-over-zone');
	});
	// Remove estilos dos silos
	document.querySelectorAll('.silo-ball').forEach(el => el.classList.remove('drag-over'));
}

// Handler Drop Silo -> Silo (SWAP)
function handleDragOver(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}
	const targetId = this.id.replace('silo-', '');
	if (targetId === draggedSiloId) return false; // Ignora a própria bola

	e.dataTransfer.dropEffect = 'move';
	return false;
}

function handleDragEnter(e) {
	const targetId = this.id.replace('silo-', '');
	if (targetId === draggedSiloId) return; // Ignora a própria bola

	this.classList.add('drag-over');
}

function handleDragLeave(e) {
	this.classList.remove('drag-over');
}

// Handler Drop Silo -> Silo (SWAP)
function handleDrop(e) {
	e.stopPropagation();
	const targetId = this.id.replace('silo-', '');

	if (draggedSiloId !== targetId) {
		swapSilos(draggedSiloId, targetId);
	}
	// Limpa estilo
	this.classList.remove('drag-over');
	return false;
}

// Handler Drop Zone -> Zone (INSERT)
function handleZoneDragOver(e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'move';
	this.classList.add('drag-over-zone');
}

function handleZoneDragLeave(e) {
	this.classList.remove('drag-over-zone');
}

function handleZoneDrop(e) {
	e.stopPropagation();
	this.classList.remove('drag-over-zone');

	const targetIndex = parseInt(this.dataset.index);
	if (draggedSiloId) {
		moveSilo(draggedSiloId, targetIndex);
	}
	return false;
}

function swapSilos(id1, id2) {
	if (id1 === id2) return;

	animateReorder(() => {
		const idx1 = appData.findIndex(s => String(s.id) === String(id1));
		const idx2 = appData.findIndex(s => String(s.id) === String(id2));

		if (idx1 > -1 && idx2 > -1) {
			const temp = appData[idx1];
			appData[idx1] = appData[idx2];
			appData[idx2] = temp;

			saveData();
			renderSilos();
			renderLists();
		}
	});
}

function moveSilo(siloId, targetIndex) {
	const currentIndex = appData.findIndex(s => String(s.id) === String(siloId));
	if (currentIndex === -1) return;

	// Se o destino for o índice atual ou o próximo (após o item), é redundante
	if (targetIndex === currentIndex || targetIndex === currentIndex + 1) return;

	animateReorder(() => {
		const [movedItems] = appData.splice(currentIndex, 1);
		if (!movedItems) {
			renderSilos();
			return;
		}

		// Ajuste do índice
		let finalIndex = targetIndex;
		if (targetIndex > currentIndex) {
			finalIndex = targetIndex - 1;
		}

		appData.splice(finalIndex, 0, movedItems);

		saveData();
		renderSilos();
		renderLists();
	});
}

// Helper: FLIP Animation (First, Last, Invert, Play)
function animateReorder(updateStateFn) {
	// 1. FIRST: Capturar posições atuais
	const firstPositions = new Map();
	document.querySelectorAll('.silo-ball').forEach(el => {
		const id = el.id;
		const rect = el.getBoundingClientRect();
		firstPositions.set(id, rect);
	});

	// 2. UPDATE: Executar a mudança de estado e renderizar
	updateStateFn();

	// 3. LAST & INVERT & PLAY: Calcular delta e animar
	const newSilos = document.querySelectorAll('.silo-ball');

	newSilos.forEach(el => {
		const id = el.id;
		const firstRect = firstPositions.get(id);

		if (firstRect) {
			const lastRect = el.getBoundingClientRect();

			// Delta
			const dx = firstRect.left - lastRect.left;
			const dy = firstRect.top - lastRect.top;

			// Invert: Se houve movimento, aplicar transform para posição inicial
			if (dx !== 0 || dy !== 0) {
				// Remover transição para aplicar transform instantâneo
				el.style.transition = 'none';
				el.style.transform = `translate(${dx}px, ${dy}px)`;

				// Forçar Reflow/Repaint
				el.getBoundingClientRect();

				// Play: Restaurar transição e remover transform (anima para 0,0)
				requestAnimationFrame(() => {
					el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
					el.style.transform = '';
				});
			}
		}
	});

	// Atualiza linhas continuamente durante a animação
	animateLines();
}

function updateDomSafely() {
	// Função legado mantida para compatibilidade, mas agora o animateReorder cuida de tudo
	saveData();
	renderSilos();
	renderLists();
	requestAnimationFrame(drawLines);
}


// ================= CRUD SILOS =================

let currentEditingSiloId = null;
let tempSiloIconBase64 = null; // Armazena temporariamente a imagem recém carregada no modal

// Elementos do Modal de Silo
// const siloModalTypeSelect = document.getElementById('silo-icon-type'); // REMOVIDO
const siloInputEmojiDiv = document.getElementById('silo-input-emoji');
const siloInputImageDiv = document.getElementById('silo-input-image');
const siloIconText = document.getElementById('silo-icon-text');
const siloIconFile = document.getElementById('silo-icon-file');
const siloIconUrl = document.getElementById('silo-icon-url'); // NOVO
const siloIconPreview = document.getElementById('silo-icon-preview');
const iconTypeRadios = document.getElementsByName('icon-type');

// Event Listener para troca de Tipo de Ícone (Radio Buttons)
iconTypeRadios.forEach(radio => {
	radio.addEventListener('change', () => {
		updateIconInputVisibility(radio.value);
	});
});

function updateIconInputVisibility(type) {
	if (type === 'emoji') {
		siloInputEmojiDiv.style.display = 'block';
		siloInputImageDiv.style.display = 'none';
	} else {
		// image ou full
		siloInputEmojiDiv.style.display = 'none';
		siloInputImageDiv.style.display = 'block';
	}
}

// Event Listener para Upload de Imagem do Silo (Arquivo e URL)
if (siloIconFile) {
	siloIconFile.addEventListener('change', (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (evt) => {
				tempSiloIconBase64 = evt.target.result;
				if (siloIconUrl) siloIconUrl.value = ''; // Limpa URL se carregou arquivo
				updateSiloPreview(tempSiloIconBase64);
			};
			reader.readAsDataURL(file);
		}
	});
}

if (siloIconUrl) {
	siloIconUrl.addEventListener('input', (e) => {
		const url = e.target.value.trim();
		if (url) {
			tempSiloIconBase64 = url; // Usa a URL como valor
			updateSiloPreview(url);
		} else {
			// Se apagou, tenta voltar para imagem anterior (se edição) ou limpa
			if (currentEditingSiloId) {
				const silo = appData.find(s => s.id === currentEditingSiloId);
				if (silo && silo.iconValue && (silo.iconType === 'image' || silo.iconType === 'full')) {
					// Restaura a imagem original do silo se houver
					// Mas só se o usuário não tiver selecionado um arquivo novo.
					// Como não trackeamos "arquivo x url" separadamente além de temp, 
					// melhor apenas limpar o preview atual e zerar temp
					tempSiloIconBase64 = null;
					updateSiloPreview('');
				} else {
					tempSiloIconBase64 = null;
					updateSiloPreview('');
				}
			} else {
				tempSiloIconBase64 = null;
				updateSiloPreview('');
			}
		}
	});
}

function updateSiloPreview(src) {
	const previewImg = document.getElementById('silo-icon-preview');
	const previewLbl = document.getElementById('preview-label');

	if (previewImg) {
		if (src && src !== '📷') {
			previewImg.src = src;
			previewImg.style.display = 'block';
			if (previewLbl) previewLbl.style.display = 'block';
		} else {
			previewImg.style.display = 'none';
			if (previewLbl) previewLbl.style.display = 'none';
		}
	}
}

// Helper: Capturar estado do formulário de Silo
function getSiloFormState() {
	const layoutRadio = document.querySelector('input[name="layout-type"]:checked');
	const iconRadio = document.querySelector('input[name="icon-type"]:checked');

	return {
		name: document.getElementById('silo-name')?.value || '',
		layout: layoutRadio ? layoutRadio.value : 'default',
		iconType: iconRadio ? iconRadio.value : 'emoji',
		iconText: document.getElementById('silo-icon-text')?.value || '',
		// Importante: comparar URL ou base64
		// Se tempSiloIconBase64 for null, pode ser que não mudou, mas precisamos saber o estado visual
		// No openSiloModal nós setamos tempSiloIconBase64 com o valor atual
		// Então podemos usar tempSiloIconBase64 como referência de "estado atual da imagem"
		tempImage: tempSiloIconBase64
	};
}

// Abrir Modal (Criar ou Editar)
function openSiloModal(siloId = null) {
	currentEditingSiloId = siloId;
	tempSiloIconBase64 = null; // Reseta imagem temporária

	const modal = document.getElementById('silo-modal');
	const title = document.getElementById('silo-modal-title');
	const nameInput = document.getElementById('silo-name');
	// const typeInput = document.getElementById('silo-type'); // REMOVIDO (Agora é radio)
	const btnDelete = document.getElementById('btn-delete-silo');

	// Resetar Inputs Visuais
	if (siloIconPreview) {
		siloIconPreview.src = '';
		siloIconPreview.style.display = 'none';
	}
	if (siloIconFile) siloIconFile.value = '';
	// Resetar Inputs Visuais
	if (siloIconPreview) {
		siloIconPreview.src = '';
		siloIconPreview.style.display = 'none';
	}
	if (siloIconFile) siloIconFile.value = '';
	if (siloIconUrl) siloIconUrl.value = '';

	// Limpar Erros de Validação Anteriores
	clearInputError(nameInput);
	if (siloIconUrl) clearInputError(siloIconUrl);
	if (siloIconFile) clearInputError(siloIconFile);

	if (siloId) {
		// Modo Edição
		const silo = appData.find(s => s.id === siloId);
		if (!silo) return;

		title.innerText = 'Editar Silo';
		nameInput.value = silo.label;
		// Setar Radio de Layout
		const layoutType = silo.type || 'default';
		const layoutRadio = document.querySelector(`input[name="layout-type"][value="${layoutType}"]`);
		if (layoutRadio) layoutRadio.checked = true;

		btnDelete.style.display = 'block';
		btnDelete.onclick = () => deleteSilo(siloId);

		// Configurar Campos de Ícone
		const iconType = silo.iconType || 'emoji';

		// Setar Radio Button
		const radio = document.querySelector(`input[name="icon-type"][value="${iconType}"]`);
		if (radio) radio.checked = true;

		updateIconInputVisibility(iconType);

		if (iconType === 'emoji') {
			siloIconText.value = silo.iconValue || silo.icon || '📁';
		} else {
			// Se for imagem, mostra preview da atual
			tempSiloIconBase64 = silo.iconValue || silo.icon;

			// Se tempSiloIconBase64 for null ou undefined (ex: dado antigo), fallback
			if (!tempSiloIconBase64 || tempSiloIconBase64 === '📷') tempSiloIconBase64 = null;

			if (tempSiloIconBase64) {
				updateSiloPreview(tempSiloIconBase64);
				// Se for URL (começa com http), preenche o input de texto
				if (tempSiloIconBase64.startsWith('http')) {
					if (siloIconUrl) siloIconUrl.value = tempSiloIconBase64;
				}
			}
		}

	} else {
		// Modo Criação
		title.innerText = 'Novo Silo';
		nameInput.value = '';
		// Resetar Radio Layout para Default
		const layoutRadio = document.querySelector(`input[name="layout-type"][value="default"]`);
		if (layoutRadio) layoutRadio.checked = true;
		btnDelete.style.display = 'none';

		// Resetar Radio para Emoji
		const radio = document.querySelector(`input[name="icon-type"][value="emoji"]`);
		if (radio) radio.checked = true;
		updateIconInputVisibility('emoji');

		siloIconText.value = '📁';
	}

	modal.style.display = 'flex';
	// Captura estado "Limpo" inicial
	initialSiloFormState = getSiloFormState();
}

function closeSiloModal(force = false) {
	// Verificar alterações (Dirty Check)
	if (!force) {
		const currentState = getSiloFormState();

		if (!currentEditingSiloId) {
			// Lógica Relaxada para NOVO Silo:
			// Só importa se o usuário preencheu nome ou mudou o ícone/imagem
			// Mudanças de "Tipo de Layout" ou "Tipo de Ícone" (Radios) são ignoradas se não houver conteúdo

			const hasName = currentState.name && currentState.name.trim() !== '';
			const hasIconText = currentState.iconType === 'emoji' && currentState.iconText !== '📁';
			// Para imagem, verifica se existe algo em tempImage (upload ou URL)
			const hasImage = currentState.iconType !== 'emoji' && currentState.tempImage;

			if (hasName || hasIconText || hasImage) {
				showDiscardConfirmation(() => closeSiloModal(true));
				return;
			}
		} else {
			// Edição de Silo Existente: Check estrito (qualquer mudança conta)
			if (JSON.stringify(initialSiloFormState) !== JSON.stringify(currentState)) {
				showDiscardConfirmation(() => closeSiloModal(true));
				return;
			}
		}
	}

	closeModalAnimated('silo-modal', () => {
		currentEditingSiloId = null;
	});
}

function closeModalAnimated(modalId, onComplete) {
	const modal = document.getElementById(modalId);
	if (!modal) return;

	// Força reflow para garantir reset de animação
	void modal.offsetWidth;

	modal.classList.add('closing');

	// Aguarda fim da animação (0.2s no CSS)
	setTimeout(() => {
		modal.style.display = 'none';
		modal.classList.remove('closing');
		if (onComplete) onComplete();
	}, 200);
}

// Botões do Modal
window.closeSiloModal = closeSiloModal;
window.openSiloModal = openSiloModal; // IMPORTANTE: Expor para usar onclick
document.getElementById('btn-save-silo').addEventListener('click', saveSilo);
addBtn.addEventListener('click', () => openSiloModal(null));

function saveSilo() {
	const name = document.getElementById('silo-name').value;

	// Ler Radio Layout
	const layoutRadio = document.querySelector('input[name="layout-type"]:checked');
	const layoutType = layoutRadio ? layoutRadio.value : 'default';

	// Ler Radio Button Checado
	const selectedRadio = document.querySelector('input[name="icon-type"]:checked');
	const iconType = selectedRadio ? selectedRadio.value : 'emoji';

	let iconValue = '';

	if (iconType === 'emoji') {
		iconValue = siloIconText.value || '📁';
	} else {
		// Imagem ou Full
		if (tempSiloIconBase64) {
			iconValue = tempSiloIconBase64;
		} else {
			// Se estiver editando e não trocou a imagem
			if (!currentEditingSiloId) {
				// Criação sem imagem -> Erro ou Fallback
				// alert('Selecione uma imagem ou insira uma URL');
				// return;
				// Melhor visual:
				if (siloIconUrl && siloIconUrl.offsetParent !== null) {
					showInputError(siloIconUrl, 'Insira uma URL ou escolha um arquivo');
				} else if (siloIconFile) {
					showInputError(siloIconFile, 'Escolha uma imagem');
				}
				return;
			}

			// Tenta pegar do atual
			const current = appData.find(s => s.id === currentEditingSiloId);
			if (current && current.iconType !== 'emoji') {
				iconValue = current.iconValue || current.icon;
			} else {
				// alert('Selecione uma imagem ou insira uma URL');
				if (siloIconUrl && siloIconUrl.offsetParent !== null) {
					showInputError(siloIconUrl, 'Insira uma URL ou escolha um arquivo');
				} else {
					showInputError(siloIconFile, 'Escolha uma imagem');
				}
				return;
			}
		}
	}

	if (!name) {
		showInputError(document.getElementById('silo-name'), 'Nome é obrigatório');
		return;
	}

	// Objeto comum de update
	const updates = {
		label: name,
		type: layoutType,
		iconType: iconType,
		iconValue: iconValue,
		// Fallback visual para sistemas que usam .icon antigo
		icon: (iconType === 'emoji') ? iconValue : '📷'
	};

	if (currentEditingSiloId) {
		// Editar
		const silo = appData.find(s => s.id === currentEditingSiloId);
		if (silo) {
			Object.assign(silo, updates);
		}
	} else {
		// Criar
		const newId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
		appData.push({
			id: newId,
			...updates,
			items: []
		});
	}

	saveData();
	renderSilos();
	renderLists();
	closeSiloModal(true);
}

// ================= DELETE SAFEGUARD =================
let siloToDeleteId = null;

function deleteSilo(id) {
	const silo = appData.find(s => s.id === id);
	if (!silo) return;

	siloToDeleteId = id;
	const modal = document.getElementById('delete-modal');
	const msg = document.getElementById('delete-msg');
	const preview = document.getElementById('delete-items-preview');

	if (silo.items.length > 0) {
		msg.innerHTML = `O silo <strong>"${silo.label}"</strong> possui <strong>${silo.items.length} itens</strong>:`;
		preview.innerHTML = silo.items.map(item => `• ${item.title}`).join('<br>');
		preview.style.display = 'block';
		document.getElementById('btn-confirm-delete').innerText = "Sim, Excluir Tudo";
	} else {
		msg.innerHTML = `Tem certeza que deseja excluir o silo <strong>"${silo.label}"</strong>?`;
		preview.innerHTML = '';
		preview.style.display = 'none';
		document.getElementById('btn-confirm-delete').innerText = "Sim, Excluir";
	}

	modal.style.display = 'flex';
	// Mantém o modal de edição aberto por baixo
	// document.getElementById('silo-modal').style.display = 'none';
}

function closeDeleteModal() {
	closeModalAnimated('delete-modal', () => {
		siloToDeleteId = null;
	});
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
	closeSiloModal(true); // Força fechamento pois já deletou
}

window.closeDeleteModal = closeDeleteModal;

// ================= CONFIRMAÇÃO DE DESCARTE =================
function showDiscardConfirmation(onConfirm) {
	discardCallback = onConfirm;
	document.getElementById('discard-modal').style.display = 'flex';
}

function closeDiscardModal() {
	document.getElementById('discard-modal').style.display = 'none';
	discardCallback = null;
}

document.getElementById('btn-discard-confirm').addEventListener('click', () => {
	if (discardCallback) discardCallback();
	closeDiscardModal();
});

document.getElementById('btn-discard-cancel').addEventListener('click', () => {
	closeDiscardModal();
});

// Fechar com ESC (Opcional, mas consistente)
// Já existe listener global no settings, que pode conflitar se não formos cuidadosos
// Mas como é um modal por cima, ele deve ter prioridade.
// Vamos deixar o listener global lidar? O listener global fecha "modais".
// Precisamos garantir que ele feche o do topo.

// ================= CRUD ITENS =================
let currentItemSiloId = null;
let currentItemIndex = null;

function openItemForm(siloId, itemIndex = null) {
	// Verificar se o modal de detalhes está aberto e empilhar
	const detailsModal = document.getElementById('modal');
	if (detailsModal && detailsModal.style.display === 'flex') {
		modalReturnStack.push('modal');
		detailsModal.style.display = 'none';
	}

	currentItemSiloId = siloId;
	currentItemIndex = itemIndex;

	const modal = document.getElementById('item-form-modal');
	const titleHeader = document.getElementById('item-form-title');
	const titleInput = document.getElementById('item-title-input');
	const descInput = document.getElementById('item-desc-input');
	const linkInput = document.getElementById('item-link-input');
	// const btnDelete = document.getElementById('btn-delete-item'); // REMOVIDO (Nova lógica)

	// Limpar Erros de Validação Anteriores
	clearInputError(titleInput);

	// Resetar estado visual da exclusão (sem animação)
	resetDeleteBtnState();
	const btnDeleteInit = document.getElementById('btn-delete-init');

	if (itemIndex !== null) {
		// Editar
		const silo = appData.find(s => s.id === siloId);
		const item = silo.items[itemIndex];

		titleHeader.innerText = 'Editar Item';
		titleInput.value = item.title;
		descInput.value = item.desc;
		linkInput.value = item.link || '';

		// Mostrar botão de excluir (Estado Inicial)
		// Pequeno delay para garantir que o reset termine e a gente possa dar override no display
		setTimeout(() => {
			btnDeleteInit.style.display = 'block';
		}, 15);

		// Vincular a ação real de exclusão ao botão "Sim"
		document.getElementById('btn-confirm-yes').onclick = () => deleteItem(siloId, itemIndex);

	} else {
		// Novo
		titleHeader.innerText = 'Novo Item';
		titleInput.value = '';
		descInput.value = '';
		linkInput.value = '';

		// Esconder botão de excluir
		// Garantido pelo resetDeleteBtnState que põe display: none por padrao
		// Mas podemos reforçar
		btnDeleteInit.style.display = 'none';
	}
	modal.style.display = 'flex';
	// Captura estado inicial
	initialItemFormState = getItemFormState();
}

function getItemFormState() {
	return {
		title: document.getElementById('item-title-input')?.value || '',
		desc: document.getElementById('item-desc-input')?.value || '',
		link: document.getElementById('item-link-input')?.value || ''
	};
}

// Variável global para controlar timeout de animação
let deleteAnimationTimeout = null;

function resetDeleteBtnState() {
	if (deleteAnimationTimeout) clearTimeout(deleteAnimationTimeout);

	const initBtn = document.getElementById('btn-delete-init');
	const group = document.getElementById('delete-confirm-group');

	// Reseta para o estado "Botão Excluir visível, Grupo oculto"
	// A visibilidade final do initBtn (block/none) deve ser definida por quem chama, ou assumimos block aqui

	group.style.transition = 'none'; // Desabilita transição para reset instantâneo
	initBtn.style.transition = 'none';

	group.style.width = '0';
	group.style.opacity = '0';
	group.style.transform = 'translateX(-150%)';
	group.style.pointerEvents = 'none';

	initBtn.style.transform = 'translateX(0)';
	initBtn.style.opacity = '1';
	initBtn.style.pointerEvents = 'auto';
	initBtn.style.display = 'none'; // Default safe

	// Remove classe ativa do modal
	const modalElement = document.querySelector('#item-form-modal .modal');
	if (modalElement) modalElement.classList.remove('delete-active');

	// Força reflow para aplicar 'none'
	void initBtn.offsetWidth;

	// Reabilita transições
	setTimeout(() => {
		group.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease';
		initBtn.style.transition = 'transform 0.3s ease';
	}, 10);
}

// ================= VALIDAÇÃO VISUAL =================

function showInputError(inputElement, message) {
	if (!inputElement) return;

	// Adiciona classe de erro
	inputElement.classList.add('input-error');

	// Adiciona Animação Shake
	inputElement.classList.add('shake');
	// Remove a classe shake após a animação para poder tremer de novo se precisar
	setTimeout(() => {
		inputElement.classList.remove('shake');
	}, 500);

	// Verifica se já existe mensagem de erro
	let errorMsg = inputElement.nextElementSibling;
	if (!errorMsg || !errorMsg.classList.contains('error-message')) {
		errorMsg = document.createElement('span');
		errorMsg.className = 'error-message';
		inputElement.parentNode.insertBefore(errorMsg, inputElement.nextSibling);
	}
	errorMsg.innerText = message;
	errorMsg.style.display = 'block';

	// Foca no input
	inputElement.focus();

	// Adiciona listener para limpar erro ao digitar
	inputElement.addEventListener('input', () => clearInputError(inputElement), { once: true });
}

function clearInputError(inputElement) {
	if (!inputElement) return;
	inputElement.classList.remove('input-error');
	const errorMsg = inputElement.nextElementSibling;
	if (errorMsg && errorMsg.classList.contains('error-message')) {
		errorMsg.style.display = 'none';
	}
}

// ================= TOAST NOTIFICAÇÕES =================

function showToast(message, type = 'info', duration = 5000) {
	const container = document.getElementById('toast-container');
	if (!container) return;

	// Criar elemento do toast
	const toast = document.createElement('div');
	toast.className = `toast ${type}`;

	// Ícone baseado no tipo (opcional, mas legal)
	let icon = '';
	if (type === 'success') icon = '✅';
	if (type === 'error') icon = '❌';
	if (type === 'info') icon = 'ℹ️';

	toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

	// Adicionar ao container
	container.appendChild(toast);

	// Remover após duração
	setTimeout(() => {
		toast.classList.add('fade-out');
		// Remover do DOM após animação de saída
		toast.addEventListener('transitionend', () => {
			toast.remove();
		});
	}, duration);
}

// Expor para uso global se necessário (embora usemos internamente aqui)
window.showToast = showToast;

// Lógica de Animação do Delete no Item
window.showDeleteConfirmation = function () {
	const initBtn = document.getElementById('btn-delete-init');
	const group = document.getElementById('delete-confirm-group');

	// Adiciona classe ao modal para controle via CSS (responsivo)
	const modalElement = document.querySelector('#item-form-modal .modal');
	if (modalElement) modalElement.classList.add('delete-active');

	// Animação: Botão inicial some (ou move) e Grupo aparece
	initBtn.style.transform = 'translateX(-100%)';
	initBtn.style.opacity = '0';
	initBtn.style.pointerEvents = 'none'; // Evita clique duplo acidental

	if (deleteAnimationTimeout) clearTimeout(deleteAnimationTimeout);
	// Pequeno delay para a troca
	deleteAnimationTimeout = setTimeout(() => {
		initBtn.style.display = 'none'; // Remove do fluxo para o grupo ocupar o espaço

		group.style.width = 'auto';
		group.style.opacity = '1';
		group.style.pointerEvents = 'auto';
		group.style.transform = 'translateX(0)';
	}, 200);
}

window.hideDeleteConfirmation = function () {
	const initBtn = document.getElementById('btn-delete-init');
	const group = document.getElementById('delete-confirm-group');

	// Remove classe
	const modalElement = document.querySelector('#item-form-modal .modal');
	if (modalElement) modalElement.classList.remove('delete-active');

	// Animação inversa
	group.style.transform = 'translateX(-150%)';
	group.style.opacity = '0';
	group.style.pointerEvents = 'none';

	if (deleteAnimationTimeout) clearTimeout(deleteAnimationTimeout);
	deleteAnimationTimeout = setTimeout(() => {
		group.style.width = '0';

		initBtn.style.display = 'block';
		// Força reflow
		void initBtn.offsetWidth;

		initBtn.style.transform = 'translateX(0)';
		initBtn.style.opacity = '1';
		initBtn.style.pointerEvents = 'auto';
	}, 200);
}


function closeItemForm(force = false) {
	if (!force) {
		const currentState = getItemFormState();
		if (JSON.stringify(initialItemFormState) !== JSON.stringify(currentState)) {
			showDiscardConfirmation(() => closeItemForm(true));
			return;
		}
	}

	closeModalAnimated('item-form-modal', () => {
		currentItemSiloId = null;
		currentItemIndex = null;
		resetDeleteBtnState(); // Reseta estado visual instantaneamente

		// Voltar navegação (Pilha)
		const returnTo = modalReturnStack.pop();
		if (returnTo) {
			const prevModal = document.getElementById(returnTo);
			if (prevModal) {
				prevModal.classList.remove('closing');
				prevModal.style.display = 'flex';
			}
		}
	});
}

function saveItem() {
	const title = document.getElementById('item-title-input').value;
	const desc = document.getElementById('item-desc-input').value;
	const link = document.getElementById('item-link-input').value;

	if (!title) {
		showInputError(document.getElementById('item-title-input'), 'Título é obrigatório');
		return;
	}

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

	// Verificar se veio do modal de detalhes (para atualizar conteúdo e voltar)
	const cameFromDetails = (modalReturnStack[modalReturnStack.length - 1] === 'modal');
	const sId = currentItemSiloId;
	const iIdx = currentItemIndex;

	closeItemForm(true); // Força fechamento pois salvou

	if (cameFromDetails) {
		openModal(sId, iIdx); // Recarrega com dados novos
	} else {
		closeModal();  // Garante que fecha se não veio de lá
	}
}

function deleteItem(siloId, index) {
	// if (!confirm('Excluir este item?')) return; // REMOVIDO: Confirmação agora é via UI

	const silo = appData.find(s => s.id === siloId);
	if (silo) {
		silo.items.splice(index, 1);
		saveData();
		renderLists();

		// Se veio do detalhes, remove da pilha pois o item não existe mais
		if (modalReturnStack.length > 0 && modalReturnStack[modalReturnStack.length - 1] === 'modal') {
			modalReturnStack.pop();
		}

		closeItemForm(true); // Força fechamento pois deletou
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

	const linkBtn = document.getElementById('modal-link');
	if (item.link && item.link.trim() !== '') {
		linkBtn.href = item.link;
		linkBtn.style.display = 'flex';
	} else {
		linkBtn.href = '#';
		linkBtn.style.display = 'none';
	}

	// Botão Editar no Modal de Detalhes
	const btnEdit = document.getElementById('btn-edit-item-details');
	btnEdit.onclick = () => {
		openItemForm(siloId, itemIndex);
	};

	document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
	closeModalAnimated('modal');
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

		// Atualiza Storage
		localStorage.setItem('silos-custom-logo', base64);

		// Verifica se o logo atual é SVG ou IMG
		const currentSvg = document.getElementById('logo-svg');
		const currentImg = document.getElementById('logo-img');

		if (currentSvg) {
			// Se for SVG, precisamos destruir e recriar a IMG para o script converter de novo
			const newImg = document.createElement('img');
			newImg.id = 'logo-img';
			newImg.src = base64;
			newImg.alt = "Logo";
			newImg.style.maxWidth = "100%";
			newImg.style.maxHeight = "100%";

			currentSvg.replaceWith(newImg);

			// Reconverte após renderizar
			setTimeout(convertLogoToSvg, 100);
		} else if (currentImg) {
			// Se ainda for IMG (ex: falha na conversão anterior), só atualiza src
			currentImg.src = base64;
			setTimeout(convertLogoToSvg, 100);
		}

		// Efeito visual de confirmação
		const root = document.getElementById('root');
		if (root) {
			root.style.transform = 'scale(0.9)';
			setTimeout(() => root.style.transform = 'scale(1)', 150);
		}
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

	// Salvar estado da UI
	localStorage.setItem('silos-ui-state', JSON.stringify({ activeSilos }));

	renderLists();
	animateLines(); // Garante animação suave das linhas ao abrir/fechar todos
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
			// alert('Projeto carregado com sucesso!');
			showToast('Projeto carregado com sucesso!', 'success');

		} catch (err) {
			console.error(err);
			// alert('Erro ao carregar projeto: ' + err.message);
			showToast('Erro ao carregar projeto: ' + err.message, 'error');
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
	closeModalAnimated('settings-modal');
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

// ================= FECHAR MODAIS (UX) =================

// Preferências do Usuário (Default: true)
let closeOnEsc = localStorage.getItem('silos-ux-esc') !== 'false';
let closeOnOverlay = localStorage.getItem('silos-ux-overlay') === 'true'; // Default: false

// Checkboxes de Configuração
const toggleEsc = document.getElementById('toggle-esc');
const toggleOverlay = document.getElementById('toggle-overlay');

// Inicializar Checkboxes
if (toggleEsc) {
	toggleEsc.checked = closeOnEsc;
	toggleEsc.addEventListener('change', (e) => {
		closeOnEsc = e.target.checked;
		localStorage.setItem('silos-ux-esc', closeOnEsc);
	});
}

if (toggleOverlay) {
	toggleOverlay.checked = closeOnOverlay;
	toggleOverlay.addEventListener('change', (e) => {
		closeOnOverlay = e.target.checked;
		localStorage.setItem('silos-ux-overlay', closeOnOverlay);
	});
}

// 1. Fechar com ESC (Respeitando preferência)
document.addEventListener('keydown', (e) => {
	if (closeOnEsc && e.key === 'Escape') {
		closeAnyOpenModal();
	}
});

// 2. Fechar ao Clicar Fora (Respeitando preferência)
document.querySelectorAll('.modal-overlay').forEach(overlay => {
	overlay.addEventListener('click', (e) => {
		if (closeOnOverlay && e.target === overlay) {
			closeAnyOpenModal();
		}
	});
});

function closeAnyOpenModal() {
	// Verifica qual está visível e chama a função específica para garantir limpeza de estado
	// Ordem importa: Modais "por cima" de outros devem fechar primeiro (ex: Confirm Delete sobre Edit Silo)

	const deleteModal = document.getElementById('delete-modal');
	if (deleteModal && deleteModal.style.display === 'flex') {
		closeDeleteModal();
		return;
	}

	const settings = document.getElementById('settings-modal');
	if (settings && settings.style.display === 'flex') {
		closeSettingsModal();
		return;
	}

	const siloModal = document.getElementById('silo-modal');
	if (siloModal && siloModal.style.display === 'flex') {
		closeSiloModal();
		return;
	}

	const itemForm = document.getElementById('item-form-modal');
	if (itemForm && itemForm.style.display === 'flex') {
		closeItemForm();
		return;
	}

	const detailsModal = document.getElementById('modal');
	if (detailsModal && detailsModal.style.display === 'flex') {
		closeModal();
		return;
	}
}