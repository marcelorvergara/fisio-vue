<!--acompanhamento virou evolução diária-->
<template>
  <div>
    <b-container class="mt-3">
      <b-row align-h="center">
        <b-col class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
          <b-card header="Evolução Diária" header-bg-variant="dark" header-text-variant="white">
            <b-form-group id="grp-nome" label="Nome do Paciente:" label-for="nome">
              <b-input-group>
                <b-form-select autocomplete="off"
                               id="rel-input" v-model="nome"
                               type="search"
                               placeholder="Pesquise aqui"
                               :options="nomesPac"
                               @change="buscaDados">
                </b-form-select>
                <b-input-group-append>
                  <b-button :disabled="!nome" @click="nome = ''">Limpar</b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
          </b-card>
        </b-col>
      </b-row>
      <b-row class="mt-4 mb-3">
        <b-col>
          <div>
            <b-table v-if="mostrarTabela"
                     :sort-by.sync="sortBy"
                     table-variant="secondary"
                     class="text-center"
                     bordered hover head-variant="dark"
                     responsive="sm"
                     small
                     :items="$store.getters.getSessoesAcompDia"
                     :fields="fields"
                     :busy="isBusy">
              <template #table-busy>
                <div class="text-center text-info my-2">
                  <b-spinner class="align-middle"></b-spinner>
                  <strong>Loading...</strong>
                </div>
              </template>
              <template #cell(acompanhamento)="row">
                <b-button variant="outline-info" size="sm" @click="row.toggleDetails" class="mr-2">
                  {{ row.detailsShowing ? 'Ocultar' : 'Mostrar'}}
                </b-button>
              </template>
              <template #row-details="row">
                <b-card>
                  <b-row class="mb-2 text-left">
                    <b-col sm="3" class="text-sm-right"><b>Evolução:</b></b-col>
                    <b-col>{{ row.item.acompanhamento }}</b-col>
                  </b-row>
                  <div class="text-right">
                    <b-button size="sm" variant="outline-danger" @click="row.toggleDetails" class="m-1">Cancelar</b-button>
                    <b-button size="sm" variant="outline-success"
                              @click="editar(row.item.uuid,row.item.acompanhamento,row.item.data,row.item.paciente,row.item.presenca)"
                              class="m-1">Editar</b-button>
                  </div>
                </b-card>
              </template>
            </b-table>
          </div>
        </b-col>
      </b-row>
    </b-container>

<!--    modal para entrar o texto do acmopanhamento diário-->
    <b-modal size="lg" id="modal-acpm" ref="modal-acpm"
            header-bg-variant="dark"
             header-text-variant="white">
      <template #modal-title >
        <b-icon icon="pencil-square" scale="2" variant="white"></b-icon>
        <span class="m-3">Evolução Diária</span>
      </template>
      <form ref="form" @submit.stop.prevent="handleSubmit">
        <b-form-group :label="labelModal" label-for="acomp-diario">
          <b-form-textarea rows="8" id="acomp-diario" v-model="textAcomp">
          </b-form-textarea>
        </b-form-group>
        <b-form-checkbox
            switch
            id="presencaId"
            v-model="presenca">
          <p v-if="presenca" style="color: dodgerblue">Marcar presença</p>
          <p v-else style="color: red">Marcar falta</p>
        </b-form-checkbox>
      </form>
      <template #modal-footer="{ ok, cancel }">
        <!-- Emulate built in modal footer ok and cancel button actions -->
        <b-button variant="outline-danger" @click="cancel()">
          Cancelar
        </b-button>
        <b-button variant="outline-success" @click="enviar()">
          Enviar
          <b-spinner v-show="loading" small label="Carregando..."></b-spinner>
        </b-button>
      </template>
    </b-modal>

    <!--    modal para alerta erro-->
    <b-modal ref="modal-err" ok-only>
      <template #modal-title>
        <b-icon icon="x-circle" scale="2" variant="danger"></b-icon>
        <span class="m-3">Evolução Diária</span>
      </template>
      <p v-html="mensagem"></p>
    </b-modal>
    <!--    modal para ok ok -->
    <b-modal ref="modal-ok" ok-only>
      <template #modal-title>
        <b-icon icon="check2-circle" scale="2" variant="success"></b-icon>
        <span class="m-3">Evolução Diária</span>
      </template>
      <p v-html="mensagem"></p>
    </b-modal>
  </div>
</template>

<script>

export default {
  name: "Evolucao",
  data(){
    return {
      isBusy:false,
      sortBy:'sortData',
      selNome:'',
      sessaoUUid:null,
      presenca:true,
      labelModal:'',
      loading:false,
      textAcomp:'',
      mensagem:'',
      nome: '',
      mostrarTabela: false,
      fields:[
        {key: 'data', label: 'Data', sortable: true },
        {key: 'presenca', label: 'Presença', sortable: true },
        {key: 'procedimento', label: 'Procedimento', sortable: true },
        {key: 'profissional', label: 'Profissional', sortable: true },
        {key: 'acompanhamento', label: 'Evolução', sortable: true }
      ]
    }
  },
  methods:{
    cancel(){

    },
    enviar(){
      this.loading = true
      this.presenca //confirmada ou falta
      var presencaSesssao
      if (this.presenca){
        presencaSesssao = 'confirmada'
      }else{
        presencaSesssao = 'falta'
      }
      this.$store.dispatch('setSessoesAcompDiaDb',
          {uuid:this.sessaoUUid,acompanhamento:this.textAcomp,presenca:presencaSesssao})
          .then(res => {
            this.mensagem = res
            this.$refs['modal-acpm'].hide()
            this.buscaDados(this.nome)
            this.$refs['modal-ok'].show()
            this.loading = false
          })
          .catch(error => {
            this.mensagem = error
            this.$refs['modal-acpm'].hide()
            this.$refs['modal-err'].show()
            this.loading = false
          })
    },
    editar(sessaoUuid,text,data,paciente,presenca){
      //botão switch de presença na tela
      this.presenca = presenca !== 'falta';
      //atribuindo o uuid da sessão para depois enviar ao banco de dados
      this.sessaoUUid = sessaoUuid
      //mini header do modal
      this.labelModal = `Paciente: ${paciente} / Data Sessão: ${data}`
      //texto do acompanhamento diário
      this.textAcomp = text
      this.$refs['modal-acpm'].show()
    },
    buscaDados(){
      //usando o busy da table
      this.isBusy = true
      this.mostrarTabela = true
      //atribuição para uso no refresh da table (chamando buscaDados)
      this.selNome = this.nome
      //dados uuid para pegar na query de banco
      const paciente = this.$store.getters.getPacientes.find(f => f.nome === this.nome)
      const profissional = this.$store.getters.getProfissionais.find(f => f.nome === this.$store.getters.user.data.displayName)
      //realizando busca para pacientes que só possuem atendimento para determinado (user) parceiro
      //admin e porfissional serão feitos mais a frente
      if (this.$store.getters.getFuncao === 'Parceiro'){
        this.$store.dispatch('getSessoesAcompDiaDb',{pacienteUuid: paciente.uuid, profissionalUuid: profissional.uuid})
        .then((res) => {
          if (res === 'Vazio'){
            this.mensagem = 'Nenhuma sessão marcada para o paciente ' + this.nome
            this.$refs['modal-ok'].show()
            this.mostrarTabela = false
          }else{
            this.isBusy = false
          }
        })
        .catch(err => {
          this.mensagem = err
          this.$refs['modal-err'].show()
        })
      }else {
        this.$store.dispatch('getSessoesAcompDiaDb',{pacienteUuid: paciente.uuid, profissionalUuid: 'ProfAdmin'})
            .then((res) => {
              if (res === 'Vazio'){
                this.mensagem = 'Nenhuma sessão marcada para o paciente ' + this.nome
                this.$refs['modal-ok'].show()
                this.mostrarTabela = false
              }else{
                this.isBusy = false
              }
            })
            .catch(err => {
              this.mensagem = err
              this.$refs['modal-err'].show()
            })
      }
    }
  },
  computed: {
    nomesPac() {
      var nomes = []
      for (let i = 0; i < this.$store.getters.getPacientes.length; i++) {
        nomes.push(this.$store.getters.getPacientes[i].nome.trim())
      }
      return nomes.sort(function (a, b) {
        return a.localeCompare(b);
      })
    }
  }
}
</script>

<style scoped>

</style>