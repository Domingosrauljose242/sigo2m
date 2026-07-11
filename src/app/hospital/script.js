// Importa o ipcRenderer diretamente graças ao nodeIntegration: true
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    // Seletores do Modal
    const modal = document.getElementById('hospitalModal');
    const btnAdd = document.querySelector('.btn-add');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const hospitalForm = document.getElementById('hospitalForm');
    
    // Seletores dos Elementos da Interface
    const totalUnidadesTxt = document.querySelector('.card-blue .card-value');
    const tableBody = document.getElementById('hospitaisTableBody');

    // Inicialização da Tela: Carrega os dados reais vindos do SQLite
    recuperarDadosDoBanco();

    function recuperarDadosDoBanco() {
        ipcRenderer.send('get-dashboard-stats'); // Pede o número total para o Card
        ipcRenderer.send('get-hospitais-lista');  // Pede a lista para a Tabela
    }

    // Retorno do Contador dos Cards
    ipcRenderer.on('dashboard-stats-result', (_event, res) => {
        if (res.success) {
            totalUnidadesTxt.textContent = res.totalHospitais;
            const subtitulo = document.querySelector('.title-section p');
            if (subtitulo) {
                subtitulo.textContent = `${res.totalHospitais} unidades de saúde registadas na província do Moxico`;
            }
        }
    });

    // Retorno da Lista do SQLite para Popular a Tabela Dinamicamente
    ipcRenderer.on('hospitais-lista-result', (_event, res) => {
        if (!res.success) {
            console.error("Erro ao obter lista:", res.error);
            return;
        }

        // Limpa a tabela antes de desenhar as linhas novas
        tableBody.innerHTML = '';

        if (!res.lista || res.lista.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="no-data">Nenhum hospital localizado no banco.</td></tr>`;
            return;
        }

        // Desenha cada linha vinda da base de dados
        res.lista.forEach(hospital => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${hospital.id}</strong></td>
                <td>${hospital.nome}</td>
                <td>${hospital.endereco || '<span style="color:#cbd5e1;">Não informado</span>'}</td>
                <td>${hospital.telefone || '<span style="color:#cbd5e1;">--</span>'}</td>
            `;
            tableBody.appendChild(tr);
        });
    });

    // Eventos de Controlo do Modal (Abrir / Fechar)
    btnAdd.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    const fecharModal = () => {
        modal.style.display = 'none';
        hospitalForm.reset();
    };

    closeModalBtn.addEventListener('click', fecharModal);
    cancelModalBtn.addEventListener('click', fecharModal);
    
    window.addEventListener('click', (e) => { 
        if (e.target === modal) fecharModal(); 
    });

    // Submissão do Formulário enviando diretamente para o SQLite via IPC
    hospitalForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const dadosHospital = {
            nome: document.getElementById('hospitalName').value.trim(),
            endereco: document.getElementById('hospitalAddress').value.trim(),
            telefone: document.getElementById('hospitalPhone').value.trim() || null
        };

        // Envia o objeto para o processo principal tratar no SQLite
        ipcRenderer.send('add-hospital', dadosHospital);
    });

    // Resposta de Sucesso ao Adicionar
    ipcRenderer.on('add-hospital-result', (_event, result) => {
        if (result.success) {
            fecharModal();
            recuperarDadosDoBanco(); // Força a atualização do card e da tabela na hora!
        } else {
            alert(`Erro ao salvar no SQLite: ${result.error}`);
        }
    });
});