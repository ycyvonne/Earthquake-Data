function map() {

	if (typeof google === 'undefined') {
			alert('ERROR: Google maps failed to load');
		}

	/* --------------------- Model Data ---------------------- */

	let Model = {
		// options to set up our google map
		mapOptions: {
			center: {lat: 0, lng: 0},
			zoom: 1,
			minZoom: 1,
			mapTypeId: google.maps.MapTypeId.TERRAIN,
			mapTypeControlOptions: {
				position: google.maps.ControlPosition.TOP_CENTER
			},
			panControlOptions: {
				position: google.maps.ControlPosition.LEFT_TOP
			},
			zoomControlOptions: {
				position: google.maps.ControlPosition.LEFT_CENTER
			}
		},

		// our basic location array
		locations: [],

		// populate earthquakeArray with data returned from api call
		getLocationData: function() {
			console.log('getLocationData called');
			$.get('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson', function(data) {
		  	var arrayReturned = data.features;

		  	for (var i = 0; i < arrayReturned.length; i++) {
		  		var earthquake = {coordinates: {}};
		  		earthquake.coordinates.lng = arrayReturned[i].geometry.coordinates[0];
		  		earthquake.coordinates.lat = arrayReturned[i].geometry.coordinates[1];
		  		earthquake.mag = arrayReturned[i].properties.mag;
		  		earthquake.place = arrayReturned[i].properties.place;

		  		Model.locations.push(earthquake);
		  	}

		  	myViewModel.init();
		  });
		}
	};


	/* --------------------- ViewModel ----------------------*/

	let ViewModel = function() {
		console.log('ViewModel called');
		let self = this;

		Model.getLocationData();

		self.init = function() {
			// put locations in VM to construct listview in DOM using KO
			self.locationsList = [];
			Model.locations.forEach(function(element) {
				self.locationsList.push(element);
			});
			// put locations length in VM for use in search and show functions
			self.locationsListLength = self.locationsList.length;
			// make an array to hold each marker
			self.markersList = [];
			console.log(self.locationsList);

			self.initializeMap();
		};

		self.setUpMarkerAnimation = function(markerCopy) {
			// make any previously clicked marker stop bouncing
			self.markersList.forEach(function(element) {
				element.setAnimation(null);
			});
			// make the clicked marker bounce
			markerCopy.setAnimation(google.maps.Animation.BOUNCE);
			// stop bouncing the marker when you close the info window
			google.maps.event.addListener(self.infoWindow, 'closeclick', function() {
				markerCopy.setAnimation(null);
			});
		};

		// initialize the map
		self.initializeMap = function() {
			console.log('initializemap called');
			// create the map
			let mapCanvas = document.getElementById('map-canvas');
			self.map = new google.maps.Map(mapCanvas, Model.mapOptions);

			var allowedBounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(85, -180),	// top left corner of map
				new google.maps.LatLng(-85, 180)	// bottom right corner
			);

			var k = 5.0;
			var n = allowedBounds .getNorthEast().lat() - k;
			var e = allowedBounds .getNorthEast().lng() - k;
			var s = allowedBounds .getSouthWest().lat() + k;
			var w = allowedBounds .getSouthWest().lng() + k;
			var neNew = new google.maps.LatLng( n, e );
			var swNew = new google.maps.LatLng( s, w );
			boundsNew = new google.maps.LatLngBounds( swNew, neNew );
			self.map .fitBounds(boundsNew);

			// declare letiables outside of the loop
			let locations = self.locationsList;
			let locationsLength = locations.length;
			let i, marker;
			// make one info window
			self.infoWindow = new google.maps.InfoWindow({
				maxWidth: 300,
			});
			// for loop makes markers with info windows
			for (i = 0; i < locationsLength; i++) {
				// make markers
				marker = new google.maps.Marker({
					position: locations[i].coordinates,
					icon: locations[i].icon
				});
				marker.setMap(self.map);
				// add each marker to an array
				self.markersList.push(marker);
			}
		};

		// prevent form from submitting when user presses enter key
		$(document).on('keypress', 'form', function(e) {
			let code = e.keyCode || e.which;

			if (code === 13) {
				e.preventDefault();

				return false;
			}
		});
	};

	// allows us to reference our instance of the ViewModel
	let myViewModel = new ViewModel();
}