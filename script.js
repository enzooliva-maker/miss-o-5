// =================================================================================
// CONFIGURAÇÃO DA API
// =================================================================================
// IMPORTANTE: Substitua os valores abaixo pelas suas credenciais do Airtable.
// Para segurança em produção, use variáveis de ambiente (ex: Replit Secrets).
const AIRTABLE_API_KEY = 'pat8Exnh4apWrW6EZ.b5b8ab10dc453ec47673f6d74f693eb9687f190cfbef52b728dd60f280d4f1d8';
const AIRTABLE_BASE_ID = 'appMzQgGu25lotLSU';
const AIRTABLE_TABLE_NAME = 'Clientes';

const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

// =================================================================================
// ELEMENTOS DO DOM
// =================================================================================
const clientForm = document.getElementById('client-form');
const clientsListContainer = document.getElementById('clients-list-container');
const themeToggleButton = document.getElementById('theme-toggle');
const editModal = document.getElementById('edit-modal');
const editClientForm = document.getElementById('edit-client-form');
const cancelEditButton = document.getElementById('cancel-edit');

// =================================================================================
// LÓGICA DO TEMA (CLARO/ESCURO)
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Verifica a preferência do usuário ou do sistema e aplica o tema
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        themeToggleButton.querySelector('.fa-sun').classList.add('hidden');
        themeToggleButton.querySelector('.fa-moon').classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

themeToggleButton.addEventListener('click', () => {
    // Alterna a classe 'dark' no elemento <html>
    document.documentElement.classList.toggle('dark');

    // Salva a preferência no localStorage
    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        themeToggleButton.querySelector('.fa-sun').classList.add('hidden');
        themeToggleButton.querySelector('.fa-moon').classList.remove('hidden');
    } else {
        localStorage.setItem('theme', 'light');
        themeToggleButton.querySelector('.fa-sun').classList.remove('hidden');
        themeToggleButton.querySelector('.fa-moon').classList.add('hidden');
    }
});

// =================================================================================
// FUNÇÕES AUXILIARES E RENDERIZAÇÃO
// =================================================================================

/**
 * Exibe uma mensagem de feedback em formato de pop-up modal.
 * ESTA FUNÇÃO FOI ATUALIZADA para aplicar estilos diretamente via JS,
 * garantindo que sempre funcione como um pop-up.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de mensagem ('success' ou 'error').
 */
function showToastMessage(message, type = 'success') {
    const existingToast = document.querySelector('.toast-popup');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.textContent = message;

    // Adiciona uma classe base para identificação
    toast.className = 'toast-popup'; 

    // Aplica estilos essenciais diretamente via JavaScript
    Object.assign(toast.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '1.5rem 2rem',
        borderRadius: '0.75rem',
        color: 'white',
        backgroundColor: type === 'success' ? '#16a34a' : '#dc2626', // Verde ou Vermelho
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        zIndex: '1001',
        textAlign: 'center',
        minWidth: '300px',
        maxWidth: '90%',
        fontSize: '1.125rem',
        fontWeight: '500',
        transition: 'opacity 0.3s ease, transform 0.4s ease',
        opacity: '0', // Inicia invisível para animação de entrada
    });

    document.body.appendChild(toast);

    // Força o navegador a renderizar o estado inicial (invisível)
    // antes de aplicar o estado final (visível) para a animação funcionar.
    setTimeout(() => {
        Object.assign(toast.style, {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)',
        });
    }, 10);


    // Define um tempo para remover o pop-up
    setTimeout(() => {
        // Aplica estilos para a animação de saída
        Object.assign(toast.style, {
            opacity: '0',
            transform: 'translate(-50%, -40%) scale(0.95)'
        });

        // Remove o elemento do DOM após a animação de saída
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 2500); 
}


/**
 * Renderiza o estado de carregamento na lista de clientes.
 */
function renderLoadingState() {
    clientsListContainer.innerHTML = `
        <div class="flex justify-center items-center p-10">
            <div class="spinner border-4 border-blue-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
        </div>
    `;
}

/**
 * Renderiza o estado de erro na lista de clientes.
 * @param {string} message - A mensagem de erro a ser exibida.
 */
function renderErrorState(message) {
    clientsListContainer.innerHTML = `
        <div class="text-center p-10 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            <i class="fas fa-exclamation-triangle fa-2x mb-4"></i>
            <p class="font-semibold">Ocorreu um erro</p>
            <p class="text-sm">${message}</p>
        </div>
    `;
}

/**
 * Renderiza o estado de lista vazia.
 */
function renderEmptyState() {
    clientsListContainer.innerHTML = `
        <div class="text-center p-10 bg-slate-200 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-lg">
            <i class="fas fa-folder-open fa-2x mb-4"></i>
            <p class="font-semibold">Nenhum cliente encontrado</p>
            <p class="text-sm">Adicione o primeiro cliente no formulário acima.</p>
        </div>
    `;
}

/**
 * Renderiza a lista de clientes na tela.
 * @param {Array} clients - A lista de objetos de clientes.
 */
function renderClients(clients) {
    if (clients.length === 0) {
        renderEmptyState();
        return;
    }

    const clientCards = clients.map((client, index) => `
        <div class="client-card bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style="animation-delay: ${index * 50}ms;">
            <div class="flex flex-col h-full">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">${client.fields.nome || 'Nome não informado'}</h3>
                <div class="flex-grow space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                    <p><i class="fas fa-envelope mr-2 w-4 text-center"></i>${client.fields.email || 'E-mail não informado'}</p>
                    <p><i class="fas fa-phone mr-2 w-4 text-center"></i>${client.fields.telefone || 'Telefone não informado'}</p>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button class="edit-btn text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors" data-id="${client.id}" title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="delete-btn text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors" data-id="${client.id}" title="Excluir">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    clientsListContainer.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${clientCards}</div>`;
}

// =================================================================================
// LÓGICA DA API (FETCH, CREATE, UPDATE, DELETE)
// =================================================================================

/**
 * Função genérica para realizar requisições à API do Airtable.
 * @param {string} url - A URL do endpoint.
 * @param {object} options - As opções da requisição (método, headers, body).
 * @returns {Promise<object>} - Os dados da resposta em JSON.
 */
async function apiRequest(url, options) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Erro na requisição: ${response.statusText} - ${errorData.error?.message || 'Detalhes indisponíveis'}`);
    }
    return response.json();
}

/**
 * Busca os clientes na API do Airtable.
 */
async function fetchClients() {
    // Verificação de credenciais antes de fazer a chamada
    if (AIRTABLE_API_KEY === 'SEU_AIRTABLE_API_KEY' || AIRTABLE_BASE_ID === 'SEU_AIRTABLE_BASE_ID') {
        renderErrorState("As credenciais da API do Airtable não foram configuradas. Edite o arquivo script.js para adicioná-las.");
        return;
    }

    renderLoadingState();
    try {
        const data = await apiRequest(API_URL, { method: 'GET' });
        renderClients(data.records);
    } catch (error) {
        renderErrorState(error.message);
    }
}

/**
 * Adiciona um novo cliente.
 * @param {Event} event - O evento de submit do formulário.
 */
async function addClient(event) {
    event.preventDefault();
    const formData = new FormData(clientForm);
    const clientData = {
        fields: {
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
        },
    };

    try {
        await apiRequest(API_URL, {
            method: 'POST',
            body: JSON.stringify(clientData),
        });
        showToastMessage('Cliente criado com sucesso!');
        clientForm.reset();
        fetchClients();
    } catch (error) {
        showToastMessage(`Erro ao criar cliente: ${error.message}`, 'error');
    }
}

/**
 * Deleta um cliente.
 * @param {string} id - O ID do cliente a ser deletado.
 */
async function deleteClient(id) {
    try {
        await apiRequest(`${API_URL}/${id}`, { method: 'DELETE' });
        showToastMessage('Cliente excluído com sucesso!');
        fetchClients();
    } catch (error) {
        showToastMessage(`Erro ao excluir cliente: ${error.message}`, 'error');
    }
}

/**
 * Atualiza um cliente.
 * @param {Event} event - O evento de submit do formulário de edição.
 */
async function updateClient(event) {
    event.preventDefault();
    const formData = new FormData(editClientForm);
    const id = formData.get('id');
    const clientData = {
        fields: {
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
        },
    };

    try {
        await apiRequest(`${API_URL}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(clientData),
        });
        showToastMessage('Cliente atualizado com sucesso!');
        closeEditModal();
        fetchClients();
    } catch (error) {
        showToastMessage(`Erro ao atualizar cliente: ${error.message}`, 'error');
    }
}


// =================================================================================
// LÓGICA DO MODAL DE EDIÇÃO
// =================================================================================

/**
 * Abre o modal de edição com os dados de um cliente específico.
 * @param {string} id - O ID do cliente a ser editado.
 */
async function openEditModal(id) {
    try {
        const client = await apiRequest(`${API_URL}/${id}`, { method: 'GET' });
        document.getElementById('edit-id').value = client.id;
        document.getElementById('edit-nome').value = client.fields.nome || '';
        document.getElementById('edit-email').value = client.fields.email || '';
        document.getElementById('edit-telefone').value = client.fields.telefone || '';

        editModal.classList.remove('hidden', 'opacity-0');
        editModal.querySelector('.modal-content').classList.remove('scale-95');
    } catch (error) {
        showToastMessage(`Erro ao carregar dados do cliente: ${error.message}`, 'error');
    }
}

/**
 * Fecha o modal de edição.
 */
function closeEditModal() {
    editModal.classList.add('opacity-0');
    editModal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => {
        editModal.classList.add('hidden');
    }, 300); // Aguarda a transição do CSS
}

// =================================================================================
// EVENT LISTENERS
// =================================================================================

// Adiciona cliente
clientForm.addEventListener('submit', addClient);

// Deleta ou edita cliente (delegação de eventos)
clientsListContainer.addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit-btn');
    const deleteButton = event.target.closest('.delete-btn');

    if (editButton) {
        const id = editButton.dataset.id;
        openEditModal(id);
    }

    if (deleteButton) {
        const id = deleteButton.dataset.id;
        // Adicionar uma confirmação seria ideal em um app real
        deleteClient(id);
    }
});

// Fecha o modal de edição
cancelEditButton.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (event) => {
    if (event.target === editModal) { // Fecha apenas se clicar no fundo
        closeEditModal();
    }
});

// Atualiza cliente
editClientForm.addEventListener('submit', updateClient);

// =================================================================================
// INICIALIZAÇÃO
// =================================================================================

// Carrega os clientes quando a página é carregada
document.addEventListener('DOMContentLoaded', fetchClients);

