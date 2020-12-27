const functions = require('firebase-functions');
const admin = require('firebase-admin');
//emulador local
admin.initializeApp({ projectId: "fisiovue" });

exports.removeSessao = functions.https.onCall((data)=> {

    return new Promise((resolve, reject) => {
        console.log('data',data)
        const db = admin.firestore()
        db.collection('sessoes')
            .doc(data).delete().then(() => {
            resolve(`Sessão desmarcada com sucesso.`)
        })
            .catch(err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))

    })
})

exports.getSessoes = functions.https.onCall(async() => {
    //async na chamada da função por causa dos documentos que são referenciados nos valores das sessões
    //a atualização de uma sessão ocorrerá se o dado de algum objeto mudar(paciente, profissional,
    //sala e procedimento)
    var listSessoes = [];
    var paciente;
    var profissional;
    var procedimento;
    var sala;
    var tamanhoSnap =0;
    return new Promise((resolve,reject) => {
        const db = admin.firestore()
        db.collection('sessoes')
            .where("uuid", "!=", " ")
            .get()
            .then( function (querySnapshot) {
                console.log("tamanho docs ",querySnapshot.docs.length)
                tamanhoSnap = querySnapshot.docs.length;
                querySnapshot.forEach(async function(doc) {
                    var sessao = {
                        uuid: null,
                        horaInicio: null,
                        horaFim: null,
                        observacao: null,
                        paciente:null,
                        profClass:null,
                        profNome:null,
                        proc:null,
                        sala:null
                    }
                    //começã a buscar os 'collection' de outras 'collections'
                    sessao.paciente = doc.get('paciente').id
                    // paciente =  doc.get('paciente').get().then((resPac)=>{
                    //     sessao.paciente = resPac.data().nome
                    //     console.log(doc.get('paciente').id)
                    // })
                    sessao.profissional = doc.get('profissional').id

                    // profissional = doc.get('profissional').get().then((resProf)=>{
                    //     sessao.profClass = resProf.data().corProf
                    //     sessao.profNome = resProf.data().nome
                    // })
                    sessao.proc = doc.get('procedimento').id
                    // procedimento =  doc.get('procedimento').get().then((resProc)=>{
                    //     sessao.proc = resProc.data().nomeProcedimento
                    // })
                    sessao.sala = doc.get('sala').id
                    // sala =  doc.get('sala').get().then((resSala)=>{
                    //     sessao.sala = resSala.data().nomeSala
                    // })
                    sessao.uuid = doc.data().uuid
                    sessao.horaInicio = doc.data().horaInicio
                    sessao.horaFim = doc.data().horaFim
                    sessao.observacao = doc.data().observacao
                    listSessoes.push(sessao)
                })
                // tem que aguardar na disciplina II
                return Promise.all([paciente, profissional, procedimento, sala, listSessoes])
                    .then(() => {
                        console.log('tamanho enviado',listSessoes.length)
                        if (listSessoes.length !== tamanhoSnap){
                            reject('Número de sessões discrepantes.')
                        }
                        resolve(listSessoes)
                    })

            })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
})

exports.setSessao = functions.https.onCall((data)=>{
    return new Promise((resolve,reject)=>{
        const db = admin.firestore()
        const uuid = data.paciente
        data.paciente = db.doc('pacientes/' + uuid)
        const uuidProf = data.profissional
        data.profissional = db.doc('profissionais/'+ uuidProf)
        const uuidSala = data.sala
        data.sala = db.doc('salas/'+ uuidSala)
        const uuidProc = data.procedimento
        data.procedimento = db.doc('procedimentos/'+ uuidProc)
        db.collection('sessoes')
            .doc(data.uuid)
            .set(
                data
            ).then(() => {
                resolve(`Sessa(oes) gravada(s) com sucesso.`)
            })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
})

exports.getSalas = functions.https.onCall(() =>{
    var listSalas = []
    return new Promise((resolve,reject) => {
        const db = admin.firestore()
        db.collection('salas')
            .get()
            .then(function(querySnapshot){
                querySnapshot.forEach(function(doc) {
                    listSalas.push(doc.data())
                });
                resolve(listSalas)
            })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
})

exports.cadastroSalas = functions.https.onCall((data) =>{
    var msg = 'atualizada';
    return new Promise((resolve, reject) =>{
        //vamos testar se é para cadastro ou atualização
        if (data.uuid === undefined){
            const { v4: uuidv4 } = require('uuid');
            data.uuid = uuidv4()
            msg = 'cadastrada'
        }
        const db = admin.firestore()
        db.collection('salas')
            .doc(data.uuid)
            .set(
                data
            ).then(() => {
            resolve(`Sala ${data.nomeSala} ${msg} com sucesso.`)
        })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
})

exports.getProcedimentos = functions.https.onCall(() =>{
    var listProcedimentos = []
    return new Promise((resolve,reject) => {
        const db = admin.firestore()
        db.collection('procedimentos')
            .get()
            .then(function(querySnapshot){
                querySnapshot.forEach(function(doc) {
                    listProcedimentos.push(doc.data())
                });
                resolve(listProcedimentos)
            })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
})

exports.cadastroProcedimentos = functions.https.onCall((data) =>{
    var msg = 'atualizado';
    return new Promise((resolve, reject) =>{
        //vamos testar se é para cadastro ou atualização
        if (data.uuid === undefined){
            const { v4: uuidv4 } = require('uuid');
            data.uuid = uuidv4()
            msg = 'cadastrado'
        }
        const db = admin.firestore()
        db.collection('procedimentos')
            .doc(data.uuid)
            .set(
                data
            ).then(() => {
            resolve(`Procedimento ${data.nomeProcedimento} ${msg} com sucesso.`)
        })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
})

exports.getPacientes = functions.https.onCall(() =>{
    var listPacientes = []
    return new Promise((resolve,reject) => {
        const db = admin.firestore()
        db.collection('pacientes')
            .get()
            .then(function(querySnapshot){
                querySnapshot.forEach(function(doc) {
                    listPacientes.push(doc.data())
                });
                resolve(listPacientes)
            })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
});

exports.cadastroPaciente = functions.https.onCall((data) =>{
    var msg = 'atualizado';
    return new Promise((resolve, reject) =>{
        //vamos testar se é para cadastro ou atualização
        if (data.uuid === undefined){
            const { v4: uuidv4 } = require('uuid');
            data.uuid = uuidv4()
            msg = 'cadastrado'
        }
        const db = admin.firestore()
        db.collection('pacientes')
            .doc(data.uuid)
            .set(
                data
            ).then(() => {
                resolve(`Paciente ${data.nome} ${msg} com sucesso.`)
        })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
})

exports.statusProfissional = functions.https.onCall((data) => {
    return new Promise((resolve,reject) => {
        admin
            .auth()
            .getUser(data.admUid)
            .then((adminRec) => {
                //checa se é administrador
                if (adminRec.customClaims.funcao === 'Admin') {
                    admin
                        .auth()
                        .getUserByEmail(data.email)
                        .then((userRecord) => {
                            // See the UserRecord reference doc for the contents of userRecord.
                            admin.auth().updateUser(userRecord.uid, data.status)
                                .then(() => {
                                    const db = admin.firestore()
                                    data.atualizado = new Date()
                                    db.collection('profissionais')
                                        .doc(data.uuid)
                                        .set(data.status, { merge: true }).then(() =>{
                                        resolve(`Status do login ${data.email} atualizado com sucesso.`)
                                    })
                                })
                        })
                        .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))

                }
            })
    })
})

exports.getProfissionais = functions.https.onCall(() =>{
    var listProfissionais = []
    return new Promise((resolve,reject) => {
        const db = admin.firestore()
        db.collection('profissionais')
            .get()
            .then(function(querySnapshot){
                querySnapshot.forEach(function(doc) {
                    listProfissionais.push(doc.data())
                });
                resolve(listProfissionais)
            })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
});

exports.atualizaProfissional = functions.https.onCall((data) => {
    return new Promise((resolve, reject) => {
        admin
            .auth()
            .getUser(data.admUid)
            .then((adminRec) => {
                //checa se é administrador
                if (adminRec.customClaims.funcao === 'Admin') {
                    admin
                        .auth()
                        .getUserByEmail(data.email)
                        .then((userRecord) => {
                            // See the UserRecord reference doc for the contents of userRecord.
                            admin.auth().setCustomUserClaims(userRecord.uid, {funcao: data.funcao})
                                .then(() => {
                                    const db = admin.firestore()
                                    data.atualizado = new Date()
                                    db.collection('profissionais')
                                        .doc(data.uuid)
                                        .set(data).then(() =>{
                                        resolve(`Profissional ${data.nome} atualizado com sucesso.`)
                                    })
                                })
                        })
                        .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))

                }
            })
            .catch( err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
})

exports.criarProfissional = functions.https.onCall((data) => {
    //promise para retornar para tela do usuário
    return new Promise((resolve, reject) => {
        const { v4: uuidv4 } = require('uuid');
        data.uuid = uuidv4()
        admin
            .auth()
            .getUser(data.admUid)
            .then((adminRec) => {
                //***checa se é administrador***
                if (adminRec.customClaims.funcao === 'Admin') {
                    return admin.auth().createUser({email: data.email, password: data.password})
                        .then((user) => {
                            admin.auth().setCustomUserClaims(user.uid, {funcao: data.funcao})
                                .then(() => {
                                    const db = admin.firestore()
                                    data.date = new Date()
                                    db.collection('profissionais')
                                        .doc(data.uuid)
                                        .set(data).then(() =>{
                                        resolve(`Profissional ${data.nome} cadastrado com sucesso.`)
                                    })
                                })
                        })
                        .catch((error) => {
                            throw new functions.https.HttpsError('internal', error.message)
                        });
                } else {
                    resolve ('Usuário não possui permissão para a operação.')
                }
            })
            .catch(err => reject(new functions.https.HttpsError('failed-precondition', err.message || 'Internal Server Error')))
    })
});
