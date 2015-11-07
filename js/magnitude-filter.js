/**
 * Created by ageorge on 6/9/14.
 */
var eqr = eqr || {};

//TODO: define an object containing bar chart rendering method, a filtering method by magnitude, a brush to drive the filter

//TODO: attach the filtering to the eqr namespace

var MagnitudeModule = function() {
    var self = this,
        workingData = [];

    //SVG Settingsa
    var width = 325,
        height = 150,
        barPadding = 1,
        barWidth = 0,
        chartPadding = 10,
        colors = {
            blue: "#ccc",
            darkGrey: "#999"
        },
        xScale = d3.scale.linear(),
        yScale = d3.scale.linear(),
        xAxis = d3.svg.axis(),
        brush = d3.svg.brush(),
        svg = d3.select(".magnitudeFilter").append("svg");

    var filterMagnitudes = function ( selectedRange ) {
        svg.selectAll( "rect.bar" )
            .each( function() {
                d3.select( this )
                    .classed( "selected", function( d ) {
                        var value = d.key,
                            isSelected = ( selectedRange[0] <= value && value < selectedRange[1] );
                        return isSelected;
                    });
            });
        eqr.map.updateMap();
    };

    self.init = function() {
        workingData = getMagnitudeSummary( eqr.data.events() );
        clearSVG();
        setXScale();
        setYScale();
        setXAxis();
        setBrush();
        renderChart();

    };

    function brushend() {
        if (!d3.event.sourceEvent) return; // only transition after input
        var extent0 = brush.extent(),
            extent1 = extent0.map( function( x ) {
                return Math.round( x );
            });

        // if empty when rounded, use floor & ceil instead
        if (extent1[0] >= extent1[1]) {
            extent1[0] = Math.floor(extent0[0]);
            extent1[1] = Math.ceil(extent0[1]);
        }



        d3.select(this).transition()
            .call(brush.extent(extent1))
            .call(brush.event);

        filterMagnitudes( extent1 );
    }

    function clearSVG() {
        svg.selectAll("*").remove();
    }

    function renderChart() {
        svg.selectAll( "rect" )
            .data( workingData )
            .enter()
            .append( "rect" )
            .classed( "bar", true )
            .classed( "selected", true )
            .attr( "x", function( d, i ) {
                return xScale( d.key );
            })
            .attr( "y", function( d ) {
                return (height - chartPadding * 2) - yScale( d.values );
            })
            .attr( "width", function() {
                return barWidth;
            })
            .attr( "height", function( d ) {
                return yScale( d.values );
            });

        svg.append( "g" )
            .attr( "class", "x axis" )
            .attr( "transform", "translate(0," + ( height - chartPadding * 2 ) + ")" )
            .call( xAxis )
            .selectAll( "text")
            .attr( "fill", "#aaa");

        svg.append( "g" )
            .call( brush )
            .call( brush.event )
            .attr( "class", "brush" )
            .selectAll( "rect" )
            .attr( "height", function() {
                return height - chartPadding * 2;
            });

        brush.extent( xScale.domain() );
    }

    function setYScale() {
        var max = d3.max( workingData, function( d ) {
            return d.values;
        });

        yScale.domain( [ 0, max ] )
            .rangeRound( [ 1, height - chartPadding ] );
    }

    function setXScale() {
        var max = d3.max( workingData, function( d ) {
            return d.key;
        });

        xScale.domain( [ 1, parseInt( max ) + 1 ] )
            .range( [ chartPadding,  width - chartPadding ] );

        barWidth = Math.floor(xScale(2) - xScale(1)) - barPadding;
    }

    function setXAxis() {
        xAxis.scale( xScale )
            .ticks( workingData.length )
            .orient( "bottom" );
    }

    function setBrush() {
        brush.x( xScale )
            .extent( xScale.domain() )
            .on( "brushend", brushend );
    }

    function getMagnitudeSummary( data ) {
        var magnitudeSummary = d3.nest()
            .key( function ( d ) {
                var shiftedValue = Math.floor( d.qualityScore );
//                shiftedValue = shiftedValue / 10;

                return shiftedValue;
            })
            .sortKeys( d3.ascending )
            .rollup(function ( leaves ) {
                return leaves.length;
            } )
            .entries( data );


        return magnitudeSummary;
    }

    self.getWorkingData = function() {
        return workingData;
    }

    self.getExtent = function() {
        return brush.extent();
    }

};

eqr.magnitude = new MagnitudeModule();
