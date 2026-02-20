// =============================================
// DATABASE SERVICE - Firebase Realtime Database
// CRUD completo para Finanças App v3
// =============================================

const DB = {
    // ========== TRANSAÇÕES ==========

    async getTransacoes(pessoa, mes) {
        try {
            let snapshot;
            if (pessoa === 'todos') {
                snapshot = await database.ref('transacoes').once('value');
            } else {
                snapshot = await database.ref('transacoes').orderByChild('pessoa').equalTo(pessoa).once('value');
            }
            const data = snapshot.val() || {};
            const result = { receitas: [], gastos: [] };

            Object.entries(data).forEach(([id, t]) => {
                if (t.mes !== mes) return;
                const item = { ...t, id };
                if (t.tipo === 'receita') result.receitas.push(item);
                else result.gastos.push(item);
            });

            const sortByDate = (a, b) => {
                if (!a.data && !b.data) return 0;
                if (!a.data) return 1;
                if (!b.data) return -1;
                const [da, ma, ya] = a.data.split('/');
                const [db2, mb, yb] = b.data.split('/');
                return new Date(yb, mb - 1, db2) - new Date(ya, ma - 1, da);
            };

            result.receitas.sort(sortByDate);
            result.gastos.sort(sortByDate);
            return result;
        } catch (error) {
            console.error('❌ Erro ao buscar transações:', error);
            return { receitas: [], gastos: [] };
        }
    },

    async addTransacao(dados) {
        try {
            const ref = database.ref('transacoes').push();
            await ref.set(dados);
            console.log('✅ Transação adicionada:', ref.key);
            return ref.key;
        } catch (error) {
            console.error('❌ Erro ao adicionar transação:', error);
            return null;
        }
    },

    async updateTransacao(id, dados) {
        try {
            await database.ref(`transacoes/${id}`).update(dados);
            console.log('✅ Transação atualizada:', id);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar transação:', error);
            return false;
        }
    },

    async deleteTransacao(id) {
        try {
            await database.ref(`transacoes/${id}`).remove();
            console.log('🗑️ Transação removida:', id);
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover transação:', error);
            return false;
        }
    },

    // ========== FATURAS (CRUD COMPLETO) ==========

    async getFaturas(pessoa, mes) {
        try {
            let snapshot;
            if (pessoa === 'todos') {
                snapshot = await database.ref('faturas').once('value');
            } else {
                snapshot = await database.ref('faturas').orderByChild('pessoa').equalTo(pessoa).once('value');
            }
            const data = snapshot.val() || {};
            const result = {};

            Object.entries(data).forEach(([id, f]) => {
                if (f.mes !== mes) return;
                const itens = f.itens ? Object.entries(f.itens).map(([itemId, item]) => ({ ...item, id: itemId })) : [];
                // Usar ID como chave em vez do nome do cartão para suportar múltiplas faturas do mesmo cartão
                result[id] = {
                    id,
                    pessoa: f.pessoa,
                    nome: f.cartao,
                    cartao: f.cartao,
                    total: f.totalFatura,
                    vencimento: f.vencimento || '',
                    itens
                };
            });

            return result;
        } catch (error) {
            console.error('❌ Erro ao buscar faturas:', error);
            return {};
        }
    },

    // Criar nova fatura
    async addFatura(dados) {
        try {
            const ref = database.ref('faturas').push();
            await ref.set({
                pessoa: dados.pessoa,
                mes: dados.mes,
                cartao: dados.cartao,
                totalFatura: 0,
                vencimento: dados.vencimento || '',
                itens: {}
            });
            console.log('✅ Fatura criada:', ref.key);
            return ref.key;
        } catch (error) {
            console.error('❌ Erro ao criar fatura:', error);
            return null;
        }
    },

    // Atualizar dados da fatura (nome do cartão, vencimento)
    async updateFatura(faturaId, dados) {
        try {
            const updates = {};
            if (dados.cartao !== undefined) updates.cartao = dados.cartao;
            if (dados.vencimento !== undefined) updates.vencimento = dados.vencimento;
            await database.ref(`faturas/${faturaId}`).update(updates);
            console.log('✅ Fatura atualizada:', faturaId);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar fatura:', error);
            return false;
        }
    },

    // Excluir fatura inteira
    async deleteFatura(faturaId) {
        try {
            await database.ref(`faturas/${faturaId}`).remove();
            console.log('🗑️ Fatura removida:', faturaId);
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover fatura:', error);
            return false;
        }
    },

    async addFaturaItem(faturaId, item) {
        try {
            const ref = database.ref(`faturas/${faturaId}/itens`).push();
            await ref.set(item);
            await this._recalcFaturaTotal(faturaId);
            console.log('✅ Item de fatura adicionado:', ref.key);
            return ref.key;
        } catch (error) {
            console.error('❌ Erro ao adicionar item de fatura:', error);
            return null;
        }
    },

    async updateFaturaItem(faturaId, itemId, dados) {
        try {
            await database.ref(`faturas/${faturaId}/itens/${itemId}`).update(dados);
            await this._recalcFaturaTotal(faturaId);
            console.log('✅ Item de fatura atualizado:', itemId);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar item de fatura:', error);
            return false;
        }
    },

    async deleteFaturaItem(faturaId, itemId) {
        try {
            await database.ref(`faturas/${faturaId}/itens/${itemId}`).remove();
            await this._recalcFaturaTotal(faturaId);
            console.log('🗑️ Item de fatura removido:', itemId);
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover item de fatura:', error);
            return false;
        }
    },

    async _recalcFaturaTotal(faturaId) {
        const snapshot = await database.ref(`faturas/${faturaId}/itens`).once('value');
        const itens = snapshot.val() || {};
        const total = Object.values(itens).reduce((sum, item) => sum + (item.valor || 0), 0);
        await database.ref(`faturas/${faturaId}/totalFatura`).set(total);
    },

    // ========== INVESTIMENTOS ==========

    async getInvestimentos(pessoa, mes) {
        try {
            let snapshot;
            if (pessoa === 'todos') {
                snapshot = await database.ref('investimentos').once('value');
            } else {
                snapshot = await database.ref('investimentos').orderByChild('pessoa').equalTo(pessoa).once('value');
            }

            const data = snapshot.val() || {};
            const result = {};

            Object.entries(data).forEach(([id, inv]) => {
                if (inv.mes !== mes) return;
                result[id] = {
                    id,
                    pessoa: inv.pessoa,
                    nome: inv.nome,
                    valor: inv.valor,
                    moeda: inv.moeda || 'BRL'
                };
            });

            return result;
        } catch (error) {
            console.error('❌ Erro ao buscar investimentos:', error);
            return {};
        }
    },

    // Buscar investimentos de todos os meses para gráfico de evolução
    async getInvestimentosHistorico(pessoa) {
        try {
            let snapshot;
            if (pessoa === 'todos') {
                snapshot = await database.ref('investimentos').once('value');
            } else {
                snapshot = await database.ref('investimentos').orderByChild('pessoa').equalTo(pessoa).once('value');
            }
            const data = snapshot.val() || {};
            // Agrupar por mês
            const porMes = {};
            Object.values(data).forEach(inv => {
                if (!porMes[inv.mes]) porMes[inv.mes] = [];
                porMes[inv.mes].push(inv);
            });
            return porMes;
        } catch (error) {
            console.error('❌ Erro ao buscar histórico de investimentos:', error);
            return {};
        }
    },

    async addInvestimento(dados) {
        try {
            const ref = database.ref('investimentos').push();
            await ref.set(dados);
            console.log('✅ Investimento adicionado:', ref.key);
            return ref.key;
        } catch (error) {
            console.error('❌ Erro ao adicionar investimento:', error);
            return null;
        }
    },

    async updateInvestimento(id, dados) {
        try {
            await database.ref(`investimentos/${id}`).update(dados);
            console.log('✅ Investimento atualizado:', id);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar investimento:', error);
            return false;
        }
    },

    async deleteInvestimento(id) {
        try {
            await database.ref(`investimentos/${id}`).remove();
            console.log('🗑️ Investimento removido:', id);
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover investimento:', error);
            return false;
        }
    },

    async getCotacaoDolar(mes) {
        try {
            const snapshot = await database.ref(`meta/cotacaoDolar/${mes}`).once('value');
            return snapshot.val() || 5.45;
        } catch (error) {
            console.error('❌ Erro ao buscar cotação dólar:', error);
            return 5.45;
        }
    },

    async setCotacaoDolar(mes, valor) {
        try {
            await database.ref(`meta/cotacaoDolar/${mes}`).set(valor);
            console.log(`✅ Cotação dólar ${mes}: ${valor}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar cotação dólar:', error);
            return false;
        }
    },

    async getTotalInvestimentos(mes) {
        try {
            const snapshot = await database.ref('investimentos').once('value');
            const data = snapshot.val() || {};
            let total = 0;

            const cotacaoDolar = await this.getCotacaoDolar(mes);

            Object.values(data).forEach(inv => {
                if (inv.mes !== mes) return;
                if (inv.moeda === 'USD') {
                    total += inv.valor * cotacaoDolar;
                } else {
                    total += inv.valor;
                }
            });

            return { total, cotacaoDolar };
        } catch (error) {
            console.error('❌ Erro ao calcular total investimentos:', error);
            return { total: 0, cotacaoDolar: 5.45 };
        }
    },

    // ========== DADOS COMPLETOS (para dashboard) ==========

    async getDadosMes(pessoa, mes) {
        const [transacoes, faturas] = await Promise.all([
            this.getTransacoes(pessoa, mes),
            this.getFaturas(pessoa, mes)
        ]);

        const totalReceitas = transacoes.receitas.reduce((sum, r) => sum + r.valor, 0);
        const totalGastos = transacoes.gastos.reduce((sum, g) => sum + g.valor, 0);
        const saldo = totalReceitas - totalGastos;

        return {
            receitas: transacoes.receitas,
            gastos: transacoes.gastos,
            faturas,
            totalReceitas,
            totalGastos,
            saldo
        };
    },

    // ========== MESES DISPONÍVEIS ==========

    async getMesesDisponiveis() {
        try {
            const snapshot = await database.ref('meta/meses').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('❌ Erro ao buscar meses:', error);
            return {};
        }
    },

    async registrarMes(mesKey, label) {
        try {
            await database.ref(`meta/meses/${mesKey}`).set({ label, criadoEm: new Date().toISOString() });
            return true;
        } catch (error) {
            console.error('❌ Erro ao registrar mês:', error);
            return false;
        }
    },

    async autoGerarProximoMes(mesAtualKey, proximoMesKey, pessoas) {
        console.log(`🔄 Auto-gerando mês ${proximoMesKey} (batch mode)...`);

        // Montar todas as operações em um único objeto de updates para escrita em lote
        const updates = {};

        for (const pessoa of pessoas) {
            console.log(`👤 Processando ${pessoa}...`);

            // 1. Calcular saldo do mês atual para criar "Sobra do mês passado"
            try {
                const dadosMesAtual = await this.getDadosMes(pessoa, mesAtualKey);
                const saldoAnterior = dadosMesAtual.saldo;

                const dataInicio = this._getFirstDayOfMonth(proximoMesKey);
                const sobraKey = database.ref('transacoes').push().key;
                updates[`transacoes/${sobraKey}`] = {
                    pessoa,
                    mes: proximoMesKey,
                    tipo: 'receita',
                    data: dataInicio,
                    categoria: 'Sobra do Mês passado',
                    descricao: 'Sobra do mês passado em conta',
                    valor: saldoAnterior
                };
                console.log(`  💰 Sobra: R$ ${saldoAnterior.toFixed(2)}`);
            } catch (e) {
                console.error(`  ❌ Erro ao calcular saldo de ${pessoa}:`, e);
            }

            // 2. Buscar TODAS as faturas do mês atual e montar parcelas pendentes
            try {
                const faturas = await this.getFaturas(pessoa, mesAtualKey);
                const fatKeys = Object.keys(faturas);
                console.log(`  📋 ${fatKeys.length} faturas encontradas em ${mesAtualKey}`);

                for (const [fatId, fatura] of Object.entries(faturas)) {
                    const itensParaProximoMes = [];

                    for (const item of (fatura.itens || [])) {
                        if (!item.parcela) continue;

                        const parcelaLower = item.parcela.toLowerCase().trim();

                        // Itens recorrentes mensais
                        if (parcelaLower === 'mensal') {
                            itensParaProximoMes.push({
                                nome: item.nome,
                                valor: item.valor,
                                data: item.data || '',
                                parcela: 'Mensal'
                            });
                            continue;
                        }

                        // Itens parcelados "X de Y"
                        const match = item.parcela.match(/(\d+)\s*de\s*(\d+)/i);
                        if (!match) continue;

                        const atual = parseInt(match[1]);
                        const total = parseInt(match[2]);
                        if (atual < total) {
                            itensParaProximoMes.push({
                                nome: item.nome,
                                valor: item.valor,
                                data: item.data || '',
                                parcela: `${atual + 1} de ${total}`
                            });
                        }
                    }

                    console.log(`    💳 ${fatura.cartao}: ${(fatura.itens || []).length} itens → ${itensParaProximoMes.length} para ${proximoMesKey}`);

                    if (itensParaProximoMes.length > 0) {
                        // Gerar ID para a nova fatura e seus itens em batch
                        const novaFaturaKey = database.ref('faturas').push().key;
                        const itensObj = {};
                        let totalFatura = 0;

                        for (const item of itensParaProximoMes) {
                            const itemKey = database.ref(`faturas/${novaFaturaKey}/itens`).push().key;
                            itensObj[itemKey] = item;
                            totalFatura += item.valor;
                        }

                        updates[`faturas/${novaFaturaKey}`] = {
                            pessoa,
                            mes: proximoMesKey,
                            cartao: fatura.cartao,
                            vencimento: fatura.vencimento || '',
                            totalFatura,
                            itens: itensObj
                        };

                        // Criar transação de despesa da fatura
                        if (totalFatura > 0) {
                            const despKey = database.ref('transacoes').push().key;
                            const vencimento = fatura.vencimento || '';
                            updates[`transacoes/${despKey}`] = {
                                pessoa,
                                mes: proximoMesKey,
                                tipo: 'despesa',
                                data: vencimento ? this._formatDateForMonth(vencimento, proximoMesKey) : '',
                                categoria: 'Fatura cartão',
                                descricao: `Fatura do cartão ${fatura.cartao}`,
                                valor: totalFatura
                            };
                        }
                    }
                }
            } catch (e) {
                console.error(`  ❌ Erro ao processar faturas de ${pessoa}:`, e);
            }

            // 3. Copiar investimentos do mês anterior
            try {
                const investimentos = await this.getInvestimentos(pessoa, mesAtualKey);
                const invEntries = Object.values(investimentos);
                console.log(`  💎 ${invEntries.length} investimentos para copiar`);

                for (const inv of invEntries) {
                    const invKey = database.ref('investimentos').push().key;
                    updates[`investimentos/${invKey}`] = {
                        pessoa,
                        mes: proximoMesKey,
                        nome: inv.nome,
                        valor: inv.valor,
                        moeda: inv.moeda || 'BRL'
                    };
                }
            } catch (e) {
                console.error(`  ❌ Erro ao copiar investimentos de ${pessoa}:`, e);
            }
        }

        // Copiar cotação do dólar
        try {
            const cotacao = await this.getCotacaoDolar(mesAtualKey);
            if (cotacao) {
                updates[`cotacaoDolar/${proximoMesKey}`] = cotacao;
            }
        } catch (e) {
            console.warn('⚠️ Erro ao copiar cotação:', e);
        }

        // ESCREVER TUDO DE UMA VEZ
        const totalOps = Object.keys(updates).length;
        console.log(`📦 Gravando ${totalOps} operações em batch...`);

        try {
            await database.ref().update(updates);
            console.log(`✅ Batch gravado com sucesso!`);
        } catch (e) {
            console.error('❌ Erro no batch write:', e);
            throw e;
        }

        await this.registrarMes(proximoMesKey, this._getMesLabel(proximoMesKey));
        console.log(`✅ Mês ${proximoMesKey} gerado com sucesso!`);
        return true;
    },

    // Verificar se o próximo mês precisa ser criado
    async verificarEAutoGerarMes(mesAtualKey) {
        const proximoMesKey = this._getProximoMes(mesAtualKey);
        if (!proximoMesKey) return null;

        const snapshot = await database.ref('transacoes')
            .orderByChild('mes')
            .equalTo(proximoMesKey)
            .limitToFirst(1)
            .once('value');

        if (snapshot.exists()) {
            console.log(`ℹ️ Mês ${proximoMesKey} já existe.`);
            return proximoMesKey;
        }

        await this.autoGerarProximoMes(mesAtualKey, proximoMesKey, ['gabriel', 'clara']);
        return proximoMesKey;
    },

    // Forçar re-geração de um mês (apaga tudo do mês e recria)
    async reGerarMes(mesAtualKey, mesAlvoKey, pessoas) {
        console.log(`🔄 Re-gerando mês ${mesAlvoKey}...`);

        const deleteUpdates = {};

        // 1. Apagar todas as transações do mês alvo
        const snapTrans = await database.ref('transacoes').orderByChild('mes').equalTo(mesAlvoKey).once('value');
        const trans = snapTrans.val() || {};
        for (const id of Object.keys(trans)) {
            deleteUpdates[`transacoes/${id}`] = null;
        }

        // 2. Apagar todas as faturas do mês alvo
        const snapFat = await database.ref('faturas').orderByChild('mes').equalTo(mesAlvoKey).once('value');
        const fats = snapFat.val() || {};
        for (const id of Object.keys(fats)) {
            deleteUpdates[`faturas/${id}`] = null;
        }

        // 3. Apagar todos os investimentos do mês alvo
        const snapInv = await database.ref('investimentos').orderByChild('mes').equalTo(mesAlvoKey).once('value');
        const invs = snapInv.val() || {};
        for (const id of Object.keys(invs)) {
            deleteUpdates[`investimentos/${id}`] = null;
        }

        const totalDeleted = Object.keys(deleteUpdates).length;
        console.log(`🗑️ Apagando ${totalDeleted} registros de ${mesAlvoKey} em batch...`);
        if (totalDeleted > 0) {
            await database.ref().update(deleteUpdates);
        }

        console.log(`✅ Dados de ${mesAlvoKey} apagados. Recriando...`);

        // 4. Re-gerar
        await this.autoGerarProximoMes(mesAtualKey, mesAlvoKey, pessoas);
        return true;
    },

    // ========== HELPERS ==========

    _getProximoMes(mesKey) {
        const [ano, mes] = mesKey.split('-').map(Number);
        const novoMes = mes + 1;
        if (novoMes > 12) return `${ano + 1}-01`;
        return `${ano}-${String(novoMes).padStart(2, '0')}`;
    },

    _getFirstDayOfMonth(mesKey) {
        const [ano, mes] = mesKey.split('-');
        return `01/${mes}/${ano}`;
    },

    _formatDateForMonth(diaMes, mesKey) {
        // diaMes pode ser "15" ou "15/02/2026". Extrai só o dia e aplica ao novo mês
        const dia = diaMes.includes('/') ? diaMes.split('/')[0] : diaMes;
        const [ano, mes] = mesKey.split('-');
        return `${dia.padStart(2, '0')}/${mes}/${ano}`;
    },

    _getMesLabel(mesKey) {
        const meses = {
            '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
            '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
            '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
        };
        const [ano, mes] = mesKey.split('-');
        return `${meses[mes]} ${ano}`;
    },

    // ========== STATUS ==========

    async testConnection() {
        try {
            const snapshot = await database.ref('meta').once('value');
            return snapshot.exists();
        } catch (error) {
            console.error('❌ Erro de conexão Firebase:', error);
            return false;
        }
    }
};

window.DB = DB;
console.log('📦 DB Service v4 (batch mode) carregado');
