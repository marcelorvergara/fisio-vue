// eslint-disable-next-line no-unused-vars
import { connDb } from "@/store/connDb";

const state = {
    procedimentos:[],
    profissionais: [],
    salas:[]
}

const getters = {
    getProcedimentos:state => state.procedimentos,
    getProfissionais: state => state.profissionais,
    getSalas: state => state.salas
}

const mutations = {
    setProcedimentos(state,procedimentos){
        state.procedimentos.push(procedimentos)
    },
    resetProcedimentos(state){
        state.procedimentos = []
    },
    setProfissionais(state,profissionais){
        state.profissionais.push(profissionais)
    },
    resetProfissionais(state){
        state.profissionais = []
    },
    setSalas(state,salas){
        state.salas.push(salas)
    },
    resetSalas(state){
        state.salas = []
    },
}

const actions = {
    setProcedimentoDb(context,payload){
      return new Promise((resolve,reject) => {
          const setProcedimento = connDb.methods.connDbFunc().httpsCallable('setProcedimento')
          setProcedimento(payload.procedimento).then(result => {
              //atualizar a lista de procedimento no app
              context.dispatch('getProcedimentosDB')
              resolve(result.data)
          })
              .catch(err => {
                  reject(err)
              })
      })
    },
    async getProcedimentosDB(context){
        //pegar os nomes dos procedimentos para o autocomplete
        const getPaciente = connDb.methods.connDbFunc().httpsCallable('getProcedimentos')
        await getPaciente().then(result => {
            context.commit('resetProcedimentos')
            for (let dados of result.data){
                context.commit('setProcedimentos',dados)
            }
        })
            .catch(err => {
                console.log(err)
            })
    },
    setProfissionalDb(context, payload){
      return new Promise((resolve,reject) => {
          const setProfissional = connDb.methods.connDbFunc().httpsCallable('setProfissional')
          setProfissional(payload.profissional).then(result => {
              //atualizar a lista de profissionais no app
              context.dispatch('getProfissionaisDb')
              resolve(result.data)
          })
              .catch(err => {
                  reject(err)
              })
      })
    },
    updateProfissionaisDb(context, payload){
      return new Promise((resolve,reject) => {
          const atualizaProfissional = connDb.methods.connDbFunc().httpsCallable('updateProfissional')
          atualizaProfissional(payload.profissonal).then(result => {
              //atualizar a lista de profissionais no app
              context.dispatch('getProfissionaisDb')
              resolve(result.data)
          })
              .catch(err => {
                  reject(err)
              })
      })
    },
    setStatusProfissinalDb(context,payload){
      return new Promise((resolve,reject) => {
          const setStatusProf = connDb.methods.connDbFunc().httpsCallable('setStatusProfissional')
          setStatusProf(payload.status).then(result => {
              //atualizar a lista de profissionais no app para pegar o status atualizado (hab/desab)
              context.dispatch('getProfissionaisDb')
              resolve(result.data)
          })
              .catch(err => {
                  reject(err)
              })
      })
    },
    //tabela de profissionais
    async getProfissionaisDb(context){
        //pegar os nomes dos profissionais para autocomplete e join com sessoes
        //é necessário rever esse método por causa das references
        const getProfissionais = connDb.methods.connDbFunc().httpsCallable('getProfissionais')
        await getProfissionais().then(result => {
            context.commit('resetProfissionais')
            for (let dados of result.data){
                context.commit('setProfissionais', dados)
            }
        })
            .catch(err => {
                console.log(err)
            })
    },
    async getSalasDb(context) {
        //pegar os nomes dos procedimentos para o autocomplete
        const getSala = connDb.methods.connDbFunc().httpsCallable('getSalas')
        await getSala().then(result => {
            context.commit('resetSalas')
            for (let dados of result.data) {
                context.commit('setSalas',dados)
            }
        })
            .catch(err => {
                console.log(err)
            })
    },
    setSalasDb(context,payload){
        return new Promise((resolve, reject) => {
            const cadSala = connDb.methods.connDbFunc().httpsCallable('setSala')
            cadSala(payload.sala).then(result => {
                //atualizar a lista de salas no app
                context.dispatch('getSalasDb')
                resolve (result.data)
            })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

export default {
    state,
    getters,
    mutations,
    actions
}