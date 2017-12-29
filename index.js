const request = require('request');
const url = require('url');
const jdbcBrowserUrl = '/dyn/admin/atg/dynamo/admin/en/jdbcbrowser/executeQuery.jhtml';
const regexFormAction = /(<form[^>]*\s+action=['"])(.*)(['"])/g;
const regexSqlError = /(<h2>Error<\/h2>)([\s\S]*)(<h2>Operation rolled back<\/h2>)/g;
const regexTableResult = /(<table)([\s\S]*)(<\/table>)/g;       

/**
 * Send request to update property in dynamo.
 * @param {Object} options - Request options
 * @param {string} options.host - Full server host address to acces jdbc browser, Ex: http://localhost:10181.
 * @param {string} options.auth - User and password concatened with colon, Ex: admin:passwd
 * @param {string} options.query - Sql query to execute in jdbcbrowser
 * @param {function} callback - function execution callbacck
 * @returns {void}
 */   
function executeQuery(options, callback){
    let optionsFormUrl = {
        url: url.resolve(options.host, jdbcBrowserUrl),
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + new Buffer(options.auth).toString('base64')
        },
    };
    request(optionsFormUrl, function (error, response, body) {
        if(error || response.statusCode >= 300){
            callback('HTTP error ' + (error ? error : response.statusCode));
            return;
        }
        
        const action = regexFormAction.exec(body)[2];
    
        let formData = {};
        formData['/atg/dynamo/admin/jdbcbrowser/ExecuteQueryDroplet.query'] = options.query;    
        formData['_D:/atg/dynamo/admin/jdbcbrowser/ExecuteQueryDroplet.query'] = ' ';
        formData['_D:/atg/dynamo/admin/jdbcbrowser/ExecuteQueryDroplet.longForm'] = ' ';
        formData['_D:/atg/dynamo/admin/jdbcbrowser/ExecuteQueryDroplet.operation'] = ' ';
        formData['/atg/dynamo/admin/jdbcbrowser/ExecuteQueryDroplet.operation'] = 'execute and rollback';
        formData['_D:/atg/dynamo/admin/jdbcbrowser/ExecuteQueryDroplet.operation'] = ' ';
    
    
        var optionsSql = {
            url: url.resolve(options.host, '/dyn/admin/atg/dynamo/admin/en/jdbcbrowser/' + action),
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + new Buffer(options.auth).toString('base64')
            },
            form : formData
        };
        request(optionsSql, function (errorSql, responseSql, bodySql) {
            if(errorSql || responseSql.statusCode >= 300){
                callback('HTTP error ' + (errorSql ? errorSql : responseSql.statusCode));
                return;
            }
            let errosMatch = regexSqlError.exec(bodySql);
            if(errosMatch){
                callback(errosMatch[2]);
                console.log('Error: ', errosMatch[2]);
            }else{
                callback(null,  bodySql.match(regexTableResult)[0]);
            }
        });
    });
}

function listDataSources(options, callback){
    //TODO
}

module.exports = {
    executeQuery,
    listDataSources
};
