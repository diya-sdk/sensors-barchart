function setBarGradient(svg) {
	var greenGradient = svg.append('svg:defs').append('svg:linearGradient').attr('id', 'greenGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%').attr('spreadMethod', 'pad');
	// Define the gradient colors
	greenGradient.append('svg:stop').attr('offset', '0%').attr('stop-color', '#019113').attr('stop-opacity', 1);
	greenGradient.append('svg:stop').attr('offset', '100%').attr('stop-color', '#008002').attr('stop-opacity', 1);
	var redGradient = svg.append('svg:defs').append('svg:linearGradient').attr('id', 'redGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%').attr('spreadMethod', 'pad');
	// Define the gradient colors
	redGradient.append('svg:stop').attr('offset', '0%').attr('stop-color', '#ff7f2a').attr('stop-opacity', 1);
	redGradient.append('svg:stop').attr('offset', '100%').attr('stop-color', '#bb5b18').attr('stop-opacity', 1);
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
					quality: model[n].qualityIndex[model[n].data.length - 1],
					values: model[n].data[model[n].data.length - 1]
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
				return d.values || 1;
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
			return yArray[d.name](d.values || 0);
		}).attr('height', function (d) {
			return h - yArray[d.name](d.values || 0);
		}).attr('fill', function (d) {
			if (d.quality >= 1)
				return 'url(#greenGradient)';
			else
				return 'url(#redGradient)';
		});
		// gBar.select('text').transition().duration(500).attr('transform', function (d) {
		// 	return 'translate(' + (x(d.name) + x.rangeBand() / 2) + ',' + yArray[d.name](d.values || 0) + ')';
		// }).style('text-anchor', 'middle').text(function (d) {
		// 	return typeof d.values != 'undefined' ? d.values.toFixed(1) + ' ' + d.unit : '';
		// });
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
		place: {
			value: null,
			notify: true,
			observer: 'placeChanged'
		},
		selector: {
			notify: true,
			observer: 'selectorChanged'
		},
		sensors: { notify: true },
		viewBoxHeight: {
			type: Number,
			value: 480
		},
		viewBoxWidth: {
			type: Number,
			value: 640
		}
	},
	attached: function() {
		this.async(function() {
			// access sibling or parent elements here
			var that = this;

			// svg's viewBox
			var viewBoxHeight = 0, viewBoxWidth = 0;
			var org = [
				0,
				0
			];

			// image's real origin in image tag of svg
			// svg's client (viewport)
			console.log("dim : "+that.$.barchart.offsetHeight+" "+that.$.barchart.offsetWidth);
			that.viewBoxWidth = that.$.barchart.offsetWidth;
			that.viewBoxHeight = that.$.barchart.offsetHeight;

			// fit viewBow to svg
			d3.select(that.$.barchart).attr('viewBox', '0 0 ' + that.viewBoxWidth + ' ' + that.viewBoxHeight).attr('preserveAspectRatio', 'xMinYMin meet');

			/* re-create/init d3 chart */
			that.barchart = barChart(that.$.barchart, that.viewBoxWidth, that.viewBoxHeight);

		},1);
	},
	ready: function () {
		var that = this;
		this.sensors = this.sensors || null;
		// init svg barchart
		this.barchart = barChart(this.$.barchart, this.viewBoxWidth, this.viewBoxHeight);
		this.selector = this.selector || null;
	},
	selectorChanged: function () {
		// autorefresh?
		if (this.period != null) {
			var that = this;
			if (this.interval) {
				clearInterval(this.interval);
			}
			this.interval = setInterval(function () {
				that.updateChart(null);
			}, this.period);
		}
	},
	/**
	 *		Update chart
	 */
	updateChart: function (options) {
		var that = this;
		if(!this.sensors)
			return;
		var sensors = this.sensors.split(',');
		/* request for data from ieq service */
		/* averaged on last 15 seconds */
		var dataConfig = {
			sampling: 1,
			operator: 'avg',
			criteria: {
				time: {
					range: this.period
				}
			},
			sensors: sensors,
			// ['Temperature','Humidity','CO2','VOCt','Fine Dust','Ozone']
			criteria: {}
		};
		if (this.place != null) {
			dataConfig.criteria.place = [this.place];
		}
		//console.log("Barchart : dataConfig: ", dataConfig);
		if (this.selector)
			d1(this.selector).IEQ().updateData(function (model) {
				// RESOLVED ! bug in Ieq.js, when multiple IEQ instances request db, this.sendModel will be corrupted, might contains more or less sensors data than requested
				// so we do the filter in this code till this bug is fixed
				/* for (var sensor in model) {
				 if (!~sensors.indexOf(sensor)) {
				 delete model[sensor];
				 }
				 }
				 */
				if (that.barchart != null) {
					that.barchart.render(model);
				}
			}, dataConfig);
		else {
		}
	},
	//console.log("Selector undefined");
	// when placId is changed
	placeChanged: function (newVal, oldVal) {
		// side effect of changed watcher: if place is set to same value, this method wont be called
		this.updateChart(null);
	},
	_computeViewBox: function (viewBoxHeight, viewBoxWidth) {
		return '0 0 ' + viewBoxWidth + ' ' + viewBoxHeight;
	}
});
