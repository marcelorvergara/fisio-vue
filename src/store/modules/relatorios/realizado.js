import { connDb } from "../../connDb";
import {Decimal} from 'decimal.js'

const state = {
    valMesRealizado: [0,0,0,0,0,0,0,0,0,0,0,0],
    valMesNaoRalizado:[0,0,0,0,0,0,0,0,0,0,0,0],
    meses:['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.'],
    valTabela: []
}

const getters = {
    getValMesRealizado:state => state.valMesRealizado,
    getValMesNaoRalizado:state => state.valMesNaoRalizado,
    getMeses:state => state.meses,
    getValTabela:state => state.valTabela
}

const mutations = {
    setMesRealizado(state,payload){
        const newVal = new Decimal(state.valMesRealizado[payload.mes]).add(payload.val)
        state.valMesRealizado.splice(payload.mes,1,newVal.toDP(2,Decimal.ROUND_DOWN))
    },
    setMesNaoRealizado(state,payload){
        const newVal = new Decimal(state.valMesNaoRalizado[payload.mes]).add(payload.val)
        state.valMesNaoRalizado.splice(payload.mes,1,newVal.toDP(2,Decimal.ROUND_DOWN))
    },
    setValTabela(state,payload){
      state.valTabela.push(payload)
    },
    resetRealizado(state){
        state.valMesRealizado = [0,0,0,0,0,0,0,0,0,0,0,0]
        state.valMesNaoRalizado = [0,0,0,0,0,0,0,0,0,0,0,0]
        state.meses = ['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.']
        state.valTabela = []
    },
    formatDados(state,listMesVazio){
        //realizando o loop ao contrário para não alterar a ordem quando excluir um elemento
        for (let i = listMesVazio.length -1; i>=0; i--){
            state.meses.splice(listMesVazio[i],1)
            state.valMesRealizado.splice(listMesVazio[i],1)
            state.valMesNaoRalizado.splice(listMesVazio[i],1)
        }
    }
}

const actions = {
    //segundo relatório realizado
    getRelatorioRealizado(context,payload){
            const data = payload
            const listSessoes = []
            return new Promise((resolve,reject) => {
                connDb.methods.connDbFirestore().collection('sessoes')
                    .where('dataFS','>=' ,data.dataIni)
                    .where('dataFS','<=', data.dataFim)
                    .orderBy('dataFS', 'desc')
                    .get()
                    .then(function(querySnapshot) {
                        // console.log(querySnapshot.docs.length)
                        querySnapshot.forEach(function(doc) {
                            const proc = doc.get('procedimento').id
                            const prof = doc.get('profissional').id
                            const sessoesObj = {
                                procUuid: proc,
                                profUuid: prof,
                                data: doc.data().data,
                                presenca: doc.data().presenca
                            }
                            listSessoes.push(sessoesObj)
                        })
                        Promise.all([listSessoes]).then(() => {
                            if (listSessoes.length !== 0){
                                for (let dado of listSessoes){
                                    const proc = context.getters.getProcedimentos.find(f => f.uuid === dado.procUuid)
                                    const valorFloat = new Decimal(proc.valor.toString().replace(',','.'))
                                    const valor = valorFloat.div(proc.qtdSessoes)
                                    //pegando o mês e adequando ao índice do array
                                    const mes = dado.data.split('-')[1] - 1
                                    if (dado.presenca === 'confirmada'){
                                        context.commit('setMesRealizado',{mes:mes,val:valor.toDP(2,Decimal.ROUND_DOWN)})
                                    }else {
                                        context.commit('setMesNaoRealizado',{mes:mes,val:valor.toDP(2,Decimal.ROUND_DOWN)})
                                    }
                                }
                                //remover meses vazios
                                const mesesVazios = [];
                                for (let i=0; i<12;i++){
                                    if (context.getters.getValMesNaoRalizado[i] === 0 && context.getters.getValMesRealizado[i] === 0){
                                        mesesVazios.push(i)
                                    }
                                }
                                //removendo meses vazios
                                context.commit('formatDados', mesesVazios)
                                //montar tabela com valores
                                for (let i = 0; i < context.getters.getMeses.length; i++){
                                    context.commit('setValTabela',{mes:context.getters.getMeses[i],
                                        realizado:context.getters.getValMesRealizado[i].toFixed(2).replace('.',','),
                                        naoRealizado:context.getters.getValMesNaoRalizado[i].toFixed(2).replace('.',',')})
                                }
                                resolve('ok')
                            } else {
                                resolve('Não há dados para o período pesquisado.')
                            }
                        })
                        .catch(err => reject(err))
                    })
                    .catch(err => reject(err))
            })
    }
}

export default {
    state,
    getters,
    mutations,
    actions
}