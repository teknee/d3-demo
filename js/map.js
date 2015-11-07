/**
 * Created by ageorge on 6/3/14.
 */
var eqr = eqr || {};

//TODO: Add an updateMap method that will combine the remove, add, and animate functions.
//TODO: Make the remove, add, and animate functions private and available through the updateMap( events ) public method.

var mapRenderer = function () {

    var self = this;

    self.currentState = ko.observable("");

    self.currentState.subscribe(function( newValue ) {
        console.log( newValue );
        self.updateMap();
    });
    // Map Settings
    var width = 750,
        height = 500,
        duration = 5000,
        projectionScale = 930,
        events = [],
        colors = {
            grey: "#ccc",
            darkGrey: "#999"
        },
        colorScale = d3.scale.linear()
            .range([ "brown", "blue", "green" ])
            .domain([ 1, 5.5, 10 ]),
        projection = d3.geo.albersUsa()
            .translate([ 400, height / 2 ])
            .scale([projectionScale]),
        mapSvg = d3.select(".map").append("svg");

    mapSvg.attr("width", width)
        .attr("height", height);

//    var removeUnmappedEvents = function () {
//
//        var localEvents = self.data.events.filter( function ( event ) {
//            return event.screenCoordinates !== null;
//        });
//
//
//        self.data.events = localEvents;
//    };

    self.updateEventProperties = function ( event ) {
        event.screenCoordinates = projection(event.coordinates.slice(0, 2));
        event.color = d3.rgb( colorScale( event.qualityScore ) );

        return event;
    };

    var renderMap = function ( json ) {
        var path = d3.geo.path().projection(projection);

        mapSvg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", colors.grey)
            .attr("stroke", colors.darkGrey)

        mapSvg.on( "click", function() {
            var d = {};

            if( d3.event.target === this) {
               self.currentState("");
            } else {
                d = d3.select( d3.event.target ).datum();
                self.currentState( d.properties.STATE_NAME );
            }
        });



        var gradient = mapSvg.append("svg:defs")
            .append("svg:radialGradient")
            .attr("id", "glow")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

        gradient.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#fff")
            .attr("stop-opacity", 1);

        gradient.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#fff")
            .attr("stop-opacity", 30);
    };

    var createTooltipContent = function ( data, tooltip ) {

        var createGPSString = function ( coordinates ) {
            var string = Math.abs( coordinates[1] ).toString();
            string += "&#176";
            string += ( coordinates[1] >= 0 ) ? "N" : "S";
            string += " ";
            string += Math.abs( coordinates[0] ).toString()
            string += "&#176";
            string += ( coordinates[1] >= 0 ) ? "E" : "W";
            if(coordinates.length == 3) {
                string += " depth=";
                string += coordinates[2];
                string += "km";
            }

            return string;
        };

        var date = new Date( data.createdDate );

        tooltip.select( ".title" )
            .text( data.name );

        tooltip.select( ".date" )
            .text( date.toLocaleString() );

        tooltip.select( ".location" )
            .html( createGPSString( data.coordinates ) );
    };

    var renderEarthquakes = function( data ) {

        var circles = mapSvg.selectAll( "circle" )
            .data( data );

        // Entering elements get animated
        circles.enter()
            .append( "circle" )
            .classed( "eq", true )
            .each( function ( d ) {
                self.updateEventProperties( d );
            })

        // Any elements left over get event handlers
        circles.on( "mouseover", function ( d ) {
            var xPos = parseFloat( d3.event.clientX + 5 ),
                yPos = parseFloat( d3.event.clientY + 5 ),
                tooltip = d3.select( "#tooltip" );

            createTooltipContent( d, tooltip );

            tooltip.style( "left", xPos + "px" )
                .style( "top", yPos + "px" )
                .classed( "hidden", false );
        })
            .on( "mouseout", function ( d ) {
                d3.select( "#tooltip" )
                    .classed( "hidden", true );
            });

    };

    var removeEarthquakes = function ( data ) {
        // Exiting elements fade out nicely
        mapSvg.selectAll( "circle" )
            .data( data )
            .exit()
            .transition()
            .duration( 1000 )
            .remove();
    };

     var animateEarthquakes = function ( data ) {

        mapSvg.selectAll( "circle" )
            .data( data )
            .style( "stroke", function ( d ) {
                return d.color.darker().toString();
            })
            .style( "fill", function ( d ) {
                return d.color.toString();
            })
            .style( "opacity", 0.6 )
            .transition()
            .delay(function ( d, i ) {
                return i / data.length * duration;
            })
            .duration( duration )
            .attr( "cx", function ( d ) {
                return d.screenCoordinates[0];
            })
            .attr( "cy", function ( d ) {
                return d.screenCoordinates[1];
            })
            .attr( "r", function ( d ) {
                return d.qualityScore * 2;
            });
    };

    self.createMap = function( events ) {
        removeEarthquakes( events );
        renderEarthquakes( events );
        animateEarthquakes( events );
    }

    self.filters = {
        date: function( d ) {
            var extent = eqr.date.getExtent();

            var date = new Date( d.createdDate ),
                isSelected = ( extent[0] <= date && date < extent[1] );
            return isSelected;
        },
        magnitude: function( d ) {
            var extent = eqr.magnitude.getExtent();

            var value = parseFloat( d.qualityScore ),
                isSelected = ( extent[0] <= value && value < extent[1] );
            return isSelected;
        },
        name: function( d ) {
            var string = $("#nameFilter" ).val().toLowerCase(),
                name = d.name.toLowerCase();

            return name.indexOf( string ) >= 0;
        },
        state: function( d ) {
            return d.address.indexOf( self.currentState() ) >= 0;
        }
    };

    self.filterName = function( string ) {
        var events = eqr.data.events();
        string = string.toLowerCase();

        events.forEach( function( event ) {
            var name = event.name.toLowerCase();

            if( name.indexOf( string ) < 0 ) {
                event.hidden( true );
            }
        })

        mapSvg.selectAll( "circle.eq" )
            .each( function() {
                d3.select( this )
                    .classed( "hidden", function( d ) {
                        return d.hidden();
                    });
            });
    };

    self.updateMap = function() {
        var events = eqr.data.events();

        events.forEach( function( event ) {
            event.hidden( !(self.filters.date( event ) && self.filters.magnitude( event ) && self.filters.name( event ) && self.filters.state( event )) );
        })

        mapSvg.selectAll( "circle.eq" )
            .each( function() {
                d3.select( this )
                    .classed( "hidden", function( d ) {
                        return d.hidden();
                    });
            });
        eqr.data.events( events );

    };

    self.init = function() {
        // We are expecting the events data to be properly handled by the data opject
        if( eqr.data ) {
            eqr.data.eq.forEach( function ( event ) {
                self.updateEventProperties ( event );
            });

            eqr.data.leads.forEach( function ( event ) {
                self.updateEventProperties ( event );
            });

            eqr.data.events().forEach(function(event) {
                if( parseFloat(event.qualityScore) > 6 ) {
                }
            })

            renderMap( eqr.data.mapJSON );
            self.createMap( eqr.data.events() );

            ko.applyBindings( eqr.data, document.getElementById( "data-list" ) );
        } else {
            console.log( "Oops. No events are available." );
        }
    }
};

eqr.map = new mapRenderer();

