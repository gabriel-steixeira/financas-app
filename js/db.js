// =============================================
// DATABASE SERVICE - Firebase Realtime Database
// CRUD completo para Finanças App
// =============================================

const DB = {
    // ========== TRANSAÇÕES ==========

    async getTransacoes(pessoa, mes) {
        try {
            const snapshot = await database.ref('transacoes').orderByChild('pessoa').equalTo(pessoa).once('value');
            const data = snapshot.val() || {};
            const result = { receitas: [], gastos: [] };

            Object.entries(data).forEach(([id, t]) => {
                if (t.mes !== mes) return;
                const item = { ...t, id };
                if (t.tipo === 'receita') result.receitas.push(item);
                else result.gastos.push(item);
            });

            // Sort by data
            const sortByDate = (a, b) => {
                if (!a.data && !b.data) return 0;
                if (!a.data) return 1;
                if (!b.data) return -1;
                const [da, ma, ya] = a.data.split('/');
                const [db, mb, yb] = b.data.split('/');
                return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
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

    // ========== FATURAS ==========

    async getFaturas(pessoa, mes) {
        try {
            const snapshot = await database.ref('faturas').orderByChild('pessoa').equalTo(pessoa).once('value');
            const data = snapshot.val() || {};
            const result = {};

            Object.entries(data).forEach(([id, f]) => {
                if (f.mes !== mes) return;
                const itens = f.itens ? Object.entries(f.itens).map(([itemId, item]) => ({ ...item, id: itemId })) : [];
                result[f.cartao] = {
                    id,
                    nome: f.cartao,
                    total: f.totalFatura,
                    itens
                };
            });

            return result;
        } catch (error) {
            console.error('❌ Erro ao buscar faturas:', error);
            return {};
        }
    },

    async addFaturaItem(faturaId, item) {
        try {
            const ref = database.ref(`faturas/${faturaId}/itens`).push();
            await ref.set(item);
            // Recalcular total
            await this._recalcFaturaTotal(faturaId);
            console.log('✅ Item de fatura adicionado:', ref.key);
            return ref.key;
        } catch (error) {
            console.error('❌ Erro ao adicionar item de fatura:', error);
            return null;
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
            const snapshot = await database.ref('investimentos').orderByChild('pessoa').equalTo(pessoa).once('value');
            const data = snapshot.val() || {};
            const result = {};

            Object.entries(data).forEach(([id, inv]) => {
                if (inv.mes !== mes) return;
                result[inv.nome] = {
                    id,
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

    async getTotalInvestimentos(mes) {
        try {
            const snapshot = await database.ref('investimentos').once('value');
            const data = snapshot.val() || {};
            let total = 0;
            let cotacaoDolar = 5.45;

            // Get cotacao from meta
            const metaSnap = await database.ref('meta/cotacaoDolar').once('value');
            if (metaSnap.val()) cotacaoDolar = metaSnap.val();

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
console.log('📦 DB Service carregado');
