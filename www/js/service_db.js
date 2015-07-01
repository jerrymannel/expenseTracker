app.factory('DB', function ($q, $rootScope, $cordovaSQLite, Toast, $window) {

    var table_names = ['user_table', 'expense_table', 'dutch_table'];

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
        var statement = "SELECT * FROM dutch_table WHERE transactionId = " + transId;
        $cordovaSQLite.execute(db, statement).then(function (r) {
            var splitters = [];
            if (r.rows.length > 0) {
                console.info('Number of transactions retrieved :: ' + r.rows.length);
                var i = 0;
                while (i < r.rows.length) {
                    splitters.push({
                        username: r.rows.item(i).user,
                        amount: r.rows.item(i).amount
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