var app = angular.module('xoApp', []);

app.controller('cupController', function cupController($scope, $http) {

    // Initialization
    $scope.show_quartz = true;
    $scope.show_cal = true;
    $scope.show_mtbstfa = true;
    $scope.show_tmah = true;
    $scope.kindLoaded = false;
    $scope.logLoaded = false;
    $scope.colorby = "kind";
    $scope.colorbrew = "Reds";

    $scope.colorScale = d3.scale.ordinal()
        .domain(['q','c','m','t'])
        .range(["orange","blue","purple","green"]);

    $scope.colorbrews = ["Reds", "Greens", "Blues", "Purples", "Oranges", "BuGn"];

    var isCupVisible = null;

    // Setup cup initial cup data
    $scope.cup = [];
    for ( var i = 0; i < 74; i++ )
    {
        $scope.cup[i] = {};
        $scope.cup[i].number = i+1;
        $scope.cup[i].kind = '';
        $scope.cup[i].maxload = 0;
        $scope.cup[i].numloads = 0;
    }

    // Read static cup type file and update cup data
    $http.get('cuptype.json').success(function(cuptypes) {
        for ( var cupnum = 0, entry; entry = cuptypes[cupnum++]; ) {
            $scope.cup[cupnum-1].kind = entry;
        }
        $scope.kindLoaded = true;
    });

    // Read static cup log file
    $http.get('cuplog.json').success(function(cuplog) {
        var cupnum, lbf;
        for (var i = 0, entry; entry = cuplog[i++];) {
            cupnum = entry[0];
            lbf = entry[1];
            if ( $scope.cup[cupnum-1].maxload < lbf ) {
                $scope.cup[cupnum-1].maxload = lbf;
            }
            $scope.cup[cupnum-1].numloads ++; 
        }
        $scope.logLoaded = true;
    });

    // Private methods
    var getCupColor = function (cupnum) {
        if ( isCupVisible(cupnum) ) {
            return $scope.colorScale($scope.cup[cupnum-1][$scope.colorby]);
        }
        return "gray";
    }

    // Based on cup kind
    // Return true if visible, false if not
    var visibleByKind = function(cupnum)
    {
        var kind = $scope.cup[cupnum-1].kind;
        var visible = ( kind == "q" && $scope.show_quartz )
            || ( kind == "c" && $scope.show_cal )
            || ( kind == "m" && $scope.show_mtbstfa )
            || ( kind == "t" && $scope.show_tmah );
        return visible;
    }

    var updateColorScale = function()
    {
        var hist = d3.map();
        var stats = d3.map();
        var useOrdinal = false;

        for ( var cupnum = 0, entry; entry = $scope.cup[cupnum++]; ) {

            var value = $scope.cup[cupnum-1][$scope.colorby];
            if ( isNaN(value) ) useOrdinal = true; // If non-numbers, use ordinal
            if ( !stats.has("min") || value < stats.get("min") ) stats.set("min", value);
            if ( !stats.has("max") || value > stats.get("max") ) stats.set("max", value);
            if ( hist.has(value) ) {
                hist.set(value, hist.get(value) + 1);
            } else {
                hist.set(value, 1);
            }
        }
        var uniques = hist.keys();
        var ncolors = uniques.length;
        if ( ncolors < 3 ) return;
        if ( ncolors > 9 ) ncolors = 9;
        if ( useOrdinal ) {
            $scope.colorScale = d3.scale.ordinal();
        } else if ( uniques.length > 9 ) {
            $scope.colorScale = d3.scale.quantile();
        } else {
            $scope.colorScale = d3.scale.quantile();
        }
        $scope.colorScale
                .domain(uniques)
                .range(colorbrewer[$scope.colorbrew][ncolors]);

        $scope.refresh();
    }

    $scope.refresh = function()
    {
        groupCupLabels.selectAll(".cuplbl")
            .style("visibility", function (d) {
                return isCupVisible(d.cup) ? "visible" : "hidden";
            })
            .style("fill", function (d) {
                var hsl = d3.hsl(getCupColor(d.cup));
                return hsl.l > 0.6 ? "black" : "white";
            });
        groupCups.selectAll(".cup")
            .attr("fill", function (d) {
                return getCupColor(d.cup);
            });
    }
    // Trigger refresh on state change
    $scope.$watch('kindLoaded', $scope.refresh);
    $scope.$watch('logLoaded', $scope.refresh);
    $scope.$watch('colorby', updateColorScale);
    $scope.$watch('colorbrew', updateColorScale);

    // Initial functor settings
    isCupVisible = visibleByKind;

    // $scope.vizcups = function()
    // {
    //     var cupid, cuplblid;
    //     for (var i = 0, cup; cup = $scope.cup[i++];) {
    //         cupid = "#cup" + cup.number;
    //         cuplblid = "#cuplbl" + cup.number;
    //         $scope.cup_circle_group.select(cupid)
    //             .attr("hidden", cup.show)
    //             .attr("fill", $scope.cupKindToColor(cup.kind));
    //         $scope.cup_label_group.select(cuplblid)
    //             .attr("hidden", cup.show);
    //     }
    // }
});
