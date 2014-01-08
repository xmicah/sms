var app = angular.module('xoApp', []);

app.controller('cupController', function cupController($scope, $http) {

    // Initialization
    $scope.show_quartz = true;
    $scope.show_cal = true;
    $scope.show_mtbstfa = true;
    $scope.show_tmah = true;
    $scope.show_deriv = true;
    $scope.show_nocup = false;
    $scope.kindLoaded = false;
    $scope.logLoaded = false;
    $scope.droplogLoaded = false;
    $scope.colorby = "kind";
    $scope.colorbrew = "Reds";
    $scope.ncolors = 6;

    var kindColorScale = d3.scale.ordinal()
        .domain(['q','c','m','t','d','n'])
        .range(["orange","blue","purple","green","red","black"]);

    var sampleColorScale = d3.scale.ordinal()
        .domain(['Rocknest','John_Klein','Cumberland',''])
        .range(["purple","green","red","black"]);

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
        $scope.cup[i].numdrops = 0;
        $scope.cup[i].sample = '';
    }

    // Read static cup type file and update cup data
    $http.get('tbcuptype.json').success(function(cuptypes) {
        for ( var cupnum = 0, entry; entry = cuptypes[cupnum++]; ) {
            $scope.cup[cupnum-1].kind = entry;
        }
        $scope.kindLoaded = true;
    });

    // Read static cup log file
    $http.get('tbcuplog.json').success(function(cuplog) {
        var cupnum, lbf;
        for (var i = 0, entry; entry = cuplog[i++];) {
            cupnum = entry[0];
            lbf = entry[1];
            if ( $scope.cup[cupnum-1].maxload < lbf ) {
                $scope.cup[cupnum-1].maxload = lbf;
            }
        }
        $scope.logLoaded = true;
    });

    // Read static cup drop log file
    $http.get('tbcupdroplog.json').success(function(cuplog) {
        var cupnum, sample;
        for (var i = 0, entry; entry = cuplog[i++];) {
            cupnum = entry[0];
            sample = entry[1];
            $scope.cup[cupnum-1].numdrops ++;
            $scope.cup[cupnum-1].sample = sample;
        }
        $scope.droplogLoaded = true;
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
            || ( kind == "t" && $scope.show_tmah )
            || ( kind == "d" && $scope.show_deriv )
            || ( kind == "n" && $scope.show_nocup );
        return visible;
    }

    var updateColorScale = function()
    {
        var labels = []; 
        var colorArray = colorbrewer[$scope.colorbrew][$scope.ncolors];
        //colorArray.unshift("white");
        
        if ( $scope.colorby == "kind" ) {
            $scope.colorScale = kindColorScale;
            labels = ['Q','C','M','T','D','N'];
        } else if ( $scope.colorby == "sample" ) {
            $scope.colorScale = sampleColorScale;
            labels = ['RN','JK','CB','0']
        } else {
            var domain = [0,1]; // placeholder
            var labels = [];
            if ( $scope.colorby == "maxload" ) {
                domain = [100,250];
                labels = [0,125,150,175,200,225];
            } else if ( $scope.colorby == "numdrops" ) {
                domain = [0,5];
                labels = d3.range(0,5);
            }
            $scope.colorScale = d3.scale.quantize()
                .domain(domain)
                .range(colorArray);
        }

        legend.selectAll("rect")
            .attr("fill", function (d) { return $scope.colorScale(labels[d])})
            .style("visibility", function (d,i) { return i < labels.length ? "visible" : "hidden"});
        legend.selectAll("text")
            .text(function (d) { return labels[d]; })
            .style("visibility", function (d,i) { return i < labels.length ? "visible" : "hidden"});

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
    $scope.$watch('droplogLoaded', $scope.refresh);
    $scope.$watch('colorby', updateColorScale);
    $scope.$watch('colorbrew', updateColorScale);

    // Initial functor settings
    isCupVisible = visibleByKind;

});
