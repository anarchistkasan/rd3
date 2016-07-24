'use strict';

const React = require('react');
const d3 = require('d3');
const DataSeries = require('./DataSeries');
const { Chart, XAxis, YAxis, Tooltip } = require('../common');
const {
  CartesianChartPropsMixin,
  DefaultAccessorsMixin,
  ViewBoxMixin,
  TooltipMixin,
} = require('../mixins');

module.exports = React.createClass({

  displayName: 'BarChart',

  propTypes: {
    chartClassName: React.PropTypes.string,
    data: React.PropTypes.array.isRequired,
    hoverAnimation: React.PropTypes.bool,
    height: React.PropTypes.number,
    margins: React.PropTypes.object,
    rangeRoundBandsPadding: React.PropTypes.number,
    // https://github.com/mbostock/d3/wiki/Stack-Layout#offset
    stackOffset: React.PropTypes.oneOf(['silhouette', 'expand', 'wigget', 'zero']),
    grouped: React.PropTypes.bool,
    valuesAccessor: React.PropTypes.func,
    title: React.PropTypes.string,
    width: React.PropTypes.number,
    xAxisClassName: React.PropTypes.string,
    yAxisClassName: React.PropTypes.string,
    yAxisTickCount: React.PropTypes.number,
    xAccessor: React.PropTypes.any, // TODO: prop types?
    yAccessor: React.PropTypes.any,
  },

  mixins: [CartesianChartPropsMixin, DefaultAccessorsMixin, ViewBoxMixin, TooltipMixin],

  getDefaultProps() {
    return {
      chartClassName: 'rd3-barchart',
      hoverAnimation: true,
      margins: { top: 10, right: 20, bottom: 40, left: 45 },
      rangeRoundBandsPadding: 0.25,
      stackOffset: 'zero',
      grouped: false,
      valuesAccessor: d => d.values,
      xAxisClassName: 'rd3-barchart-xaxis',
      yAxisClassName: 'rd3-barchart-yaxis',
      yAxisTickCount: 4,
    };
  },

  _getStackedValuesMaxY(_data) {
    // in stacked bar chart, the maximum height we need for
    // yScale domain is the sum of y0 + y
    const { valuesAccessor } = this.props;
    return d3.max(_data, (d) => (
      d3.max(valuesAccessor(d), (d2) => (
        // where y0, y is generated by d3.layout.stack()
        d2.y0 + d2.y
      ))
    ));
  },

  _getStackedValuesMinY(_data) {
    const { valuesAccessor } = this.props;
    return d3.min(_data, (d) => (
      d3.min(valuesAccessor(d), (d2) => (
        // where y0, y is generated by d3.layout.stack()
        d2.y0 + d2.y
      ))
    ));
  },

  _getLabels(firstSeries) {
    // we only need first series to get all the labels
    const { valuesAccessor, xAccessor } = this.props;
    return valuesAccessor(firstSeries).map(xAccessor);
  },

  _stack() {
    // Only support columns with all positive or all negative values
    // https://github.com/mbostock/d3/issues/2265
    const { stackOffset, xAccessor, yAccessor, valuesAccessor } = this.props;
    return d3.layout.stack()
                    .offset(stackOffset)
                    .x(xAccessor)
                    .y(yAccessor)
                    .values(valuesAccessor);
  },

  render() {
    const props = this.props;
    const yOrient = this.getYOrient();

    const domain = props.domain || {};

    if (props.data.length === 0) {
      return null;
    }
    const _data = this._stack()(props.data);

    const { innerHeight, innerWidth, trans, svgMargins } = this.getDimensions();

    const xDomain = domain.x || this._getLabels(_data[0]);
    const xScale = d3.scale.ordinal()
                     .domain(xDomain)
                     .rangeRoundBands([0, innerWidth], props.rangeRoundBandsPadding);

    const minYDomain = Math.min(0, this._getStackedValuesMinY(_data));
    const maxYDomain = this._getStackedValuesMaxY(_data);
    const yDomain = domain.y || [minYDomain, maxYDomain];
    const yScale = d3.scale.linear().range([innerHeight, 0]).domain(yDomain);

    const series = props.data.map((item) => item.name);

    return (
      <span>
        <Chart
          viewBox={this.getViewBox()}
          legend={props.legend}
          data={props.data}
          margins={props.margins}
          colors={props.colors}
          colorAccessor={props.colorAccessor}
          width={props.width}
          height={props.height}
          title={props.title}
          shouldUpdate={!this.state.changeState}
        >
          <g transform={trans} className={props.chartClassName}>
            <YAxis
              yAxisClassName={props.yAxisClassName}
              yAxisTickValues={props.yAxisTickValues}
              yAxisLabel={props.yAxisLabel}
              yAxisLabelOffset={props.yAxisLabelOffset}
              yScale={yScale}
              margins={svgMargins}
              yAxisTickCount={props.yAxisTickCount}
              tickFormatting={props.yAxisFormatter}
              width={innerWidth}
              height={innerHeight}
              horizontalChart={props.horizontal}
              xOrient={props.xOrient}
              yOrient={yOrient}
              gridHorizontal={props.gridHorizontal}
              gridHorizontalStroke={props.gridHorizontalStroke}
              gridHorizontalStrokeWidth={props.gridHorizontalStrokeWidth}
              gridHorizontalStrokeDash={props.gridHorizontalStrokeDash}
            />
            <XAxis
              xAxisClassName={props.xAxisClassName}
              xAxisTickValues={props.xAxisTickValues}
              xAxisLabel={props.xAxisLabel}
              xAxisLabelOffset={props.xAxisLabelOffset}
              xScale={xScale}
              margins={svgMargins}
              tickFormatting={props.xAxisFormatter}
              width={innerWidth}
              height={innerHeight}
              horizontalChart={props.horizontal}
              xOrient={props.xOrient}
              yOrient={yOrient}
              gridVertical={props.gridVertical}
              gridVerticalStroke={props.gridVerticalStroke}
              gridVerticalStrokeWidth={props.gridVerticalStrokeWidth}
              gridVerticalStrokeDash={props.gridVerticalStrokeDash}
            />
            <DataSeries
              yScale={yScale}
              xScale={xScale}
              margins={svgMargins}
              _data={_data}
              series={series}
              width={innerWidth}
              height={innerHeight}
              grouped={props.grouped}
              colors={props.colors}
              colorAccessor={props.colorAccessor}
              hoverAnimation={props.hoverAnimation}
              valuesAccessor={props.valuesAccessor}
              onMouseOver={this.onMouseOver}
              onMouseLeave={this.onMouseLeave}
            />
          </g>
        </Chart>
        {(props.showTooltip ? <Tooltip {...this.state.tooltip} /> : null)}
      </span>
    );
  },
});
