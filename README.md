jdbcbrowser-exec
=========

Js lib to run sql query in dynamo jdbc browser.

## Installation
```
  npm install jdbcbrowser-exec
```

```javascript
const jdbc = require('jdbcbrowser-exec');

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


jdbc.setDataSource({
    auth: 'admin:admin',
    host: 'http://localhost:10181', 
    datasource : '/atg/dynamo/service/jdbc/SwitchingDataSourceA'
}, function(error, result){
    if(error){
        console.log('Erro : ', error);
        return;
    }
    console.log('Result: ', result);
});

jdbc.getCurrentDataSource({
    auth: 'admin:admin',
    host: 'http://localhost:10181'
}, function(error, result){
    if(error){
        console.log('Erro : ', error);
        return;
    }
    console.log('Result: ', result);
});

```

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Lint and test your code