app.controller('SettingsCtrl', function ($scope, $state, $ionicModal, $ionicPopup, DB, Toast) {

    var userList = null;
    $scope.deleteList = {};

    $scope.userEditMode = false;

    $scope.$on('$ionicView.afterEnter', init);

    function init() {
        DB.getUserList().then(function (d) {
            userList = d.sort().slice(0);
            $scope.userList = userList;
        }, function (e) {});
    }

    // the popup to select users with whom the bill must be split.
    var userPopupConfig = {
        templateUrl: 'templates/modals/showUsers.html',
        cssClass: 'dashpopup',
        scope: $scope,
        buttons: [
            {
                text: 'Cancel',
                type: 'button-stable'
            }
        ]
    };

    // opens a pop up and lists the users.
    var userPopUp = null;
    $scope.showUsers = function () {
        $scope.deleteList = {};
        DB.getUserList().then(function (d) {
            $scope.rootUser = DB.getRootUser();
            userList = d.sort().slice(0);
            $scope.userList = userList;
            userPopUp = $ionicPopup.show(userPopupConfig);
        }, function (e) {
            Toast.msg("No users found", 500);
        });
    }

    // toggle the user remove mode
    $scope.toggelUserDeleteMode = function () {
        $scope.userEditMode = !$scope.userEditMode;
        $scope.deleteList = {};
    }

    // removes the selected users
    $scope.removeUsers = function () {
        userPopUp.close();
        for (var key in $scope.deleteList) {
            if ($scope.deleteList[key]) DB.removeUser(key);
        }
        init();
    }

    // add new user
    $scope.addUsers = function () {
        $scope.addUser = {};
        $ionicPopup.show({
            template: '<input type="text" ng-model="addUser.name" name="userName">',
            title: 'Add new user',
            scope: $scope,
            buttons: [
                {
                    text: 'Cancel',
                    type: 'button-dark'
            },
                {
                    text: 'OK',
                    type: 'button-positive',
                    onTap: function (e) {
                        DB.addNewUser($scope.addUser.name).then(function (d) {
                            init();
                            Toast.msg("User added", 500);
                        }, function (err) {
                            Toast.msg("User already exists", 500);
                        });
                    }
            }
        ]
        });
    }

    // clear all Data
    $scope.clearAllData = function () {
        $ionicPopup.confirm({
            title: 'Purge all data',
            template: 'Are you sure you want to remove all data? This action cannot be undone!',
            buttons: [
                {
                    text: 'Cancel',
                    type: 'button-dark'
            },
                {
                    text: 'OK',
                    type: 'button-assertive',
                    onTap: function (d) {
                        DB.removeRootUser();
                        DB.cleanUp();
                        DB.initializeDB();
                        $state.go('tab.dash');
                    }
            }
        ]
        });
    }
});