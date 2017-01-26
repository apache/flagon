var Bowie = (function () {
  // Set up module variables
  var element = '#bowie';
  var data;
  var metric;


  // Grab data for this static case
  d3.json('/js/graphData.json', function (error, response) {
    if (error) throw error;
    data = response;

    if (typeof metric !== 'undefined') {
      update(metric);
    }
  });


  // Set up D3 variables
  var svg;
  var tooltip;
  var arcs;
  var chords;
  var circles;
  var margin = {
    top : 20,
    right : 20,
    bottom : 20,
    left : 20,
  };
  var fullWidth = 600;
  var fullHeight = 400;
  var width = fullWidth - margin.left - margin.right;
  var height = fullHeight - margin.top - margin.bottom;
  var mainRadius = 280;

  var color = d3.scaleOrdinal()
    .range([
      '#E24614',
      '#DBA915',
      '#BFD02C',
      '#38A6D8',
      '#852EB7'
    ]);

  var arc = d3.arc()
    .innerRadius(mainRadius - 50)
    .outerRadius(mainRadius);

  var ribbon = d3.ribbon();

  var graphLayout = graphFlow()
    .radius(mainRadius - 50)
    .innerRadius(mainRadius - 150);


  // Define bowie layout function
  function graphFlow() {
    var tau = Math.PI * 2;

    var padAngle = 0;
    var spaceAngle = tau / 4;
    var radius = 0;
    var innerRadius = 0;

    function layout(data) {
      var result = {};

      result.in = arrayToObj(data.in);
      result.out = arrayToObj(data.out);
      result.blt = arrayToObj(circleLayout(data.blt, innerRadius));

      var arcAngle = (tau - (spaceAngle * 2)) / 2;
      var inStart = (tau + spaceAngle) / 2;
      var outStart = spaceAngle / 2;

      var inSide = sideLayout(data.inMatrix, result.blt, inStart, arcAngle, padAngle, radius, 'in');
      var outSide = sideLayout(data.outMatrix, result.blt, outStart, arcAngle, padAngle, radius, 'out');

      result.inArcs = inSide[0];
      result.inChords = inSide[1];
      result.outArcs = outSide[0];
      result.outChords = outSide[1];

      return result;
    }

    layout.padAngle = function (value) {
      return value ? (padAngle = value, layout) : padAngle;
    };

    layout.spaceAngle = function (value) {
      return value ? (spaceAngle = value, layout) : spaceAngle;
    };

    layout.radius = function (value) {
      return value ? (radius = value, layout) : radius;
    };

    layout.innerRadius = function (value) {
      return value ? (innerRadius = value, layout) : innerRadius;
    };

    return layout;
  }

  function sideLayout(matrix, circles, startAngle, angle, padAngle, radius, type) {
    var n = matrix.length;
    var m = matrix[0].length;
    var groupSums = [];
    var total = 0;
    var arcs = new Array(n);
    var chordTemp = new Array(n * m);
    var chords = [];
    var k;
    var dx;
    var x;
    var x0;
    var i;
    var j;

    matrix.forEach(function (group) {
      groupSums.push(group.reduce(function (prev, curr) { return prev + curr; }));
    });

    total = groupSums.reduce(function (prev, curr) { return prev + curr; });

    k = Math.max(0, angle - padAngle * n) / total;
    dx = k ? padAngle : angle / n;

    x = startAngle;
    i = -1;

    while(++i < n) {
      x0 = x;
      j = -1;

      while(++j < n) {
        var v = matrix[i][j];
        var a0 = x;
        var a1 = x += v * k;

        chordTemp[j + (n * i)] = {
          index : i,
          subindex : j,
          startAngle : a0,
          endAngle : a1,
          value : v,
        };
      }

      arcs[i] = {
        index : i,
        type : type,
        startAngle : x0,
        endAngle : x,
        value : groupSums[i],
      };

      x += dx;
    }

    chordTemp.forEach(function (chord) {
      if (chord.value > 0) {
        var circle = circles[chord.subindex];

        chords.push({
          index : chord.index,
          subindex : chord.subindex,
          type : type,
          source : {
            startAngle : chord.startAngle,
            endAngle : chord.endAngle,
            radius : radius,
          },
          target : {
            startAngle : circle.theta - 0.001,
            endAngle : circle.theta + 0.001,
            radius : circle.radius,
          },
        });
      }
    });

    return [arcs, chords];
  }

  function circleLayout(circles, innerRadius) {
    circles.forEach(function (d) {
      d.r = d.value;
    });

    d3.packSiblings(circles);
    var enclose = d3.packEnclose(circles);
    var k = innerRadius / enclose.r;

    circles.forEach(function (d) {
      d.r = d.r * k;
      d.x = d.x * k;
      d.y = d.y * k;

      var rSq = Math.pow(d.x, 2) + Math.pow(d.y, 2);
      d.radius = Math.sqrt(rSq);
      d.theta = Math.atan2(d.y, d.x) + (Math.PI / 2);
    });

    return circles;
  }

  function arrayToObj(a) {
    var o = {};

    a.forEach(function (d) {
      o[d.index] = d;
    });

    return o;
  }

  // Initial full build of bowie
  function create() {
    svg = d3.select(element).append('svg')
      .attr('width', fullWidth)
      .attr('height', fullHeight)
      .append('g')
      .attr('transform', 'translate(' + ((width / 2) + margin.left) + ',' + ((height / 2) + margin.top) + ')');

    tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
  }


  // Actually render bowie
  function update(m) {
    metric = m;
    if (typeof data === 'undefined') {
      return false;
    }

    var currentData = data[metric];
    var layout = graphLayout(currentData);

    var t = d3.transition()
      .duration(500);

    arcs = svg.selectAll('.arc')
      .data(layout.inArcs.concat(layout.outArcs), function (d) {
        return d.type + d.index;
      });

    arcs.exit()
      .attr('class', 'exit')
      .transition(t)
      .style('fill-opacity', 0)
      .remove();

    arcs = arcs.enter()
      .append('path')
      .attr('class', 'arc')
      .merge(arcs);

    arcs
      .on('mouseover', function (d) {
        highlight(d, 'arc');
        showTooltip(currentData.in[d.index], d3.event.pageX, d3.event.pageY);
      })
      .on('mouseout', function (d) {
        restore();
        hideTooltip();
      })
      .transition(t)
      // TODO: add arc tweens
      .attr('d', arc)
      .style('fill', function (d) { return color(currentData.in[d.index].elementGroup); });

    chords = svg.selectAll('.chord')
      .data(layout.inChords.concat(layout.outChords), function (d) {
        return d.index + d.type + d.subindex;
      });

    chords.exit()
      .attr('class', 'exit')
      .transition(t)
      .style('fill-opacity', 0)
      .remove();

    chords = chords.enter()
      .append('path')
      .attr('class', 'chord')
      .style('fill', '#B0B9BE')
      .merge(chords);

    chords
      .transition(t)
      .attr('d', ribbon)
      .style('fill-opacity', 0.5);

    circles = svg.selectAll('.node')
      .data($.map(layout.blt, function (val) { return val; }), function (d) { return d.index; });

    circles.exit()
      .attr('class', 'exit')
      .transition(t)
      .attr('r', 0)
      .remove();

    circles = circles.enter()
      .append('circle')
      .attr('class', 'node')
      .merge(circles);

    circles
      .on('mouseover', function (d) {
        highlight(d, 'circle');
        showTooltip(currentData.in[d.index], d3.event.pageX, d3.event.pageY);
      })
      .on('mouseout', function (d) {
        restore();
        hideTooltip();
      })
      .transition(t)
      .attr('r', function (d) { return d.r; })
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; })
      .style('fill', function (d) {
        return color(currentData.in[d.index].elementGroup)
      })
      .style('fill-opacity', 0.75);
  }


  // Helper functions for mouse behaviors
  function hideTooltip() {
    tooltip.transition()
      .duration(350)
      .style('opacity', 0);
  }

  function showTooltip(activity, x, y) {
    tooltip.transition()
      .duration(350)
      .style('opacity', 0.9);

    tooltip
      .style('left', (x + 6) + 'px')
      .style('top', (y - 28) + 'px')
      .html('Action: ' + activity.action + '<br>Id: ' + activity.elementId + '<br>Group: ' + activity.elementGroup);
  }

  function highlight(d, type) {
    var indices = [];

    if (type === 'arc') {
      chords
        .style('fill-opacity', function (c) {
          if (c.index !== d.index || c.type !== d.type) {
            return 0.1;
          } else {
            indices.push(c.subindex);
            return 0.5;
          }
        });

      circles
        .style('fill-opacity', function (c) {
          return indices.includes(c.index) ? 0.75 : 0.1;
        });

      arcs
        .style('fill-opacity', function (c) {
          return c === d ? 1 : 0.25;
        });
    } else if (type === 'circle') {
      chords
        .style('fill-opacity', function (c) {
          if (c.subindex !== d.index) {
            return 0.1;
          } else {
            indices.push(c.index);
            return 0.5;
          }
        });

      circles
        .style('fill-opacity', function (c) {
          return c === d ? 0.75 : 0.25;
        });

      arcs
        .style('fill-opacity', function (c) {
          return indices.includes(c.index) ? 1 : 0.1;
        });
    }
  }

  function restore() {
    chords.style('fill-opacity', 0.5);
    circles.style('fill-opacity', 0.75);
    arcs.style('fill-opacity', 1);
  }

  // Return API
  return {
    create: create,
    update: update
  };
})();
