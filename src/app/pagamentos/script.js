const { ipcRenderer } = require('electron');

let pagamentosLista = [];
let filtroAtual = 'todos';
let termoPesquisa = '';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
        const avatar = document.getElementById('userAvatar');
        if (avatar) avatar.textContent = user.username.substring(0, 2).toUpperCase();
    }

    const modal = document.getElementById('pagamentoModal');
    const btnAdd = document.getElementById('btnAddPagamento');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const pagamentoForm = document.getElementById('pagamentoForm');
    const searchInput = document.getElementById('searchInput');
    const dataInput = document.getElementById('dataInput');

    dataInput.value = new Date().toISOString().split('T')[0];

    carregarDados();

    btnAdd.addEventListener('click', () => {
        ipcRenderer.send('get-medicos-lista');
        modal.style.display = 'flex';
    });

    const fecharModal = () => {
        modal.style.display = 'none';
        pagamentoForm.reset();
        dataInput.value = new Date().toISOString().split('T')[0];
        document.getElementById('statusSelect').value = 'Pago';
    };

    closeModalBtn.addEventListener('click', fecharModal);
    cancelModalBtn.addEventListener('click', fecharModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });

    searchInput.addEventListener('input', (e) => {
        termoPesquisa = e.target.value.trim().toLowerCase();
        renderizarTabela();
    });

    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            filtroAtual = btn.dataset.filter;
            renderizarTabela();
        });
    });

    pagamentoForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const medicoId = document.getElementById('medicoSelect').value;
        if (!medicoId) {
            showToast('Seleccione um médico.', true);
            return;
        }

        const dados = {
            medico_id: parseInt(medicoId, 10),
            valor: parseFloat(document.getElementById('valorInput').value),
            data_pagamento: document.getElementById('dataInput').value,
            metodo_pagamento: document.getElementById('metodoSelect').value,
            status: document.getElementById('statusSelect').value,
            observacoes: document.getElementById('observacoesInput').value.trim() || null,
        };

        ipcRenderer.send('add-pagamento', dados);
    });
});

function carregarDados() {
    ipcRenderer.send('get-pagamentos-stats');
    ipcRenderer.send('get-pagamentos-lista');
    ipcRenderer.send('get-medicos-lista');
}

ipcRenderer.on('pagamentos-stats-result', (_event, res) => {
    if (!res.success) return;

    const { total, pagos, pendentes, receita_total } = res.stats;
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPagos').textContent = pagos;
    document.getElementById('statPendentes').textContent = pendentes;
    document.getElementById('statReceita').textContent = formatarMoeda(receita_total);

    const badge = document.getElementById('pendingBadge');
    if (badge) {
        badge.style.display = pendentes > 0 ? 'block' : 'none';
    }

    const subtitle = document.getElementById('subtitleText');
    if (subtitle) {
        subtitle.textContent = `${total} registo${total !== 1 ? 's' : ''} de pagamento — ${pendentes} pendente${pendentes !== 1 ? 's' : ''}`;
    }
});

ipcRenderer.on('pagamentos-lista-result', (_event, res) => {
    if (!res.success) {
        console.error('Erro ao obter pagamentos:', res.error);
        return;
    }
    pagamentosLista = res.lista || [];
    renderizarTabela();
});

ipcRenderer.on('medicos-lista-result', (_event, res) => {
    if (!res.success) return;

    const select = document.getElementById('medicoSelect');
    const hint = document.getElementById('medicosHint');
    const lista = res.lista || [];

    select.innerHTML = '<option value="">Seleccionar médico...</option>';

    if (lista.length === 0) {
        hint.style.display = 'block';
        return;
    }

    hint.style.display = 'none';
    lista.forEach((medico) => {
        const opt = document.createElement('option');
        opt.value = medico.id;
        opt.textContent = medico.especialidade
            ? `${medico.nome} — ${medico.especialidade}`
            : medico.nome;
        select.appendChild(opt);
    });
});

ipcRenderer.on('add-pagamento-result', (_event, result) => {
    if (result.success) {
        document.getElementById('pagamentoModal').style.display = 'none';
        document.getElementById('pagamentoForm').reset();
        document.getElementById('dataInput').value = new Date().toISOString().split('T')[0];
        document.getElementById('statusSelect').value = 'Pago';
        carregarDados();
        showToast('Pagamento registado com sucesso!');
    } else {
        showToast(`Erro: ${result.error}`, true);
    }
});

ipcRenderer.on('update-pagamento-status-result', (_event, result) => {
    if (result.success) {
        carregarDados();
        showToast('Pagamento confirmado com sucesso!');
    } else {
        showToast(`Erro: ${result.error}`, true);
    }
});

function renderizarTabela() {
    const tbody = document.getElementById('pagamentosTableBody');
    let filtrados = pagamentosLista;

    if (filtroAtual !== 'todos') {
        filtrados = filtrados.filter((p) => p.status === filtroAtual);
    }

    if (termoPesquisa) {
        filtrados = filtrados.filter((p) => {
            const nome = (p.medico_nome || '').toLowerCase();
            const id = String(p.id);
            return nome.includes(termoPesquisa) || id.includes(termoPesquisa);
        });
    }

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="no-data">Nenhum pagamento encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map((p) => {
        const isPago = p.status === 'Pago';
        const statusClass = isPago ? 'status-pago' : 'status-pendente';
        const valorClass = isPago ? 'valor-pago' : 'valor-pendente';
        const dataFormatada = formatarData(p.data_pagamento);

        const acoes = isPago
            ? `<button class="btn-action btn-confirm" disabled title="Já confirmado">✓ Pago</button>`
            : `<button class="btn-action btn-confirm" onclick="confirmarPagamento(${p.id})">✓ Confirmar</button>`;

        return `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td>${p.medico_nome || '<span style="color:#cbd5e1;">—</span>'}</td>
                <td>${p.especialidade || '<span style="color:#cbd5e1;">—</span>'}</td>
                <td class="${valorClass}">${formatarMoeda(p.valor)}</td>
                <td>${dataFormatada}</td>
                <td>${p.metodo_pagamento || '—'}</td>
                <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                <td><div class="action-btns">${acoes}</div></td>
            </tr>
        `;
    }).join('');
}

window.confirmarPagamento = function (id) {
    ipcRenderer.send('update-pagamento-status', { id, status: 'Pago' });
};

function formatarMoeda(valor) {
    return `AOA ${Number(valor || 0).toLocaleString('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatarData(dataStr) {
    if (!dataStr) return '—';
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
}

function showToast(msg, isError) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = isError ? '#dc2626' : '#0c1a30';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
