app.controller('BreakCtrl', function ($scope, $ionicModal, $ionicPopup, DB) {

    $scope.expenses = [];
    $scope.open = true;

    $scope.$on('$ionicView.afterEnter', init);

    function init() {
        $scope.expenses = [];
        $scope.users = [];
        
        DB.getSettlementData().then(function(data){
            if(data.length == 0){
                DB.getAllExpense().then(function(data){
                    DB.getDebitPerUser(data).then(function(data){
                        $scope.users = data;
                    }, function(error){
                        console.log("Error while fetching");
                    });
                }, function(error){
                    console.log("Error while fetching");
                });
            }else{
                $scope.users = data;
            }
        }, function(error){
            console.log("Error while fetching expenses");
        });
        
        /*DB.getExpenseDetails().then(function(data){
            $scope.expenses = data;
        }, function(error){
            console.log("Error while fetching expenses");
        });*/
        
    }
    
    var settlement = [];
    $ionicModal.fromTemplateUrl('templates/modals/settleExpense.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });
    
    $scope.closeModal = function(){
        $scope.modal.hide();
    };
    
    $scope.settlePayment = function(user){
        console.log(JSON.stringify(user));
        DB.getDataToSettle(user.username).then(function(data){
            console.log("Got data to settle, " + JSON.stringify(data));
            $scope.settleData = data;
            $scope.modal.show();
        },function(err){
            console.log("Error while fetching data to settle");
        });
    };
    $scope.addSettlement = function(isChecked, settle){
        if(isChecked)
            //Show text box to edit amount and then add
            settlement.push(settle);
        else{
            //hide text box
            var index = settlement.indexOf(settle);
            if (index > -1) {
                settlement.splice(index, 1);
            }
        }
        console.log("Data to settle, " + JSON.stringify(settlement));
    };
    
    $scope.settleFinish = function(){
        var today = new Date();
        settlement.forEach(function(settle){
            DB.addSettlementHistory([settle.from, settle.payTo, settle.amount, today]);
            $scope.users.forEach(function(user){
                if(user.username === settle.from){
                    user.debit = user.debit - settle.amount;
                    DB.settlementDone(user.username, "debit", user.debit);
                }else if(user.username === settle.payTo){
                    user.credit = user.credit - settle.amount;
                    DB.settlementDone(user.username, "credit", user.credit);
                }
            });
            DB.updateDutch(settle.transactionId, settle.from);
        });
        
        settlement = [];
        $scope.closeModal();
    };
    
    $scope.openBreakup = function(expense){
        console.log(JSON.stringify(expense));
    };
    
    $scope.toggleGroup = function(expense) {
        if ($scope.isGroupShown(expense)) {
          $scope.shownGroup = null;
        } else {
          $scope.shownGroup = expense;
        }
    };
    $scope.isGroupShown = function(expense) {
        return $scope.shownGroup === expense;
    };

});