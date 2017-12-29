const jdbc = require('./index');

jdbc.executeQuery({
    auth: 'admin:admin',
    host: 'http://localhost:10181',
    query: 'select * from user'    
}, function(error, result){
    if(error){
        console.log('Erro run query: ', error);
        return;
    }
    console.log('Query result: ', result);
});

jdbc.listDataSources({
    auth: 'admin:admin',
    host: 'http://localhost:10181'
}, function(error, result){
    if(error){
        console.log('Erro : ', error);
        return;
    }
    console.log('Result: ', result);
});