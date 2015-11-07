var eqr = eqr || {};

var DataModel = function() {
    var self = this;

    self.init = function () {
        self.getMapJson();
        self.getEvents();

    }

    self.events = ko.observableArray([]);
    self.eq = [];
    self.leads = [];

    self.filteredEvents = [];

    self.mapJSON = {};

    self.getMapJson = function() {
        d3.json("json/states.json", function (data) {
            self.mapJSON = data;
        });
    };

    self.setEvents = function( data ) {

        if( data ) {
            var events = data.features;
            var projection = d3.geo.albersUsa()
                .translate([ 100, 100 ])
                .scale([100]);
            events.forEach( function( event ) {

                if( projection( event.geometry.coordinates ) ) {
                    var timestamp = event.properties.time;
                    var newEQ = {};
                    var index = event.properties.title.indexOf("of ");

                    newEQ.createdDate = new Date( timestamp );
                    newEQ.qualityScore = event.properties.mag;
                    newEQ.coordinates = event.geometry.coordinates;
                    newEQ.name = event.properties.title;
                    newEQ.hidden = ko.observable( false );
                    newEQ.phone = null;
                    newEQ.email = null;
                    newEQ.address = newEQ.name.substring( index + 3, newEQ.name.length );
                    self.eq.push(newEQ);
                }
            });

            self.eq.sort( function( a, b ) {
                return d3.descending( a.qualityScore, b.qualityScore );
            });

            self.events( self.eq );
            eqr.map.init();
            eqr.magnitude.init();
            eqr.date.init();
        }

    };

    self.getEvents = function () {
        eqr.usgsConnector.getEarthQuakeData( self.setEvents );
    };

}

eqr.data = new DataModel();

eqr.data.init();