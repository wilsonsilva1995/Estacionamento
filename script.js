
class Vaga {
    constructor(id, tempoMaximoMinutos = 120) {
        this.id = id;
        this.tempoMaximo = tempoMaximoMinutos * 60 * 1000;
        this.ocupado = false;
        this.placa = null;
        this.horaEntrada = null;
    }

    estacionar(placa) {
        if (this.ocupado) return false;
        this.ocupado = true;
        this.placa = placa.toUpperCase().trim();
        this.horaEntrada = new Date();
        return true;
    }

    sair() {
        if (!this.ocupado) return null;
        
        const horaSaida = new Date();
        const tempoPermanencia = horaSaida - this.horaEntrada;
        const tempoExcedido = tempoPermanencia > this.tempoMaximo;
        
        let multa = 0;
        if (tempoExcedido) {
            const excesso = tempoPermanencia - this.tempoMaximo;
            const horasExcedidas = Math.floor(excesso / (60 * 60 * 1000)) + 1;
            multa = horasExcedidas * 5.0;
        }
        
        const dados = {
            vaga: this.id,
            placa: this.placa,
            horaEntrada: this.horaEntrada.toLocaleString('pt-BR'),
            horaSaida: horaSaida.toLocaleString('pt-BR'),
            tempoPermanencia: this._formatarTempo(tempoPermanencia),
            tempoMaximo: this._formatarTempo(this.tempoMaximo),
            excedeu: tempoExcedido,
            multa: multa
        };
        
        this.ocupado = false;
        this.placa = null;
        this.horaEntrada = null;
        
        return dados;
    }

    tempoRestante() {
        if (!this.ocupado) return null;
        const agora = new Date();
        const decorrido = agora - this.horaEntrada;
        const restante = this.tempoMaximo - decorrido;
        if (restante <= 0) return "⏰ Excedeu!";
        const minutos = Math.floor(restante / (60 * 1000));
        const segundos = Math.floor((restante % (60 * 1000)) / 1000);
        return `${minutos}min ${segundos}s`;
    }

    _formatarTempo(milissegundos) {
        const minutos = Math.floor(milissegundos / (60 * 1000));
        const segundos = Math.floor((milissegundos % (60 * 1000)) / 1000);
        return `${minutos}min ${segundos}s`;
    }
}


class Estacionamento {
    constructor(numVagas = 10, tempoMaximoMinutos = 120) {
        this.vagas = [];
        for (let i = 1; i <= numVagas; i++) {
            this.vagas.push(new Vaga(i, tempoMaximoMinutos));
        }
        this.historico = [];
        this.caixa = 0;
        this._carregarBackup();
    }

    encontrarVagaLivre() {
        return this.vagas.find(vaga => !vaga.ocupado);
    }

    vagasLivres() {
        return this.vagas.filter(vaga => !vaga.ocupado).length;
    }

    estacionarVeiculo(placa) {
        if (!placa || placa.trim() === "") {
            throw new Error("Placa é obrigatória");
        }
        
        const vaga = this.encontrarVagaLivre();
        if (!vaga) {
            throw new Error("Estacionamento lotado!");
        }
        
        vaga.estacionar(placa);
        this._salvarBackup();
        return true;
    }

    removerVeiculo(placa) {
        if (!placa || placa.trim() === "") {
            throw new Error("Placa é obrigatória");
        }
        
        const vaga = this.vagas.find(v => v.ocupado && v.placa === placa);
        if (!vaga) {
            throw new Error("Veículo não encontrado!");
        }
        
        const dadosSaida = vaga.sair();
        this.historico.unshift(dadosSaida); 
        this.caixa += dadosSaida.multa;
        
        
        if (this.historico.length > 50) {
            this.historico = this.historico.slice(0, 50);
        }
        
        this._salvarBackup();
        return dadosSaida;
    }

    getEstatisticas() {
        return {
            caixa: this.caixa,
            vagasLivres: this.vagasLivres(),
            totalVagas: this.vagas.length,
            totalVeiculos: this.historico.length,
            vagasOcupadas: this.vagas.length - this.vagasLivres()
        };
    }

    getHistorico() {
        return this.historico;
    }

    limparHistorico() {
        this.historico = [];
        this.caixa = 0;
        this._salvarBackup();
    }

    _salvarBackup() {
        const backup = {
            caixa: this.caixa,
            historico: this.historico,
            vagas: this.vagas.map(v => ({
                id: v.id,
                ocupado: v.ocupado,
                placa: v.placa,
                horaEntrada: v.horaEntrada
            }))
        };
        localStorage.setItem('estacionamento_backup', JSON.stringify(backup));
    }

    _carregarBackup() {
        const backup = localStorage.getItem('estacionamento_backup');
        if (backup) {
            try {
                const dados = JSON.parse(backup);
                this.caixa = dados.caixa || 0;
                this.historico = dados.historico || [];
                
                
                if (dados.vagas) {
                    dados.vagas.forEach((vagaData, index) => {
                        if (vagaData.ocupado && this.vagas[index]) {
                            this.vagas[index].ocupado = true;
                            this.vagas[index].placa = vagaData.placa;
                            this.vagas[index].horaEntrada = vagaData.horaEntrada ? new Date(vagaData.horaEntrada) : null;
                        }
                    });
                }
            } catch (e) {
                console.error("Erro ao carregar backup:", e);
            }
        }
    }
}


let estacionamento = null;

function init() {
    estacionamento = new Estacionamento(10, 120);
    
    
    document.getElementById('btnEntrada').addEventListener('click', registrarEntrada);
    document.getElementById('btnSaida').addEventListener('click', registrarSaida);
    document.getElementById('btnBackup').addEventListener('click', salvarBackupManual);
    document.getElementById('btnLimparHistorico').addEventListener('click', limparHistorico);
    
    
    document.getElementById('placaInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registrarEntrada();
    });
    document.getElementById('placaSaidaInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registrarSaida();
    });
    
    atualizarUI();
    setInterval(atualizarUI, 1000); 
}

function registrarEntrada() {
    const placaInput = document.getElementById('placaInput');
    const placa = placaInput.value;
    
    try {
        estacionamento.estacionarVeiculo(placa);
        placaInput.value = '';
        atualizarUI();
        mostrarNotificacao(`✅ Veículo ${placa} estacionado com sucesso!`, 'success');
    } catch (error) {
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    }
}

function registrarSaida() {
    const placaInput = document.getElementById('placaSaidaInput');
    const placa = placaInput.value;
    
    try {
        const dados = estacionamento.removerVeiculo(placa);
        placaInput.value = '';
        atualizarUI();
        
        if (dados.excedeu) {
            mostrarNotificacao(`⚠️ Veículo ${placa} excedeu o tempo! Multa: R$ ${dados.multa.toFixed(2)}`, 'warning');
        } else {
            mostrarNotificacao(`✅ Veículo ${placa} saiu dentro do prazo!`, 'success');
        }
    } catch (error) {
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    }
}

function atualizarUI() {
    
    const stats = estacionamento.getEstatisticas();
    document.getElementById('caixaTotal').textContent = `R$ ${stats.caixa.toFixed(2)}`;
    document.getElementById('vagasLivres').textContent = stats.vagasLivres;
    document.getElementById('totalVeiculos').textContent = stats.totalVeiculos;
    
    
    const mapaDiv = document.getElementById('mapaVagas');
    mapaDiv.innerHTML = '';
    
    estacionamento.vagas.forEach(vaga => {
        const vagaCard = document.createElement('div');
        vagaCard.className = `vaga-card ${vaga.ocupado ? 'ocupada' : 'livre'}`;
        vagaCard.onclick = () => {
            if (vaga.ocupado) {
                document.getElementById('placaSaidaInput').value = vaga.placa;
                registrarSaida();
            }
        };
        
        vagaCard.innerHTML = `
            <div class="vaga-numero">Vaga ${vaga.id}</div>
            <div class="vaga-status">${vaga.ocupado ? '🔴 OCUPADA' : '🟢 LIVRE'}</div>
            ${vaga.ocupado ? `<div class="vaga-placa">${vaga.placa}</div>` : ''}
            ${vaga.ocupado ? `<div class="vaga-tempo">⏱️ ${vaga.tempoRestante()}</div>` : ''}
        `;
        
        mapaDiv.appendChild(vagaCard);
    });
    
    
    const historicoDiv = document.getElementById('historicoLista');
    historicoDiv.innerHTML = '';
    
    estacionamento.getHistorico().slice(0, 20).forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `historico-item ${item.excedeu ? 'multa' : ''}`;
        itemDiv.innerHTML = `
            <strong>${item.placa}</strong> - Vaga ${item.vaga}<br>
            Entrada: ${item.horaEntrada} | Saída: ${item.horaSaida}<br>
            Tempo: ${item.tempoPermanencia} / ${item.tempoMaximo}<br>
            ${item.excedeu ? `<strong style="color: #dc3545;">⚠️ Multa: R$ ${item.multa.toFixed(2)}</strong>` : '✅ Dentro do prazo'}
        `;
        historicoDiv.appendChild(itemDiv);
    });
    
    if (estacionamento.getHistorico().length === 0) {
        historicoDiv.innerHTML = '<p style="text-align: center; color: #666;">Nenhum movimento registrado ainda</p>';
    }
}

function salvarBackupManual() {
    mostrarNotificacao('💾 Backup salvo automaticamente no navegador!', 'success');
}

function limparHistorico() {
    if (confirm('Tem certeza que deseja limpar todo o histórico e zerar o caixa?')) {
        estacionamento.limparHistorico();
        atualizarUI();
        mostrarNotificacao('🗑️ Histórico limpo com sucesso!', 'success');
    }
}

function mostrarNotificacao(mensagem, tipo) {
    
    const notification = document.createElement('div');
    notification.textContent = mensagem;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#ffc107'};
        color: ${tipo === 'warning' ? '#333' : 'white'};
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


window.addEventListener('DOMContentLoaded', init);