      // Change D3's SI prefix to more business friendly units
      //      K = thousands
      //      M = millions
      //      B = billions
      //      T = trillion
      //      P = quadrillion
      //      E = quintillion
      // small decimals are handled with e-n formatting.
      var d3_formatPrefixes = ["e-24","e-21","e-18","e-15","e-12","e-9","e-6","e-3","","K","M","B","T","P","E","Z","Y"].map(d3_formatPrefix);

      // Override d3's formatPrefix function
      d3.formatPrefix = function(value, precision) {
          var i = 0;
          if (value) {
              if (value < 0) {
                  value *= -1;
              }
              if (precision) {
                  value = d3.round(value, d3_format_precision(value, precision));
              }
              i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
              i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
          }
          return d3_formatPrefixes[8 + i / 3];
      };

      function d3_formatPrefix(d, i) {
          var k = Math.pow(10, Math.abs(8 - i) * 3);
          return {
              scale: i > 8 ? function(d) { return d / k; } : function(d) { return d * k; },
              symbol: d
          };
      }

      function d3_format_precision(x, p) {
          return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
      }

      // Define margins of the SVG canvas
      var margin = {top:50, right:20, bottom:30, left:100};
      var width = 500 - margin.left - margin.right;
      var height = 500 - margin.top - margin.bottom;

      // Parse and format the Year data 
      var parseDate = d3.time.format("%Y").parse;
      var formatDate = d3.time.format("%Y");

      // Format the Population data 
      var formatData = d3.format(".2s");
      var commaData = d3.format(",");
      
      // Define the scales
      var myXScale = d3.time.scale().range([0,width]);    
      var myYScale = d3.scale.linear().range([height,0]);

      // Define the axes
      var myXAxis = d3.svg.axis().scale(myXScale).orient("bottom");
      var myYAxis = d3.svg.axis().scale(myYScale).orient("left").tickFormat(formatData);

      // Define the output line
      var line1 = d3.svg.line().x(function(d) { return myXScale(d.Year);}).y(function(d) { return myYScale(d.Population);});
      var line2 = d3.svg.line().x(function(d) { return myXScale(d.Year);}).y(function(d) { return myYScale(d.Population);});

      // Define a tooltip for points on the graph
      var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function(d) { return "<strong> Year:</strong> <span style='color:orange'>" + formatDate(d.Year) + "</span>, <strong> Population:</strong> <span style='color:orange'>" + commaData(d.Population) + "</span>" ; });

      // Define the SVG and inner drawing space which will act as a container for our viz
      var mySVG = d3.select("#populationDiv").append("svg").attr("width", width+margin.left+margin.right).attr("height", height+margin.top+margin.bottom).append("g").attr("transform","translate("+margin.left+","+margin.top+")");

      // Define the function that obtains the max and min of India's population data from the TSV file
      function indiaPopData()
        {
          d3.tsv("indiaPopulation.tsv", function(error,data)
            {
              // Iterating through the data
              data.forEach(function(d)
              {
                // Parsing the Year format present in the original data
                d.Year = parseDate(d.Year); 
                // Converting string to integer
                d.Population = +d.Population;
              });

              // Defining variables to store the max and min values present in the dataset
              var Indmax;
              var Indmin;
              Indmax = d3.max(data, function(d) { return d.Population;});
              Indmin = d3.min(data,function(d) { return d.Population;});
            });
        }

      // Defining a function to draw the graph with India's population represented on the scales
      function INDPopulationCreate()
        {
          d3.tsv("indiaPopulation.tsv", function(error,data)
            {
              // Iterating through the data
              data.forEach(function(d)
              {
                // Parsing the Year format present in the original data
                d.Year = parseDate(d.Year);
                // Converting string to integer
                d.Population = +d.Population;
              });

              // Assigning the max and min values in the dataset
              Indmax = d3.max(data, function(d) { return d.Population;});
              Indmin = d3.min(data,function(d) { return d.Population;});

              // Define the domain for the axes
              myXScale.domain(d3.extent(data, function(d) { return d.Year;}));
              myYScale.domain([0,Indmax]);

              // Draw horizontal grid lines
              mySVG.selectAll("line.horizontalGrid").data(myYScale.ticks(10)).enter().append("line")
              .attr(
                    {
                        "class":"horizontalGrid",
                        "x1" : "0",
                        "x2" : width,
                        "y1" : function(d){ return myYScale(d);},
                        "y2" : function(d){ return myYScale(d);},
                        "fill" : "none",
                        "shape-rendering" : "crispEdges",
                        "stroke" : "grey",
                        "stroke-opacity" : "0.5",
                        "stroke-width" : "1px"
                    });

              // Draw vertical grid lines
              mySVG.selectAll("line.verticalGrid").data(myXScale.ticks(10)).enter().append("line")
              .attr(
                    {
                      "class":"verticalGrid",
                      "x1" : function(d){ return myXScale(d);},
                      "x2" : function(d){ return myXScale(d);},
                      "y1" : "0",
                      "y2" : height,
                      "fill" : "none",
                      "shape-rendering" : "crispEdges",
                      "stroke" : "grey",
                      "stroke-opacity" : "0.4",
                      "stroke-width" : "1px"
                    });

              // Draw the X and Y axes
              mySVG.append("g").attr("class","x-axis").attr("transform","translate(0, "+height+")").call(myXAxis).append("text").attr("class","whiteFont").attr("x",width).attr("y", -6).style("text-anchor","end").text("Time in years");;
              mySVG.append("g").attr("class","y-axis").call(myYAxis).append("text").attr("class","whiteFont").attr("transform","rotate(-90)").attr("y", 6).attr("dy", "0.71em").style("text-anchor","end").text("Population Numbers");

              // Draw the circular points on the output graph
              mySVG.selectAll(".point").data(data).enter().append("circle").attr("class","point").attr("cx", function(d) { return myXScale(d.Year);}).attr("cy", function(d) { return myYScale(d.Population);}).attr("r", 3).style("fill", "#FFD747").on('mouseover', tip.show).on('mouseout', tip.hide);

              // Javascript code to add hover effects to the graph
              $(function () 
                {
                  $('circle').hover(function () {
                  $(this).attr('r',5);
                   }, function() {
                  $(this).attr('r',3);});
                });

              // Draw the line on the output graph
              var path2 = mySVG.append("path").datum(data).attr("class","line1").attr("d",line1);

              // Add transitions to the path
              var totalLength = path2.node().getTotalLength();
              path2.attr("stroke-dasharray", totalLength + " " + totalLength).attr("stroke-dashoffset", totalLength).transition().duration(1000).ease("linear").attr("stroke-dashoffset", 0);

              // Add label to the end of the path
              mySVG.append("text").attr("transform", "translate("+(width+10)+","+myYScale(data[23].Population)+")").attr("dy", ".35em").attr("text-anchor", "start").style("fill", "#FFD747").text("India");

              // Calling the tip() function for the tooltip
              mySVG.call(tip);
            });
        }

      // Pull data from the external TSV file and parse the year information present in it
      function USPopulationCreate() 
        {
          d3.tsv("USAPopulation.tsv", function(error,data)
            {
              data.forEach(function(d)
              {
                d.Year = parseDate(d.Year);
                d.Population = +d.Population;
              });

              // Calling the function to get max and min values of the India's population to set the domain for the axes
              indiaPopData();
             
              // Draw the circular points on the output graph
              mySVG.selectAll(".dot").data(data).enter().append("circle").attr("class","dot").attr("cx", function(d) { return myXScale(d.Year);}).attr("cy", function(d) { return myYScale(d.Population);}).attr("r", 3).style("fill", "#FFD747").on('mouseover', tip.show).on('mouseout', tip.hide);

              // Javascript code to add hover effects to the graph
              $(function () 
                {
                  $('circle').hover(function () {
                  $(this).attr('r',5);
                  }, function(){
                  $(this).attr('r',3);
                  });
                });

              // Draw the line on the output graph
              var path1 = mySVG.append("path").datum(data).attr("class","line2").attr("d",line2);
              var totalLength = path1.node().getTotalLength();

              // Add transitions to the path
              path1.attr("stroke-dasharray", totalLength + " " + totalLength).attr("stroke-dashoffset", totalLength).transition().duration(1000).ease("linear")
            .attr("stroke-dashoffset", 0);

              // Add label to the end of the path
              mySVG.append("text").attr("transform", "translate("+(width+10)+","+(myYScale(data[0].Population)-15)+")").attr("dy", ".35em").attr("text-anchor", "start").style("fill", "#FFD747").text("USA");
            
              // Add a title to the graph
              mySVG.append("text").attr("class","whiteHeader").attr("x", (width / 2)).attr("y", 0 - (margin.top / 2)).attr("text-anchor", "middle").style("font-size", "14px").style("font-weight","bold").text("Population trend in USA and India from 1990 to 2014");

              // Calling the tooltip function
              mySVG.call(tip);
            });
        }

      // Function call to create the line graphs for both countries

      INDPopulationCreate();
      USPopulationCreate();
