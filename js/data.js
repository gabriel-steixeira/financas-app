// =============================================
// DADOS FINANCEIROS - Gabriel & Clara
// Extraídos do Google Sheets (Fev 2026)
// =============================================

const FINANCAS_DATA = {
  // ====== GABRIEL ======
  gabriel: {
    novembro: {
      mes: 'Novembro',
      ano: 2025,
      receitas: [
        { data: '01/11/2025', categoria: 'Sobra do Mês passado', descricao: 'Sobra do mês passado em conta', valor: 89.00 },
        { data: '05/11/2025', categoria: 'Pix', descricao: 'Salário XP', valor: 3200.00 },
        { data: '10/11/2025', categoria: 'Extra', descricao: 'Freelance desenvolvimento', valor: 800.00 },
      ],
      gastos: [
        { data: '05/11/2025', categoria: 'Investimento', descricao: 'Cofrinho ML', valor: 500.00, status: 'Pago' },
        { data: '10/11/2025', categoria: 'Boleto', descricao: 'Casamento - 4 de 17', valor: 1249.00, status: 'Pago' },
        { data: '10/11/2025', categoria: 'Boleto', descricao: 'Parcela Construtora', valor: 994.60, status: 'Pago' },
        { data: '15/11/2025', categoria: 'Fatura cartão', descricao: 'Fatura XP', valor: 2800.00, status: 'Pago' },
        { data: '10/11/2025', categoria: 'Boleto', descricao: 'Celular/Claro', valor: 43.54, status: 'Pago' },
      ],
      faturas: {}
    },
    dezembro: {
      mes: 'Dezembro',
      ano: 2025,
      receitas: [
        { data: '01/12/2025', categoria: 'Sobra do Mês passado', descricao: 'Sobra do mês passado em conta', valor: 55.00 },
        { data: '05/12/2025', categoria: 'Pix', descricao: 'Salário XP', valor: 3800.00 },
        { data: '15/12/2025', categoria: 'Extra', descricao: 'Serviço extra', valor: 600.00 },
      ],
      gastos: [
        { data: '05/12/2025', categoria: 'Investimento', descricao: 'Cofrinho ML', valor: 600.00, status: 'Pago' },
        { data: '10/12/2025', categoria: 'Boleto', descricao: 'Casamento - 5 de 17', valor: 1249.00, status: 'Pago' },
        { data: '10/12/2025', categoria: 'Boleto', descricao: 'Parcela Construtora', valor: 994.60, status: 'Pago' },
        { data: '15/12/2025', categoria: 'Fatura cartão', descricao: 'Fatura XP', valor: 2950.00, status: 'Pago' },
        { data: '10/12/2025', categoria: 'Boleto', descricao: 'Celular/Claro', valor: 43.54, status: 'Pago' },
      ],
      faturas: {}
    },
    janeiro: {
      mes: 'Janeiro',
      ano: 2026,
      receitas: [
        { data: '01/01/2026', categoria: 'Sobra do Mês passado', descricao: 'Sobra do mês passado em conta', valor: 72.00 },
        { data: '05/01/2026', categoria: 'Pix', descricao: 'Salário XP', valor: 4200.00 },
        { data: '10/01/2026', categoria: 'Extra', descricao: 'Serviço Clinica', valor: 850.00 },
        { data: '15/01/2026', categoria: 'Pix', descricao: 'Clara mandou', valor: 947.00 },
        { data: '20/01/2026', categoria: 'Retirada Investimento', descricao: 'Cofrinho ML', origem: 'ML', valor: 2500.00 },
      ],
      gastos: [
        { data: '05/01/2026', categoria: 'Investimento', descricao: 'Cofrinho ML', valor: 947.00, status: 'Pago' },
        { data: '10/01/2026', categoria: 'Boleto', descricao: 'Casamento - 6 de 17', valor: 1249.00, status: 'Pago' },
        { data: '10/01/2026', categoria: 'Boleto', descricao: 'Evolução de Obra', valor: 901.03, destino: 'Caixa', status: 'Pago' },
        { data: '10/01/2026', categoria: 'Boleto', descricao: 'Parcela Construtora', valor: 994.60, status: 'Pago' },
        { data: '15/01/2026', categoria: 'Fatura cartão', descricao: 'Fatura XP', valor: 3100.00, status: 'Pago' },
        { data: '10/01/2026', categoria: 'Fatura cartão', descricao: 'Fatura NUBANK', valor: 280.00, status: 'Pago' },
        { data: '10/01/2026', categoria: 'Fatura cartão', descricao: 'Fatura FREE', valor: 450.00, status: 'Pago' },
        { data: '10/01/2026', categoria: 'Boleto', descricao: 'Celular/Claro', valor: 43.54, status: 'Pago' },
        { data: '15/01/2026', categoria: 'Boleto', descricao: 'Parcela Músicos - 1 de 12', valor: 250.00, status: 'Pago' },
      ],
      faturas: {}
    },
    fevereiro: {
      mes: 'Fevereiro',
      ano: 2026,
      receitas: [
        { data: '01/02/2026', categoria: 'Sobra do Mês passado', descricao: 'Sobra do mês passado em conta', valor: 103.01 },
        { data: '03/02/2026', categoria: 'Extra', descricao: 'Serviço Clinica 1/2', origem: 'ML', valor: 425.00 },
        { data: '03/02/2026', categoria: 'Pix', descricao: 'Ajuda do Pai no Casamento', destino: 'XP', valor: 500.00 },
        { data: '03/02/2026', categoria: 'Pix', descricao: 'Pai mandou do uber', destino: 'XP', valor: 15.00 },
        { data: '05/02/2026', categoria: 'Pix', descricao: 'App da ZonaAzul', origem: 'XP', valor: 5.00 },
        { data: '05/02/2026', categoria: 'Pix', descricao: 'Gastos da mãe no adicional', destino: 'XP', valor: 1000.00 },
        { data: '05/02/2026', categoria: 'Pix', descricao: 'Clara mandou', valor: 947.00 },
        { data: '09/02/2026', categoria: 'Retirada Investimento', descricao: 'Cofrinho ML', origem: 'ML', destino: 'Caixa', valor: 701.03 },
        { data: '10/02/2026', categoria: 'Retirada Investimento', descricao: 'Cofrinho ML', origem: 'ML', valor: 1757.17 },
        { data: '10/02/2026', categoria: 'Retirada Investimento', descricao: 'Cofrinho ML', origem: 'ML', valor: 1137.00 },
        { data: '11/02/2026', categoria: 'Retirada Investimento', descricao: 'Cofrinho ML', origem: 'ML', valor: 34.99 },
      ],
      gastos: [
        { data: '03/02/2026', categoria: 'Investimento', descricao: 'Cofrinho ML', destino: 'ML', valor: 425.00, status: 'Pago' },
        { data: '03/02/2026', categoria: 'Investimento', descricao: 'Cofrinho ML', destino: 'ML', valor: 515.00, status: 'Pago' },
        { data: '05/02/2026', categoria: 'Investimento', descricao: 'Cofrinho ML', destino: 'ML', valor: 947.00, status: 'Pago' },
        { data: '05/02/2026', categoria: 'Boleto', descricao: 'Ajuda com conta de luz', origem: 'Santander', valor: 100.00, status: 'Pago' },
        { data: '09/02/2026', categoria: 'Fatura cartão', descricao: 'Fatura do cartão NUBANK', valor: 253.98, status: 'Pago' },
        { data: '10/02/2026', categoria: 'Presente', descricao: 'Ajuda mãe com convênio', origem: 'XP', valor: 1137.00, status: 'Pago' },
        { data: '10/02/2026', categoria: 'Boleto', descricao: 'Casamento - 7 de 17', origem: 'Santander', valor: 1249.00, status: 'Pago' },
        { data: '10/02/2026', categoria: 'Boleto', descricao: 'Evolução de Obra Agosto', origem: 'Santander', destino: 'Caixa', valor: 901.03, status: 'Pago' },
        { data: '10/02/2026', categoria: 'Fatura cartão', descricao: 'Fatura do cartão SX final 4182', valor: 60.28, status: 'Pago' },
        { data: '10/02/2026', categoria: 'Fatura cartão', descricao: 'Fatura do cartão FREE final 8669', valor: 437.87, status: 'Pago' },
        { data: '10/02/2026', categoria: 'Boleto', descricao: 'Celular/Claro', origem: 'XP', valor: 43.54, status: 'Pago' },
        { data: '10/02/2026', categoria: 'Boleto', descricao: 'Parcela Cerimonialista - 1 de 10', origem: 'XP', valor: 149.00, status: 'Pago' },
        { data: '11/02/2026', categoria: 'Fatura cartão', descricao: 'Fatura do cartão Montreal', valor: 34.99, status: 'Pago' },
        { data: '15/02/2026', categoria: 'Boleto', descricao: 'Parcela Construtora', valor: 994.60, status: 'Pago' },
        { data: '15/02/2026', categoria: 'Fatura cartão', descricao: 'Fatura XP', origem: 'XP', valor: 3266.91, status: 'Pago' },
        { data: '15/02/2026', categoria: 'Boleto', descricao: 'Parcela Músicos - 2 de 12', origem: 'XP', valor: 250.00, status: 'Pago' },
        { data: '18/02/2026', categoria: 'Fatura cartão', descricao: 'Fatura ML', origem: 'ML', valor: 149.81, status: 'Pago' },
      ],
      faturas: {
        'SX': {
          nome: 'Santander SX',
          total: 60.28,
          itens: [
            { data: '05/04/2025', nome: 'Lego Trem - Decoração', parcela: '10 de 10', valor: 60.28 },
          ]
        },
        'FREE': {
          nome: 'Santander FREE',
          total: 437.87,
          itens: [
            { data: '08/07/2024', nome: 'Assinatura do Investidor 10', parcela: '7 de 12', valor: 19.90 },
            { data: '', nome: 'Seguro Cartão/Mochila e Celular', parcela: 'Mensal', valor: 19.99 },
            { data: '24/04/2025', nome: 'Finclass', parcela: '11 de 12', valor: 34.90 },
            { data: '20/09/2025', nome: 'iPhone 15', parcela: '6 de 12', valor: 363.10 },
          ]
        },
        'NUBANK': {
          nome: 'Nubank',
          total: 253.98,
          itens: [
            { data: '02/07/2025', nome: 'Curso Trade IA Cripto', parcela: '6 de 12', valor: 20.19 },
            { data: '03/08/2025', nome: 'Alianças Noivado/Casamento', parcela: '6 de 10', valor: 148.50 },
            { data: '26/08/2025', nome: 'Robô FX100', parcela: '6 de 10', valor: 35.39 },
            { data: '28/08/2025', nome: 'Indicador Toreda', parcela: '6 de 12', valor: 49.90 },
          ]
        },
        'XP': {
          nome: 'Cartão XP',
          total: 3266.91,
          itens: [
            { data: '12/11/2025', nome: 'Presente casamento Valdeci', parcela: '3 de 10', valor: 12.52 },
            { data: '26/11/2025', nome: 'Investimento', parcela: '3 de 6', valor: 34.88 },
            { data: '13/12/2025', nome: 'Presente Clara', parcela: '2 de 2', valor: 89.99 },
            { data: '', nome: 'Besni', parcela: '2 de 2', valor: 94.99 },
            { data: '', nome: 'Maky Kau', parcela: '2 de 4', valor: 112.40 },
            { data: '17/12/2025', nome: 'Wellhub', parcela: 'Mensal', valor: 59.90 },
            { data: '', nome: 'Aparelho', parcela: '2 de 10', valor: 160.00 },
            { data: '22/12/2025', nome: 'Presente Dia 19', parcela: '2 de 3', valor: 35.93 },
            { data: '', nome: 'Presente Helena', parcela: '2 de 3', valor: 37.91 },
            { data: '', nome: 'Blusa de Lã', parcela: '2 de 3', valor: 24.95 },
            { data: '07/01/2026', nome: 'Remédio Esomex 20mg', parcela: 'Única', valor: 79.90 },
            { data: '10/01/2026', nome: 'Cinemark', parcela: 'Única', valor: 217.00 },
            { data: '', nome: 'Desodorante', parcela: 'Única', valor: 32.99 },
            { data: '', nome: 'Papel Brilhoso Kalunga', parcela: 'Única', valor: 28.90 },
            { data: '', nome: 'Estacionamento Shops', parcela: 'Única', valor: 20.00 },
            { data: '11/01/2026', nome: 'Uber/99', parcela: 'Única', valor: 10.05 },
            { data: '', nome: 'Gasolina', parcela: 'Única', valor: 80.00 },
            { data: '12/01/2026', nome: 'Gravatas dos padrinhos', parcela: '1 de 2', valor: 67.15 },
            { data: '13/01/2026', nome: 'Limpador de parabrisa', parcela: 'Única', valor: 64.90 },
            { data: '', nome: 'Girafestas', parcela: 'Única', valor: 129.00 },
            { data: '', nome: 'Rafael Costa', parcela: 'Única', valor: 212.00 },
            { data: '14/01/2026', nome: 'Tênis - O Precinho', parcela: '1 de 10', valor: 20.08 },
            { data: '', nome: 'Cada Passinho', parcela: 'Única', valor: 307.97 },
            { data: '15/01/2026', nome: 'Chocopan', parcela: '1 de 2', valor: 91.89 },
            { data: '16/01/2026', nome: 'HP - Controle Carro da Vó', parcela: 'Única', valor: 114.00 },
            { data: '', nome: 'Swag Calçados', parcela: '1 de 2', valor: 44.50 },
            { data: '', nome: 'Spani', parcela: 'Única', valor: 120.31 },
            { data: '', nome: 'PagMenos', parcela: 'Única', valor: 117.84 },
            { data: '17/01/2026', nome: 'Gasolina do carro da vó', parcela: 'Única', valor: 58.90 },
            { data: '18/01/2026', nome: 'LotoFácil', parcela: 'Diária', valor: 70.00 },
            { data: '19/01/2026', nome: 'Etec', parcela: '1 de 2', valor: 90.00 },
            { data: '', nome: 'Uber/99', parcela: 'Única', valor: 14.96 },
            { data: '', nome: 'Uber/99', parcela: 'Única', valor: 10.93 },
            { data: '24/01/2026', nome: 'Uber/99', parcela: 'Única', valor: 14.90 },
            { data: '', nome: 'Uber/99', parcela: 'Única', valor: 11.80 },
            { data: '', nome: 'Esfihas', parcela: 'Única', valor: 58.99 },
            { data: '27/01/2026', nome: 'Almoço Presencial XP', parcela: 'Única', valor: 86.50 },
            { data: '29/01/2026', nome: 'Parizzoto', parcela: 'Única', valor: 33.50 },
            { data: '', nome: 'Mercadinho', parcela: 'Única', valor: 10.70 },
            { data: '', nome: 'Salgado p Clara', parcela: 'Única', valor: 7.00 },
            { data: '30/01/2026', nome: 'Mesa Escritório', parcela: '1 de 6', valor: 31.35 },
            { data: '31/01/2026', nome: 'Gasolina', parcela: 'Única', valor: 50.00 },
            { data: '', nome: 'Filtro de linha', parcela: 'Única', valor: 32.88 },
            { data: '', nome: 'McDonalds', parcela: 'Única', valor: 203.80 },
            { data: '01/02/2026', nome: 'Quitanda', parcela: 'Única', valor: 15.90 },
            { data: '', nome: 'Uber/99', parcela: 'Única', valor: 10.94 },
            { data: '', nome: 'Uber/99', parcela: 'Única', valor: 9.96 },
            { data: '', nome: 'Uber/99', parcela: 'Única', valor: 1.00 },
            { data: '02/02/2026', nome: 'Uber/99', parcela: 'Única', valor: 14.95 },
            { data: '03/02/2026', nome: 'MegaSena', parcela: 'Única', valor: 6.00 },
          ]
        },
        'ML': {
          nome: 'Mercado Livre',
          total: 149.81,
          itens: [
            { data: '13/01/2026', nome: 'Balões Helena', parcela: '1 de 4', valor: 10.70 },
            { data: '', nome: 'Torneira Banheiro', parcela: 'Única', valor: 43.90 },
            { data: '30/01/2026', nome: 'Cadeira Escritório', parcela: '1 de 12', valor: 38.73 },
            { data: '02/02/2026', nome: 'Travesseiro novo', parcela: '1 de 7', valor: 19.98 },
            { data: '', nome: 'Monitor Gamer', parcela: '1 de 15', valor: 36.50 },
          ]
        },
        'MONTREAL': {
          nome: 'Montreal',
          total: 34.99,
          itens: [
            { data: '14/01/2026', nome: 'Roupas', parcela: 'Única', valor: 29.99 },
            { data: '', nome: 'Taxa app', parcela: 'Única', valor: 5.00 },
          ]
        }
      }
    }
  },

  // ====== CLARA ======
  clara: {
    novembro: {
      mes: 'Novembro',
      ano: 2025,
      receitas: [
        { data: '', categoria: 'Sobra do Mês passado', descricao: '', valor: 100.00 },
        { data: '', categoria: 'Salário', descricao: 'Salário Bê', valor: 3800.00 },
        { data: '', categoria: 'Salário', descricao: 'Salário Enrico', valor: 1961.00 },
        { data: '', categoria: 'Pix', descricao: 'Resinas', valor: 200.00 },
      ],
      gastos: [
        { data: '', categoria: 'Fatura cartão', descricao: 'Fatura cartão', valor: 1800.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Cell alice', valor: 85.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'APTO', valor: 947.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'FACULDADE', valor: 251.00, status: 'Pago' },
        { data: '', categoria: 'Transporte', descricao: 'Transporte do mês', valor: 471.00, status: 'Pago' },
        { data: '', categoria: 'Investimento', descricao: 'Reserva', valor: 350.00, status: 'Pago' },
      ],
      faturas: {}
    },
    dezembro: {
      mes: 'Dezembro',
      ano: 2025,
      receitas: [
        { data: '', categoria: 'Sobra do Mês passado', descricao: '', valor: 80.00 },
        { data: '', categoria: 'Salário', descricao: 'Salário Bê', valor: 4000.00 },
        { data: '', categoria: 'Salário', descricao: 'Salário Enrico', valor: 1961.00 },
      ],
      gastos: [
        { data: '', categoria: 'Fatura cartão', descricao: 'Fatura cartão', valor: 1900.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Cell alice', valor: 85.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'APTO', valor: 947.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'FACULDADE', valor: 251.00, status: 'Pago' },
        { data: '', categoria: 'Transporte', descricao: 'Transporte do mês', valor: 471.00, status: 'Pago' },
        { data: '', categoria: 'Investimento', descricao: 'Reserva', valor: 350.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'TIM', valor: 55.00, status: 'Pago' },
      ],
      faturas: {}
    },
    janeiro: {
      mes: 'Janeiro',
      ano: 2026,
      receitas: [
        { data: '', categoria: 'Sobra do Mês passado', descricao: '', valor: 90.00 },
        { data: '', categoria: 'Salário', descricao: 'Salário Bê', valor: 4131.00 },
        { data: '', categoria: 'Salário', descricao: 'Salário Enrico', valor: 1961.00 },
        { data: '', categoria: 'Pix', descricao: 'Resinas', valor: 150.00 },
      ],
      gastos: [
        { data: '', categoria: 'Fatura cartão', descricao: 'Fatura cartão', valor: 1950.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Cell alice', valor: 85.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'APTO', valor: 947.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'FACULDADE', valor: 251.00, status: 'Pago' },
        { data: '', categoria: 'Transporte', descricao: 'Transporte do mês', valor: 471.00, status: 'Pago' },
        { data: '', categoria: 'Investimento', descricao: 'Reserva', valor: 350.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'TIM', valor: 55.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Casamento', valor: 249.00, status: 'Pago' },
      ],
      faturas: {}
    },
    fevereiro: {
      mes: 'Fevereiro',
      ano: 2026,
      receitas: [
        { data: '', categoria: 'Sobra do Mês passado', descricao: '', valor: 129.00 },
        { data: '', categoria: 'Salário', descricao: 'Salário Bê', valor: 4131.00 },
        { data: '', categoria: 'Salário', descricao: 'Salário Enrico', valor: 1961.00 },
        { data: '', categoria: 'Pix', descricao: 'Delza', valor: 115.00 },
      ],
      gastos: [
        { data: '', categoria: 'Fatura cartão', descricao: 'Fatura cartão', valor: 2002.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Cell alice', valor: 85.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'APTO', valor: 947.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'FACULDADE', valor: 251.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Escovas madrinhas', valor: 630.00, status: 'Pago' },
        { data: '', categoria: 'Transporte', descricao: 'Transporte desse mês', valor: 471.00, status: 'Pago' },
        { data: '', categoria: 'Transporte', descricao: 'Coleta', valor: 100.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Vestido de noiva', valor: 400.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Casamento', valor: 249.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'TIM', valor: 55.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Voil decoração casamento', valor: 400.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Festa', valor: 249.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Sobrancelha', valor: 60.00, status: 'Pago' },
        { data: '', categoria: 'Investimento', descricao: 'Reserva', valor: 350.00, status: 'Pago' },
        { data: '', categoria: 'Boleto', descricao: 'Inteirei valor mãe dia noiva', valor: 47.00, status: 'Pago' },
        { data: '', categoria: 'Alimentação', descricao: 'Alimentação', valor: 38.00, status: 'Pago' },
      ],
      faturas: {}
    }
  },

  // ====== INVESTIMENTOS ======
  investimentos: {
    gabriel: {
      'Cofrinho ML 115%': { dezembro: 0, janeiro: 94.15, fevereiro: 6838.98 },
      'Conta XP': { dezembro: 6533.09, janeiro: 7648.39, fevereiro: 8133.62 },
      'Conta XP Global (USD)': { dezembro: 432.72, janeiro: 495.68, fevereiro: 501.65 },
      'Investback': { dezembro: 0, janeiro: 68.51, fevereiro: 68.51 },
    },
    clara: {
      'Casamento': { dezembro: 1484.00, janeiro: 1504.14, fevereiro: 1525.00 },
      'Reserva': { dezembro: 1935.00, janeiro: 1388.00, fevereiro: 1738.00 },
    },
    totais: {
      dezembro: 12310.41,
      janeiro: 10703.19,
      fevereiro: 18304.11,
    },
    cotacaoDolar: 5.45
  }
};

// Utility functions
function formatCurrency(value, currency = 'BRL') {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getTotalReceitas(data) {
  return data.receitas.reduce((sum, r) => sum + r.valor, 0);
}

function getTotalGastos(data) {
  return data.gastos.reduce((sum, g) => sum + g.valor, 0);
}

function getSaldo(data) {
  return getTotalReceitas(data) - getTotalGastos(data);
}

function getCategoryIcon(categoria) {
  const icons = {
    'Pix': '💸',
    'Extra': '⭐',
    'Salário': '💼',
    'Sobra do Mês passado': '📦',
    'Retirada Investimento': '📈',
    'Investimento': '💎',
    'Boleto': '📄',
    'Fatura cartão': '💳',
    'Presente': '🎁',
    'Transporte': '🚌',
    'Alimentação': '🍽️',
    'Coleta': '📦',
  };
  return icons[categoria] || '💰';
}

function getCategoryClass(categoria) {
  const classes = {
    'Pix': 'pix',
    'Extra': 'extra',
    'Salário': 'salario',
    'Sobra do Mês passado': 'sobra',
    'Retirada Investimento': 'retirada',
    'Investimento': 'investimento',
    'Boleto': 'boleto',
    'Fatura cartão': 'fatura',
    'Presente': 'presente',
    'Transporte': 'transporte',
    'Alimentação': 'alimentacao',
    'Coleta': 'transporte',
  };
  return classes[categoria] || 'pix';
}

// Export for use
window.FINANCAS_DATA = FINANCAS_DATA;
window.formatCurrency = formatCurrency;
window.getTotalReceitas = getTotalReceitas;
window.getTotalGastos = getTotalGastos;
window.getSaldo = getSaldo;
window.getCategoryIcon = getCategoryIcon;
window.getCategoryClass = getCategoryClass;
