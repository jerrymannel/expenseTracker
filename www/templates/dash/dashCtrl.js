app.controller('DashCtrl', function ($scope, $ionicModal, $ionicPopup, DB) {


    $scope.expenses = [];
    var userList = [];

    $scope.$on('$ionicView.afterEnter', init);

    function init() {
        $scope.expenses = [];
        if (!DB.getRootUser()) {
            $scope.addUser = {};
            $ionicPopup.show({
                template: '<input type="text" ng-model="addUser.name" name="userName">',
                title: 'Enter your name',
                scope: $scope,
                buttons: [
                    {
                        text: 'Cancel',
                        type: 'button-dark'
                        },
                    {
                        text: 'OK',
                        type: 'button-positive',
                        onTap: function (d) {
                            DB.addNewUser($scope.addUser.name).then(function (d) {
                                DB.setRootUser($scope.addUser.name);
                                init();
                            });
                        }
                        }
                    ]
            });
        } else {
            $scope.userName = DB.getRootUser();
            DB.getUserList().then(function (d) {
                userList = d.sort().slice(0);
            }, function (e) {});
            updateExpenses();
            updateAmount();
        }
    }

    // modal to show the add expense screen
    $ionicModal.fromTemplateUrl('templates/modals/addExpense.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    // action for the (+) button on the dash
    // opens the modal to enter the expenses
    $scope.addExpense = function () {
        $scope.perhead = 0;
        $scope.splitters = {};
        $scope.expenseData = {
            date: new Date(),
            splitters: [],
            perhead: 0
        };
        $scope.payers = userList.slice(0);
        $scope.sharers = userList.slice(0);
        $scope.modal.show();
    }

    $scope.clearSearch = function () {
        log($scope.searchString);
    }

    // closes the add expense modal
    $scope.closeAddExpense = function () {
        $scope.modal.hide();
    }

    // when we select the person who paid the bill
    // we need to remove them from the list of people
    // with whom the bill must be split
    $scope.changedWhoPaid = function () {
        $scope.expenseData.splitters = [];
        $scope.splitters = {};
        $scope.payers = userList.slice(0);
        $scope.sharers = userList.slice(0);
        $scope.sharers.splice($scope.sharers.indexOf($scope.expenseData.paidBy), 1);
        $scope.expenseData.perhead = $scope.expenseData.amount;
    }

    // the popup to select users with whom the bill must be split.
    var selectSharersPupupConfig = {
        templateUrl: 'templates/modals/selectUser.html',
        cssClass: 'dashpopup',
        scope: $scope,
        buttons: [
            {
                text: 'Cancel',
                type: 'button-assertive'
            },
            {
                text: 'OK',
                type: 'button-positive',
                onTap: function (e) {
                    $scope.expenseData.splitters = [];
                    for (var key in $scope.splitters) {
                        if ($scope.splitters[key]) $scope.expenseData.splitters.push(key);
                    }
                    $scope.expenseData.perhead = Math.ceil($scope.expenseData.amount / ($scope.expenseData.splitters.length + 1));
                }
            }
        ]
    };

    // show the pop-up to select splitters
    $scope.selectSplitters = function () {
        $ionicPopup.show(selectSharersPupupConfig);
    }

    // save the expense
    $scope.saveExpense = function (expense) {
        if (expense.hasOwnProperty('id')) {
            log(expense);
            DB.updateExpense(expense).then(function (data) {
                if (data == expense.id) {
                    DB.removeDutchData(expense.id);
                    expense.splitters.forEach(function (user) {
                        DB.addNewDutchData([expense.id, expense.date, expense.perhead, user, false]);
                    });
                }
            }, function (e) {});

        } else {
            DB.creditUpdate(expense.paidBy, expense.amount).then(function (d) {
                if (DB.getRootUser() === expense.paidBy)
                    $scope.amount = parseInt($scope.amount) + parseInt(expense.amount);
            });
            DB.addNewExpense(expense).then(function (transactionId) {
                DB.addNewDutchData([transactionId, expense.date, expense.perhead, expense.paidBy, false]);
                expense.splitters.forEach(function (user) {
                    DB.addNewDutchData([transactionId, expense.date, expense.perhead, user, false]);
                    DB.updateSettlement("debit", user, expense.perhead);
                });
                
                var length = expense.splitters.length + 1;
                var creditAmount = expense.amount - expense.amount/length;
                DB.updateSettlement("credit", expense.paidBy, creditAmount);
                updateExpenses();
            }, function (err) {});
        }
        $scope.modal.hide();
    }

    // todo this
    // show expense Modal
    var showExpensePopPup = {
        templateUrl: 'templates/modals/showExpense.html',
        scope: $scope,
        buttons: [
            {
                text: 'Edit',
                type: 'button-light button-icon ion-edit dark',
                onTap: function (e) {
                    var sharers = $scope.expenseData.sharers.slice(0);
                    delete $scope.expenseData.sharers;
                    $scope.splitters = {};
                    $scope.perhead = sharers[0].amount;
                    $scope.expenseData.splitters = [];
                    $scope.expenseData.perhead = sharers[0].amount;
                    var i = 0;
                    while (i < sharers.length) {
                        if (sharers[i].username != $scope.expenseData.paidBy) {
                            $scope.expenseData.splitters.push(sharers[i].username);
                            $scope.splitters[sharers[i].username] = true;
                        }
                        i++;
                    }
                    $scope.payers = userList.slice(0);
                    $scope.sharers = userList.slice(0).splice($scope.sharers.indexOf($scope.expenseData.paidBy), 1);
                    $scope.expenseData.date = new Date($scope.expenseData.date);
                    $scope.modal.show();
                }
                },
            {
                text: 'OK',
                type: 'button-positive',
                onTap: function (e) {}
                }
        ]
    };
    $scope.showExpenseDetails = function (expense) {
        $scope.expenseData = expense;
        DB.getDutchDetails(expense.id).then(function (data) {
            $scope.expenseData.sharers = data;
            $ionicPopup.show(showExpensePopPup);
        }, function (e) {
            console.log(e.message);
        });
    }

    function updateExpenses() {
        DB.getExpenses('').then(function (d) {
            $scope.expenses = d;
        }, function (e) {});
    }

    function updateAmount() {
        DB.getUserCredit(DB.getRootUser()).then(function (d) {
            $scope.amount = d;
        }, function (e) {});
    }
});