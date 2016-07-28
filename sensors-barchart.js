function setBarGradient(svg) {
	var greenGradient = svg.append('svg:defs').append('svg:linearGradient').attr('id', 'greenGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%').attr('spreadMethod', 'pad');
	// Define the gradient colors
	greenGradient.append('svg:stop').attr('offset', '0%').attr('stop-color', '#019113').attr('stop-opacity', 1);
	greenGradient.append('svg:stop').attr('offset', '100%').attr('stop-color', '#008002').attr('stop-opacity', 1);
	var redGradient = svg.append('svg:defs').append('svg:linearGradient').attr('id', 'redGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%').attr('spreadMethod', 'pad');
	// Define the gradient colors
	redGradient.append('svg:stop').attr('offset', '0%').attr('stop-color', '#ff7f2a').attr('stop-opacity', 1);
	redGradient.append('svg:stop').attr('offset', '100%').attr('stop-color', '#bb5b18').attr('stop-opacity', 1);
	// Define the gradient colors
	var yellowGradient = svg.append('svg:defs').append('svg:linearGradient').attr('id', 'yellowGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%').attr('spreadMethod', 'pad');
	yellowGradient.append('svg:stop').attr('offset', '0%').attr('stop-color', '#D1E231').attr('stop-opacity', 1);
	yellowGradient.append('svg:stop').attr('offset', '0%').attr('stop-color', '#8DB600').attr('stop-opacity', 1);
}
/**
 * @param
 * @param width			of chart
 * @param height		 of chart
 * @param qualityThreshold	 define threshold on quality for color switching
 */
function barChart(element, width, height) {
	var data = [];
	var that = {};
	var margin = {
		top: 20,
		right: 0,
		bottom: 50,
		left: 0
	};

	var h = height - margin.top - margin.bottom, w = width - margin.left - margin.right, x, y, yArray = {};

	/** clear chart **/
	d3.select(element).selectAll("*").remove();

	var svg = d3.select(element).append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
	setBarGradient(svg);
	/* group all bars */
	svg.append('g').attr('class', 'allBars');
	// add axis
	svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + h + ')');
	svg.append('g').attr('class', 'y axis');
	that.render = function (model) {
		//console.log("render: "+JSON.stringify(model));
		if (!model || model == {})
			return;
		/** convert model to data */
		var data = [];
		for (var n in model) {
			if (n !== 'time') {
				data.push({
					name: model[n].label,
					unit: model[n].unit,
					quality: model[n].avg.i[0],
					values: model[n].avg.d[0]
				});
			}
		}
		//console.log(data);
		x = d3.scale.ordinal().rangeRoundBands([
			0,
			w
		], 0.05);
		x.domain(data.map(function (d) {
			return d.name;
		}));
		y = d3.scale.linear().range([
			h,
			0
		]);
		y.domain([
			0,
			d3.max(data, function (d) {
				return ( typeof d.values ==='number'? (d.values>0? d.values:0) : 0 );
			})
		]);
		/** extract scale for each data */
		for (var i in model) {
			if (i != 'time') {
				yArray[model[i].label] = d3.scale.linear().range([
					h,
					0
				]).domain(model[i].range);
			}
		}
		xAxis = d3.svg.axis().scale(x).orient('bottom');
		// No y axis to display
		this.updateBars(data);
		this.updateAxis();
	};
	/** update Bars */
	that.updateBars = function (data) {
		// console.log("data :"+JSON.stringify(data));
		var bars = svg.select('.allBars').selectAll('.barChart').data(data);
		bars.exit().transition().duration(500).attr('height', 0).remove();
		var gBar = bars.enter().append('g').attr('class', 'barChart');
		gBar.append('rect');
		gBar.append('text').attr('class', 'text').attr('y', -20).attr('dy', '.15em');
		gBar = svg.selectAll('.barChart');
		gBar.select('rect').transition().duration(500).attr('x', function (d) {
			return x(d.name);
		}).attr('width', x.rangeBand()).attr('y', function (d) {
			return yArray[d.name](d.values>0? d.values:0);
		}).attr('height', function (d) {
			return h - yArray[d.name](d.values>0? d.values:0);
		}).attr('fill', function (d) {
			if (d.quality >= 0.5)
				return 'url(#greenGradient)';
			else
				return 'url(#yellowGradient)';
		});
	};
	/* text */
	that.updateAxis = function () {
		svg.selectAll('g.x.axis').call(xAxis);
	};
	that.clean = function () {
		svg.selectAll('*').remove();
	};
	return that;
};

Polymer({
	is: 'sensors-barchart',
	properties: {
		period: { notify: true },
		// TODO : manage filter by places
		sensors: { notify: true },
		viewBoxHeight: {
			type: Number,
			value: 480
		},
		viewBoxWidth: {
			type: Number,
			value: 640
		},
		databind: { // bind on common data for sensors
			notify: true,
			observer : 'onDataChanged'
		}
	},
	attached: function() {
		this.async(function() {
			// access sibling or parent elements here
			var that = this;

			// init svg barchart
			// svg's viewBox - image's real origin in image tag of svg
			// svg's client (viewport)
			that.viewBoxWidth = that.$.barchart.offsetWidth || that.$.barchart.clientWidth || that.viewBoxWidth;
			that.viewBoxHeight = that.$.barchart.offsetHeight || that.$.barchart.clientHeight || that.viewBoxHeight;
			console.log("Viewbox: "+that.viewBoxWidth+"/"+that.viewBoxHeight);

			// fit viewBox to svg
			d3.select(that.$.barchart).attr('viewBox', '0 0 ' + that.viewBoxWidth + ' ' + that.viewBoxHeight).attr('preserveAspectRatio', 'xMinYMin meet');

			/* create/init d3 chart */
			that.barchart = barChart(that.$.barchart, that.viewBoxWidth, that.viewBoxHeight);

		},1);
	},
	ready: function () {
		var that = this;
		this.sensors = this.sensors || null;
		this.selector = this.selector || null;
	},
	onDataChanged: function() {
		var that = this;
		if(!this.sensors)
			return;
		var sensors = this.sensors.split(',');

		if(!this.databind)
			return;

		var model = {};
		// build model from selected sensors
		sensors.forEach(function(name) {
			if(name)
				if(that.databind[name] && that.databind[name].avg)
					model[name] = that.databind[name];
		});

		if (that.barchart != null) {
			that.barchart.render(model);
		}
	},
	_computeViewBox: function (viewBoxHeight, viewBoxWidth) {
		return '0 0 ' + viewBoxWidth + ' ' + viewBoxHeight;
	}
});
