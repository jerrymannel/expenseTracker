var db = null;

app = angular.module('starter', ['ionic', 'ngCordova'])

.run(function ($ionicPlatform, $cordovaSQLite, DB) {
    $ionicPlatform.ready(function () {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleLightContent();
        }
        if (window.cordova) {
            // App syntax
            db = $cordovaSQLite.openDB('expenses');
        } else {
            // Ionic serve syntax
            db = window.openDatabase("expenses.db", "1.0", "MyDB", -1);
        }
        DB.initializeDB();
    });
})

.config(function ($ionicConfigProvider) {
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.tabs.style('striped');
});

var state_index = {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/index/index.html"
};

var state_dash = {
    url: "/dash",
    views: {
        'dash': {
            templateUrl: "templates/dash/dash.html",
            controller: 'DashCtrl'
        }
    }
};

var state_settings = {
    url: "/settings",
    views: {
        'settings': {
            templateUrl: "templates/settings/settings.html",
            controller: 'SettingsCtrl'
        }
    }
};

var state_breakup = {
    url: "/breakup",
    views: {
        'breakup': {
            templateUrl: "templates/breakup/break.html",
            controller: 'BreakCtrl'
        }
    }
};


app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('tab', state_index)
        .state('tab.dash', state_dash)
        .state('tab.settings', state_settings)
        .state('tab.breakup', state_breakup)
    $urlRouterProvider.otherwise('/tab/dash');
//    $urlRouterProvider.otherwise('/tab/settings');

});

function getDateOnly(incomingDate) {
    if (typeof incomingDate != 'undefined') {
        var sd = incomingDate;
        var syear = sd.getFullYear();
        var smonth = ('0' + (sd.getMonth() + 1)).slice(-2);
        var sdate = ('0' + sd.getDate()).slice(-2);
        var startDate = syear + "-" + smonth + "-" + sdate;
        return startDate;
    }
    return "";
}

function log(s) {
    console.log(JSON.stringify(s, null, "\t"));
}