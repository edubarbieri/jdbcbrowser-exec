const request = require('request');
const url = require('url');
const cheerio = require('cheerio');
const dynamoRequest = require('dynamo-request');
const jdbcBrowserUrl = '/dyn/admin/atg/dynamo/admin/en/jdbcbrowser/executeQuery.jhtml';
const dataSourceUrl = '/dyn/admin/nucleus/atg/dynamo/service/jdbc/';
const jdbcIndexUrl = '/dyn/admin/atg/dynamo/admin/en/jdbcbrowser/index.jhtml';
const regexFormAction = /(<form[^>]*\s+action=['"])(.*)(['"])/g;
const regexSqlError = /(<h2>Error<\/h2>)([\s\S]*)(<h2>Operation rolled back<\/h2>)/g;
const regexTableResult = /(<table)([\s\S]*)(<\/table>)/g;

/**
 * Execute query in jdbcbrowser
 * @param {Object} options - Request options
 * @param {string} options.host - Full server host address to acces jdbc browser, Ex: http://localhost:10181.
 * @param {string} options.auth - User and password concatened with colon, Ex: admin:passwd
 * @param {string} options.query - Sql query to execute in jdbcbrowser
 * @param {function} callback - function execution callbacck
 * @returns {void}
 */
function executeQuery(options, callback) {
    let optionsFormUrl = {
        url: url.resolve(options.host, jdbcBrowserUrl),
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + new Buffer(options.auth).toString('base64')
        },
    };
    request(optionsFormUrl, function (error, response, body) {
        if (error || response.statusCode >= 300) {
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
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + new Buffer(options.auth).toString('base64')
            },
            form: formData
        };
        request(optionsSql, function (errorSql, responseSql, bodySql) {
            if (errorSql || responseSql.statusCode >= 300) {
                callback('HTTP error ' + (errorSql ? errorSql : responseSql.statusCode));
                return;
            }
            let errosMatch = regexSqlError.exec(bodySql);
            if (errosMatch) {
                callback(errosMatch[2]);
                console.log('Error: ', errosMatch[2]);
            } else {
                callback(null, bodySql.match(regexTableResult)[0]);
            }
        });
    });
}

/**
 * List datasources
 * @param {Object} options - Request options
 * @param {string} options.host - Full server host address to acces jdbc browser, Ex: http://localhost:10181.
 * @param {string} options.auth - User and password concatened with colon, Ex: admin:passwd
 * @param {function} callback - function execution callbacck
 * @returns {void}
 */
function listDataSources(options, callback) {
    let reqOptions = {
        url: url.resolve(options.host, dataSourceUrl),
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + new Buffer(options.auth).toString('base64')
        },
    };
    request(reqOptions, function (error, response, body) {
        if (error || response.statusCode >= 300) {
            callback('HTTP error ' + (error ? error : response.statusCode));
            return;
        }
        try {
            const $ = cheerio.load(body);
            var listDS = $('h3 a').map(function () {
                let href = this.attribs.href;
                if (href.indexOf('DataSourceInfoCache') >= 0 || href.indexOf('DataSource') === -1) {
                    return;
                }
                if (href.indexOf('/') >= 0) {
                    href = href.substring(0, href.indexOf('/'));
                }
                return '/atg/dynamo/service/jdbc/' + href;
            }).get();

            callback(null, listDS);

        } catch (error) {
            callback('Generic error ' + error);
        }
    });
}

/**
 * Set datasource to run query
 * @param {Object} options - Request options
 * @param {string} options.host - Full server host address to acces jdbc browser, Ex: http://localhost:10181.
 * @param {string} options.auth - User and password concatened with colon, Ex: admin:passwd
 * @param {string} options.datasource -Datasource to set
 * @param {function} callback - function execution callbacck
 * @returns {void}
 */
function setDataSource(options, callback) {
    //Update property
    const propertyReq = {
        component: '/atg/dynamo/admin/jdbcbrowser/ConnectionPoolPointer/',
        propertyName: 'connectionPool',
        newValue: options.datasource
    };
    dynamoRequest.updateProperty(options.host, propertyReq, options.auth, (error, requestData) => {
        if (error) {
            callback('Error ' + error);
            return;
        }
        callback(null, 'success');
    });
}

/**
 * Set datasource to run query
 * @param {Object} options - Request options
 * @param {string} options.host - Full server host address to acces jdbc browser, Ex: http://localhost:10181.
 * @param {string} options.auth - User and password concatened with colon, Ex: admin:passwd
 * @param {function} callback - function execution callbacck
 * @returns {void}
 */
function getCurrentDataSource(options, callback) {
    let reqOptions = {
        url: url.resolve(options.host, jdbcIndexUrl),
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + new Buffer(options.auth).toString('base64')
        },
    };
    request(reqOptions, function (error, response, body) {
        if (error || response.statusCode >= 300) {
            callback('HTTP error ' + (error ? error : response.statusCode));
            return;
        }
        try {
            const $ = cheerio.load(body);
            callback(null, $('tt').first().text().trim());

        } catch (error) {
            callback('Generic error ' + error);
        }
    });
}

module.exports = {
    executeQuery,
    listDataSources,
    setDataSource,
    getCurrentDataSource
};