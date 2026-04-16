https://auto2h.netlify.app/

📌 O QUE É ESTE PROJETO?
É um sistema de gestão de estacionamento rotativo (Autocar) que resolve um problema real:

Problema: Motoristas ocupam vagas por tempo indeterminado, prejudicando o rodízio.

Solução: Sistema que controla tempo máximo (2h) e aplica multas automáticas por excesso.


## 📋 Funcionalidades
- ✅ Registrar entrada de veículos
- ✅ Registrar saída com cálculo automático de multa
- ✅ Mapa visual das vagas (10 vagas)
- ✅ Histórico de movimentações
- ✅ Backup automático no LocalStorage
- ✅ Cálculo de multa por excesso de tempo (R$ 5/hora)
- ✅ Interface responsiva


## 🛠️ Tecnologias
- HTML5
- CSS3
- JavaScript 

## 👨‍💻 Como executar localmente
1. Clone o repositório
2. Abra o arquivo `index.html` no VS Code
3. Use a extensão "Live Server" ou abra diretamente no navegador

## 📊 Regras de Negócio
- Tempo máximo: 2 horas
- Multa por hora excedida: R$ 5,00
- Capacidade: 10 vagas


## 🧠 LÓGICA DE NEGÓCIO (REGRA DE OURO)
javascript
// Regra principal do sistema
Tempo máximo = 120 minutos (2 horas)
Multa = R$ 5,00 por hora ou fração excedida

// Exemplo prático:
Carro entrou às 10:00
Saiu às 13:15
Tempo total = 3h15 (excedeu 1h15)
Multa = 2 horas excedidas × R$5 = R$10,00
