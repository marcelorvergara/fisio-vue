<template>
  <div>
    <div v-if="sala && procedimento && profissional && feriado">
<!--    menu principal-->
      <b-navbar toggleable="lg" type="dark" variant="dark" >
        <img src="../assets/logo.png" class="d-inline-block align-top mr-3" alt="Kitten">
        <b-navbar-brand :to="{path: `/Home/${$route.params.id}`}" replace class="m-1 mr-3">CFRA</b-navbar-brand>

        <b-navbar-toggle target="nav-collapse" class="mr-auto">
          <template #default="{ expanded }">
            <b-icon v-if="expanded" icon="chevron-bar-up"></b-icon>
            <b-icon v-else icon="chevron-bar-down"></b-icon>
          </template>
        </b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="mr-auto">

            <b-nav-item-dropdown class="m-1" text="Pacientes" right v-if="$store.getters.getFuncao === 'Parceiro' ||$store.getters.getFuncao === 'Profissional' || $store.getters.getFuncao === 'Admin'">
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/CadastroPaciente`}" replace>Cadastrar/Atualizar</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Agendamentos`}" replace>Agenda</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Evolucao`}" replace>Evolução Diária</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Presenca`}" replace>Presença</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Relatorio`}" replace>Relatório</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Comissao`}" replace>Comissão</b-dropdown-item>
            </b-nav-item-dropdown>

          <b-nav-item-dropdown class="m-1" text="Financeiro" right v-if="$store.getters.getFuncao === 'Financeiro' || $store.getters.getFuncao === 'Admin'">
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Custos`}" replace>Custos Operacionais</b-dropdown-item>
              <b-dropdown-item href="#">Comissões</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Relatorios`}" replace>Relatórios</b-dropdown-item>
            </b-nav-item-dropdown>

            <b-nav-item-dropdown class="m-1" text="Administração" right v-if="$store.getters.getFuncao === 'Admin'">
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Profissionais`}" replace>Profissionais</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Procedimentos`}" replace>Procedimentos</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Salas`}" replace>Salas</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Feriados`}" replace>Feriados</b-dropdown-item>
              <b-dropdown-item :to="{path: `/Home/${$route.params.id}/Homologa`}" replace>Funções de Homologação</b-dropdown-item>
            </b-nav-item-dropdown>

          </b-navbar-nav>
        </b-collapse>
        <div class="p-0">
          <b-row >
            <b-col>
              <b-button v-show="user.data" variant="outline-light" @click="signOut" class="" size="sm">
                Sair <b-icon icon="door-open-fill"> </b-icon>{{ userEmail }}
              </b-button>
            </b-col>
          </b-row>
          <b-row class="mt-1" >
            <b-col>
              <b-tooltip placement="auto" target="dicas" v-if="$store.getters.getSatusTooltip">
                Ajuda na utilização das funções da página. Apresenta um quadro com informações sobre o item.
              </b-tooltip>
              <div id="dicas" >
                <b-form-checkbox v-model="helper" @change="$store.commit('setTooltipStatus',{root:$root})" name="ajuda-button" switch>
                  <span class="text-light" v-if="!helper">Dicas desligadas</span>
                  <span class="text-light" v-else>Dicas ligadas</span>
                </b-form-checkbox>
              </div>
            </b-col>
          </b-row>
        </div>
      </b-navbar>
      <b-breadcrumb :items="$route.meta.breadcrumb"></b-breadcrumb>
      <!--router view para mostrar os componentes filhos do Home-->
      <router-view></router-view>
    </div>
    <div v-else class="text-center text-info">
      <b-progress max="1" height="4.2rem" variant="dark" striped animated
                  class="align-middle">
        <b-progress-bar value="1">
          <strong style="font-size: 1.3rem">Carregando...</strong>
        </b-progress-bar>

      </b-progress>
    </div>


<!--    <b-breadcrumb :items=""></b-breadcrumb>-->
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import { connDb } from "../store/connDb";

export default {
  name: "Home",
  watch:{
    '$route'(){
      this.breadcrumbList = this.$route.meta.breadcrumb
    }
  },
  mixins:[connDb],
  data(){
    return {
      helper:false,
      breadcrumbList:'',
      userEmail:'',
      sala:false,
      procedimento:false,
      profissional:false,
      feriado:false
    }
  },
  methods:{
    signOut() {
      //limpando vuex para se algum login diferente entrar no app (mesmo browser), não pegar dados armazenados
      this.$store.commit('resetEvents')
      this.$store.commit('resetSessoesAcompDia')
      this.connDbAuth()
          .signOut()
          .then(() => {
              this.$router.replace({
                name: "Login"
              });
          });
    }
  },
  computed:{
    ...mapGetters({
      user: "user"
    })
  },
  created() {
    if (this.user.data === null){
      this.$router.replace({
        name: "Login"
      });
    }else {
      this.userEmail = this.user.data.displayName || this.user.data.email || 'email'
      //pegar qual o papel - função - do login
      this.connDbAuth().currentUser.getIdTokenResult()
          .then((idTokenResult) => {
            this.$store.commit('setFuncao',idTokenResult.claims.funcao)
          })
          .catch((error) => {
            console.log(error);
          });
      //carregar tabelas para consultas
      //colocando async e promisse para só carregar o menu depois que tiver as infos
      this.$store.dispatch('getProfissionaisDb').then(res => {
        if (res === 'ok'){
          this.profissional = true
        }
      })
      this.$store.dispatch('getSalasDb').then(res => {
        if (res === 'ok'){
          this.sala = true
        }
      })
      this.$store.dispatch('getProcedimentosDB').then(res => {
        if (res === 'ok'){
          this.procedimento = true
        }
      })
      this.$store.dispatch('getFeriadosDB').then(res => {
        if (res === 'ok'){
          this.feriado = true
        }
      })
      // this.$store.dispatch('priAcesso')
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Exo&display=swap');
/deep/ .nav-item.nav-item.nav-item{
  font-size: 1.1em;
  font-family: 'Exo', sans-serif;
  color: white !important;
  background-color: #0278ae;
  margin: -4px 0 -1px 0;
  padding: 4px;
}
/deep/ .nav-item.nav-item.nav-item li a {
  font-family: 'Exo', sans-serif;
  color: white;
  background-color: #0278ae;
  margin: -8px 0 -8px 0;
  padding-top: 6px;
}
</style>