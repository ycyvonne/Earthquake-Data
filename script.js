function app() {

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
		data: {locations: []},

		makeWorldMapBounds: function() {
			/* cited from:
			 * http://stackoverflow.com/questions/9893680/google-maps-api-v3-show-the-whole-world
			 * if editing, also see
			 * http://stackoverflow.com/questions/20498210/display-world-map-with-no-repeats
			*/
			let allowedBounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(85, -180),	// top left corner of map
				new google.maps.LatLng(-85, 180)	// bottom right corner
			);
			let k = 5.0;
			let n = allowedBounds .getNorthEast().lat() - k;
			let e = allowedBounds .getNorthEast().lng() - k;
			let s = allowedBounds .getSouthWest().lat() + k;
			let w = allowedBounds .getSouthWest().lng() + k;
			let neNew = new google.maps.LatLng( n, e );
			let swNew = new google.maps.LatLng( s, w );
			boundsNew = new google.maps.LatLngBounds( swNew, neNew );
			return boundsNew;
		}
	};

	/* --------------------- ViewModel ----------------------*/

	let ViewModel = function() {
		let self = this;
		// populate model with data returned from api call
		self.getLocationData = function() {
			$.get('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', function(data) {
			  	let arrayReturned = data.features;

			  	//console.log(arrayReturned);

			  	for (let i = 0; i < arrayReturned.length; i++) {
			  		let earthquake = {coordinates: {}};
			  		earthquake.coordinates.lng = arrayReturned[i].geometry.coordinates[0];
			  		earthquake.coordinates.lat = arrayReturned[i].geometry.coordinates[1];
			  		earthquake.mag = arrayReturned[i].properties.mag;
			  		earthquake.place = arrayReturned[i].properties.place;

			  		Model.data.locations.push(earthquake);
		  	}
		  	self.init();
		  });
		};
		self.getLocationData();

		self.init = function() {
			// put locations in VM to construct listview in DOM using KO
			self.locationsList = [];
			Model.data.locations.forEach(function(element) {
				self.locationsList.push(element);
			});

			// put locations length in VM for use in search and show functions
			self.locationsListLength = self.locationsList.length;
			// make an array to hold each marker
			self.markersList = [];

			self.initTemplate();
			self.initMap();
			self.setUpVisualization();
		};

		self.initTemplate = function() {
 			let template = Handlebars.compile ($('#template').html());  
			$(document.body).append(template(Model.data));
			//window.allData = Model.data.locations;
		}

		// initialize the map
		self.initMap = function() {
			// create the map
			let mapCanvas = document.getElementById('map-canvas');
			self.map = new google.maps.Map(mapCanvas, Model.mapOptions);
			boundsNew = Model.makeWorldMapBounds();
			self.map.fitBounds(boundsNew);
			// declare letiables outside of the loop
			let locations = self.locationsList;
			let locationsLength = locations.length;
			let i, marker;
			// make one info window
			self.infoWindow = new google.maps.InfoWindow({
				maxWidth: 300,
			});
			// for loop makes markers with info windows
			for (let i = 0; i < locationsLength; i++) {
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

		self.setUpVisualization = function(){
			let data = [];
			for (earthquake of self.locationsList){
				let quake = {'magnitude' : earthquake.mag,
							 'place' : earthquake.place };
				data.push(quake);
			}

			let canvas = d3.select('.visual-container')
				.append('svg')
				.attr('width', 500)
				.attr('height', 500);

			let width = 600;
			let height = 500;

			let widthScale = d3.scaleLinear()
				.domain([0, 8])
				.range([0, width]);

			let color = d3.scaleLinear()
				.domain([0, 8])
				.range(['blue', 'red']);

			let nodes = canvas.selectAll('rect')
				.data(data)
				.enter().append('g');

			nodes.append('rect')
						.classed('bar', true)
						.attr('id', (d, i) => {return "bar" + i;})
						.attr('width', 0)
						.attr('height', (370.0 / self.locationsListLength))
						.attr('fill', d => { return color(d.magnitude) })
						.attr('y', (d, i) => { return i * 420.0 / self.locationsListLength })
					.transition()
						.duration(1500)
						.attr('width', d => { return widthScale(d.magnitude); });

			canvas.selectAll('rect').on('click', (d, i) => {
				d3.selectAll('rect').style('opacity', '0.5');
				d3.select('#bar'+i).style('opacity', 1);
				d3.select('#mag-title').html('['+d.magnitude+'] '+d.place);
			});

		}

		self.setUpMarkerAnimation = function(markerCopy) {
			// make any previously clicked marker stop bouncing
			self.markersList.forEach(function(element) {
				element.setAnimation(null);
			});
			// make the clicked marker bounce

			markerCopy.setAnimation(google.maps.Animation.BOUNCE);
			// stop bouncing the marker when you close the info window
			/*google.maps.event.addListener(self.infoWindow, 'closeclick', function() {
				markerCopy.setAnimation(null);
			});*/
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