app.factory('Toast', function ($ionicLoading) {
    return {
        msg: function (message, duration) {
            $ionicLoading.show({
                template: message,
                noBackdrop: true,
                duration: duration
            });
        }
    }
});