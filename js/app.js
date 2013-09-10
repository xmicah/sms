var app = angular.module('xoApp', []);

app.controller('cupController', function cupController($scope, $http) {

    $scope.show_quartz = true;
    $scope.show_cal = true;
    $scope.show_mtbstfa = true;
    $scope.show_tmah = true;
    $scope.kindLoaded = false;
    $scope.logLoaded = false;
    $scope.colorby = "kind";
    $scope.colorbrew = "Reds";

    var isCupVisible = null;
    var colorByCupNum = null;

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

    var getCupColor = function (cupnum) {
        if ( isCupVisible(cupnum) ) {
            return colorByCupNum(cupnum);
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

    // Return specific color for cup kind
    var colorByKind = function(cupnum)
    {
        var kind = $scope.cup[cupnum-1].kind;
        var color = "black";
        switch (kind) {
            case 'q':
                color = "orange";
                break;
            case 'm':
                color = "purple";
                break;
            case 't':
                color = "green";
                break;
            case 'c':
                color = "blue";
                break;
            default:
                color = "yellow";
        }
        return color;
    }

    $scope.colorScale = d3.scale.linear().domain([100,250]).range(["#ffcccc", "#660000"]);
    // $scope.redLoadScale = d3.scale.linear().domain([100,250]).range(["#ffcccc", "#660000"]);
    // $scope.purpleLoadScale = d3.scale.quantize()
    //     .domain([100, 250])
    //     .range(colorbrewer.YlGnBu[9]);

    var colorByLoad = function(cupnum)
    {
        return $scope.colorScale($scope.cup[cupnum-1].maxload);
    }

    var updateColorBy = function()
    {
        if ( $scope.colorby == "kind" ) {
            colorByCupNum = colorByKind;
        } else if ( $scope.colorby == "maxload" ) {
            colorByCupNum = colorByLoad;
        }
        $scope.refresh();
    }

    var updateColorbrew = function()
    {
        $scope.colorScale.range(colorbrewer[$scope.colorbrew][9]);
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

    // Trigger refresh on state change
    $scope.$watch('kindLoaded', $scope.refresh);
    $scope.$watch('logLoaded', $scope.refresh);
    $scope.$watch('colorby', updateColorBy);
    $scope.$watch('colorbrew', updateColorbrew);

    // Initial functor settings
    isCupVisible = visibleByKind;
    //colorByCupNum = colorByLoad;
    colorByCupNum = colorByKind;
    $scope.colorScale = d3.scale.quantize().domain([100,250]).range(colorbrewer[$scope.colorbrew][6]);

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
