d3.csv("data/2018-boston-crimes.csv").then(function (data) {
    /*
    BOSTON CRIME DATA from the BOSTON POLICE DEPARTMENT, 2018
    Adapted from:
    https://www.kaggle.com/ankkur13/boston-crime-data/
    */
    // console.log(data);

    /*
    BEGIN BY DEFINING THE DIMENSIONS OF THE SVG and CREATING THE SVG CANVAS
    */
    var width = document.querySelector("#chart").clientWidth;
    var height = document.querySelector("#chart").clientHeight;
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);


    // translate to the center of our SVG
    var chartG = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);


    /*
    TRANSFORM THE DATA
    We want to eventually create a sunburst that shows the relative proportion of each offense code group
    for the top 10 (by frequency) offense code groups in 2018.
    We can use the function d3.nest() to count the number of incidents of each unique offense code group:
    */
    var nested = d3.nest()
        .key(function (d) { return d.OFFENSE_CODE_GROUP; })
        .key(function (d) { return d.DISTRICT; })
        .rollup(function (d) { return d.length; })
        .entries(data)
        .sort(function (a, b) { return a.value - b.value; });

    /*
    After sorting the data above from largest to smallest, use array.slice() to grab only the first 10 entries
    */
    nested = nested.slice(0, 10);

    console.log(nested);

    /*
    CREATE A COLOR SCALE
    The D3 module d3-scale-chromatic features several different color palettes we can use.
    How do these differ in their usage?
    What kinds of color palettes are best for these data?
    */
    // var color = d3.scaleOrdinal(d3.schemeDark2);
    // var color = d3.scaleOrdinal(d3.schemeBlues[5]);
    var color = d3.scaleOrdinal(d3.schemeSpectral[9]);

    /*
    CREATE THE PARTITION LAYOUT GENERATOR
    */

    // size of sunburst radius
    var radius = 350;

    // make the Partition
    var partitionLayout = d3.partition()
        .size([2 * Math.PI, radius]);

    // create an arcGenerator for each "wedge" of the sunburst
    var arcGenerator = d3.arc()
        .startAngle(function (d) { return d.x0; })
        .endAngle(function (d) { return d.x1; })
        .innerRadius(function (d) { return d.y0; })
        .outerRadius(function (d) { return d.y1; });

    /*
    CREATE THE HIERARCHY
    We need to use d3.hierarchy() to turn our data set into a 'hierarchical' data structure;
    d3.partition() REQUIRES a hierarchical structure to generate the sunburst
    */
    var rootNode = d3.hierarchy(
        { values: nested }, // feed in the data object
        function (d) {  // specify for each "row", where to find the values for sizing
            return d.values;
        }
    ).sum(function (d) { return d.value; }); // sum up the valeus for each category specified in our nest() function

    /* 
    GENERATE THE ROOT HIERARCHY
    By passing in our hierarchical data structure into our treemap() function,
    we generate the geometries required to create the treemap in the SVG canvas
    */
    partitionLayout(rootNode);
    console.log(rootNode);
    console.log(rootNode.leaves());

    /*
    DRAW THE WEDGES
    We will use our `root` structure, from above, to draw the wedges of our sunburst
    we will do this by performing a data join with the array of nodes returned by root.leaves()
    (What does this return? Inspect the structure in the JS console)
    */
    var wedges = chartG
        .selectAll('path')
        .data(rootNode.descendants())
        .join('path')
        .attr('d', arcGenerator)
        .attr("display", function (d) { return d.depth ? null : "none"; }) // hide the center circle
        .attr("stroke", "#FFFFFF")
        // IMPORTANT: not every "leaf" has children, so we need to add a "ternary operator" to check each entry
        // for more on ternary operators see here: https://www.codingem.com/javascript-if-else-on-one-line/
        .style("fill", function (d) { return color((d.children ? d : d.parent).data.key); });

    var title = chartG.append("text")
        .attr("x", -40)
        .attr("y", 0)
        .attr("font-size", 24)
        .text("Sunburst!")
        .attr("text-anchor", "middle")

    /* 
    ADD TOOLTIP
    The visualization gets too cluttered if we try to add text labels;
    use a tooltip instead
    */
    var tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip");

    wedges.on("mouseover", function (d) {

        // Retrieve position based on the positions
        // generated by the treemap layout --
        // the same x0 and y0 properties used to compute
        // the rectangles above!
        var x = 100;
        var y = 100;

        let text;
        let fillColor;
        if (d.parent.data.key == undefined) {
            text = d.data.key;
            fillColor = color(d.data.key);
        } else {
            text = d.parent.data.key + "</br>" + d.data.key
            fillColor = color(d.parent.data.key);
        }

        tooltip.style("visibility", "visible")
            .style("left", x + "px")
            .style("top", y + "px")
            .style("color", fillColor)
            .html(text);

        chartG.selectAll('path').attr("opacity", 0.3);

        d3.select(this)
            .attr("opacity", 1);

    }).on("mouseout", function () {

        tooltip.style("visibility", "hidden");

        chartG.selectAll('path').attr("opacity", 1)

    });

});
