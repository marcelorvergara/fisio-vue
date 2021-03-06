<template>
  <div>
    <b-container fluid class="mt-3">
      <b-row class="mb-3">
        <b-col lg="4">
          <b-form-group label="Filtro" label-for="filtro-input" label-cols-sm="3" label-align-sm="right" label-size="sm">
            <b-input-group size="sm">
              <b-form-input autocomplete="off" id="filtro-input" v-model="filter" type="search" placeholder="Pesquise aqui">
              </b-form-input>
              <b-input-group-append>
                <b-button :disabled="!filter" @click="filter = ''">Limpar</b-button>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col lg="6">
          <b-form-group
              v-model="sortDirection"
              description="Deixe desmarcado para filtrar todas as colunas"
              label-cols-sm="3"
              label-align-sm="right"
              label-size="sm"
              v-slot="{ ariaDescribedby }">
            <b-form-checkbox-group
                v-model="filterOn"
                :aria-describedby="ariaDescribedby">
              <b-form-checkbox value="data">Data</b-form-checkbox>
              <b-form-checkbox value="paciente">Paciente</b-form-checkbox>
              <b-form-checkbox value="procedimento">Procedimento</b-form-checkbox>
              <b-form-checkbox value="status">Status</b-form-checkbox>
              <b-form-checkbox value="profissional">Profissional</b-form-checkbox>
            </b-form-checkbox-group>
          </b-form-group>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <div>
            <b-table
                :current-page="currentPage"
                :per-page="perPage"
                :filter="filter"
                :filter-included-fields="filterOn"
                :sort-direction="sortDirection"
                table-variant="secondary"
                class="text-center"
                bordered hover head-variant="dark"
                responsive="sm"
                :items="lista"
                :fields="fields"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                sort-icon-left
                show-empty
                empty-text="Sem dados para apresentar"
                empty-filtered-text="Sem dados"
                small
                @filtered="onFiltered"
                :busy="isBusy">
              <template v-slot:cell(comissao)="data">
                <span v-if="$store.getters.getSatusTooltip" v-b-tooltip.hover :title=data.item.descricaoComissao>{{ data.value}}</span>
                <span v-else>{{ data.value }}</span>
              </template>
              <template #table-busy>
                <div class="text-center text-info my-2">
                  <b-spinner class="align-middle"></b-spinner>
                  <strong>Carregando...</strong>
                </div>
              </template>
            </b-table>
          </div>
          <div class="text-right mr-2">
            <span class="text-black-75">Comissão R$ {{ valorComissaoTot }}</span>
          </div>
        </b-col>
      </b-row>
      <b-row class="mt-2 mb-4" align-h="end">
        <b-col lg="5">
          <div class="mb-3">
          <b-form-group
              label="Itens por página"
              label-for="per-page-select"
              label-cols-sm="6"
              label-cols-md="4"
              label-cols-lg="3"
              label-align-sm="right"
              label-size="sm"
              class="mb-0">
            <b-form-select
                id="per-page-select"
                v-model="perPage"
                :options="pageOptions"
                size="sm"
            ></b-form-select>
          </b-form-group>
          </div>
          <div>
          <b-pagination
              v-model="currentPage"
              :total-rows="totalRows"
              :per-page="perPage"
              align="fill"
              size="sm"
              class="my-0"
          ></b-pagination>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <!--    modal para ERRO-->
    <!--    modal para alerta erro-->
    <b-modal ref="modal-err" ok-only>
      <template #modal-title>
        <b-icon icon="x-circle" scale="2" variant="danger"></b-icon>
        <span class="m-3">Relatório de Presença</span>
      </template>
      <p v-html="mensagemErro"></p>
    </b-modal>
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import {Decimal} from 'decimal.js'

export default {
  name: "Relatorio",
  data(){
    return {
      valorComissaoTot: 0,
      isBusy: false,
      pageOptions: [5, 10, 15, { value: 100, text: "Mostrar o máximo por página" }],
      perPage:10,
      totalRows:1,
      currentPage:1,
      filterOn: [],
      sortDirection: 'asc',
      filter: null,
      sortBy: 'sortData',
      sortDesc: false,
      fields: [
        { key: 'data', sortable: true },
        { key: 'paciente', sortable: true },
        { key: 'procedimento', sortable: true },
        { key: 'inicio', sortable: true },
        { key: 'fim', sortable: true },
        { key: 'agendador', sortable: true },
        { key: 'status', sortable: true },
        { key: 'profissional', sortable: true},
        { key: 'comissao', label:'Comissão (R$)', sortable: true}
      ],
      mensagemErro:'',
      lista: []
    }
  },
  methods:{
    somaValFiltro(filteredItems){
      //somar as comissões
      var valor = 0
      for (let item of filteredItems){
        valor += parseFloat(item.comissao)
      }
      this.valorComissaoTot = valor.toFixed(2).toString().replace('.',',')
    },
    onFiltered(filteredItems){
      this.totalRows = filteredItems.length
      this.currentPage = 1
      this.somaValFiltro(filteredItems)
    },
    getSessoesRel(){
      const profUuid = this.$store.getters.getProfissionais.find(f => f.email === this.user.data.email)
      if (profUuid === undefined){
        this.mensagemErro = 'Profissional sem sessões ou não cadastrado'
        //criar user com nome, email e uuid
        this.$refs['modal-err'].show()
        this.isBusy = false
      }else{
        this.$store.dispatch('getSessoesRelDb',{uuid:profUuid.uuid, admUid: this.$store.getters.user.data.uid}).then(() => {
          const sessoesList = this.$store.getters.getSessoesRelatorio.data
          for (let sessao of sessoesList){
            const dia0 = sessao.horaInicio.split(' ')[0].split('-')
            const dia = dia0[2]+'-'+dia0[1]+'-'+dia0[0]
            const horaIni = sessao.horaInicio.split(' ')[1]
            const horaFim = sessao.horaFim.split(' ')[1]
            const paciente = this.$store.getters.getPacientes.find(f => f.uuid === sessao.paciente)
            const procedimento = this.$store.getters.getProcedimentos.find(f => f.uuid === sessao.proc)
            const profissional = this.$store.getters.getProfissionais.find(f => f.uuid === sessao.profissional)
            const agendador = sessao.agendador
            const status = sessao.presenca || 'sem status'
            const sortData = sessao.sortData
            //cálculo da comissão é valor comissão/100 * valor da sessão
            const comissao = new Decimal(procedimento.comissao).div(100)
            const valorSessao = new Decimal(procedimento.valor.toString().replace(',','.'))
            const valComissaoInt = comissao.times(valorSessao)
            const valComissao = valComissaoInt.toFixed(2)
            const sessaoObj = {
                data: dia,
                inicio: horaIni,
                fim: horaFim,
                paciente: paciente.nome,
                procedimento: procedimento.nomeProcedimento,
                agendador: agendador,
                status,
                profissional:profissional.nome,
                comissao: valComissao.toString().replace('.',','),
                descricaoComissao: 'Valor sessão: '+ parseFloat(procedimento.valor).toFixed(2).toString().replace('.',',') + '. Comissão: ' +procedimento.comissao + '%',
                sortData}
            this.lista.push(sessaoObj)
          }
          this.somaValFiltro(this.lista)
          this.totalRows = this.$store.getters.getSessoesRelatorio.data.length
          this.isBusy = false
        }).catch(error => {
          this.mensagemErro = error
          this.$refs['modal-err'].show()
        })
      }

    }
  },
  computed:{
    ...mapGetters({
      user: "user"
    })
  },
  created() {
    this.isBusy = true
  },
  mounted() {
    this.getSessoesRel()
  }
}
</script>

<style scoped>

</style>