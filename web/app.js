angular.module("myApp", ["ngTable","QuickList"]);

(function () {
    "use strict";

    angular.module("myApp").controller("demoController", demoController);
    demoController.$inject = ["$scope","NgTableParams","$http","ngTableEventsChannel"];

    function demoController($scope,NgTableParams,$http,ngTableEventsChannel) {
        var self = this;
        $scope.originalData=[];
        self.allTableEvents = [];
        $http.get('data/test.json').success(function(data){

            $scope.originalData = data;
            self.ordata = angular.copy($scope.originalData);
            $scope.tableParams = createUsingFullOptions();
            $scope.isLoading = $scope.tableParams.settings().$loading;
            var logPagesChangedEvent = _.partial(logEvent, self.allTableEvents, "pagesChanged");
            ngTableEventsChannel.onPagesChanged(logPagesChangedEvent, $scope);
        });


        self.deleteCount = 0;
        self.changePage = changePage;
        self.add = add;
        self.cancelChanges = cancelChanges;
        self.del = del;
        self.hasChanges = hasChanges;
        self.saveChanges = saveChanges;
        $scope.tableParams = createUsingFullOptions();


        $scope.click = function(){
            alert($scope.originalData.length);
        };
        //////////
        function changePage(nextPage){
            $scope.tableParams.page(nextPage);
        }
        function createUsingFullOptions() {
            var initialParams = {
                count: 50 // initial page size
            };
            var initialSettings = {
                // page size buttons (right set of buttons in demo)
                counts: [50,500,2000],
                // determines the pager buttons (left set of buttons in demo)
                paginationMaxBlocks: 5,
                paginationMinBlocks: 2,
                dataset: self.ordata,
                $loading:true
            };
            return new NgTableParams(initialParams, initialSettings);
        }
        function add() {
            self.isEditing = true;
            self.isAdding = true;
            $scope.tableParams.settings().dataset.unshift({
                name: "",
                age: null,
                money: null
            });
            // we need to ensure the user sees the new row we've just added.
            // it seems a poor but reliable choice to remove sorting and move them to the first page
            // where we know that our new item was added to
            $scope.tableParams.sorting({});
            $scope.tableParams.page(1);
            $scope.tableParams.reload();
        }

        function cancelChanges() {
            resetTableStatus();
            var currentPage = $scope.tableParams.page();
            $scope.tableParams.settings({
                dataset: angular.copy($scope.originalData)
            });
            // keep the user on the current page when we can
            if (!self.isAdding) {
                $scope.tableParams.page(currentPage);
            }
        }

        function del(row) {
            _.remove($scope.tableParams.settings().dataset, function (item) {
                return row === item;
            });
            self.deleteCount++;
            self.tableTracker.untrack(row);
            $scope.tableParams.reload().then(function (data) {
                if (data.length === 0 && $scope.tableParams.total() > 0) {
                    $scope.tableParams.page($scope.tableParams.page() - 1);
                    $scope.tableParams.reload();
                }
            });
        }

        function hasChanges() {
            return self.tableForm.$dirty || self.deleteCount > 0
        }

        function resetTableStatus() {
            self.isEditing = false;
            self.isAdding = false;
            self.deleteCount = 0;
            self.tableTracker.reset();
            self.tableForm.$setPristine();
        }

        function saveChanges() {
            resetTableStatus();
            var currentPage = $scope.tableParams.page();
            $scope.originalData = angular.copy($scope.tableParams.settings().dataset);
        }
    }
})();

(function () {
    "use strict";

    angular.module("myApp").run(configureDefaults);
    configureDefaults.$inject = ["ngTableDefaults"];

    function configureDefaults(ngTableDefaults) {
        ngTableDefaults.params.count = 5;
        ngTableDefaults.settings.counts = [];
    }
})();

/**********
 The following directives are necessary in order to track dirty state and validity of the rows
 in the table as the user pages within the grid
 ------------------------
 */

(function () {
    angular.module("myApp").directive("demoTrackedTable", demoTrackedTable);

    demoTrackedTable.$inject = [];

    function demoTrackedTable() {
        return {
            restrict: "A",
            priority: -1,
            require: "ngForm",
            controller: demoTrackedTableController
        };
    }

    demoTrackedTableController.$inject = ["$scope", "$parse", "$attrs", "$element"];

    function demoTrackedTableController($scope, $parse, $attrs, $element) {
        var self = this;
        var tableForm = $element.controller("form");
        var dirtyCellsByRow = [];
        var invalidCellsByRow = [];

        init();

        ////////

        function init() {
            var setter = $parse($attrs.demoTrackedTable).assign;
            setter($scope, self);
            $scope.$on("$destroy", function () {
                setter(null);
            });

            self.reset = reset;
            self.isCellDirty = isCellDirty;
            self.setCellDirty = setCellDirty;
            self.setCellInvalid = setCellInvalid;
            self.untrack = untrack;
        }

        function getCellsForRow(row, cellsByRow) {
            return _.find(cellsByRow, function (entry) {
                return entry.row === row;
            })
        }

        function isCellDirty(row, cell) {
            var rowCells = getCellsForRow(row, dirtyCellsByRow);
            return rowCells && rowCells.cells.indexOf(cell) !== -1;
        }

        function reset() {
            dirtyCellsByRow = [];
            invalidCellsByRow = [];
            setInvalid(false);
        }

        function setCellDirty(row, cell, isDirty) {
            setCellStatus(row, cell, isDirty, dirtyCellsByRow);
        }

        function setCellInvalid(row, cell, isInvalid) {
            setCellStatus(row, cell, isInvalid, invalidCellsByRow);
            setInvalid(invalidCellsByRow.length > 0);
        }

        function setCellStatus(row, cell, value, cellsByRow) {
            var rowCells = getCellsForRow(row, cellsByRow);
            if (!rowCells && !value) {
                return;
            }

            if (value) {
                if (!rowCells) {
                    rowCells = {
                        row: row,
                        cells: []
                    };
                    cellsByRow.push(rowCells);
                }
                if (rowCells.cells.indexOf(cell) === -1) {
                    rowCells.cells.push(cell);
                }
            } else {
                _.remove(rowCells.cells, function (item) {
                    return cell === item;
                });
                if (rowCells.cells.length === 0) {
                    _.remove(cellsByRow, function (item) {
                        return rowCells === item;
                    });
                }
            }
        }

        function setInvalid(isInvalid) {
            self.$invalid = isInvalid;
            self.$valid = !isInvalid;
        }

        function untrack(row) {
            _.remove(invalidCellsByRow, function (item) {
                return item.row === row;
            });
            _.remove(dirtyCellsByRow, function (item) {
                return item.row === row;
            });
            setInvalid(invalidCellsByRow.length > 0);
        }
    }
})();

(function () {
    angular.module("myApp").directive("demoTrackedTableRow", demoTrackedTableRow);

    demoTrackedTableRow.$inject = [];

    function demoTrackedTableRow() {
        return {
            restrict: "A",
            priority: -1,
            require: ["^demoTrackedTable", "ngForm"],
            controller: demoTrackedTableRowController
        };
    }

    demoTrackedTableRowController.$inject = ["$attrs", "$element", "$parse", "$scope"];

    function demoTrackedTableRowController($attrs, $element, $parse, $scope) {
        var self = this;
        var row = $parse($attrs.demoTrackedTableRow)($scope);
        var rowFormCtrl = $element.controller("form");
        var trackedTableCtrl = $element.controller("demoTrackedTable");

        self.isCellDirty = isCellDirty;
        self.setCellDirty = setCellDirty;
        self.setCellInvalid = setCellInvalid;

        function isCellDirty(cell) {
            return trackedTableCtrl.isCellDirty(row, cell);
        }

        function setCellDirty(cell, isDirty) {
            trackedTableCtrl.setCellDirty(row, cell, isDirty)
        }

        function setCellInvalid(cell, isInvalid) {
            trackedTableCtrl.setCellInvalid(row, cell, isInvalid)
        }
    }
})();

(function () {
    angular.module("myApp").directive("demoTrackedTableCell", demoTrackedTableCell);

    demoTrackedTableCell.$inject = [];

    function demoTrackedTableCell() {
        return {
            restrict: "A",
            priority: -1,
            scope: true,
            require: ["^demoTrackedTableRow", "ngForm"],
            controller: demoTrackedTableCellController
        };
    }

    demoTrackedTableCellController.$inject = ["$attrs", "$element", "$scope"];

    function demoTrackedTableCellController($attrs, $element, $scope) {
        var self = this;
        var cellFormCtrl = $element.controller("form");
        var cellName = cellFormCtrl.$name;
        var trackedTableRowCtrl = $element.controller("demoTrackedTableRow");

        if (trackedTableRowCtrl.isCellDirty(cellName)) {
            cellFormCtrl.$setDirty();
        } else {
            cellFormCtrl.$setPristine();
        }
        // note: we don't have to force setting validaty as angular will run validations
        // when we page back to a row that contains invalid data

        $scope.$watch(function () {
            return cellFormCtrl.$dirty;
        }, function (newValue, oldValue) {
            if (newValue === oldValue) return;

            trackedTableRowCtrl.setCellDirty(cellName, newValue);
        });

        $scope.$watch(function () {
            return cellFormCtrl.$invalid;
        }, function (newValue, oldValue) {
            if (newValue === oldValue) return;

            trackedTableRowCtrl.setCellInvalid(cellName, newValue);
        });
    }
})();