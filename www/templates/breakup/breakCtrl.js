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