var eqr = eqr || {};

eqr.usgsConnector = (function(w, $) {
    function getEarthQuakeData( successCallback ) {

        $.ajax( {
            dataType: "json",
            async: true,
            url: "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
            success: successCallback
        } );


    }

    function getCities( lead ) {
        $.ajax( {
            dataType: "json",
            async: false,
            url: "http://geoservices.tamu.edu/Services/ReverseGeocoding/WebService/v04_01/HTTP/default.aspx",
            data: {
                apiKey: "698beaca1ad24a12a2cbc6e7ced79fe6",
                version: 4.01,
                format: "json",
                lat: lead.coordinates[1],
                lon: lead.coordinates[0]
            },
            success: function (data) {
                lead.address = data.StreetAddresses[0].City + ", " + data.StreetAddresses[0].State
                console.log(lead);
            },
            error: function (data) {
                console.log(data);
            }
        });
    }

    return {
        getEarthQuakeData: getEarthQuakeData,
        getCities: getCities
    };
}(window, jQuery));

