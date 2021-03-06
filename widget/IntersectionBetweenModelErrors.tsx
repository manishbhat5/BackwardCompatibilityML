// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3";
import { bisect } from "./optimization.tsx";


type IntersectionBetweenModelErrorsState = {
  selectedDataPoint: any
}

type IntersectionBetweenModelErrorsProps = {
  selectedDataPoint: any
}

class IntersectionBetweenModelErrors extends Component<IntersectionBetweenModelErrorsProps, IntersectionBetweenModelErrorsState> {
  constructor(props) {
    super(props);

    this.state = {
      selectedDataPoint: this.props.selectedDataPoint
    };

    this.node = React.createRef<HTMLDivElement>();
    this.createVennDiagramPlot = this.createVennDiagramPlot.bind(this);
  }

  node: React.RefObject<HTMLDivElement>

  componentDidMount() {
    this.createVennDiagramPlot();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedDataPoint: nextProps.selectedDataPoint
    });
  }

  componentDidUpdate() {
    this.createVennDiagramPlot();
  }

  createVennDiagramPlot() {
    var _this = this;
    var body = d3.select(this.node.current);

    var margin = { top: 15, right: 15, bottom: 50, left: 55 }
    var h = 250 - margin.top - margin.bottom
    var w = 250 - margin.left - margin.right

    var tooltip = d3.select("#venntooltip");

    // SVG
    d3.select("#venndiagram").remove();
    var svg = body.append('svg')
        .attr('id', "venndiagram")
        .attr('height',h + margin.top + margin.bottom)
        .attr('width',w + margin.left + margin.right)
      .append('g')
        .attr('transform',`translate(0,${margin.top + 15})`)

    svg.append('text')
      .attr('id','xAxisLabel')
      .attr('y', -20)
      .attr('x', 200)
      .attr('dy','.71em')
      .style('text-anchor','end')
      .text("Intersection Between Model Errors")
      .attr("font-family", "sans-serif")
      .attr("font-size", "10px")
      .attr("fill", "black");

    svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", w + margin.left + margin.right)
      .attr("height", h)
      .attr("fill", "rgba(255, 255, 255, 0.8)")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5);

    if (this.state.selectedDataPoint != null) {
      //var selectedDataPoint = this.state.selectedDataPoint;
      var errorPartition = this.state.selectedDataPoint.models_error_overlap;
      var a = errorPartition[0];
      var b = errorPartition[1];
      var ab = errorPartition[2];

      var data = [
        {"name": "Ra", "area": a},
        {"name": "Rb", "area": b},
        {"name": "intersectionRaRb", "area": ab}
      ]

      let Ra;
      let Rb;
      let Aab;
      let x = 1;
      if (a >= b) {
        x = (50 * 50 * 3.14) / a;
        Ra = 50;
        Rb = Math.sqrt(b * x / 3.14);
        Aab = ab * x;
      } else {
        x = (50 * 50 * 3.14) / b;
        Rb = 50;
        Ra = Math.sqrt(a * x / 3.14);
        Aab = ab * x;
      }

      function areaIntersection(r1, r2, dist) {
        var r = Math.min(r1, r2);
        var R = Math.max(r1, r2);
        if (dist == 0) {
          return (3.14 * Math.pow(r, 2));
        } else if (dist >= (R + r)) {
          return 0;
        }

        var sectorAreas = Math.pow(r, 2) * Math.acos((Math.pow(dist, 2) +
          Math.pow(r, 2) - Math.pow(R, 2)) / (2 * dist * r)) +
          Math.pow(R, 2) * Math.acos((Math.pow(dist, 2) + Math.pow(R, 2) - Math.pow(r, 2)) / (2 * dist * R));

        var triangleAreas = 1/2 * Math.sqrt((-dist + r + R) * (dist + r - R) * (dist - r + R) * (dist + r + R));
        var intersectionArea = sectorAreas - triangleAreas;

        return intersectionArea;
      }

      var r = Math.min(Ra, Rb);
      var R = Math.max(Ra, Rb);

      function aIntersection(dist) {
        return (areaIntersection(Ra, Rb, dist) - Aab);
      }

      let d = bisect(aIntersection, (r + R - 0.00001), (R - r + 0.00001));

      var circleRad = 50;
      var xCenter = w/4 + margin.left;
      var yCenter = h/2
      var xCenter2 = xCenter + d;

      function bringToTop(name) {
        svg.selectAll("g")
          .sort(function(a, b) {
            if (a.name == "intersectionRaRb") {
              return 1;
            } else if (b.name == "intersectionRaRb") {
              return -1;
            } else if (a.name == name) {
              return 1;
            } else {
              return -1;
            }
          });
      }

      svg.append("g")
          .append("circle")
          .attr("r", Ra)
          .attr('transform',
              "translate(" +
              xCenter + "," +
              yCenter + ")")
          .attr("fill", "rgba(170, 170, 255, 0.8)")
          .attr("stroke", "black")
          .attr("stroke-width", "1px")
          .on("mouseover", function() {
            tooltip.text(a.toFixed(2))
              .style("opacity", 0.8);

            bringToTop("Ra");

            d3.select(this).attr("stroke-width", "2px");
          })
          .on("mousemove", function() {
            var vennDiagramPlot = document.getElementById("venndiagramplot");
            var coords = d3.mouse(vennDiagramPlot);
            tooltip.style("left", `${coords[0] - (margin.left + margin.right)/2}px`)
              .style("top", `${coords[1] - (margin.top + margin.bottom)/2}px`);
          })
          .on("mouseout", function() {
            tooltip.style("opacity", 0);
            d3.select(this).attr("stroke-width", "1px");
          });

      svg.append("g")
          .append("circle")
          .attr("r", Rb)
          .attr('transform',
              "translate(" +
              xCenter2 + "," +
              yCenter + ")")
          .attr("fill", "rgba(206, 160, 205, 0.8)")
          .attr("stroke", "black")
          .attr("stroke-width", "1px")
          .on("mouseover", function() {
            tooltip.text(b.toFixed(2))
              .style("opacity", 0.8);

            bringToTop("Rb");

            d3.select(this).attr("stroke-width", "2px");
          })
          .on("mousemove", function() {
            var vennDiagramPlot = document.getElementById("venndiagramplot");
            var coords = d3.mouse(vennDiagramPlot);
            tooltip.style("left", `${coords[0] - (margin.left + margin.right)/2}px`)
              .style("top", `${coords[1] - (margin.top + margin.bottom)/2}px`);
          })
          .on("mouseout", function() {
            tooltip.style("opacity", 0);
            d3.select(this).attr("stroke-width", "1px");
          });

      var path = svg.append("g").append("path");
      var myPath = d3.path();
      myPath.arc(xCenter, yCenter, Ra, -Math.acos((Math.pow(d, 2) + Math.pow(Ra, 2) - Math.pow(Rb, 2))/(2 * d *Ra)), Math.acos((Math.pow(d, 2) + Math.pow(Ra, 2) - Math.pow(Rb, 2))/(2 * d *Ra)));
      myPath.arc(xCenter2, yCenter, Rb, Math.PI - Math.acos((Math.pow(d, 2) + Math.pow(Rb, 2) - Math.pow(Ra, 2))/(2 * d *Rb)), Math.PI + Math.acos((Math.pow(d, 2) + Math.pow(Rb, 2) - Math.pow(Ra, 2))/(2 * d *Rb)));
      myPath.closePath();

      path.attr("d", myPath)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .attr("fill", "rgba(170, 213, 255, 0.8)")
          .on("mouseover", function() {
            tooltip.text(ab.toFixed(2))
              .style("opacity", 0.8);

            bringToTop("intersectionRaRb");

            d3.select(this).attr("stroke-width", "2px");
            d3.select(this).attr("stroke", "black");
          })
          .on("mousemove", function() {
            var vennDiagramPlot = document.getElementById("venndiagramplot");
            var coords = d3.mouse(vennDiagramPlot);
            tooltip.style("left", `${coords[0] - (margin.left + margin.right)/2}px`)
              .style("top", `${coords[1] - (margin.top + margin.bottom)/2}px`);
          })
          .on("mouseout", function() {
            tooltip.style("opacity", 0);
            d3.select(this).attr("stroke-width", "1px");
            d3.select(this).attr("stroke", "black");
          });

      svg.selectAll("g")
        .data(data);

    }

  }

  render() {
    return (
      <div className="plot" ref={this.node} id="venndiagramplot">
        <div className="tooltip" id="venntooltip" />
      </div>
    );
  }
}
export default IntersectionBetweenModelErrors;
