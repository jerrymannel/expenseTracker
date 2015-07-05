app.factory('DB', function ($q, $rootScope, $cordovaSQLite, Toast, $window) {

    var table_names = ['user_table', 'expense_table', 'dutch_table', 'settlement_table'];

    var initializeDB = function () {
        var sql = 'CREATE TABLE IF NOT EXISTS user_table(userId INTEGER PRIMARY KEY AUTOINCREMENT, userName, credit)';
        $cordovaSQLite.execute(db, sql).then(function (r) {
            console.log('User DB Initialized');
        }, catchError);
        var sql = 'CREATE TABLE IF NOT EXISTS expense_table(transactionId INTEGER PRIMARY KEY AUTOINCREMENT, transactiondate, amount, location, paidBy)';
        $cordovaSQLite.execute(db, sql).then(function (r) {
            console.log('Transaction DB Initialized');
        }, catchError);
        var sql = 'CREATE TABLE IF NOT EXISTS dutch_table(dutchId INTEGER PRIMARY KEY AUTOINCREMENT, transactionId, dutchdate, amount, user)';
        $cordovaSQLite.execute(db, sql).then(function (r) {
            console.log('Dutch DB Initialized');
        }, catchError);
        var sql = 'CREATE TABLE IF NOT EXISTS settlement_table(user, debit, credit)';
        $cordovaSQLite.execute(db, sql).then(function (r) {
            console.log('Settlements DB Initialized');
        }, catchError);
        var sql = 'CREATE TABLE IF NOT EXISTS settlement_history(from, to, amount, date)';
        $cordovaSQLite.execute(db, sql).then(function (r) {
            console.log('Settlement History DB Initialized');
        }, catchError);
    }

    var addNewUser = function (data) {
        var defer = $q.defer();
        var statement = 'INSERT INTO user_table (userName, credit) VALUES(?,?)';
        getUser(data).then(function (d) {
            if (d == 0) {
                $cordovaSQLite.execute(db, statement, [data, 0]).then(function (d) {
                    console.log("New INSERT :: " + d.rowsAffected);
                    defer.resolve();
                }, function (e) {
                    defer.reject()
                });
                defer.resolve();
            } else {
                defer.reject();
            }
        }, function (e) {
            defer.reject()
        });
        return defer.promise;
    }

    var addNewExpense = function (data) {
        var defer = $q.defer();
        var statement_expense = 'INSERT INTO expense_table (transactiondate, amount, location, paidBy) VALUES(?, ?, ?, ?)';
        $cordovaSQLite.execute(db, statement_expense, [data.date, data.amount, data.location, data.paidBy]).then(function (resultSet) {;
            if (resultSet.rowsAffected != 1) defer.reject();
            else defer.resolve(resultSet.insertId);
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    }

    var addNewDutchData = function (data) {
        var defer = $q.defer();
        var statement_dutch = 'INSERT INTO dutch_table (transactionId, dutchdate, amount, user) VALUES(?, ?, ?, ?)';
        $cordovaSQLite.execute(db, statement_dutch, data).then(function (resultSet) {
            if (resultSet.rowsAffected != 1) defer.reject();
            else defer.resolve(resultSet.insertId);
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    }
    
    var addSettlementData = function (data) {
        var defer = $q.defer();
        var statement_settlement = 'INSERT INTO settlement_table (user, debit, credit) VALUES(?, ?, ?)';
        $cordovaSQLite.execute(db, statement_settlement, data).then(function (resultSet) {
            if (resultSet.rowsAffected != 1) defer.reject();
            else defer.resolve(resultSet.insertId);
            
            console.log("Settlement inserted " + resultSet.insertId);
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    }
    
    var addSettlementHistory = function (data) {
        var defer = $q.defer();
        var statement_settlement = 'INSERT INTO settlement_history (from, to, amount, date) VALUES(?, ?, ?, ?)';
        $cordovaSQLite.execute(db, statement_settlement, data).then(function (resultSet) {
            if (resultSet.rowsAffected != 1) defer.reject();
            else defer.resolve(resultSet.insertId);
            
            console.log("Settlement history inserted " + resultSet.insertId);
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    }

    var getUserList = function () {
        var defer = $q.defer();
        var query = "SELECT userName FROM user_table";
        $cordovaSQLite.execute(db, query).then(function (r) {
            var userName = [];
            if (r.rows.length > 0) {
                console.info('Number of users retrieved :: ' + r.rows.length);
                var i = 0;
                while (i < r.rows.length) {
                    userName.push(r.rows.item(i).userName);
                    i++;
                }
                defer.resolve(userName);
            } else {
                console.info('No users fetched!');
                defer.reject();
            }
        }, function (e) {
            defer.reject();
        });
        return defer.promise;
    }

    var getUser = function (userName) {
        var defer = $q.defer();
        var statement = "SELECT userName from user_table WHERE userName = '" + userName + "'";
        $cordovaSQLite.execute(db, statement).then(function (r) {
            defer.resolve(r.rows.length);
        }, function (e) {
            console.error(e.message);
            defer.reject();
        });
        return defer.promise;
    }

    var getUserCredit = function (userName) {
        var defer = $q.defer();
        var statement = "SELECT credit from user_table WHERE userName = '" + userName + "'";
        $cordovaSQLite.execute(db, statement).then(function (r) {
            defer.resolve(r.rows.item(0).credit);
        }, function (e) {
            console.error(e.message);
            defer.reject();
        });
        return defer.promise;
    }

    var getExpenses = function (transactionId) {
        var defer = $q.defer();
        var statement = null;
        if (transactionId != '')
            statement = "SELECT * FROM expense_table WHERE transactionId = '" + transactionId + "'";
        else
            statement = "SELECT * FROM expense_table";
        $cordovaSQLite.execute(db, statement).then(function (r) {
            var expenses = []
            if (r.rows.length > 0) {
                console.info('Number of transactions retrieved :: ' + r.rows.length);
                var i = 0;
                while (i < r.rows.length) {
                    expenses.push({
                        id: r.rows.item(i).transactionId,
                        date: new Date(r.rows.item(i).transactiondate),
                        amount: r.rows.item(i).amount,
                        location: r.rows.item(i).location != 'undefined' ? r.rows.item(i).location : '',
                        paidBy: r.rows.item(i).paidBy
                    });
                    i++;
                }
                defer.resolve(expenses);
            }
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    }

    var getDutchDetails = function (transId) {
        var defer = $q.defer();
        
        if(transId != '')
            var statement = "SELECT * FROM dutch_table WHERE transactionId = " + transId;
        else
            var statement = "SELECT * FROM dutch_table";
        
        $cordovaSQLite.execute(db, statement).then(function (r) {
            var splitters = [];
            if (r.rows.length > 0) {
                console.info('Number of transactions retrieved :: ' + r.rows.length);
                var i = 0;
                while (i < r.rows.length) {
                    splitters.push({
                        username: r.rows.item(i).user,
                        amount: r.rows.item(i).amount,
                        transid: r.rows.item(i).transactionId
                    });
                    i++;
                }
            }
            defer.resolve(splitters);
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    }
    
    var getSettlementData = function(user){
        var defer = $q.defer();
        if(user)
            var stmnt = "SELECT * FROM settlement_table WHERE user = '" + user +"'";
        else
            var stmnt = "SELECT * FROM settlement_table";
        $cordovaSQLite.execute(db, stmnt).then(function (r) {
            if (r.rows.length > 0) {
                console.info('Number of rows retrieved :: ' + r.rows.length);
                var i = 0;
                var data = [];
                while (i < r.rows.length) {
                    data.push({
                        username: r.rows.item(i).user,
                        credit: r.rows.item(i).credit,
                        debit: r.rows.item(i).debit
                    });
                    i++;
                }
                defer.resolve(data);
            }
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    };
    
    var updateSettlement = function (col, user, amount) {
        var defer = $q.defer();
        var amount = amount;
        var col = col;
        
        var stmnt = "SELECT * FROM settlement_table WHERE user = '" + user + "'";
        $cordovaSQLite.execute(db, stmnt).then(function (data) {
            if(data.rows.length > 0){
                if(col === "credit")
                    amount = parseInt(amount) + parseInt(data.rows.item(0).credit);
                else
                    amount = parseInt(amount) + parseInt(data.rows.item(0).debit);
                
                var statement_expense = "UPDATE OR FAIL settlement_table SET '"+col+"' = " + amount + " WHERE user = '" + user + "'";
                $cordovaSQLite.execute(db, statement_expense).then(function (resultSet) {
                    if (resultSet.rowsAffected != 1){
                        defer.reject();
                    }else{
                        defer.resolve(data.id);
                        console.log("Settlement updated");
                    }
                }, function (e) {
                    catchError(e);
                    defer.reject();
                });
            }else{
                var settle = [];
                if(col === "credit"){
                    settle = [user, 0, amount];
                }else{
                    settle = [user, amount, 0]; 
                }
                addSettlementData(settle);
            }
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    };
    
    var getDataToSettle = function(user){
        var defer = $q.defer();
        var statement = "SELECT dutch_table.transactionId, dutch_table.amount, expense_table.paidBy FROM dutch_table INNER JOIN expense_table ON dutch_table.transactionId=expense_table.transactionId WHERE dutch_table.user = '"+user+"'";
        $cordovaSQLite.execute(db, statement).then(function (r) {
            if (r.rows.length > 0) {
                console.info('Number of rows retrieved :: ' + r.rows.length);
                var i = 0;
                var data = [];
                while (i < r.rows.length) {
                    if(r.rows.item(i).paidBy != user){
                        data.push({
                            transactionId: r.rows.item(i).transactionId,
                            amount: r.rows.item(i).amount,
                            payTo: r.rows.item(i).paidBy,
                            from: user
                        });
                    }
                    i++;
                }
                defer.resolve(data);
            }
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    };
    var getAllExpense = function(){
        var defer = $q.defer();
        var stmnt = "SELECT * FROM user_table";
        $cordovaSQLite.execute(db, stmnt).then(function (r) {
            if (r.rows.length > 0) {
                console.info('Number of rows retrieved :: ' + r.rows.length);
                var i = 0;
                var data = [];
                while (i < r.rows.length) {
                    data.push({
                        username: r.rows.item(i).userName,
                        credit: r.rows.item(i).credit
                    });
                    i++;
                }
                defer.resolve(data);
            }
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    };
    
    var getDebitPerUser = function(users){
        var defer = $q.defer();
        var data = [];
        users.forEach(function(user){
            var statement = "SELECT SUM(amount) as debit FROM dutch_table WHERE user = '"+user.username+"'";
            $cordovaSQLite.execute(db, statement).then(function (r) {
                if (r.rows.length > 0) {
                    console.info('Number of rows retrieved :: ' + r.rows.length);
                    var i = 0;
                    while (i < r.rows.length) {
                        data.push({
                            username: user.username,
                            credit: user.credit,
                            debit: r.rows.item(0).debit
                        });
                        i++;
                    }
                    defer.resolve(data);
                }
            }, function (e) {
                catchError(e);
                defer.reject();
            });
        });
        
        return defer.promise;
    };
    
    /*var getExpenseDetails = function(){
        var defer = $q.defer();
        var statement = "SELECT expense_table.transactionId, expense_table.transactiondate, expense_table.amount, expense_table.paidBy, expense_table.location, dutch_table.amount AS split, dutch_table.user FROM expense_table INNER JOIN dutch_table ON expense_table.transactionId=dutch_table.transactionId";
        $cordovaSQLite.execute(db, statement).then(function (r) {
            console.info('Rows fetched from table' + r.rows.length);
            if (r.rows.length > 0) {
                var i = 0;
                var data = [];
                while (i < r.rows.length) {
                    var paidby = r.rows.item(i).paidBy;
                    var transactionId = r.rows.item(i).transactionId;
                    var transactiondate = r.rows.item(i).transactiondate;
                    var amount = r.rows.item(i).amount;
                    var location = r.rows.item(i).location;
                    
                    var temp = 0;
                    if(data[paidby]){
                        for(var k=0;k<data[paidby].length;k++){
                            var paid = data[paidby][k];
                            if(transactionId === paid.transactionId){
                                paid.split.push({
                                    contri: r.rows.item(i).split,
                                    user: r.rows.item(i).user
                                });
                                temp = 0;
                                break;
                            }else{
                                temp = 1;
                            }
                        }
                        if(temp == 1){
                            data[paidby].push({
                                transactionId: transactionId,
                                transactiondate: transactiondate,
                                amount: amount,
                                location: location,
                                split: [{
                                    contri: r.rows.item(i).split,
                                    user: r.rows.item(i).user
                                }]
                            });
                        }
                            
                    }else{
                        data[paidby] = [];
                        data[paidby].push({
                            transactionId: transactionId,
                            transactiondate: transactiondate,
                            amount: amount,
                            location: location,
                            split: [{
                                contri: r.rows.item(i).split,
                                user: r.rows.item(i).user
                            }]
                        });
                    }
                    i++;
                }
                console.info(JSON.stringify(data));
                defer.resolve(data);
            }
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    };*/
    
    var updateExpense = function (data) {
        var defer = $q.defer();
        var statement_expense = "UPDATE OR FAIL expense_table SET transactiondate = '" + data.date + "', amount = " + data.amount + ", location = '" + data.location + "', paidBy = '" + data.paidBy + "' WHERE transactionId = " + data.id;
        $cordovaSQLite.execute(db, statement_expense).then(function (resultSet) {
            if (resultSet.rowsAffected != 1) defer.reject();
            else defer.resolve(data.id);
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    }

    var creditUpdate = function (userName, amount) {
        var defer = $q.defer();
        var statement = "UPDATE OR FAIL user_table SET credit = credit + '" + amount + "' WHERE userName = '" + userName + "'";
        $cordovaSQLite.execute(db, statement).then(function (d) {
            defer.resolve();
        }, function (e) {
            catchError(e);
            defer.reject();
        });
        return defer.promise;
    }

    var removeUser = function (userName) {
        var statement = "DELETE from user_table WHERE userName = '" + userName + "'";
        $cordovaSQLite.execute(db, statement).then(function (s) {}, catchError);
    }
    
    var removeTransactionData = function (transactionID) {
        var statement = "DELETE from expense_table WHERE transactionID = " + transactionID;
        $cordovaSQLite.execute(db, statement).then(function (s) {}, catchError);
    }
    
    var removeDutchData = function (transactionID) {
        var statement = "DELETE from dutch_table WHERE transactionID = " + transactionID;
        $cordovaSQLite.execute(db, statement).then(function (s) {}, catchError);
    }

    var cleanUp = function () {
        table_names.forEach(function (t) {
            var statement = 'DROP TABLE IF EXISTS ' + t;
            $cordovaSQLite.execute(db, statement).then(function (r) {
                console.log(t.toUpperCase() + ' :: Cleared')
            }, catchError);
        });
    }

    function catchError(e) {
        console.error(e.message);
    }

    return {
        initializeDB: initializeDB,
        cleanUp: cleanUp,
        addNewUser: addNewUser,
        removeUser: removeUser,
        creditUpdate: creditUpdate,
        getUser: getUser,
        getUserList: getUserList,
        addNewExpense: addNewExpense,
        updateExpense: updateExpense,
        getUserCredit: getUserCredit,
        getExpenses: getExpenses,
        getDutchDetails: getDutchDetails,
        addNewDutchData: addNewDutchData,
        removeDutchData: removeDutchData,
        getAllExpense: getAllExpense,
        getDebitPerUser: getDebitPerUser,
        /*getExpenseDetails: getExpenseDetails,*/
        addSettlementData: addSettlementData,
        getSettlementData: getSettlementData,
        updateSettlement: updateSettlement,
        getDataToSettle: getDataToSettle,
        addSettlementHistory: addSettlementHistory,
        setRootUser: function (userName) {
            $window.localStorage['root'] = userName;
        },
        getRootUser: function () {
            return $window.localStorage['root']
        },
        removeRootUser: function () {
            $window.localStorage.removeItem('root');
        }
    }

});