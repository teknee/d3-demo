/**
 * Created by ageorge on 6/9/14.
 */
var eqr = eqr || {};

//TODO: define an object containing bar chart rendering method, a filtering method by date, a brush to drive the filter

//TODO: attach the filtering to the eqr namespace

var DateModule = function() {
    var self = this,
        workingData = [];

    //SVG Settingsa
    var width = 325,
        height = 150,
        barPadding = 1,
        chartPadding = 10,
        roundDate = d3.time.day.floor,
        tomorrow = d3.time.day.offset( roundDate(new Date()), 1 ),
        xTimeScale = d3.time.scale(),
        xTimeAxis = d3.svg.axis(),
        yScale = d3.scale.linear(),
        brush = d3.svg.brush(),
        svg = d3.select(".dateFilter").append("svg");

    self.init = function() {
        workingData = getDateSummary( eqr.data.events() );
        clearSVG();
        setXTimeScale();
        setXTimeAxis();
        setYScale();
        setBrush();
        renderChart();

    };

    function brushend() {
        if (!d3.event.sourceEvent) return; // only transition after input
        var extent0 = brush.extent(),
            extent1 = extent0.map(d3.time.day.round);

        // if empty when rounded, use floor & ceil instead
        if (extent1[0] >= extent1[1]) {
            extent1[0] = d3.time.day.floor(extent0[0]);
            extent1[1] = d3.time.day.ceil(extent0[1]);
        }



        d3.select(this).transition()
            .call(brush.extent(extent1))
            .call(brush.event);

        filterDates( extent1 );
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
                return xTimeScale( new Date( d.key ) );
            })
            .attr( "y", function( d ) {
                return (height - chartPadding * 2) - yScale( d.values );
            })
            .attr( "width", function( d, i ) {
                return ( (width - chartPadding *2) / workingData.length) - barPadding;
            } )
            .attr( "height", function( d ) {
                return yScale( d.values );
            });

        svg.append( "g" )
            .attr( "class", "x axis" )
            .attr( "transform", "translate(0," + ( height - chartPadding * 2 ) + ")" )
            .call( xTimeAxis )
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
    }

    function setYScale() {
        var max = d3.max( workingData, function( d ) {
            return d.values;
        });

        yScale.domain( [ 0, max ] )
            .rangeRound( [ 0, height - chartPadding * 2 ] );
    }

    function setXTimeAxis() {
        xTimeAxis.scale( xTimeScale )
            .tickFormat( d3.time.format("%_m/%e") )
            .ticks( d3.time.days, 5 )
            .tickPadding( 0 )
            .orient( "bottom" );
    }

    function setXTimeScale() {
        xTimeScale.domain( [ d3.min( workingData, function( d ) {return new Date( d.key )} ), new Date( tomorrow ) ] )
            .range( [ chartPadding,  width - chartPadding ] );
    }

    function setBrush() {
        brush.x( xTimeScale )
            .extent( xTimeScale.domain() )
            .on( "brushend", brushend );
    }

    function filterDates( selectedRange ) {
        svg.selectAll( "rect.bar" )
            .each( function() {
                d3.select( this )
                    .classed( "selected", function( d ) {
                        var date = new Date( d.key ),
                            isSelected = ( selectedRange[0] <= date && date < selectedRange[1] );
                        return isSelected;
                    });
            });
        eqr.map.updateMap();
    }

    function getDateSummary( data ) {

        var dateSummary = d3.nest()
            .key( function ( d ) {
                return roundDate( new Date( d.createdDate ) );
            })
            .rollup(function ( leaves ) {
                return leaves.length;
            })
            .entries( data );
        return dateSummary;
    }

    self.getWorkingData = function() {
        return workingData;
    }

    self.getExtent = function() {
        return brush.extent();
    }

};

eqr.date = new DateModule();